/**
 * Passe 2 — Liaison ServiceGuichet restants (61 sans liaison après passe 1)
 * Mapping secteurs élargi. Idempotent, ne touche pas aux liaisons existantes.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SECTOR_TO_DOMAINES: Record<string, string[]> = {
  'Transport': ['SERVICES_CITOYENS'],
  'Éducation': ['EDUCATION', 'EMPLOI_FORMATION'],
  'Fiscalités et domaine': ['FINANCES_PUBLIQUES', 'FONCIER_CADASTRE'],
  'Sante / protection sociale': ['SANTE_NUMERIQUE', 'PROTECTION_SOCIALE'],
  'Travail et Sécurité Sociale': ['EMPLOI_FORMATION', 'PROTECTION_SOCIALE'],
  'Citoyenneté': ['IDENTITE_NUMERIQUE', 'JUSTICE_ETAT_CIVIL', 'SERVICES_CITOYENS'],
  'Formation professsonnelle': ['EMPLOI_FORMATION', 'EDUCATION'],
  // ---- Extensions passe 2 ----
  'État Civil': ['JUSTICE_ETAT_CIVIL'],
  'État Civil Consulaire': ['JUSTICE_ETAT_CIVIL'],
  'Justice': ['JUSTICE_ETAT_CIVIL'],
  'Urbanisme': ['FONCIER_CADASTRE'],
  'Vie Associative': ['SERVICES_CITOYENS'],
  'Commerce': ['CLIMAT_AFFAIRES'],
  'Création d\'entreprise': ['CLIMAT_AFFAIRES'],
  'entreprenariat': ['CLIMAT_AFFAIRES'],
  'Exportation / douane': ['FINANCES_PUBLIQUES'],
  'Services aux Étrangers': ['IDENTITE_NUMERIQUE', 'SERVICES_CITOYENS'],
  'Environnement': ['SERVICES_CITOYENS'],
  'Tourisme': ['SERVICES_CITOYENS'],
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
  if (a === b) return 0; if (a.length === 0) return b.length; if (b.length === 0) return a.length;
  let prev = new Array(b.length + 1), curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) { curr[0] = i; for (let j = 1; j <= b.length; j++) { const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1; curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost); } [prev, curr] = [curr, prev]; }
  return prev[b.length];
}
function levenshteinNormalized(a: string, b: string): number { const maxLen = Math.max(a.length, b.length); return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen; }
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a), sb = new Set(b); let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter; return union === 0 ? 0 : inter / union;
}
function similarity(intituleGuichet: string, intituleCU: string): number {
  const ng = normalize(intituleGuichet), nc = normalize(intituleCU);
  if (ng.length === 0 || nc.length === 0) return 0;
  return Math.max(levenshteinNormalized(ng, nc), jaccard(tokens(intituleGuichet), tokens(intituleCU)));
}

async function main() {
  // ---- Cible : uniquement les ServiceGuichet sans liaison ----
  const allServices = await prisma.serviceGuichet.findMany({
    include: { _count: { select: { liaisons: true } } },
    orderBy: { code: 'asc' },
  });
  const toProcess = allServices.filter((s) => s._count.liaisons === 0);
  console.log(`Total ServiceGuichet      : ${allServices.length}`);
  console.log(`Déjà liés (passe 1)       : ${allServices.length - toProcess.length}`);
  console.log(`Sans liaison → à matcher  : ${toProcess.length}\n`);

  if (toProcess.length === 0) { console.log('Rien à faire.'); await prisma.$disconnect(); return; }

  const catalogue = await prisma.casUsageMVP.findMany({
    where: { typologie: { in: ['METIER', 'TECHNIQUE'] }, domaine: { not: null } },
    select: { id: true, code: true, titre: true, domaine: true },
  });
  const byDomaine: Record<string, Array<{ id: string; code: string; titre: string; domaine: string }>> = {};
  for (const cu of catalogue) { const dom = cu.domaine!; (byDomaine[dom] ||= []).push({ id: cu.id, code: cu.code, titre: cu.titre, domaine: dom }); }

  const LOT_DATE = '2026-07-01';
  let palier070 = 0, palier050 = 0, zoneAveugle = 0, horsMapping = 0;
  const aveugles: Array<{ code: string; intitule: string; secteur: string; bestScore: number; bestCU: string; nbPool: number }> = [];
  const horsMappingList: Array<{ code: string; intitule: string; secteur: string }> = [];
  const exemples: Array<{ svcCode: string; svcIntitule: string; cuCode: string; cuIntitule: string; score: number; mode: string }> = [];

  for (const svc of toProcess) {
    const secteur = svc.secteur ?? '';
    const domaineMapping = SECTOR_TO_DOMAINES[secteur];

    if (!domaineMapping || domaineMapping.length === 0) {
      horsMapping++;
      horsMappingList.push({ code: svc.code, intitule: svc.intitule, secteur });
      continue;
    }

    const pool: Array<{ id: string; code: string; titre: string; domaine: string }> = [];
    for (const d of domaineMapping) if (byDomaine[d]) pool.push(...byDomaine[d]);

    const cands = pool
      .map((cu) => ({ cuId: cu.id, cuCode: cu.code, cuIntitule: cu.titre, domaineCatalogue: cu.domaine, score: similarity(svc.intitule, cu.titre) }))
      .sort((a, b) => b.score - a.score || a.cuCode.localeCompare(b.cuCode));
    const top1 = cands[0];

    if (!top1 || top1.score < 0.50) {
      zoneAveugle++;
      aveugles.push({ code: svc.code, intitule: svc.intitule, secteur, bestScore: top1?.score ?? 0, bestCU: top1?.cuCode ?? '(0 candidat)', nbPool: cands.length });
      continue;
    }

    const mode = top1.score >= 0.70 ? 'MATCHING_AUTO' : 'MATCHING_AUTO_A_CONFIRMER';
    const scoreStr = top1.score.toFixed(2);
    const note = `score=${scoreStr} lot ${LOT_DATE}`;

    await prisma.liaisonGuichet.upsert({
      where: { casUsageId_serviceGuichetId: { casUsageId: top1.cuId, serviceGuichetId: svc.id } },
      create: { casUsageId: top1.cuId, serviceGuichetId: svc.id, mode, note, ajoutePar: 'MATCHING_AUTO' },
      update: { mode, note },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: 'MATCHING_AUTO', userEmail: 'script@liaison-masse', userRole: 'ADMIN',
          action: 'UPDATE', resource: 'liaison-guichet',
          resourceId: `${svc.code}`, resourceLabel: `${svc.code} ↔ ${top1.cuCode} (score ${scoreStr})`,
          ipAddress: '127.0.0.1',
        },
      });
    } catch {}

    if (mode === 'MATCHING_AUTO') palier070++; else palier050++;
    exemples.push({ svcCode: svc.code, svcIntitule: svc.intitule, cuCode: top1.cuCode, cuIntitule: top1.cuIntitule, score: top1.score, mode });
  }

  // ---- Récap ----
  const liaisonTotal = await prisma.liaisonGuichet.count();
  console.log('=== CRÉATION PASSE 2 ===');
  console.log(`score >= 0.70 (MATCHING_AUTO)           : ${palier070}`);
  console.log(`0.50 <= score < 0.70 (A_CONFIRMER)     : ${palier050}`);
  console.log(`zone aveugle (score < 0.50 / 0 cand)   : ${zoneAveugle}`);
  console.log(`secteur hors mapping                   : ${horsMapping}`);
  console.log(`Total ServiceGuichet sans liaison      : ${toProcess.length}`);
  console.log(`Liaisons créées dans la passe           : ${palier070 + palier050}`);
  console.log(`Total LiaisonGuichet en base            : ${liaisonTotal}`);

  // ---- KPIs globaux ----
  const cus = await prisma.casUsageMVP.findMany({
    select: { id: true, liaisonsGuichet: { select: { serviceGuichet: { select: { id: true, publicCible: true, statutEsenegal: true } } } } },
  });
  let citoyen = 0, entreprise = 0, enLigne = 0, nonUtilise = 0, avecLiaison = 0;
  const sgIds = new Set<string>();
  for (const cu of cus) {
    if (cu.liaisonsGuichet.length > 0) avecLiaison++;
    for (const l of cu.liaisonsGuichet) {
      sgIds.add(l.serviceGuichet.id);
      if (l.serviceGuichet.publicCible === 'CITOYEN') citoyen++;
      else if (l.serviceGuichet.publicCible === 'ENTREPRISE') entreprise++;
      if (l.serviceGuichet.statutEsenegal === 'En ligne') enLigne++;
      else if (l.serviceGuichet.statutEsenegal === 'En ligne mais Non utilisée') nonUtilise++;
    }
  }
  console.log('\n=== KPIs GLOBAUX (passe 1+2) ===');
  console.log(`casUsageAvecLiaison : ${avecLiaison} / ${cus.length}`);
  console.log(`servicesGuichetLies : ${sgIds.size} / ${allServices.length}`);
  console.log(`liaisonsCitoyen     : ${citoyen}`);
  console.log(`liaisonsEntreprise  : ${entreprise}`);
  console.log(`exposeEnLigne       : ${enLigne} + nonUtilise: ${nonUtilise}`);

  // ---- Zone aveugle résiduelle ----
  if (aveugles.length > 0) {
    console.log(`\n=== ${aveugles.length} SERVICE GUICHET EN ZONE AVEUGLE RÉSIDUELLE ===`);
    for (const a of aveugles) console.log(`  [${a.code}] (${a.secteur || '?'}) best=${a.bestCU} score=${a.bestScore.toFixed(2)} | pool=${a.nbPool} - ${a.intitule}`);
  }
  if (horsMappingList.length > 0) {
    console.log(`\n=== ${horsMappingList.length} SECTEUR HORS MAPPING (à ajouter manuellement) ===`);
    for (const h of horsMappingList) console.log(`  [${h.code}] (${h.secteur}) - ${h.intitule}`);
  }

  // ---- 10 exemples passe 2 ----
  const toShow = exemples.slice(0, 10);
  console.log('\n=== 10 EXEMPLES PASSE 2 ===');
  for (const e of toShow) console.log(`  ${e.svcCode} (${e.svcIntitule.slice(0, 55)}) ↔ ${e.cuCode} (${e.cuIntitule.slice(0, 55)}) | score=${e.score.toFixed(2)} ${e.mode}`);

  await prisma.$disconnect();
  console.log('\n✅ Passe 2 terminée.');
}

main().catch(async (e) => { console.error('Échec :', e); await prisma.$disconnect(); process.exit(1); });
