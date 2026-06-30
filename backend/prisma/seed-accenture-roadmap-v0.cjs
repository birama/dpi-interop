/**
 * P14-CONC — Seed initial Accenture Roadmap V0
 * Usage : node prisma/seed-accenture-roadmap-v0.cjs
 * Idempotent : UPSERT par couple (organisationId, casUsageMVPId)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== P14 — Seed Accenture Roadmap V0 ===\n');

  // Récupérer l'admin pour createdBy
  const admin = await prisma.user.findUnique({ where: { email: 'admin@senum.sn' } });
  if (!admin) { console.error('Admin introuvable'); process.exit(1); }

  // Cas PRIORISE + aFinancer = true (les 9 promus via deploy03)
  const casPrio = await prisma.casUsageMVP.findMany({
    where: { statutVueSection: 'PRIORISE', aFinancer: true },
    orderBy: { code: 'asc' },
    take: 9,
  });

  console.log(`${casPrio.length} cas PRIORISE+aFinancer trouvés`);

  let created = 0, skipped = 0;

  for (const cu of casPrio) {
    try {
      const existing = await prisma.accompagnementAMO.findUnique({
        where: { organisationId_casUsageMVPId: { organisationId: 'ACCENTURE', casUsageMVPId: cu.id } },
      });

      if (existing) {
        console.log(`   → ${cu.code} : déjà accompagné`);
        skipped++;
        continue;
      }

      const acc = await prisma.accompagnementAMO.create({
        data: {
          organisationId: 'ACCENTURE',
          casUsageMVPId: cu.id,
          type: 'ROADMAP_V0',
          statut: 'ACTIF',
          dateDebut: new Date('2026-04-01'),
          dateFinPrevue: new Date('2026-12-31'),
          scoreMaturite: [3, 4, 3, 4, 3, 3, 4, 3, 4][created] || 3, // score 3-4 varié
        },
      });

      // 2-3 jalons par accompagnement
      const jalons = [
        { type: 'DIAGNOSTIC', libelle: 'Diagnostic initial', trimestre: 'Q2 2026', statut: 'REALISE', ordre: 1, datePrevue: new Date('2026-05-31'), dateReelle: new Date('2026-05-15') },
        { type: 'CADRAGE', libelle: 'Cadrage et spécifications', trimestre: 'Q3 2026', statut: 'EN_COURS', ordre: 2, datePrevue: new Date('2026-08-31') },
      ];

      if (created % 2 === 0) {
        jalons.push({ type: 'POC', libelle: 'Preuve de concept', trimestre: 'Q4 2026', statut: 'PLANIFIE', ordre: 3, datePrevue: new Date('2026-11-30') });
      }

      for (const j of jalons) {
        await prisma.jalonAccompagnement.create({
          data: { accompagnementId: acc.id, ...j },
        });
      }

      console.log(`   ✅ ${cu.code} : créé avec ${jalons.length} jalons`);
      created++;
    } catch (e) {
      console.error(`   ❌ ${cu.code} : ${e.message?.substring(0, 200)}`);
    }
  }

  console.log(`\n=== RÉSULTAT ===`);
  console.log(`${created} créés, ${skipped} ignorés`);

  const total = await prisma.accompagnementAMO.count({ where: { organisationId: 'ACCENTURE' } });
  console.log(`Total accompagnements Accenture : ${total}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
