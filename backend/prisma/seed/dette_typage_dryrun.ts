/**
 * DRY-RUN — Correction dette typage CasUsageMVP.typologie
 *
 * Lecture seule absolue. AUCUN UPDATE en base.
 *
 * Règle de cible (validée par Birama après diagnostic) :
 *   - code commence par PINS-METIER-  → typologie cible = METIER
 *   - code commence par PINS-TECH-    → typologie cible = TECHNIQUE
 *   - autre préfixe                    → cible "indéterminée" (hors dette mécanique)
 *
 * Sortie :
 *   - récap (total à corriger, sens des transitions)
 *   - CSV  backend/prisma/seed/dette_typage_dryrun.csv
 *     colonnes : code, intitule, typologieActuelle, typologieCible
 *
 * Réf : MCTN/DU/PROMPTS-PINS-DETTE-TYPAGE-2026 — passe DRY-RUN.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Cible = 'METIER' | 'TECHNIQUE' | 'INDETERMINE';

function cibleDepuisCode(code: string): Cible {
  if (/^PINS-METIER-/i.test(code)) return 'METIER';
  if (/^PINS-TECH-/i.test(code)) return 'TECHNIQUE';
  return 'INDETERMINE';
}

function csvField(s: any): string {
  if (s === null || s === undefined) return '';
  const v = String(s);
  return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

async function main() {
  const rows = await prisma.casUsageMVP.findMany({
    select: { id: true, code: true, titre: true, typologie: true },
    orderBy: { code: 'asc' },
  });
  console.log(`Total CasUsageMVP : ${rows.length}`);

  let toMetier = 0;        // typo actuelle TECHNIQUE → cible METIER
  let toTechnique = 0;     // typo actuelle METIER → cible TECHNIQUE
  let dejaCorrects = 0;    // typo == cible
  let indetermines = 0;    // cible == INDETERMINE (préfixe code 'autre')
  const divergent: Array<{ code: string; titre: string; typologieActuelle: string; typologieCible: Cible }> = [];

  for (const r of rows) {
    const cible = cibleDepuisCode(r.code);
    if (cible === 'INDETERMINE') {
      indetermines++;
      continue;
    }
    if (r.typologie === cible) {
      dejaCorrects++;
      continue;
    }
    // Divergence
    if (r.typologie === 'TECHNIQUE' && cible === 'METIER') toMetier++;
    else if (r.typologie === 'METIER' && cible === 'TECHNIQUE') toTechnique++;
    divergent.push({
      code: r.code,
      titre: r.titre,
      typologieActuelle: r.typologie,
      typologieCible: cible,
    });
  }

  // Récap
  console.log('\n=== RÉCAP DRY-RUN ===');
  console.log(`Lignes déjà correctes (typo == cible)            : ${dejaCorrects}`);
  console.log(`Lignes à corriger (typo != cible)                : ${divergent.length}`);
  console.log(`  - sens TECHNIQUE → METIER (préfixe PINS-METIER-) : ${toMetier}`);
  console.log(`  - sens METIER → TECHNIQUE (préfixe PINS-TECH-)   : ${toTechnique}`);
  console.log(`Lignes indéterminées (préfixe code 'autre')      : ${indetermines}`);
  console.log(`Total contrôlé : ${dejaCorrects + divergent.length + indetermines} (doit = ${rows.length})`);

  // CSV
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(__dirname, 'dette_typage_dryrun.csv');
  const header = ['code', 'intitule', 'typologieActuelle', 'typologieCible'].join(',');
  const lines = [header];
  for (const d of divergent) {
    lines.push([
      csvField(d.code), csvField(d.titre),
      csvField(d.typologieActuelle), csvField(d.typologieCible),
    ].join(','));
  }
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
  console.log(`\nCSV écrit : ${outPath}`);
  console.log(`${divergent.length} lignes (entête + 1 par CU divergent)`);

  console.log('\n⚠️  AUCUN UPDATE en base. Validation humaine + backup requis avant exécution.');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Échec dry-run :', e);
  await prisma.$disconnect();
  process.exit(1);
});
