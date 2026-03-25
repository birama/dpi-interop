import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Synchronisation MVP 1.0 avec DAT PexOne v0.5 ===');

  // --- 1. INSTITUTIONS PILOTES ---
  const pilotes = [
    { code: 'DGPSN', nom: 'Délégation Générale à la Protection Sociale et à la Solidarité Nationale', ministere: 'Famille' },
    { code: 'SEN-CSU', nom: 'Secrétariat Exécutif National — Couverture Sanitaire Universelle', ministere: 'Santé' },
    { code: 'DGD', nom: 'Direction Générale des Douanes', ministere: 'Finances' },
    { code: 'DGID', nom: 'Direction Générale des Impôts et des Domaines', ministere: 'Finances' },
  ];

  const instIds: Record<string, string> = {};
  for (const p of pilotes) {
    const inst = await prisma.institution.upsert({
      where: { code: p.code },
      update: { nom: p.nom, ministere: p.ministere },
      create: { code: p.code, nom: p.nom, ministere: p.ministere, responsableNom: 'À définir', responsableFonction: 'Point focal interopérabilité', responsableEmail: `pfi.${p.code.toLowerCase().replace(/-/g, '')}@gouv.sn`, responsableTel: '+221 33 XXX XX XX' },
    });
    instIds[p.code] = inst.id;
    console.log(`✅ ${p.code}: ${inst.id}`);
  }

  // --- 2. PHASES MVP ---
  const mvp1 = await prisma.phaseMVP.upsert({
    where: { code: 'MVP-1.0' },
    update: {
      nom: 'MVP 1.0 — Protection Sociale & Finances',
      description: 'Déploiement de l\'infrastructure X-Road avec 2 cas d\'usage pilotes : Protection Sociale (DGPSN ↔ SEN-CSU) et Finances (DGD ↔ DGID). 4 agences pilotes, tous Security Servers hébergés par SENUM.',
      dateDebutPrevue: new Date('2025-10-09'),
      dateFinPrevue: new Date('2025-12-31'),
      dateDebutEffective: new Date('2025-10-09'),
      statut: 'EN_COURS',
      livrablesCles: '1. Infrastructure X-Road (Central Server + Security Servers + PKI Lite temporaire)\n2. Cas d\'usage Protection Sociale : DGPSN → SEN-CSU (RNU.GetBeneficiaire)\n3. Cas d\'usage Finances : DGD → DGID (Douanes.GetDeclarations)\n4. 4 environnements : DEV (SN-DEV), INT (SN-INT), UAT (SN-UAT), PROD (SN)\n5. Site de monitoring et traçabilité (PexOne)\n6. DAT v0.5 (PexOne / Aly Wane Diène)\nNOTES: PKI Lite déployée (PKISN pas opérationnelle), retard API agences',
    },
    create: { code: 'MVP-1.0', nom: 'MVP 1.0 — Protection Sociale & Finances', statut: 'EN_COURS', dateDebutPrevue: new Date('2025-10-09'), dateFinPrevue: new Date('2025-12-31'), dateDebutEffective: new Date('2025-10-09'), livrablesCles: 'Voir update' },
  });

  const mvp2 = await prisma.phaseMVP.upsert({
    where: { code: 'MVP-2.0' },
    update: {
      nom: 'MVP 2.0 — Extension sectorielle',
      description: 'Extension vers Finances publiques (DGD-DGCPT), nouveaux secteurs, migration Security Servers vers hébergement propre.',
      dateDebutPrevue: new Date('2026-04-01'),
      dateFinPrevue: new Date('2027-12-31'),
      statut: 'PLANIFIE',
      livrablesCles: '1. Nouveaux cas d\'usage JICA (4 max)\n2. Cas d\'usage DGD-DGCPT (financement GIZ)\n3. Migration PKISN opérationnelle (PAENS/BM)\n4. Migration Security Servers vers hébergement propre\n5. Fédération UEMOA / Smart Africa (préparation)',
    },
    create: { code: 'MVP-2.0', nom: 'MVP 2.0 — Extension sectorielle', statut: 'PLANIFIE', dateDebutPrevue: new Date('2026-04-01'), dateFinPrevue: new Date('2027-12-31'), livrablesCles: 'Voir update' },
  });
  console.log('✅ Phases MVP 1.0 et 2.0');

  // --- 3. SUPPRIMER ANCIENS CAS D'USAGE MVP 1.0 INCORRECTS ---
  for (const code of ['XRN-CU-01', 'XRN-CU-02', 'XRN-CU-03', 'XRN-CU-04']) {
    const uc = await prisma.casUsageMVP.findUnique({ where: { code } });
    if (uc) {
      await prisma.financement.deleteMany({ where: { casUsageMVPId: uc.id } });
      await prisma.fluxInstitution.deleteMany({ where: { casUsageMVPId: uc.id } });
      await prisma.casUsage.updateMany({ where: { casUsageMVPId: uc.id }, data: { casUsageMVPId: null } });
      await prisma.casUsageMVP.delete({ where: { id: uc.id } });
      console.log(`🗑️ Supprimé ancien: ${code}`);
    }
  }

  // --- 4. VRAIS CAS D'USAGE MVP 1.0 (DAT PexOne) ---
  const cu01 = await prisma.casUsageMVP.upsert({
    where: { code: 'MVP1-CU-01' },
    update: {},
    create: {
      code: 'MVP1-CU-01',
      titre: 'Vérification éligibilité protection sociale (RNU.GetBeneficiaire)',
      description: 'Permettre au SEN-CSU d\'interroger en temps réel le RNU de la DGPSN pour vérifier l\'éligibilité des ménages vulnérables et inscrire automatiquement les bénéficiaires à l\'assurance maladie gratuite.',
      institutionSourceCode: 'DGPSN', institutionCibleCode: 'SEN-CSU',
      donneesEchangees: 'Référence ménage, NIN, nom, prénom, statut protection sociale, éligibilité assurance maladie',
      registresConcernes: 'RNU (Registre National Unique), PNBSF, SIGICMU',
      axePrioritaire: 'Protection sociale', impact: 'CRITIQUE', complexite: 'ELEVE',
      statutImpl: 'EN_TEST', phaseMVPId: mvp1.id,
      conventionRequise: true, conventionSignee: false, dateIdentification: new Date('2025-10-09'),
      observations: 'API DGPSN (RNU) prête Swagger. SEN-CSU sans API — adaptateur REST requis. Consentement implicite (Loi 2008-12, art.5). Fréquence temps réel.',
    },
  });

  const cu02 = await prisma.casUsageMVP.upsert({
    where: { code: 'MVP1-CU-02' },
    update: {},
    create: {
      code: 'MVP1-CU-02',
      titre: 'Rapprochement fiscal des déclarations douanières (Douanes.GetDeclarations)',
      description: 'Permettre à la DGID de récupérer mensuellement les déclarations douanières validées par la DGD pour automatiser le rapprochement fiscal et réduire les fuites de recettes.',
      institutionSourceCode: 'DGD', institutionCibleCode: 'DGID',
      donneesEchangees: 'ID déclaration, NINEA, valeur en douane, droits payés, TVA',
      registresConcernes: 'DB2 ZOS / GAINDE Integral, SAP Data Lake DGID',
      axePrioritaire: 'Finances publiques', impact: 'CRITIQUE', complexite: 'ELEVE',
      statutImpl: 'EN_TEST', phaseMVPId: mvp1.id,
      conventionRequise: true, conventionSignee: false, dateIdentification: new Date('2025-10-09'),
      observations: 'DGD: export FTP/Excel actuel, adaptateur REST requis. DGID: Data Lake SAP, accompagnement nécessaire. Fréquence mensuelle par lot.',
    },
  });
  console.log('✅ 2 cas d\'usage MVP 1.0 (PexOne)');

  // --- 5. CAS D'USAGE MVP 2.0 (DGD-DGCPT pour GIZ) ---
  const ucMvp2 = [
    { code: 'MVP2-CU-01', titre: 'Réconciliation recettes douanières-trésor', source: 'DGD', cible: 'DGCPT', donnees: 'Recettes douanières, liquidations, quittances ASTER', impact: 'CRITIQUE' as const },
    { code: 'MVP2-CU-02', titre: 'Suivi des exonérations douanières', source: 'DGD', cible: 'DGCPT', donnees: 'Exonérations, montants, bénéficiaires', impact: 'ELEVE' as const },
    { code: 'MVP2-CU-03', titre: 'Rapprochement liquidations douanières', source: 'DGD', cible: 'DGCPT', donnees: 'Liquidations, paiements', impact: 'ELEVE' as const },
    { code: 'MVP2-CU-04', titre: 'Vérification NINEA inter-administrations', source: 'ANSD', cible: 'DGID', donnees: 'Fichier immatriculation NINEA, données référence entreprises', impact: 'CRITIQUE' as const },
  ];

  for (const uc of ucMvp2) {
    await prisma.casUsageMVP.upsert({
      where: { code: uc.code },
      update: {},
      create: {
        code: uc.code, titre: uc.titre, institutionSourceCode: uc.source, institutionCibleCode: uc.cible,
        donneesEchangees: uc.donnees, axePrioritaire: 'Finances publiques', impact: uc.impact, complexite: 'MOYEN',
        statutImpl: 'IDENTIFIE', phaseMVPId: mvp2.id, conventionRequise: true,
        observations: 'Cas d\'usage structurant DGD-DGCPT — financement à demander GIZ (RFS059)',
      },
    });
  }
  console.log('✅ 4 cas d\'usage MVP 2.0');

  // --- 6. XROAD READINESS (4 agences — état réel DAT PexOne) ---
  const readiness = [
    { institutionId: instIds['DGPSN'], serveurDedie: 'EN_COURS' as const, connectiviteReseau: 'EN_COURS' as const, certificatsSSL: 'NON_DEMARRE' as const, securityServerInstall: 'NON_DEMARRE' as const, premierServicePublie: 'NON_DEMARRE' as const, premierEchangeReussi: 'NON_DEMARRE' as const, hebergement: 'SENUM_CENTRALISE' as const, hebergementCible: 'HEBERGEMENT_PROPRE' as const, prerequisMigration: 'Salle serveur dédiée, équipe réseau formée X-Road, connectivité intranet', disposeAPI: true, maturiteAPI: 'Mature', systemeSource: 'RNU 1.0 / PNBSF', protocoleAPI: 'REST/JSON', observationsAPI: 'API documentée Swagger, clé API. Données: référence ménage, NIN, statut PNBSF.', observations: 'Fournisseur Protection Sociale. API RNU prête.' },
    { institutionId: instIds['SEN-CSU'], serveurDedie: 'NON_DEMARRE' as const, connectiviteReseau: 'NON_DEMARRE' as const, certificatsSSL: 'NON_DEMARRE' as const, securityServerInstall: 'NON_DEMARRE' as const, premierServicePublie: 'NON_DEMARRE' as const, premierEchangeReussi: 'NON_DEMARRE' as const, hebergement: 'SENUM_CENTRALISE' as const, hebergementCible: 'SENUM_CENTRALISE' as const, disposeAPI: false, maturiteAPI: 'Faible', systemeSource: 'SIGICMU', protocoleAPI: 'Fichier Excel (manuel)', observationsAPI: 'Aucune API. Fichiers Excel manuels. Adaptateur REST requis.', observations: 'Consommateur Protection Sociale. Maturité SI faible.', blocage: 'Aucune API — développement adaptateur REST requis' },
    { institutionId: instIds['DGD'], serveurDedie: 'EN_COURS' as const, connectiviteReseau: 'EN_COURS' as const, certificatsSSL: 'NON_DEMARRE' as const, securityServerInstall: 'NON_DEMARRE' as const, premierServicePublie: 'NON_DEMARRE' as const, premierEchangeReussi: 'NON_DEMARRE' as const, hebergement: 'SENUM_CENTRALISE' as const, hebergementCible: 'HEBERGEMENT_PROPRE' as const, prerequisMigration: 'Infra existante solide (VMware, fibre ADIE, 8 ing. réseau, 5 ing. système, 9 ing. sécurité). Migration possible dès API REST opérationnelle.', disposeAPI: true, maturiteAPI: 'Mature (données disponibles, API pas opérationnelle)', systemeSource: 'DB2 ZOS / GAINDE Integral', protocoleAPI: 'Export FTP/Excel → REST/JSON (cible)', observationsAPI: 'Export .xlsx mensuel via FTP. Pas d\'API REST opérationnelle. NINEA reçu temps réel ANSD via Mule ESB.', observations: 'Fournisseur Finances. Infra mature mais API REST manquante.', blocage: 'API REST pas opérationnelle — adaptateur requis' },
    { institutionId: instIds['DGID'], serveurDedie: 'NON_DEMARRE' as const, connectiviteReseau: 'NON_DEMARRE' as const, certificatsSSL: 'NON_DEMARRE' as const, securityServerInstall: 'NON_DEMARRE' as const, premierServicePublie: 'NON_DEMARRE' as const, premierEchangeReussi: 'NON_DEMARRE' as const, hebergement: 'SENUM_CENTRALISE' as const, hebergementCible: 'HEBERGEMENT_PROPRE' as const, prerequisMigration: 'Data Lake SAP avec capacité exposition API. Équipe SI à former administration X-Road.', disposeAPI: false, maturiteAPI: 'Non — accompagnement nécessaire', systemeSource: 'SAP Data Lake', protocoleAPI: 'Aucun (consommateur)', observationsAPI: 'Data Lake SAP prêt à consommer. Adaptation en-têtes X-Road nécessaire.', observations: 'Consommateur Finances. Data Lake SAP mais pas d\'API.', blocage: 'Pas d\'API — accompagnement nécessaire' },
  ];

  for (const r of readiness) {
    await prisma.xRoadReadiness.upsert({
      where: { institutionId: r.institutionId },
      update: r,
      create: r,
    });
  }
  console.log('✅ XRoad Readiness 4 agences pilotes');

  // --- 7. FINANCEMENTS MVP 1.0 ---
  const jicaProg = await prisma.programme.findUnique({ where: { code: 'JICA-XROAD' } });
  if (jicaProg) {
    for (const cuId of [cu01.id, cu02.id]) {
      await prisma.financement.upsert({
        where: { casUsageMVPId_programmeId: { casUsageMVPId: cuId, programmeId: jicaProg.id } },
        update: { statut: 'EN_COURS' },
        create: { casUsageMVPId: cuId, programmeId: jicaProg.id, typeFinancement: 'Assistance technique + Équipement', statut: 'EN_COURS' },
      });
    }
    console.log('✅ Financements JICA liés MVP 1.0');
  }

  // --- 8. EXPERTISES ---
  if (jicaProg) {
    await prisma.expertise.upsert({
      where: { id: 'pexone-aly' },
      update: {},
      create: { id: 'pexone-aly', programmeId: jicaProg.id, nom: 'Aly Wane Diène', profil: 'Architecte technique / DevOps', role: 'Auteur du DAT, développement site monitoring', prestataire: 'PexOne', actif: true },
    });
  }
  const gizProg = await prisma.programme.findUnique({ where: { code: 'RFS059' } });
  if (gizProg) {
    await prisma.expertise.upsert({
      where: { id: 'giz-birama' },
      update: {},
      create: { id: 'giz-birama', programmeId: gizProg.id, nom: 'Birama DIOP', profil: 'Expert interopérabilité / DPI Architect', role: 'Point Focal National d\'Interopérabilité — Delivery Unit', prestataire: 'Luvent Consulting GmbH', actif: true },
    });
  }
  console.log('✅ Expertises PexOne + GIZ');

  // --- STATS ---
  const stats = {
    institutions: await prisma.institution.count(),
    casUsageMVP: await prisma.casUsageMVP.count(),
    xroadReadiness: await prisma.xRoadReadiness.count(),
    phasesMVP: await prisma.phaseMVP.count(),
    financements: await prisma.financement.count(),
  };
  console.log('\n=== STATS FINALES ===');
  console.log(stats);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
