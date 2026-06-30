/**
 * SPRINT A — Injection des 21 cas techniques GIZ Finances v0.2
 * Idempotent : UPSERT par code, relances sans doublon.
 * Usage : npx tsx prisma/seed_cas_techniques_giz.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAS_TECHNIQUES: Array<{
  code: string;
  titre: string;
  description: string;
  producteur: string;
  statut: 'PROPOSE' | 'PRIORISE';
  aFinancer: boolean;
  domaineSecondaire?: string;
  action?: 'UPDATE' | 'CREATE';
}> = [
  {
    code: 'PINS-TECH-2001',
    titre: 'Douanes.GetDeclarationsDouanieres',
    description: 'Service d\'exposition des déclarations douanières mensuelles (DGD → DGID, DGCPT)',
    producteur: 'DGD',
    statut: 'PRIORISE',
    aFinancer: true,
    action: 'UPDATE',
  },
  {
    code: 'PINS-TECH-2002',
    titre: 'Impots.GetDeclarationsFiscales',
    description: 'Service d\'exposition des déclarations fiscales (DSF, TVA, BIC, IS) — DGID → DGD, DGCPT',
    producteur: 'DGID',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2003',
    titre: 'Impots.GetContribuablesCGE',
    description: 'Fichier des contribuables Centre des Grandes Entreprises — DGID → DGD',
    producteur: 'DGID',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2004',
    titre: 'Douanes.GetContribuablesActifs',
    description: 'Retour des contribuables actifs douaniers (flux retour UC-1) — DGD → DGID',
    producteur: 'DGD',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2005',
    titre: 'Douanes.PushDeclarationLiquidee',
    description: 'Transmission temps réel des déclarations liquidées vers le Trésor (40+ taxes) — DGD → DGCPT',
    producteur: 'DGD',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2006',
    titre: 'Tresor.ValiderPaiement',
    description: 'Validation et comptabilisation du paiement par le percepteur — DGCPT (SIGIF)',
    producteur: 'DGCPT',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2007',
    titre: 'Tresor.PushQuittance',
    description: 'Retour de la quittance à la DGD pour émargement BAE — DGCPT → DGD',
    producteur: 'DGCPT',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2008a',
    titre: 'Impots.GetAttestationImposition',
    description: 'Vérification temps réel de l\'imposition à un impôt spécifique (patente, BIC, IS, TVA, IRPP)',
    producteur: 'DGID',
    statut: 'PRIORISE',
    aFinancer: true,
    domaineSecondaire: 'CLIMAT_AFFAIRES',
  },
  {
    code: 'PINS-TECH-2008b',
    titre: 'Impots.GetConformiteFiscale',
    description: 'Vérification temps réel de la conformité fiscale globale (quitus agrégé) — DGID',
    producteur: 'DGID',
    statut: 'PRIORISE',
    aFinancer: true,
    domaineSecondaire: 'CLIMAT_AFFAIRES',
  },
  {
    code: 'PINS-TECH-2008c',
    titre: 'Impots.GetSituationFiscaleDetaillee',
    description: 'Vue détaillée de la situation fiscale (usage interne contrôle/audit) — DGID',
    producteur: 'DGID',
    statut: 'PRIORISE',
    aFinancer: true,
  },
  {
    code: 'PINS-TECH-2009',
    titre: 'Etaxes.PushTeledeclaration',
    description: 'Transmission télédéclaration et ordre de paiement (E.Taxes → SIGIF)',
    producteur: 'DGID',
    statut: 'PROPOSE',
    aFinancer: false,
  },
  {
    code: 'PINS-TECH-2010',
    titre: 'Tresor.NotifierEncaissement',
    description: 'Notification du virement effectif et imputation (SIGIF → E.Taxes)',
    producteur: 'DGCPT',
    statut: 'PROPOSE',
    aFinancer: false,
  },
  {
    code: 'PINS-TECH-2011',
    titre: 'ANSD.GetNinea',
    description: 'Consultation NINEA et informations entreprise (à migrer ESB → X-Road)',
    producteur: 'ANSD',
    statut: 'PROPOSE',
    aFinancer: false,
    domaineSecondaire: 'TRANSVERSAL',
  },
  {
    code: 'PINS-TECH-2012',
    titre: 'ANSD.PushCreationNinea',
    description: 'Notification de création / mise à jour de NINEA aux administrations abonnées',
    producteur: 'ANSD',
    statut: 'PROPOSE',
    aFinancer: false,
    domaineSecondaire: 'TRANSVERSAL',
  },
  {
    code: 'PINS-TECH-2013',
    titre: 'ANSD.GetEntreprisesParCriteres',
    description: 'Recherche d\'entreprises par critères avancés (secteur, région, période)',
    producteur: 'ANSD',
    statut: 'PROPOSE',
    aFinancer: false,
    domaineSecondaire: 'TRANSVERSAL',
  },
  {
    code: 'PINS-TECH-2014',
    titre: 'DataHub.PushAlertesContribuables',
    description: 'Publication des alertes contribuables à risque depuis le DataHub Économique National',
    producteur: 'DataHub Économique National (MCTN)',
    statut: 'PROPOSE',
    aFinancer: false,
    domaineSecondaire: 'TRANSVERSAL',
  },
  {
    code: 'PINS-TECH-2015',
    titre: 'Tresor.GetBalanceComptes',
    description: 'Exposition de la balance des comptes du Trésor (alimentation TOFE)',
    producteur: 'DGCPT',
    statut: 'PROPOSE',
    aFinancer: false,
  },
  {
    code: 'PINS-TECH-2016',
    titre: 'Budget.GetExecutionBudgetaire',
    description: 'Exposition de l\'exécution budgétaire (mandats, DPBEP, ventilation par programme)',
    producteur: 'DGF',
    statut: 'PROPOSE',
    aFinancer: false,
  },
  {
    code: 'PINS-TECH-2017',
    titre: 'DGUH.PushAutorisationConstruire',
    description: 'Transmission des autorisations TéléDAC vers les collectivités et DGCPT',
    producteur: 'DGUH',
    statut: 'PROPOSE',
    aFinancer: false,
  },
  {
    code: 'PINS-TECH-2018',
    titre: 'Collectivites.NotifierEmissionTaxe',
    description: 'Émission de l\'avis de taxe locale par la commune (GFILOC → SIGIF)',
    producteur: 'Collectivités',
    statut: 'PROPOSE',
    aFinancer: false,
  },
  {
    code: 'PINS-TECH-2019',
    titre: 'Tresor.NotifierEncaissementTaxeLocale',
    description: 'Retour d\'encaissement vers la collectivité (SIGIF → GFILOC)',
    producteur: 'DGCPT',
    statut: 'PROPOSE',
    aFinancer: false,
  },
];

const RELATIONS: Array<{ metier: string; technique: string }> = [
  // UC-101 Réconciliation
  { metier: 'PINS-METIER-101', technique: 'PINS-TECH-2001' },
  { metier: 'PINS-METIER-101', technique: 'PINS-TECH-2002' },
  { metier: 'PINS-METIER-101', technique: 'PINS-TECH-2003' },
  { metier: 'PINS-METIER-101', technique: 'PINS-TECH-2004' },
  // UC-102 Cycle BAE
  { metier: 'PINS-METIER-102', technique: 'PINS-TECH-2005' },
  { metier: 'PINS-METIER-102', technique: 'PINS-TECH-2006' },
  { metier: 'PINS-METIER-102', technique: 'PINS-TECH-2007' },
  // UC-103 Quitus
  { metier: 'PINS-METIER-103', technique: 'PINS-TECH-2008a' },
  { metier: 'PINS-METIER-103', technique: 'PINS-TECH-2008b' },
  { metier: 'PINS-METIER-103', technique: 'PINS-TECH-2008c' },
  // UC-104 Télépaiement
  { metier: 'PINS-METIER-104', technique: 'PINS-TECH-2009' },
  { metier: 'PINS-METIER-104', technique: 'PINS-TECH-2010' },
  // UC-105 NINEA
  { metier: 'PINS-METIER-105', technique: 'PINS-TECH-2011' },
  { metier: 'PINS-METIER-105', technique: 'PINS-TECH-2012' },
  { metier: 'PINS-METIER-105', technique: 'PINS-TECH-2013' },
  // UC-106 Risque
  { metier: 'PINS-METIER-106', technique: 'PINS-TECH-2014' },
  { metier: 'PINS-METIER-106', technique: 'PINS-TECH-2002' },
  { metier: 'PINS-METIER-106', technique: 'PINS-TECH-2003' },
  { metier: 'PINS-METIER-106', technique: 'PINS-TECH-2004' },
  // UC-107 TOFE
  { metier: 'PINS-METIER-107', technique: 'PINS-TECH-2015' },
  { metier: 'PINS-METIER-107', technique: 'PINS-TECH-2016' },
  // UC-108 Fiscalité locale
  { metier: 'PINS-METIER-108', technique: 'PINS-TECH-2017' },
  { metier: 'PINS-METIER-108', technique: 'PINS-TECH-2018' },
  { metier: 'PINS-METIER-108', technique: 'PINS-TECH-2019' },
];

async function main() {
  console.log('=== Sprint A — Injection 21 cas techniques GIZ Finances v0.2 ===\n');

  // Récupérer l'admin pour createdBy
  const admin = await prisma.user.findUnique({ where: { email: 'admin@senum.sn' } });
  if (!admin) { console.error('Admin introuvable'); process.exit(1); }

  // ---- Étape 1 : UPSERT des cas techniques ----
  console.log('[1/3] Cas techniques...');
  const techMap = new Map<string, string>(); // code → id
  let created = 0, updated = 0, skipped = 0;

  for (const ct of CAS_TECHNIQUES) {
    const existing = await prisma.casUsageMVP.findUnique({ where: { code: ct.code } });

    const data = {
      titre: ct.titre,
      description: ct.description,
      institutionSourceCode: ct.producteur,
      domaine: 'FINANCES_PUBLIQUES' as any,
      typologie: 'TECHNIQUE' as any,
      statutVueSection: ct.statut,
      statutImpl: 'IDENTIFIE' as any,
      aFinancer: ct.aFinancer,
      sourceProposition: 'ETUDE_SENUM' as any,
    };

    if (existing) {
      await prisma.casUsageMVP.update({ where: { code: ct.code }, data });
      techMap.set(ct.code, existing.id);
      updated++;
    } else {
      const created_ = await prisma.casUsageMVP.create({ data: { ...data, code: ct.code } });
      techMap.set(ct.code, created_.id);
      created++;
    }
  }
  console.log(`   ${created} créés, ${updated} mis à jour, ${skipped} ignorés`);

  // ---- Étape 2 : Résoudre les UUIDs métier ----
  console.log('[2/3] Résolution cas métier...');
  const metierCodes = [...new Set(RELATIONS.map(r => r.metier))];
  const metierMap = new Map<string, string>();
  for (const code of metierCodes) {
    const cu = await prisma.casUsageMVP.findUnique({ where: { code } });
    if (cu) metierMap.set(code, cu.id);
    else console.log(`   ⚠️ Cas métier introuvable: ${code}`);
  }
  console.log(`   ${metierMap.size}/${metierCodes.length} cas métier résolus`);

  // ---- Étape 3 : Créer les relations ----
  console.log('[3/3] Relations N-N...');
  let relCrees = 0, relIgnorees = 0;
  for (const r of RELATIONS) {
    const metierId = metierMap.get(r.metier);
    const techId = techMap.get(r.technique);
    if (!metierId || !techId) {
      console.log(`   ⚠️ Ignorée: ${r.metier}↔${r.technique} (ID manquant)`);
      relIgnorees++;
      continue;
    }
    try {
      await prisma.relationCasUsage.upsert({
        where: { casUsageMetierId_casUsageTechniqueId: { casUsageMetierId: metierId, casUsageTechniqueId: techId } },
        update: {},
        create: { casUsageMetierId: metierId, casUsageTechniqueId: techId, createdBy: admin.id },
      });
      relCrees++;
    } catch (e: any) {
      console.log(`   ⚠️ Erreur ${r.metier}↔${r.technique}: ${e.message?.substring(0, 100)}`);
      relIgnorees++;
    }
  }
  console.log(`   ${relCrees} créées, ${relIgnorees} ignorées`);

  // ---- Stats finales ----
  const totalTech = await prisma.casUsageMVP.count({ where: { code: { startsWith: 'PINS-TECH-20' } } });
  const totalRel = await prisma.relationCasUsage.count({
    where: {
      casUsageMetier: { code: { startsWith: 'PINS-METIER-10' } },
      casUsageTechnique: { code: { startsWith: 'PINS-TECH-20' } },
    },
  });
  console.log(`\n=== RÉSULTAT ===`);
  console.log(`Cas techniques PINS-TECH-20XX : ${totalTech}`);
  console.log(`Relations métier↔technique     : ${totalRel}`);
  console.log(`Total cas_usage_mvp             : ${await prisma.casUsageMVP.count()}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
