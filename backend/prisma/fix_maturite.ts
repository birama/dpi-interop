import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Correction maturité des soumissions importées ===');

  // Récupérer toutes les soumissions avec leurs niveaux d'interop
  const submissions = await prisma.submission.findMany({
    where: { status: { in: ['SUBMITTED', 'VALIDATED'] } },
    include: {
      institution: { select: { code: true, nom: true } },
      niveauxInterop: true,
    },
  });

  let fixed = 0;

  for (const sub of submissions) {
    // Si maturité déjà renseignée correctement (pas 0 et pas tout à 3), skip
    if (sub.maturiteInfra > 0 && sub.maturiteDonnees > 0 &&
        !(sub.maturiteInfra === 3 && sub.maturiteDonnees === 3 && sub.maturiteCompetences === 3 && sub.maturiteGouvernance === 3 && sub.niveauxInterop.length > 0)) {
      continue;
    }

    if (sub.niveauxInterop.length === 0) {
      // Pas de niveaux interop → mettre 1 par défaut si tout est à 0
      if (sub.maturiteInfra === 0) {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { maturiteInfra: 1, maturiteDonnees: 1, maturiteCompetences: 1, maturiteGouvernance: 1 },
        });
        console.log(`🔧 ${sub.institution?.code || '?'}: 0→1 (aucun niveau interop)`);
        fixed++;
      }
      continue;
    }

    // Mapper les niveaux interop aux 4 dimensions
    const matMap: Record<string, number[]> = { infra: [], donnees: [], competences: [], gouvernance: [] };

    for (const ni of sub.niveauxInterop) {
      const dim = (ni.question || ni.niveau || '').toLowerCase();
      const note = parseInt(ni.reponse?.replace('/5', '') || '0') || 0;
      if (note === 0) continue;

      if (dim.includes('infrastructure') || dim.includes('infra') || dim.includes('technique') || dim.includes('numérisation') || dim.includes('numerisation')) {
        matMap.infra.push(note);
      } else if (dim.includes('donnée') || dim.includes('donnee') || dim.includes('data') || dim.includes('capacité') || dim.includes('échange')) {
        matMap.donnees.push(note);
      } else if (dim.includes('compétence') || dim.includes('competence') || dim.includes('équipe') || dim.includes('humain') || dim.includes('expérience')) {
        matMap.competences.push(note);
      } else if (dim.includes('gouvernance') || dim.includes('organisation') || dim.includes('pilotage') || dim.includes('conformité') || dim.includes('juridique')) {
        matMap.gouvernance.push(note);
      } else {
        // Dimension non reconnue → distribuer
        matMap.infra.push(note);
      }
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const allNotes = sub.niveauxInterop.map(n => parseInt(n.reponse?.replace('/5', '') || '0') || 0).filter(n => n > 0);
    const globalAvg = allNotes.length > 0 ? Math.round(allNotes.reduce((a, b) => a + b, 0) / allNotes.length) : 1;

    const newInfra = avg(matMap.infra) || globalAvg;
    const newDonnees = avg(matMap.donnees) || globalAvg;
    const newCompetences = avg(matMap.competences) || globalAvg;
    const newGouvernance = avg(matMap.gouvernance) || globalAvg;

    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        maturiteInfra: Math.max(1, Math.min(5, newInfra)),
        maturiteDonnees: Math.max(1, Math.min(5, newDonnees)),
        maturiteCompetences: Math.max(1, Math.min(5, newCompetences)),
        maturiteGouvernance: Math.max(1, Math.min(5, newGouvernance)),
      },
    });

    console.log(`✅ ${sub.institution?.code || '?'}: I:${newInfra} D:${newDonnees} C:${newCompetences} G:${newGouvernance} (${sub.niveauxInterop.length} niveaux)`);
    fixed++;
  }

  console.log(`\n=== ${fixed} soumissions corrigées sur ${submissions.length} ===`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
