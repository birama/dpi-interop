/**
 * Script d'harmonisation des codes cas d'usage → PINS-CU-XXX
 *
 * Usage : npx tsx prisma/harmonize_codes.ts
 *
 * 1. Sauvegarde l'ancien code dans ancienCode
 * 2. Réattribue les codes séquentiellement PINS-CU-001, PINS-CU-002, etc.
 * 3. Trie par date de création (plus ancien en premier)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Harmonisation des codes cas d\'usage ===\n');

  // 1. Récupérer tous les cas d'usage triés par date de création
  const casUsages = await prisma.casUsageMVP.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, code: true, ancienCode: true, titre: true, createdAt: true },
  });

  console.log(`${casUsages.length} cas d'usage trouvés.\n`);

  // 2. Vérifier si déjà harmonisés
  const alreadyDone = casUsages.every(cu => /^PINS-CU-\d{3}$/.test(cu.code));
  if (alreadyDone) {
    console.log('Les codes sont déjà harmonisés au format PINS-CU-XXX.');
    return;
  }

  // 3. Réattribuer les codes
  console.log('Ancien code → Nouveau code :');
  for (let i = 0; i < casUsages.length; i++) {
    const cu = casUsages[i];
    const newCode = `PINS-CU-${String(i + 1).padStart(3, '0')}`;

    // Ne pas écraser ancienCode s'il existe déjà (re-run safe)
    const ancienCode = cu.ancienCode || cu.code;

    console.log(`  ${cu.code.padEnd(15)} → ${newCode}  (${cu.titre.substring(0, 50)})`);

    await prisma.casUsageMVP.update({
      where: { id: cu.id },
      data: { code: newCode, ancienCode },
    });
  }

  console.log(`\n${casUsages.length} codes harmonisés avec succès.`);
}

main()
  .catch(e => { console.error('Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
