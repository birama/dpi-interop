/**
 * Correction dette typage CasUsageMVP — APPLY (exécution réelle)
 *
 * Pré-requis : backup pg_dump. Ce script écrit.
 *
 * Actions :
 *   1. Compte les divergences AVANT (READ)
 *   2. Transaction atomique : ALTER COLUMN typologie DROP DEFAULT +
 *      UPDATE typologie='METIER' WHERE code LIKE 'PINS-METIER-%' AND typologie != 'METIER'
 *   3. Compte APRÈS et vérifie 0 divergence
 *
 * Usage : npx tsx prisma/seed/dette_typage_apply.ts
 *
 * Réf : MCTN/DU/PROMPTS-PINS-DETTE-TYPAGE-2026
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countDivergences() {
  const r: any = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS n FROM cas_usage_mvp
    WHERE (code LIKE 'PINS-METIER-%' AND typologie != 'METIER')
       OR (code LIKE 'PINS-TECH-%'   AND typologie != 'TECHNIQUE')`);
  return r[0].n;
}

async function main() {
  // ---- AVANT ----
  const typoAvant: any = await prisma.$queryRawUnsafe(
    `SELECT typologie::text AS t, COUNT(*)::int AS n FROM cas_usage_mvp GROUP BY 1 ORDER BY 1`);
  const defAvant: any = await prisma.$queryRawUnsafe(
    `SELECT column_default FROM information_schema.columns WHERE table_name='cas_usage_mvp' AND column_name='typologie'`);
  const divAvant = await countDivergences();

  console.log('=== AVANT ===');
  console.log('Répartition :', typoAvant);
  console.log('DEFAULT SQL  :', defAvant[0]);
  console.log('Divergences  :', divAvant);

  if (divAvant === 0) {
    console.log('\n✅ Aucune divergence — rien à corriger. Seul le DROP DEFAULT sera appliqué.');
  }

  // ---- TRANSACTION ----
  await prisma.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(`ALTER TABLE "cas_usage_mvp" ALTER COLUMN "typologie" DROP DEFAULT`);
    if (divAvant > 0) {
      await tx.$executeRawUnsafe(
        `UPDATE "cas_usage_mvp" SET "typologie"='METIER' WHERE "code" LIKE 'PINS-METIER-%' AND "typologie"='TECHNIQUE'`);
    }
  });

  // ---- APRÈS ----
  const typoApres: any = await prisma.$queryRawUnsafe(
    `SELECT typologie::text AS t, COUNT(*)::int AS n FROM cas_usage_mvp GROUP BY 1 ORDER BY 1`);
  const defApres: any = await prisma.$queryRawUnsafe(
    `SELECT column_default FROM information_schema.columns WHERE table_name='cas_usage_mvp' AND column_name='typologie'`);
  const divApres = await countDivergences();

  console.log('\n=== APRÈS ===');
  console.log('Répartition :', typoApres);
  console.log('DEFAULT SQL  :', defApres[0]);
  console.log('Divergences  :', divApres);

  if (divApres === 0 && defApres[0]?.column_default === null) {
    console.log('\n✅ Correction OK — 0 divergence, DEFAULT retiré.');
  } else {
    console.error('\n❌ ÉCHEC — divergences restantes ou DEFAULT toujours actif.');
    process.exit(2);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Échec :', e); await prisma.$disconnect(); process.exit(1); });
