import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MAPPINGS = [
  { email: 'dsi@apix.sn', code: 'APIX' },
  { email: 'dsi@dgid.sn', code: 'DGID' },
  { email: 'dsi@dgd.sn', code: 'DGD' },
  { email: 'informatique@douanes.sn', code: 'DGD' },
  { email: 'dsi@ansd.sn', code: 'ANSD' },
  { email: 'informatique@dgcpt.sn', code: 'DGCPT' },
  { email: 'si@anec.sn', code: 'ANEC' },
];

async function main() {
  console.log('=== Fix rattachement utilisateurs → institutions ===\n');

  for (const m of MAPPINGS) {
    const user = await prisma.user.findUnique({ where: { email: m.email }, include: { institution: { select: { code: true, nom: true } } } });
    if (!user) { console.log(`⏭️ ${m.email} — utilisateur non trouvé`); continue; }

    const inst = await prisma.institution.findFirst({ where: { code: m.code } });
    if (!inst) { console.log(`❌ ${m.email} — institution ${m.code} non trouvée`); continue; }

    if (user.institutionId === inst.id) {
      console.log(`✅ ${m.email} → ${m.code} (${inst.nom.substring(0, 40)}) — OK`);
    } else {
      await prisma.user.update({ where: { email: m.email }, data: { institutionId: inst.id } });
      console.log(`🔧 ${m.email} — corrigé: ${user.institution?.code || '?'} → ${m.code}`);
    }
  }

  // Vérifier les soumissions APIX
  const apix = await prisma.institution.findFirst({ where: { code: 'APIX' } });
  if (apix) {
    const apixSubs = await prisma.submission.findMany({ where: { institutionId: apix.id } });
    console.log(`\nSoumissions APIX: ${apixSubs.length}`);
    if (apixSubs.length === 0) {
      console.log('⚠️ Aucune soumission pour APIX — vérifier si le seed_apix_dgid a été exécuté');
    }
  }

  console.log('\n=== Vérification finale ===');
  const users = await prisma.user.findMany({
    where: { email: { in: MAPPINGS.map(m => m.email) } },
    include: { institution: { select: { code: true, nom: true } } },
  });
  for (const u of users) {
    console.log(`${u.email.padEnd(30)} → ${u.institution?.code || 'AUCUNE'} (${u.institution?.nom?.substring(0, 40) || '—'})`);
  }
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
