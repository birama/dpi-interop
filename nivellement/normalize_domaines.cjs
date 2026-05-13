/**
 * Normalisation des valeurs CasUsageMVP.axePrioritaire (texte libre) vers
 * CasUsageMVP.domaine (enum Domaine, 14 valeurs canoniques) — PTF Phase 2.
 *
 * Mode dry-run par défaut. Pour appliquer effectivement :
 *   node normalize_domaines.cjs --apply
 *
 * Le champ `axePrioritaire` est CONSERVÉ (rétrocompatibilité). Seul `domaine`
 * est rempli en additif. Les cas dont `axePrioritaire` est NULL gardent
 * `domaine` à NULL (pas de fallback automatique vers TRANSVERSAL).
 *
 * Mapping (validé par Birama avant exécution prod) :
 *   "Finances publiques"                   → FINANCES_PUBLIQUES
 *   "Finances publiques — Doing Business"  → FINANCES_PUBLIQUES
 *   "Climat des affaires"                  → CLIMAT_AFFAIRES
 *   "Doing Business"                       → CLIMAT_AFFAIRES
 *   "Protection sociale"                   → PROTECTION_SOCIALE
 *   "Equite sociale"                       → PROTECTION_SOCIALE
 *   "Services citoyens"                    → SERVICES_CITOYENS
 *   "Service au citoyen"                   → SERVICES_CITOYENS
 *   "Transversal"                          → TRANSVERSAL
 *   NULL                                   → NULL (laisse intact)
 *
 * Pour les valeurs non listées ici (ex : nouveau domaine ajouté entre-temps),
 * le script SKIP avec un warning. Compléter le mapping manuellement.
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const MAPPING = {
  'Finances publiques': 'FINANCES_PUBLIQUES',
  'Finances publiques — Doing Business': 'FINANCES_PUBLIQUES',
  'Climat des affaires': 'CLIMAT_AFFAIRES',
  'Doing Business': 'CLIMAT_AFFAIRES',
  'Protection sociale': 'PROTECTION_SOCIALE',
  'Equite sociale': 'PROTECTION_SOCIALE',
  'Services citoyens': 'SERVICES_CITOYENS',
  'Service au citoyen': 'SERVICES_CITOYENS',
  'Transversal': 'TRANSVERSAL',
};

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`Mode : ${apply ? 'APPLY (UPDATEs effectifs)' : 'DRY-RUN (lecture seule)'}\n`);

  const cas = await p.casUsageMVP.findMany({
    select: { id: true, code: true, axePrioritaire: true, domaine: true },
  });

  const counters = { mapped: 0, alreadySet: 0, nullSource: 0, unknownAxe: 0, skipped: 0 };
  const unknownValues = new Set();

  for (const c of cas) {
    if (c.domaine) {
      counters.alreadySet++;
      continue;
    }
    if (!c.axePrioritaire) {
      counters.nullSource++;
      continue;
    }
    const target = MAPPING[c.axePrioritaire.trim()];
    if (!target) {
      counters.unknownAxe++;
      unknownValues.add(c.axePrioritaire);
      console.log(`[UNKNOWN] ${c.code} : "${c.axePrioritaire}" → pas de mapping`);
      continue;
    }
    counters.mapped++;
    if (apply) {
      await p.casUsageMVP.update({ where: { id: c.id }, data: { domaine: target } });
      console.log(`[OK] ${c.code} : "${c.axePrioritaire}" → ${target}`);
    } else {
      console.log(`[DRY-RUN] ${c.code} : "${c.axePrioritaire}" → ${target}`);
    }
  }

  console.log('\n=== Récapitulatif ===');
  console.log(`Total cas examinés : ${cas.length}`);
  console.log(`Mappés (${apply ? 'appliqués' : 'à appliquer'}) : ${counters.mapped}`);
  console.log(`Déjà renseignés (skip) : ${counters.alreadySet}`);
  console.log(`Source NULL (skip)     : ${counters.nullSource}`);
  console.log(`Valeur inconnue (skip) : ${counters.unknownAxe}`);
  if (unknownValues.size > 0) {
    console.log('\nValeurs sans mapping :');
    for (const v of unknownValues) console.log(`  - "${v}"`);
    console.log('\nÀ compléter dans MAPPING puis relancer.');
  }
  if (!apply && counters.mapped > 0) {
    console.log(`\nDry-run OK. Pour appliquer : node normalize_domaines.cjs --apply`);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); }).finally(() => p.$disconnect());
