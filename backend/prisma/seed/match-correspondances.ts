/**
 * Correspondances candidates ServiceGuichet ↔ CasUsageMVP — Étape 3/5
 *
 * Lecture seule. AUCUNE LiaisonGuichet créée — la validation est humaine
 * (étape 5).
 *
 * Univers : les ServiceGuichet avec besoinSiTiers renseigné.
 * Cibles  : CasUsageMVP de typologie METIER ou TECHNIQUE.
 *
 * Méthode :
 *   1. Filtre par secteur : on ne retient comme candidats que les CU dont le
 *      domaine appartient au mapping du secteur ServiceGuichet.
 *   2. Score d'intitulé = max(Levenshtein normalisé, Jaccard sur tokens),
 *      après normalisation (lowercase, sans accents, sans ponctuation,
 *      stopwords FR très courants retirés pour Jaccard).
 *   3. Top-3 candidats par ServiceGuichet, triés score DESC, code CU ASC en
 *      départage. On garde aussi les scores bas pour audit visuel.
 *
 * Sortie : backend/prisma/seed/correspondances_candidates.csv
 *
 * Réf : MCTN/DU/PROMPTS-PINS-LIAISON-GUICHET-2026 — étape 3.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MAPPING SECTEURS séminaire → domaines catalogue (validé par Birama 30/06/2026)
// Voir conversation : Transport → SERVICES_CITOYENS uniquement (pas TRANSVERSAL),
// les éventuels non-matches sont une zone aveugle assumée, pas masquée par un
// faux positif.
// ============================================================================
const SECTOR_TO_DOMAINES: Record<string, string[]> = {
  'Transport': ['SERVICES_CITOYENS'],
  'Éducation': ['EDUCATION', 'EMPLOI_FORMATION'],
  'Fiscalités et domaine': ['FINANCES_PUBLIQUES', 'FONCIER_CADASTRE'],
  'Sante / protection sociale': ['SANTE_NUMERIQUE', 'PROTECTION_SOCIALE'],
  'Travail et Sécurité Sociale': ['EMPLOI_FORMATION', 'PROTECTION_SOCIALE'],
  'Citoyenneté': ['IDENTITE_NUMERIQUE', 'JUSTICE_ETAT_CIVIL', 'SERVICES_CITOYENS'],
  'Formation professsonnelle': ['EMPLOI_FORMATION', 'EDUCATION'],
};

// Stopwords FR très courants — réduit le bruit Jaccard (le simple "de" matchant
// 80 % des intitulés gonflerait artificiellement le score). Liste volontairement
// courte, conservatrice.
const STOPWORDS_FR = new Set([
  'a', 'au', 'aux', 'avec', 'd', 'de', 'des', 'du', 'en', 'et', 'l',
  'la', 'le', 'les', 'ou', 'par', 'pour', 'sur', 'un', 'une',
]);

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS_FR.has(t));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  // Rolling-array Levenshtein (O(min(a, b)) memory)
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function levenshteinNormalized(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function similarity(intituleGuichet: string, intituleCU: string): number {
  const ng = normalize(intituleGuichet);
  const nc = normalize(intituleCU);
  if (ng.length === 0 || nc.length === 0) return 0;
  const lev = levenshteinNormalized(ng, nc);
  const jac = jaccard(tokens(intituleGuichet), tokens(intituleCU));
  return Math.max(lev, jac);
}

// RFC 4180 quoting
function csvField(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return '';
  const v = s.toString();
  if (/[",\r\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

interface Candidate {
  casUsageCode: string;
  casUsageIntitule: string;
  domaineCatalogue: string;
  score: number;
}

interface RowOut {
  serviceGuichetCode: string;
  serviceGuichetIntitule: string;
  secteurGuichet: string;
  casUsageCode: string;
  casUsageIntitule: string;
  domaineCatalogue: string;
  score: number;
  rang: number;
}

async function main() {
  // 1. Univers
  const services = await prisma.serviceGuichet.findMany({
    where: { besoinSiTiers: { not: null } },
    select: { code: true, intitule: true, secteur: true },
    orderBy: { code: 'asc' },
  });
  console.log(`Univers : ${services.length} ServiceGuichet avec besoinSiTiers`);

  // 2. Catalogue METIER + TECHNIQUE, indexé par domaine
  const catalogue = await prisma.casUsageMVP.findMany({
    where: {
      typologie: { in: ['METIER', 'TECHNIQUE'] },
      domaine: { not: null },
    },
    select: { code: true, titre: true, domaine: true },
  });
  console.log(`Catalogue : ${catalogue.length} CasUsageMVP (METIER+TECHNIQUE) avec domaine renseigné`);
  console.log(`           ${17 /* connu */} cas avec domaine=NULL exclus (zone aveugle dette catalogue)`);

  const byDomaine: Record<string, Array<{ code: string; titre: string; domaine: string }>> = {};
  for (const cu of catalogue) {
    const dom = cu.domaine!; // filtré non null
    (byDomaine[dom] ||= []).push({ code: cu.code, titre: cu.titre, domaine: dom });
  }

  // 3. Matching
  const rows: RowOut[] = [];
  const noCandidate: Array<{ code: string; intitule: string; secteur: string }> = [];
  const top1Scores: number[] = [];

  for (const svc of services) {
    const secteur = svc.secteur ?? '';
    const domaines = SECTOR_TO_DOMAINES[secteur];
    if (!domaines || domaines.length === 0) {
      // Secteur hors mapping : devrait pas arriver dans l'univers des 41,
      // mais sécurité.
      noCandidate.push({ code: svc.code, intitule: svc.intitule, secteur });
      console.warn(`[${svc.code}] secteur "${secteur}" hors mapping → 0 candidat`);
      continue;
    }
    const pool: Array<{ code: string; titre: string; domaine: string }> = [];
    for (const d of domaines) {
      if (byDomaine[d]) pool.push(...byDomaine[d]);
    }
    if (pool.length === 0) {
      noCandidate.push({ code: svc.code, intitule: svc.intitule, secteur });
      continue;
    }
    const scored: Candidate[] = pool.map((cu) => ({
      casUsageCode: cu.code,
      casUsageIntitule: cu.titre,
      domaineCatalogue: cu.domaine,
      score: similarity(svc.intitule, cu.titre),
    }));
    // Tri principal : score DESC, secondaire : code ASC pour stabilité
    scored.sort((a, b) => b.score - a.score || a.casUsageCode.localeCompare(b.casUsageCode));
    const top3 = scored.slice(0, 3);
    if (top3.length === 0) {
      noCandidate.push({ code: svc.code, intitule: svc.intitule, secteur });
      continue;
    }
    top1Scores.push(top3[0].score);
    for (let i = 0; i < top3.length; i++) {
      rows.push({
        serviceGuichetCode: svc.code,
        serviceGuichetIntitule: svc.intitule,
        secteurGuichet: secteur,
        casUsageCode: top3[i].casUsageCode,
        casUsageIntitule: top3[i].casUsageIntitule,
        domaineCatalogue: top3[i].domaineCatalogue,
        score: top3[i].score,
        rang: i + 1,
      });
    }
  }

  // 4. Tri global de la sortie : serviceGuichetCode ASC, rang ASC
  rows.sort((a, b) =>
    a.serviceGuichetCode.localeCompare(b.serviceGuichetCode) || a.rang - b.rang
  );

  // 5. Écriture CSV
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(__dirname, 'correspondances_candidates.csv');
  const header = [
    'serviceGuichetCode',
    'serviceGuichetIntitule',
    'secteurGuichet',
    'casUsageCode',
    'casUsageIntitule',
    'domaineCatalogue',
    'score',
    'rang',
  ].join(',');
  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.serviceGuichetCode),
        csvField(r.serviceGuichetIntitule),
        csvField(r.secteurGuichet),
        csvField(r.casUsageCode),
        csvField(r.casUsageIntitule),
        csvField(r.domaineCatalogue),
        r.score.toFixed(4),
        r.rang,
      ].join(',')
    );
  }
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
  console.log(`\nCSV écrit : ${outPath}`);
  console.log(`${rows.length} lignes (top-3 par ServiceGuichet ayant ≥ 1 candidat)`);

  // 6. Stats demandées
  const svcAvecCandidat = new Set(rows.map((r) => r.serviceGuichetCode));
  const top1Map = new Map<string, number>();
  for (const r of rows) {
    if (r.rang === 1) top1Map.set(r.serviceGuichetCode, r.score);
  }
  const svcAvecScore05 = [...top1Map.entries()].filter(([, s]) => s >= 0.5).length;

  const ge07 = [...top1Map.values()].filter((s) => s >= 0.7).length;
  const ge05_07 = [...top1Map.values()].filter((s) => s >= 0.5 && s < 0.7).length;
  const lt05 = [...top1Map.values()].filter((s) => s < 0.5).length;

  console.log('\n=== STATS ===');
  console.log(`ServiceGuichet avec ≥ 1 candidat (toute qualité)   : ${svcAvecCandidat.size} / ${services.length}`);
  console.log(`ServiceGuichet avec top-1 score ≥ 0.5              : ${svcAvecScore05} / ${services.length}`);
  console.log('\nRépartition des scores top-1 :');
  console.log(`  ≥ 0.7        : ${ge07}`);
  console.log(`  0.5 — 0.7    : ${ge05_07}`);
  console.log(`  < 0.5        : ${lt05}`);

  console.log(`\n=== ${noCandidate.length} ServiceGuichet à 0 CANDIDAT ===`);
  if (noCandidate.length === 0) {
    console.log('(aucun)');
  } else {
    for (const s of noCandidate) {
      console.log(`  [${s.code}] (${s.secteur}) — ${s.intitule}`);
    }
  }

  console.log('\n⚠️  AUCUNE LiaisonGuichet créée. Validation humaine étape 5.');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Échec matching :', e);
  await prisma.$disconnect();
  process.exit(1);
});
