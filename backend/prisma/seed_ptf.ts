import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('💰 Import PTF, Programmes et Phases MVP');
  console.log('='.repeat(70));

  // ============================================================================
  // PTF & PROGRAMMES
  // ============================================================================

  const jica = await prisma.pTF.upsert({
    where: { code: 'JICA' },
    update: {},
    create: { code: 'JICA', nom: 'Agence Japonaise de Coopération Internationale', acronyme: 'JICA', type: 'BILATERAL', pays: 'Japon' },
  });
  const progJICA = await prisma.programme.upsert({
    where: { code: 'JICA-XROAD' },
    update: {},
    create: { ptfId: jica.id, code: 'JICA-XROAD', nom: 'Projet de mise en place de la plateforme nationale d\'interopérabilité X-Road', partenaireTechnique: 'Accenture', composantsDPI: 'Interopérabilité (X-Road/PINS)', statut: 'ACTIF', dateDebut: new Date('2024-01-01') },
  });
  console.log('✅ JICA + Programme JICA-XROAD');

  const giz = await prisma.pTF.upsert({
    where: { code: 'GIZ' },
    update: {},
    create: { code: 'GIZ', nom: 'Coopération Allemande au Développement', acronyme: 'GIZ', type: 'BILATERAL', pays: 'Allemagne' },
  });
  const progGIZ = await prisma.programme.upsert({
    where: { code: 'RFS059' },
    update: {},
    create: { ptfId: giz.id, code: 'RFS059', nom: 'Programme Goin\' Digital — Transformation numérique', consortium: 'GOPA / Luvent Consulting GmbH', composantsDPI: 'Interopérabilité, Gouvernance numérique, GouvNum', statut: 'ACTIF', dateDebut: new Date('2023-01-01') },
  });
  await prisma.expertise.upsert({
    where: { id: 'expert-birama' },
    update: {},
    create: { id: 'expert-birama', programmeId: progGIZ.id, nom: 'Birama DIOP', profil: 'Expert interopérabilité / DPI Architect', role: 'Point Focal National d\'Interopérabilité', prestataire: 'Luvent Consulting GmbH', actif: true, dateDebut: new Date('2024-01-01') },
  });
  console.log('✅ GIZ + Programme RFS059 + Expert Birama DIOP');

  const bm = await prisma.pTF.upsert({
    where: { code: 'BM' },
    update: {},
    create: { code: 'BM', nom: 'Groupe de la Banque Mondiale', acronyme: 'Banque Mondiale', type: 'MULTILATERAL' },
  });
  const progBM = await prisma.programme.upsert({
    where: { code: 'PAENS' },
    update: {},
    create: { ptfId: bm.id, code: 'PAENS', nom: 'Projet d\'Appui à l\'Économie Numérique du Sénégal', composantsDPI: 'PKI, e-Santé, e-Administration', statut: 'ACTIF' },
  });
  console.log('✅ Banque Mondiale + Programme PAENS');

  const gates = await prisma.pTF.upsert({
    where: { code: 'GATES' },
    update: {},
    create: { code: 'GATES', nom: 'Fondation Bill & Melinda Gates', acronyme: 'Gates Foundation', type: 'FONDATION', pays: 'USA' },
  });
  const progGates = await prisma.programme.upsert({
    where: { code: 'GATES-ID' },
    update: {},
    create: { ptfId: gates.id, code: 'GATES-ID', nom: 'Programme Identité Numérique', composantsDPI: 'Identité Numérique', statut: 'EN_PREPARATION' },
  });
  console.log('✅ Gates Foundation + Programme Identité');

  const etat = await prisma.pTF.upsert({
    where: { code: 'ETAT-SN' },
    update: {},
    create: { code: 'ETAT-SN', nom: 'État du Sénégal', acronyme: 'Budget National', type: 'ETAT' },
  });
  const progEtat = await prisma.programme.upsert({
    where: { code: 'BUDGET-NAT' },
    update: {},
    create: { ptfId: etat.id, code: 'BUDGET-NAT', nom: 'Budget d\'investissement État', composantsDPI: 'Infrastructure, Cloud Souverain, SENUM', statut: 'ACTIF' },
  });
  console.log('✅ État du Sénégal + Budget National');

  // ============================================================================
  // PHASES MVP
  // ============================================================================

  const mvp1 = await prisma.phaseMVP.upsert({
    where: { code: 'MVP-1.0' },
    update: {},
    create: { code: 'MVP-1.0', nom: 'MVP 1.0 — Fondations de l\'interopérabilité', statut: 'EN_COURS', dateDebutPrevue: new Date('2025-01-01'), dateFinPrevue: new Date('2026-03-31'), dateDebutEffective: new Date('2025-01-15'), livrablesCles: 'Projet de décret interopérabilité, Référentiel National d\'Interopérabilité (RNI), Plateforme X-Road (Central Server + Security Servers + PKI), Site de monitoring et traçabilité des flux' },
  });
  const mvp2 = await prisma.phaseMVP.upsert({
    where: { code: 'MVP-2.0' },
    update: {},
    create: { code: 'MVP-2.0', nom: 'MVP 2.0 — Extension sectorielle', statut: 'PLANIFIE', dateDebutPrevue: new Date('2026-04-01'), dateFinPrevue: new Date('2026-12-31'), livrablesCles: '4 nouveaux cas d\'usage JICA, Use cases DGD-DGCPT (financement GIZ à demander), Extension aux administrations financières' },
  });
  const mvp3 = await prisma.phaseMVP.upsert({
    where: { code: 'MVP-3.0' },
    update: {},
    create: { code: 'MVP-3.0', nom: 'MVP 3.0 — Services aux citoyens', statut: 'PLANIFIE', dateDebutPrevue: new Date('2027-01-01'), livrablesCles: 'Portail citoyen PINS, Services de bout en bout' },
  });
  console.log('✅ Phases MVP 1.0, 2.0, 3.0');

  // ============================================================================
  // CAS D'USAGE MVP 1.0 (JICA)
  // ============================================================================

  const cu01 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-01' },
    update: {},
    create: { code: 'XRN-CU-01', titre: 'Vérification NINEA', description: 'Vérification automatique du NINEA des contribuables entre ANSD et DGID', institutionSourceCode: 'ANSD', institutionCibleCode: 'DGID', donneesEchangees: 'NINEA, raison sociale, statut', axePrioritaire: 'Finances publiques', impact: 'CRITIQUE', phaseMVPId: mvp1.id, statutImpl: 'EN_DEVELOPPEMENT' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu01.id, programmeId: progJICA.id } },
    update: {},
    create: { casUsageMVPId: cu01.id, programmeId: progJICA.id, statut: 'ACCORDE', typeFinancement: 'Assistance technique + Développement' },
  });

  const cu02 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-02' },
    update: {},
    create: { code: 'XRN-CU-02', titre: 'Vérification statut fiscal', description: 'Consultation du statut fiscal d\'un contribuable par les Douanes', institutionSourceCode: 'DGID', institutionCibleCode: 'DGD', donneesEchangees: 'Statut fiscal, conformité', axePrioritaire: 'Finances publiques', impact: 'ELEVE', phaseMVPId: mvp1.id, statutImpl: 'EN_PREPARATION' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu02.id, programmeId: progJICA.id } },
    update: {},
    create: { casUsageMVPId: cu02.id, programmeId: progJICA.id, statut: 'ACCORDE', typeFinancement: 'Assistance technique' },
  });

  const cu03 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-03' },
    update: {},
    create: { code: 'XRN-CU-03', titre: 'Situation douanière', description: 'Consultation de la situation douanière d\'un opérateur', institutionSourceCode: 'DGD', institutionCibleCode: 'DGCPT', donneesEchangees: 'Situation douanière, paiements', axePrioritaire: 'Finances publiques', impact: 'ELEVE', phaseMVPId: mvp1.id, statutImpl: 'PRIORISE' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu03.id, programmeId: progJICA.id } },
    update: {},
    create: { casUsageMVPId: cu03.id, programmeId: progJICA.id, statut: 'ACCORDE', typeFinancement: 'Assistance technique' },
  });

  const cu04 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-04' },
    update: {},
    create: { code: 'XRN-CU-04', titre: 'Croisement fiscalo-douanier', description: 'Croisement des données fiscales et douanières pour la lutte contre la fraude', institutionSourceCode: 'DGID', institutionCibleCode: 'DGD', donneesEchangees: 'Données fiscales, données douanières', axePrioritaire: 'Finances publiques', impact: 'CRITIQUE', phaseMVPId: mvp1.id, statutImpl: 'IDENTIFIE' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu04.id, programmeId: progJICA.id } },
    update: {},
    create: { casUsageMVPId: cu04.id, programmeId: progJICA.id, statut: 'ACCORDE', typeFinancement: 'Assistance technique' },
  });
  console.log('✅ 4 cas d\'usage MVP 1.0 (financés JICA)');

  // ============================================================================
  // CAS D'USAGE DGD-DGCPT (DEMANDE GIZ)
  // ============================================================================

  const cu10 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-10' },
    update: {},
    create: { code: 'XRN-CU-10', titre: 'Réconciliation recettes douanières-trésor', description: 'Rapprochement automatique des recettes douanières avec les encaissements du Trésor (ASTER)', institutionSourceCode: 'DGD', institutionCibleCode: 'DGCPT', donneesEchangees: 'Recettes douanières, quittances ASTER', axePrioritaire: 'Finances publiques', impact: 'CRITIQUE', phaseMVPId: mvp2.id, statutImpl: 'IDENTIFIE' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu10.id, programmeId: progGIZ.id } },
    update: {},
    create: { casUsageMVPId: cu10.id, programmeId: progGIZ.id, statut: 'DEMANDE', typeFinancement: 'Assistance technique' },
  });

  const cu11 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-11' },
    update: {},
    create: { code: 'XRN-CU-11', titre: 'Suivi des exonérations douanières', description: 'Traçabilité des exonérations douanières et leur impact budgétaire', institutionSourceCode: 'DGD', institutionCibleCode: 'DGCPT', donneesEchangees: 'Exonérations, montants, bénéficiaires', axePrioritaire: 'Finances publiques', impact: 'ELEVE', phaseMVPId: mvp2.id, statutImpl: 'IDENTIFIE' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu11.id, programmeId: progGIZ.id } },
    update: {},
    create: { casUsageMVPId: cu11.id, programmeId: progGIZ.id, statut: 'DEMANDE', typeFinancement: 'Assistance technique' },
  });

  const cu12 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-12' },
    update: {},
    create: { code: 'XRN-CU-12', titre: 'Rapprochement liquidations douanières', description: 'Vérification croisée des liquidations douanières avec les paiements enregistrés', institutionSourceCode: 'DGD', institutionCibleCode: 'DGCPT', donneesEchangees: 'Liquidations, paiements', axePrioritaire: 'Finances publiques', impact: 'ELEVE', phaseMVPId: mvp2.id, statutImpl: 'IDENTIFIE' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu12.id, programmeId: progGIZ.id } },
    update: {},
    create: { casUsageMVPId: cu12.id, programmeId: progGIZ.id, statut: 'DEMANDE', typeFinancement: 'Assistance technique' },
  });
  console.log('✅ 3 cas d\'usage DGD-DGCPT (demande financement GIZ)');

  // CAS D'USAGE PKI (BM)
  const cu20 = await prisma.casUsageMVP.upsert({
    where: { code: 'XRN-CU-20' },
    update: {},
    create: { code: 'XRN-CU-20', titre: 'Infrastructure PKI nationale', description: 'Mise en place de l\'infrastructure à clés publiques pour la signature et le chiffrement', axePrioritaire: 'Transversal', impact: 'CRITIQUE', phaseMVPId: mvp1.id, statutImpl: 'EN_PREPARATION' },
  });
  await prisma.financement.upsert({
    where: { casUsageMVPId_programmeId: { casUsageMVPId: cu20.id, programmeId: progBM.id } },
    update: {},
    create: { casUsageMVPId: cu20.id, programmeId: progBM.id, statut: 'EN_NEGOCIATION', typeFinancement: 'Équipement + Développement' },
  });
  console.log('✅ PKI nationale (financement BM en négociation)');

  console.log('\n' + '='.repeat(70));
  console.log('🎉 IMPORT PTF TERMINÉ');
  console.log('   5 PTF, 5 programmes, 8 cas d\'usage MVP, 8 financements, 1 expert');
  console.log('='.repeat(70));
}

main()
  .catch((e) => { console.error('❌ Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
