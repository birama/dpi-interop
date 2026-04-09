import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Fix maturité à 0 → 1 ===');

  const subs = await prisma.submission.findMany({
    where: { status: { in: ['SUBMITTED', 'VALIDATED'] } },
    include: { institution: { select: { code: true } } },
  });

  let fixed = 0;
  for (const s of subs) {
    const code = s.institution?.code || '?';
    console.log(`${code}: I:${s.maturiteInfra} D:${s.maturiteDonnees} C:${s.maturiteCompetences} G:${s.maturiteGouvernance}`);

    if (s.maturiteInfra === 0 || s.maturiteDonnees === 0 || s.maturiteCompetences === 0 || s.maturiteGouvernance === 0) {
      await prisma.submission.update({
        where: { id: s.id },
        data: {
          maturiteInfra: s.maturiteInfra || 1,
          maturiteDonnees: s.maturiteDonnees || 1,
          maturiteCompetences: s.maturiteCompetences || 1,
          maturiteGouvernance: s.maturiteGouvernance || 1,
        },
      });
      console.log(`  -> corrigé`);
      fixed++;
    }
  }

  console.log(`\n=== ${fixed} corrigées sur ${subs.length} ===`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
