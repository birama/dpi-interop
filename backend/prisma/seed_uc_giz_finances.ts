import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Import 8 UC Finances GIZ (Note de cadrage v4.0) ===');

  // Trouver la phase MVP-2.0
  let mvp2 = await prisma.phaseMVP.findUnique({ where: { code: 'MVP-2.0' } });
  if (!mvp2) {
    mvp2 = await prisma.phaseMVP.create({
      data: { code: 'MVP-2.0', nom: 'MVP 2.0 — Extension sectorielle', statut: 'PLANIFIE',
        dateDebutPrevue: new Date('2026-04-01'), dateFinPrevue: new Date('2027-12-31') },
    });
  }

  // Trouver le programme GIZ RFS059
  const gizProg = await prisma.programme.findUnique({ where: { code: 'RFS059' } });
  if (!gizProg) { console.error('Programme RFS059 non trouvé'); process.exit(1); }

  // Supprimer les anciens UC-GIZ-FIN si existants
  for (let i = 1; i <= 8; i++) {
    const code = `UC-GIZ-FIN-${String(i).padStart(2, '0')}`;
    const existing = await prisma.casUsageMVP.findUnique({ where: { code } });
    if (existing) {
      await prisma.financement.deleteMany({ where: { casUsageMVPId: existing.id } });
      await prisma.fluxInstitution.deleteMany({ where: { casUsageMVPId: existing.id } });
      await prisma.casUsage.updateMany({ where: { casUsageMVPId: existing.id }, data: { casUsageMVPId: null } });
      await prisma.casUsageMVP.delete({ where: { id: existing.id } });
    }
  }

  const useCases = [
    {
      code: 'UC-GIZ-FIN-01',
      titre: 'Réconciliation bidirectionnelle DGD ↔ DGID',
      description: 'Étendre le flux MVP existant (DGD→DGID) vers un service bidirectionnel. La DGID (SENTAX) expose les informations comptables, déclarations fiscales et fichier CGE. La DGD (GAINDE) consomme ce service pour croisement sur NINEA. Détection sous-déclarations et élargissement assiette fiscale.',
      source: 'DGD', cible: 'DGID',
      donnees: 'Déclarations douanières (numéro, année, bureau), importations/exportations par régime, TVA suspendue, acomptes BIC, FNID. Retour: informations comptables entreprises, états financiers, fichier CGE, conformité fiscale',
      impact: 'CRITIQUE' as const, complexite: 'ELEVE' as const,
      statut: 'EN_TEST' as const, // MVP existant à étendre
      axe: 'Finances publiques — Doing Business',
      observations: 'PRIORITÉ 1. MVP EXISTANT à étendre. Flux DGD→DGID déjà opérationnel dans X-Road. Étendre vers flux retour DGID→DGD. Transition SIGTAS→SENTAX = opportunité concevoir avec X-Road natif. KPIs: taux réconciliation 100%, réduction sous-déclarations 90%.',
    },
    {
      code: 'UC-GIZ-FIN-02',
      titre: 'Cycle complet Liquidation → Recouvrement → BAE',
      description: 'Trois services X-Road interconnectant GAINDE et SIGIF. (1) GAINDE→SIGIF: transmission temps réel des déclarations validées avec détail des droits par nature de taxe (40+ codes). (2) Paiement: validation dans SIGIF, comptabilisation par nature, quittance. (3) SIGIF→GAINDE: retour quittance pour émargement BAE.',
      source: 'DGD', cible: 'DGCPT',
      donnees: 'Numéro déclaration (année-bureau-numéro), code PPM déclarant, détail taxes par code (Trésor, UEMOA, CEDEAO), référence avis validation, quittances, date envoi, code créditaire',
      impact: 'CRITIQUE' as const, complexite: 'CRITIQUE' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques — Doing Business',
      observations: 'PRIORITÉ 1. IMPACT DB MAXIMAL. Réduction cycle liquidation→BAE de 48h+ à temps réel. 3 services X-Road. Table correspondance bureau douane/percepteur. Mapping 40+ codes taxes → comptes SIGIF. GAINDE repensé + SIGIF imminent = fenêtre d\'opportunité.',
    },
    {
      code: 'UC-GIZ-FIN-03',
      titre: 'Quitus fiscal en temps réel',
      description: 'Service X-Road exposant l\'état de conformité fiscale (identifié par NINEA), interrogeable en temps réel par DGD (exonérations) et DGCPT (marchés publics). Retourne: conforme / non conforme / dossier en cours avec dates validité.',
      source: 'DGID', cible: 'DGD',
      donnees: 'NINEA, statut conformité fiscale, dates validité, motif non-conformité',
      impact: 'CRITIQUE' as const, complexite: 'MOYEN' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques — Doing Business',
      observations: 'PRIORITÉ 1. Passage de 5 jours à temps réel. Suppression déplacements. Simplification accès marchés publics et régimes exonération. Intégrer nativement dans SENTAX.',
    },
    {
      code: 'UC-GIZ-FIN-04',
      titre: 'Télépaiement fiscal via X-Road (E.Taxes ↔ SIGIF)',
      description: 'Flux E.Taxes ↔ SIGIF via PINS. Télédéclaration → ordre virement banque → notification Trésor → comptabilisation SIGIF (recettes attendues) → réimputation par nature recettes → notification DGID avec références paiement.',
      source: 'DGID', cible: 'DGCPT',
      donnees: 'Télédéclarations, ordres virement, notifications acceptation, écritures comptables par nature recettes, références paiement SICA STAR',
      impact: 'ELEVE' as const, complexite: 'ELEVE' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques',
      observations: 'PRIORITÉ 2. Intégrer dans SIGIF. Réconciliation automatisée télédéclarations/encaissements. Suppression réimputation manuelle.',
    },
    {
      code: 'UC-GIZ-FIN-05',
      titre: 'Référentiel NINEA via PINS (migration ESB → X-Road)',
      description: 'Migration du service de partage NINEA de l\'ESB actuel vers PINS/X-Road. Expose créations NINEA, mises à jour immatriculation, informations complètes contribuable. e-NINEA (immatriculation en ligne) renforce le caractère stratégique.',
      source: 'ANSD', cible: 'DGID',
      donnees: 'Créations NINEA, mises à jour immatriculation, raison sociale, régime juridique, adresse, activité, statut',
      impact: 'CRITIQUE' as const, complexite: 'MOYEN' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques',
      observations: 'PRIORITÉ 2. Migration ESB → X-Road. SENTAX et SIGIF doivent consommer ce service nativement. Cohérence avec e-NINEA (ANSD).',
    },
    {
      code: 'UC-GIZ-FIN-06',
      titre: 'Détection contribuables à risque (croisement multi-sources)',
      description: 'Croisement données DGD+DGID+DGCPT via plateforme PRES. Détection entreprises actives douane mais inconnues impôts, CA incohérents avec importations, suivi exonérations. Capitalise sur flux UC-1, UC-2, UC-4 via Kafka/ClickHouse/Metabase.',
      source: 'DGD', cible: 'DGID',
      donnees: 'Données croisées DGD/DGID/DGCPT, alertes contribuables à risque, tableau de bord analytique',
      impact: 'ELEVE' as const, complexite: 'ELEVE' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques',
      observations: 'PRIORITÉ 2. Extension analytique. Capitalise sur UC-1/UC-2/UC-4. Plateforme PRES (Kafka, ClickHouse, Metabase). Augmentation recettes par élargissement assiette.',
    },
    {
      code: 'UC-GIZ-FIN-07',
      titre: 'Alimentation automatisée TOFE et données budgétaires',
      description: 'Alimentation automatisée du TOFE par données SIGIF (balance comptes, recettes/dépenses, dette) et SIGFIP (mandats, exécution budgétaire, DPBEP) via PINS.',
      source: 'DGCPT', cible: 'DGF',
      donnees: 'Balance des comptes, recettes/dépenses, dette, mandats, exécution budgétaire, DPBEP',
      impact: 'MOYEN' as const, complexite: 'MOYEN' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques',
      observations: 'PRIORITÉ 3. Fiabilisation données budgétaires pour projets loi de finances.',
    },
    {
      code: 'UC-GIZ-FIN-08',
      titre: 'Fiscalité locale (TéléDAC / GFILOC / SIGIF)',
      description: 'Dématérialisation des Demandes d\'Autorisation de Construire (TéléDAC) et intégration GFILOC ↔ SIGIF pour comptabilisation taxes locales (patentes, taxes foncières). Identification receveurs par commune.',
      source: 'DGCPT', cible: 'MCTDAT',
      donnees: 'Demandes autorisation construire, patentes, taxes foncières, aiguillage par commune',
      impact: 'MOYEN' as const, complexite: 'MOYEN' as const,
      statut: 'IDENTIFIE' as const,
      axe: 'Finances publiques',
      observations: 'PRIORITÉ 3. TéléDAC / GFILOC / SIGIF via PINS.',
    },
  ];

  for (const uc of useCases) {
    const cu = await prisma.casUsageMVP.create({
      data: {
        code: uc.code, titre: uc.titre, description: uc.description,
        institutionSourceCode: uc.source, institutionCibleCode: uc.cible,
        donneesEchangees: uc.donnees, axePrioritaire: uc.axe,
        impact: uc.impact, complexite: uc.complexite, statutImpl: uc.statut,
        phaseMVPId: mvp2.id, conventionRequise: true,
        observations: uc.observations,
      },
    });

    // Lier au financement GIZ
    await prisma.financement.create({
      data: {
        casUsageMVPId: cu.id, programmeId: gizProg.id,
        typeFinancement: 'Accompagnement technique et organisationnel',
        statut: uc.code <= 'UC-GIZ-FIN-03' ? 'EN_COURS' : 'DEMANDE',
      },
    });

    console.log(`✅ ${uc.code}: ${uc.titre.substring(0, 60)}`);
  }

  // Stats
  const total = await prisma.casUsageMVP.count({ where: { code: { startsWith: 'UC-GIZ-FIN' } } });
  const financed = await prisma.financement.count({ where: { casUsageMVP: { code: { startsWith: 'UC-GIZ-FIN' } } } });
  console.log(`\n=== ${total} cas d'usage créés, ${financed} financements GIZ liés ===`);
  console.log('Budget total estimé: 173 800 € (accompagnement GIZ RFS059)');
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
