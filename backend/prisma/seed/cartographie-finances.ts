/**
 * Cartographie des cas d'usage des administrations financières — extraction
 * LECTURE SEULE. Sortie JSON + résumé console.
 *
 * Usage : npx tsx prisma/seed/cartographie-finances.ts
 * Sortie : exports/cartographie_finances_2026-07.json
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEYWORDS = [
  'impot', 'impôt', 'fiscal', 'taxe', 'tva', 'douane', 'dedouan', 'dédouan',
  'dau', 'patente', 'contribuable', 'ninea', 'quitus', 'tresor', 'trésor',
  'recette', 'redevance', 'timbre', 'cge', 'contentieux fiscal',
  'exoneration', 'exonération', 'sigif', 'sentax', 'gaine', 'gAInde', 'aster',
];

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.toString().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function matchKeyword(titre: string): boolean {
  const n = normalize(titre);
  return KEYWORDS.some((k) => n.includes(k));
}

async function main() {
  // ---- 1. Périmètre ----
  const all = await prisma.casUsageMVP.findMany({
    select: { id: true, code: true, titre: true, typologie: true, domaine: true },
    orderBy: { code: 'asc' },
  });

  const perimetreIds: string[] = [];
  const criteres: Record<string, string[]> = {}; // code → ['domaine', 'keyword']

  for (const cu of all) {
    const reasons: string[] = [];
    if (cu.domaine === 'FINANCES_PUBLIQUES') reasons.push('domaine');
    if (matchKeyword(cu.titre)) reasons.push('keyword');
    if (reasons.length > 0) {
      perimetreIds.push(cu.id);
      criteres[cu.code] = reasons;
    }
  }

  console.log(`Périmètre : ${perimetreIds.length} cas (sur ${all.length} total)`);

  // ---- 2. Extraction détaillée ----
  const cas = await prisma.casUsageMVP.findMany({
    where: { id: { in: perimetreIds } },
    orderBy: [{ domaine: 'asc' }, { typologie: 'asc' }, { code: 'asc' }],
    include: {
      stakeholders360: { include: { institution: { select: { code: true, nom: true } } } },
      registresAssocies: { include: { registre: { select: { code: true, nom: true, domaine: true } } } },
      casUsageProjets: { include: { projetNational: { select: { code: true, nom: true } } } },
      relationsMetier: { select: { casUsageTechnique: { select: { code: true, titre: true } } } },
      relationsTechnique: { select: { casUsageMetier: { select: { code: true, titre: true } } } },
      liaisonsGuichet: { include: { serviceGuichet: { select: { code: true, intitule: true } } } },
    },
  });

  // ---- 3. Structuration JSON ----
  interface CasExport {
    code: string; titre: string; typologie: string | null; domaine: string | null;
    statutVueSection: string; statutImpl: string; impact: string; aFinancer: boolean;
    sourceProposition: string | null; resumeMetier: string | null;
    critere: string[];
    partiesPrenantes: Array<{ code: string; nom: string }>;
    registresNationaux: Array<{ code: string; nom: string; domaine: string | null }>;
    projetsNDT: Array<{ code: string; nom: string }>;
    servicesTechniquesMobilises: string[];
    casMetierParents: string[];
    liaisonsGuichet: Array<{ code: string; intitule: string }>;
  }

  const exports: CasExport[] = cas.map((cu) => ({
    code: cu.code, titre: cu.titre, typologie: cu.typologie, domaine: cu.domaine,
    statutVueSection: cu.statutVueSection, statutImpl: cu.statutImpl,
    impact: cu.impact, aFinancer: cu.aFinancer,
    sourceProposition: cu.sourceProposition,
    resumeMetier: (cu.resumeMetier ?? '').slice(0, 200) || null,
    critere: criteres[cu.code] ?? [],
    partiesPrenantes: cu.stakeholders360.map((s) => ({ code: s.institution.code, nom: s.institution.nom })),
    registresNationaux: cu.registresAssocies.map((r) => ({ code: r.registre.code, nom: r.registre.nom, domaine: r.registre.domaine })),
    projetsNDT: cu.casUsageProjets.map((p) => ({ code: p.projetNational.code, nom: p.projetNational.nom })),
    servicesTechniquesMobilises: cu.relationsMetier.map((r) => r.casUsageTechnique.code),
    casMetierParents: cu.relationsTechnique.map((r) => r.casUsageMetier.code),
    liaisonsGuichet: cu.liaisonsGuichet.map((l) => ({ code: l.serviceGuichet.code, intitule: l.serviceGuichet.intitule })),
  }));

  // ---- 4. Agrégats ----
  const byDomaineTypoStatut: Record<string, number> = {};
  const byInstitution: Record<string, number> = {};
  let withRegistre = 0, withProjetNDT = 0, withPartiePrenante = 0, withGuichet = 0;

  for (const cu of cas) {
    const key = `${cu.domaine ?? 'NULL'} | ${cu.typologie} | ${cu.statutVueSection}`;
    byDomaineTypoStatut[key] = (byDomaineTypoStatut[key] ?? 0) + 1;
    if (cu.registresAssocies.length > 0) withRegistre++;
    if (cu.casUsageProjets.length > 0) withProjetNDT++;
    if (cu.stakeholders360.length > 0) withPartiePrenante++;
    if (cu.liaisonsGuichet.length > 0) withGuichet++;
    for (const s of cu.stakeholders360) {
      const inst = s.institution.code;
      byInstitution[inst] = (byInstitution[inst] ?? 0) + 1;
    }
  }

  const pilotes = cas.filter((cu) => ['EN_PRODUCTION_360', 'QUALIFIE', 'PRIORISE'].includes(cu.statutVueSection));
  const gizFinances = cas.filter((cu) => /^PINS-TECH-20\d\d/.test(cu.code));
  const horsDomaine = cas.filter((cu) => cu.domaine !== 'FINANCES_PUBLIQUES');

  const n = cas.length;

  const resume = {
    total: n,
    parDomaine: byDomaineTypoStatut,
    pilotes: pilotes.map((c) => ({ code: c.code, titre: c.titre, statut: c.statutVueSection })),
    gizFinances: gizFinances.map((c) => ({ code: c.code, titre: c.titre, statut: c.statutVueSection })),
    institutions: Object.entries(byInstitution).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ institution: k, occurrences: v })),
    tauxRemplissage: {
      avecPartiePrenante: Math.round((withPartiePrenante / n) * 100),
      avecRegistre: Math.round((withRegistre / n) * 100),
      avecProjetNDT: Math.round((withProjetNDT / n) * 100),
      avecGuichet: Math.round((withGuichet / n) * 100),
    },
    horsFinancesPubliques: horsDomaine.map((c) => ({ code: c.code, titre: c.titre, domaine: c.domaine, typologie: c.typologie, statut: c.statutVueSection })),
  };

  // ---- 5. Résumé console ----
  console.log(`\n=== AGRÉGATS ===`);
  console.log(`Total cas finances : ${n}`);

  console.log(`\n--- Répartition domaine × typologie × statut (top 20) ---`);
  const topKeys = Object.entries(byDomaineTypoStatut).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [k, v] of topKeys) console.log(`  ${k} : ${v}`);

  console.log(`\n--- Pilotes (EN_PRODUCTION_360, QUALIFIE, PRIORISE) : ${pilotes.length} ---`);
  for (const c of pilotes) console.log(`  ${c.code} | ${c.titre.slice(0, 70)} | ${c.statutVueSection}`);

  console.log(`\n--- Lot GIZ Finances (PINS-TECH-20xx) : ${gizFinances.length} ---`);
  for (const c of gizFinances) console.log(`  ${c.code} | ${c.titre.slice(0, 70)} | ${c.statutVueSection}`);

  const instSorted = Object.entries(byInstitution).sort((a, b) => b[1] - a[1]);
  console.log(`\n--- Institutions (${instSorted.length} distinctes) ---`);
  if (instSorted.length === 0) {
    console.log('  ⚠️ Aucune partie prenante peuplée (taux 0%). Le champ stakeholders360 est vide.');
  } else {
    for (const [inst, v] of instSorted.slice(0, 15)) console.log(`  ${inst} : ${v}`);
  }

  console.log(`\n--- Taux de remplissage ---`);
  console.log(`  Parties prenantes : ${withPartiePrenante}/${n} (${resume.tauxRemplissage.avecPartiePrenante}%)`);
  console.log(`  Registres          : ${withRegistre}/${n} (${resume.tauxRemplissage.avecRegistre}%)`);
  console.log(`  Projets NDT         : ${withProjetNDT}/${n} (${resume.tauxRemplissage.avecProjetNDT}%)`);
  console.log(`  Liaisons guichet    : ${withGuichet}/${n} (${resume.tauxRemplissage.avecGuichet}%)`);

  console.log(`\n--- Hors FINANCES_PUBLIQUES (frontières) : ${horsDomaine.length} ---`);
  for (const c of horsDomaine) console.log(`  ${c.code} | ${c.domaine ?? 'NULL'} | ${c.typologie} | ${c.statutVueSection} | ${c.titre.slice(0, 60)}`);

  // ---- 6. Écriture JSON ----
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(__dirname, '..', '..', 'exports');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'cartographie_finances_2026-07.json');
  writeFileSync(outPath, JSON.stringify({ resume, cas: exports }, null, 2), 'utf-8');
  console.log(`\nJSON écrit : ${outPath}`);
  console.log(`${exports.length} cas exportés, ${JSON.stringify(outPath).length} bytes`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Échec :', e); await prisma.$disconnect(); process.exit(1); });
