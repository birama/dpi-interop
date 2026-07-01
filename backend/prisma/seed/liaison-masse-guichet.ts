/**
 * Liaison de masse ServiceGuichet ↔ CasUsageMVP — validation humaine 2026-07-01
 *
 * Lecture/écriture. Crée des LiaisonGuichet pour le top-1 de chaque
 * ServiceGuichet, par paliers de score. Idempotent : re-jouable sans doublon.
 *
 * Pré-requis : 100 ServiceGuichet importés, typologie CasUsageMVP corrigée.
 * Base cible : locale (prod non encore alignée — migration + seed pending).
 *
 * Réf : MCTN/DU/PROMPTS-PINS-LIAISON-GUICHET-2026 — liaison de masse.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MAPPING SECTEURS (validé Birama 30/06/2026)
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

const STOPWORDS_FR = new Set([
  'a', 'au', 'aux', 'avec', 'd', 'de', 'des', 'du', 'en', 'et', 'l',
  'la', 'le', 'les', 'ou', 'par', 'pour', 'sur', 'un', 'une',
]);

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.toString().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s: string): string[] {
  return normalize(s).split(' ').filter((t) => t.length >= 2 && !STOPWORDS_FR.has(t));
}
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
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
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}
function similarity(intituleGuichet: string, intituleCU: string): number {
  const ng = normalize(intituleGuichet);
  const nc = normalize(intituleCU);
  if (ng.length === 0 || nc.length === 0) return 0;
  return Math.max(levenshteinNormalized(ng, nc), jaccard(tokens(intituleGuichet), tokens(intituleCU)));
}

interface Candidate { casUsageId: string; casUsageCode: string; casUsageIntitule: string; domaineCatalogue: string; score: number; }

async function main() {
  // ---- 0. État initial ----
  const svcBefore = await prisma.serviceGuichet.count();
  const liaisonBefore = await prisma.liaisonGuichet.count();
  console.log(`ServiceGuichet : ${svcBefore} | LiaisonGuichet existantes : ${liaisonBefore}`);

  // ---- 1. Matching sur TOUS les 100 ServiceGuichet ----
  const services = await prisma.serviceGuichet.findMany({
    select: { id: true, code: true, intitule: true, secteur: true },
    orderBy: { code: 'asc' },
  });
  console.log(`${services.length} ServiceGuichet à matcher`);

  const catalogue = await prisma.casUsageMVP.findMany({
    where: { typologie: { in: ['METIER', 'TECHNIQUE'] }, domaine: { not: null } },
    select: { id: true, code: true, titre: true, domaine: true },
  });
  console.log(`${catalogue.length} CasUsageMVP (METIER+TECHNIQUE, domaine renseigné)`);

  const byDomaine: Record<string, Array<{ id: string; code: string; titre: string; domaine: string }>> = {};
  for (const cu of catalogue) {
    const dom = cu.domaine!;
    (byDomaine[dom] ||= []).push({ id: cu.id, code: cu.code, titre: cu.titre, domaine: dom });
  }

  const scored: Array<{ svcId: string; svcCode: string; svcIntitule: string; svcSecteur: string; top3: Candidate[] }> = [];

  for (const svc of services) {
    const domaineMapping = SECTOR_TO_DOMAINES[svc.secteur ?? ''] ?? [];
    const pool: Array<{ id: string; code: string; titre: string; domaine: string }> = [];
    for (const d of domaineMapping) if (byDomaine[d]) pool.push(...byDomaine[d]);

    const cands: Candidate[] = pool.map((cu) => ({
      casUsageId: cu.id, casUsageCode: cu.code, casUsageIntitule: cu.titre,
      domaineCatalogue: cu.domaine, score: similarity(svc.intitule, cu.titre),
    }));
    cands.sort((a, b) => b.score - a.score || a.casUsageCode.localeCompare(b.casUsageCode));
    scored.push({ svcId: svc.id, svcCode: svc.code, svcIntitule: svc.intitule, svcSecteur: svc.secteur ?? '', top3: cands.slice(0, 3) });
  }

  // ---- 2. Création LiaisonGuichet top-1, par paliers ----
  const LOT_DATE = '2026-07-01';
  let palier070 = 0, palier050 = 0, zoneAveugle = 0;
  const aveugles: Array<{ code: string; intitule: string; secteur: string; bestScore: number; bestCU: string; nbPool: number }> = [];

  for (const s of scored) {
    const top1 = s.top3[0];
    if (!top1 || top1.score < 0.50) {
      zoneAveugle++;
      aveugles.push({
        code: s.svcCode, intitule: s.svcIntitule, secteur: s.svcSecteur,
        bestScore: top1?.score ?? 0, bestCU: top1?.casUsageCode ?? '(0 candidat)', nbPool: s.top3.length,
      });
      continue;
    }
    const mode = top1.score >= 0.70 ? 'MATCHING_AUTO' : 'MATCHING_AUTO_A_CONFIRMER';
    const scoreStr = top1.score.toFixed(2);
    const note = `score=${scoreStr} lot ${LOT_DATE}`;

    await prisma.liaisonGuichet.upsert({
      where: { casUsageId_serviceGuichetId: { casUsageId: top1.casUsageId, serviceGuichetId: s.svcId } },
      create: { casUsageId: top1.casUsageId, serviceGuichetId: s.svcId, mode, note, ajoutePar: 'MATCHING_AUTO' },
      update: { mode, note },
    });

    // Audit log manuel (le upsert ne déclenche pas le middleware audit de la route HTTP)
    try {
      await prisma.auditLog.create({
        data: {
          userId: 'MATCHING_AUTO', userEmail: 'script@liaison-masse', userRole: 'ADMIN',
          action: 'UPDATE', resource: 'liaison-guichet',
          resourceId: `${s.svcCode}`, resourceLabel: `${s.svcCode} ↔ ${top1.casUsageCode} (score ${scoreStr})`,
          ipAddress: '127.0.0.1',
        },
      });
    } catch {}

    if (mode === 'MATCHING_AUTO') palier070++;
    else palier050++;
  }

  // ---- 3. Récap ----
  const liaisonAfter = await prisma.liaisonGuichet.count();
  console.log(`\n=== CRÉATION ===`);
  console.log(`score >= 0.70 (MATCHING_AUTO)           : ${palier070}`);
  console.log(`0.50 <= score < 0.70 (A_CONFIRMER)     : ${palier050}`);
  console.log(`score < 0.50 / 0 candidat (zone aveugle): ${zoneAveugle}`);
  console.log(`Total ServiceGuichet                     : ${services.length}`);
  console.log(`Total LiaisonGuichet en base             : ${liaisonAfter} (avant: ${liaisonBefore}, créées/MAJ: ${palier070 + palier050})`);

  // Liste zone aveugle
  if (aveugles.length > 0) {
    console.log(`\n=== ${aveugles.length} ServiceGuichet EN ZONE AVEUGLE (score < 0.50 ou 0 candidat) ===`);
    for (const a of aveugles) {
      console.log(`  [${a.code}] (${a.secteur || '?'}) — ${a.intitule} | best=${a.bestCU} score=${a.bestScore.toFixed(2)} | pool=${a.nbPool}`);
    }
  }

  // KPIs /correspondance-esenegal
  const cus = await prisma.casUsageMVP.findMany({
    orderBy: [{ typologie: 'asc' }, { code: 'asc' }],
    select: {
      id: true, liaisonsGuichet: {
        select: { serviceGuichet: { select: { id: true, publicCible: true, statutEsenegal: true } } },
      },
    },
  });
  let citoyen = 0, entreprise = 0, mixte = 0, enLigne = 0, nonUtilise = 0, avecLiaison = 0;
  const sgIds = new Set<string>();
  for (const cu of cus) {
    if (cu.liaisonsGuichet.length > 0) avecLiaison++;
    for (const l of cu.liaisonsGuichet) {
      sgIds.add(l.serviceGuichet.id);
      const pc = l.serviceGuichet.publicCible;
      if (pc === 'CITOYEN') citoyen++;
      else if (pc === 'ENTREPRISE') entreprise++;
      else if (pc === 'MIXTE') mixte++;
      const se = l.serviceGuichet.statutEsenegal;
      if (se === 'En ligne') enLigne++;
      else if (se === 'En ligne mais Non utilisée') nonUtilise++;
    }
  }
  console.log(`\n=== KPIs /correspondance-esenegal ===`);
  console.log(`casUsageTotal       : ${cus.length}`);
  console.log(`casUsageAvecLiaison : ${avecLiaison}`);
  console.log(`casUsageSansLiaison : ${cus.length - avecLiaison}`);
  console.log(`servicesGuichetLies : ${sgIds.size}`);
  console.log(`liaisonsCitoyen     : ${citoyen}`);
  console.log(`liaisonsEntreprise  : ${entreprise}`);
  console.log(`liaisonsExposeEnLigne   : ${enLigne}`);
  console.log(`liaisonsExposeNonUtilise: ${nonUtilise}`);

  // ---- 4. Échantillon 10 exemples ----
  const sample = await prisma.liaisonGuichet.findMany({
    take: 10,
    orderBy: { dateAjout: 'desc' },
    select: {
      mode: true, note: true,
      casUsage: { select: { code: true, titre: true } },
      serviceGuichet: { select: { code: true, intitule: true } },
    },
  });
  console.log('\n=== 10 EXEMPLES (récentes) ===');
  for (const s of sample) {
    console.log(`  ${s.serviceGuichet.code} (${s.serviceGuichet.intitule.slice(0, 60)}) ↔ ${s.casUsage.code} (${s.casUsage.titre.slice(0, 60)}) | mode=${s.mode} ${s.note ?? ''}`);
  }

  await prisma.$disconnect();
  console.log('\n✅ Liaison de masse terminée. Rollback : DELETE FROM liaison_guichet WHERE mode LIKE \'MATCHING_AUTO%\';');
}

main().catch(async (e) => {
  console.error('Échec liaison masse :', e);
  await prisma.$disconnect();
  process.exit(1);
});
