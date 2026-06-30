/**
 * Import idempotent du référentiel guichet e-sénégal — Étape 2/5
 *
 * Charge backend/prisma/seed/PINS_referentiel_guichet_esenegal.json et upsert
 * un ServiceGuichet par entrée de `demarches_guichet`.
 *
 * Idempotence : clé naturelle (intitule + secteur). Pas de code source dans
 * le JSON donc on attribue PINS-GUICHET-NNN séquentiel (capacité 999) au
 * premier import — le code est ensuite préservé sur les relances.
 *
 * Contrôle de non-régression : compte CasUsageMVP par typologie AVANT et
 * APRÈS. Si METIER ou TECHNIQUE change → exit non-zéro. Cible : 100
 * ServiceGuichet en fin de premier import.
 *
 * Usage : npx tsx prisma/seed/import-guichet.ts
 *
 * Réf : MCTN/DU/PROMPTS-PINS-LIAISON-GUICHET-2026 — étape 2.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PublicCibleEnum = 'CITOYEN' | 'ENTREPRISE' | 'MIXTE';

interface DemarcheGuichet {
  intitule: string;
  evenement_de_vie?: string | null;
  secteur?: string | null;
  public_cible_propose?: string | null;
  statut_exposition_teledac?: string | null;
  besoin_si_tiers?: string | null;
  mecanisme_integration?: string | null;
  point_focal_si_tiers?: string | null;
  ministere?: string | null;
  structure?: string | null;
  code_priorisation_2026?: string | null;
  code_priorisation_v1?: string | null;
  priorisation?: Record<string, unknown> | null;
  present_dans?: string[] | null;
  [key: string]: unknown;
}

interface Referentiel {
  source: string;
  note_integration?: string;
  recap?: Record<string, unknown>;
  demarches_guichet: DemarcheGuichet[];
}

function normalizePublicCible(raw: string | null | undefined): PublicCibleEnum | null {
  if (!raw) return null;
  const v = raw.toString().trim().toLowerCase();
  if (v === 'citoyen') return 'CITOYEN';
  if (v === 'entreprise') return 'ENTREPRISE';
  if (v === 'mixte') return 'MIXTE';
  // "à valider" et toute autre valeur → null (à statuer manuellement après import)
  return null;
}

function normalizeNullable(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const s = raw.toString().trim();
  return s.length === 0 ? null : s;
}

function buildPriorisationJson(d: DemarcheGuichet): Record<string, unknown> | null {
  const blob: Record<string, unknown> = {};
  if (d.code_priorisation_2026) blob.code_priorisation_2026 = d.code_priorisation_2026;
  if (d.code_priorisation_v1) blob.code_priorisation_v1 = d.code_priorisation_v1;
  if (d.mecanisme_integration) blob.mecanisme_integration = d.mecanisme_integration;
  if (d.structure) blob.structure = d.structure;
  if (d.priorisation && Object.keys(d.priorisation).length > 0) {
    blob.priorisation = d.priorisation;
  }
  if (Array.isArray(d.present_dans) && d.present_dans.length > 0) {
    blob.present_dans = d.present_dans;
  }
  return Object.keys(blob).length === 0 ? null : blob;
}

function nextCode(currentMax: number): string {
  const next = currentMax + 1;
  if (next > 999) {
    throw new Error(`PINS-GUICHET-NNN épuisé (max=${currentMax}, capacité 999)`);
  }
  return `PINS-GUICHET-${next.toString().padStart(3, '0')}`;
}

async function countCasUsageMVPParTypologie() {
  const rows = await prisma.casUsageMVP.groupBy({
    by: ['typologie'],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.typologie] = r._count._all;
  }
  return counts;
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const jsonPath = resolve(__dirname, 'PINS_referentiel_guichet_esenegal.json');
  console.log(`Source : ${jsonPath}`);

  const raw = readFileSync(jsonPath, 'utf-8');
  const ref = JSON.parse(raw) as Referentiel;

  if (!Array.isArray(ref.demarches_guichet)) {
    throw new Error('Format invalide : demarches_guichet manquant ou non tableau');
  }
  console.log(`${ref.demarches_guichet.length} démarches à traiter`);

  // ----- CONTRÔLE DE NON-RÉGRESSION : compte AVANT -----
  const typologieAvant = await countCasUsageMVPParTypologie();
  const guichetAvant = await prisma.serviceGuichet.count();
  console.log('\n=== AVANT IMPORT ===');
  console.log(`CasUsageMVP par typologie : ${JSON.stringify(typologieAvant)}`);
  console.log(`ServiceGuichet total      : ${guichetAvant}`);

  // ----- Init compteur de codes PINS-GUICHET-NNN -----
  const existingCodes = await prisma.serviceGuichet.findMany({
    select: { code: true },
  });
  let currentMax = 0;
  for (const { code } of existingCodes) {
    const m = code.match(/^PINS-GUICHET-(\d{3})$/);
    if (m) currentMax = Math.max(currentMax, parseInt(m[1], 10));
  }
  console.log(`PINS-GUICHET-NNN — max existant : ${currentMax}`);

  // ----- IMPORT IDEMPOTENT -----
  let crees = 0;
  let majs = 0;
  let ignores = 0;
  const erreurs: Array<{ index: number; intitule: string; error: string }> = [];

  for (let i = 0; i < ref.demarches_guichet.length; i++) {
    const d = ref.demarches_guichet[i];
    const intitule = normalizeNullable(d.intitule);
    if (!intitule) {
      ignores++;
      console.warn(`[${i}] IGNORÉ — intitule vide`);
      continue;
    }
    const secteur = normalizeNullable(d.secteur);

    try {
      // 1. Lookup par (intitule, secteur)
      const existing = await prisma.serviceGuichet.findFirst({
        where: {
          intitule,
          ...(secteur === null ? { secteur: null } : { secteur }),
        },
      });

      const data = {
        intitule,
        evenementDeVie: normalizeNullable(d.evenement_de_vie),
        secteur,
        publicCible: normalizePublicCible(d.public_cible_propose),
        statutEsenegal: normalizeNullable(d.statut_exposition_teledac),
        ministere: normalizeNullable(d.ministere),
        pointFocalSiTiers: normalizeNullable(d.point_focal_si_tiers),
        besoinSiTiers: normalizeNullable(d.besoin_si_tiers),
        priorisationJson: buildPriorisationJson(d),
      };

      if (existing) {
        await prisma.serviceGuichet.update({
          where: { id: existing.id },
          // ⚠️ NE PAS réassigner le code — on préserve l'identifiant stable
          data,
        });
        majs++;
      } else {
        const code = nextCode(currentMax);
        currentMax += 1;
        await prisma.serviceGuichet.create({
          data: {
            code,
            ...data,
          },
        });
        crees++;
      }
    } catch (err: any) {
      erreurs.push({ index: i, intitule, error: err?.message || String(err) });
      console.error(`[${i}] ERREUR — ${intitule} : ${err?.message || err}`);
    }
  }

  // ----- CONTRÔLE DE NON-RÉGRESSION : compte APRÈS -----
  const typologieApres = await countCasUsageMVPParTypologie();
  const guichetApres = await prisma.serviceGuichet.count();

  console.log('\n=== RÉCAP IMPORT ===');
  console.log(`Créés   : ${crees}`);
  console.log(`MAJ     : ${majs}`);
  console.log(`Ignorés : ${ignores}`);
  console.log(`Erreurs : ${erreurs.length}`);
  if (erreurs.length > 0) {
    console.log('Détails erreurs :');
    for (const e of erreurs) console.log(`  - [${e.index}] ${e.intitule} : ${e.error}`);
  }

  console.log('\n=== APRÈS IMPORT ===');
  console.log(`CasUsageMVP par typologie : ${JSON.stringify(typologieApres)}`);
  console.log(`ServiceGuichet total      : ${guichetApres}`);

  // ----- ASSERTIONS NON-RÉGRESSION -----
  const allTypologies = new Set([...Object.keys(typologieAvant), ...Object.keys(typologieApres)]);
  let regression = false;
  for (const t of allTypologies) {
    const av = typologieAvant[t] ?? 0;
    const ap = typologieApres[t] ?? 0;
    if (av !== ap) {
      console.error(`❌ RÉGRESSION CasUsageMVP[${t}] : ${av} → ${ap}`);
      regression = true;
    }
  }
  if (regression) {
    console.error('\n❌ Contrôle de non-régression ÉCHEC — typologies modifiées par l\'import.');
    await prisma.$disconnect();
    process.exit(2);
  }
  console.log('✅ Non-régression OK — typologies CasUsageMVP inchangées.');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Échec import :', e);
  await prisma.$disconnect();
  process.exit(1);
});
