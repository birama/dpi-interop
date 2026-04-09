import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Seed APIX + DGID enrichissement ===');

  // --- 1. APIX Institution ---
  let apix = await prisma.institution.findFirst({ where: { OR: [{ code: 'APIX' }, { nom: { contains: 'Promotion des Investissements' } }] } });
  if (!apix) {
    apix = await prisma.institution.create({ data: { code: 'APIX', nom: 'Agence pour la Promotion des Investissements et des Grands Travaux', ministere: 'Économie', responsableNom: 'Maïmouna Dia', responsableFonction: 'DSI', responsableEmail: 'dsi@apix.sn', responsableTel: '+221 33 849 05 55' } });
    console.log('✅ Institution APIX créée');
  } else {
    console.log('⏭️ APIX existe');
  }

  // --- 2. Compte APIX ---
  const existingUser = await prisma.user.findUnique({ where: { email: 'dsi@apix.sn' } });
  if (!existingUser) {
    const hash = await bcrypt.hash('Password@123', 10);
    await prisma.user.create({ data: { email: 'dsi@apix.sn', password: hash, role: 'INSTITUTION', institutionId: apix.id, mustChangePassword: true } });
    console.log('✅ User dsi@apix.sn créé');
  }

  // --- Récupérer institutions ---
  const dgd = await prisma.institution.findFirst({ where: { code: 'DGD' } });
  const dgid = await prisma.institution.findFirst({ where: { code: 'DGID' } });
  const ansd = await prisma.institution.findFirst({ where: { code: 'ANSD' } });
  const dgcpt = await prisma.institution.findFirst({ where: { code: 'DGCPT' } });
  const mvp2 = await prisma.phaseMVP.findUnique({ where: { code: 'MVP-2.0' } });

  if (!dgd || !dgid || !ansd || !dgcpt) { console.error('Institutions manquantes'); process.exit(1); }
  if (!mvp2) { console.error('Phase MVP-2.0 manquante'); process.exit(1); }

  // --- 3. CasUsageMVP APIX ---
  const ucApix = [
    { code: 'MVP2-CU-05', titre: 'Transmission des projets agréés APIX vers la Douane', description: 'Transmission mensuelle des projets agréés (agréments et IPCE) depuis la plateforme e-agrément APIX vers GAINDE. Intégration base NINEA dans e-agrément.', source: 'APIX', cible: 'DGD', donnees: 'Projets agréés, numéros NINEA, décisions IPCE', impact: 'CRITIQUE' as const, complexite: 'MOYEN' as const, observations: 'Convention APIX-DGD existante. Interopérabilité en cours. Axe Doing Business / Climat des affaires.' },
    { code: 'MVP2-CU-06', titre: 'Gestion des exonérations et suivi suspensions TVA (APIX-DGD-DGID)', description: 'Gestion des exonérations accordées aux investisseurs agréés par APIX. DGD valide les suspensions de TVA. DGID impliquée pour le volet fiscal.', source: 'APIX', cible: 'DGD', donnees: 'Exonérations, suspensions TVA, statut fiscal investisseur', impact: 'CRITIQUE' as const, complexite: 'ELEVE' as const, observations: 'Cas tripartite APIX-DGD-DGID. Nécessite convention tripartite. Axe Doing Business.' },
    { code: 'MVP2-CU-07', titre: 'Interopérabilité plateforme OMAR avec ANSD, DGD et DGID', description: 'Plateforme OMAR (priorité stratégique APIX, dédiée à l\'investissement) nécessite interopérabilité native avec ANSD (NINEA), DGD (douanes, exonérations), DGID (fiscal). Hébergement prévu SENUM SA.', source: 'APIX', cible: 'ANSD', donnees: 'NINEA, données fiscales, données douanières, statut investisseur', impact: 'CRITIQUE' as const, complexite: 'ELEVE' as const, observations: 'OMAR lancée début avril 2026. Hébergement SENUM SA en évaluation. Cas structurant Guichet Unique de l\'Investissement.' },
  ];

  for (const uc of ucApix) {
    await prisma.casUsageMVP.upsert({
      where: { code: uc.code },
      update: {},
      create: { code: uc.code, titre: uc.titre, description: uc.description, institutionSourceCode: uc.source, institutionCibleCode: uc.cible, donneesEchangees: uc.donnees, axePrioritaire: 'Climat des affaires', impact: uc.impact, complexite: uc.complexite, statutImpl: 'IDENTIFIE', phaseMVPId: mvp2.id, conventionRequise: true, observations: uc.observations },
    });
    console.log(`✅ ${uc.code}: ${uc.titre.substring(0, 50)}`);
  }

  // --- 4. Conventions APIX ---
  const convApixAnsd = await prisma.convention.findFirst({ where: { institutionAId: apix.id, institutionBId: ansd.id } });
  if (!convApixAnsd) {
    await prisma.convention.create({ data: { institutionAId: apix.id, institutionBId: ansd.id, objet: 'Interconnexion avec le greffe et accès aux données entreprises (NINEA)', donneesVisees: 'NINEA, données entreprises, registre du commerce', statut: 'ACTIVE', dateSignatureA: new Date('2025-01-01'), dateSignatureB: new Date('2025-01-01'), dateActivation: new Date('2025-01-01'), observations: 'Convention opérationnelle. Interconnexion APIX-ANSD active pour e-agrément.' } });
    console.log('✅ Convention APIX-ANSD');
  }

  const convApixDgd = await prisma.convention.findFirst({ where: { institutionAId: apix.id, institutionBId: dgd.id } });
  if (!convApixDgd) {
    await prisma.convention.create({ data: { institutionAId: apix.id, institutionBId: dgd.id, objet: 'Interopérabilité APIX-DGD pour les agréments, exonérations et IPCE', donneesVisees: 'Projets agréés, exonérations, IPCE, suspensions TVA', statut: 'EN_COURS_REDACTION', observations: 'Interopérabilité en cours. Convention signée mais mise en œuvre technique non finalisée.' } });
    console.log('✅ Convention APIX-DGD');
  }

  // --- 5. XRoadReadiness APIX ---
  await prisma.xRoadReadiness.upsert({
    where: { institutionId: apix.id },
    update: {},
    create: { institutionId: apix.id, serveurDedie: 'NON_DEMARRE', connectiviteReseau: 'NON_DEMARRE', certificatsSSL: 'NON_DEMARRE', securityServerInstall: 'NON_DEMARRE', premierServicePublie: 'NON_DEMARRE', premierEchangeReussi: 'NON_DEMARRE', hebergement: 'SENUM_CENTRALISE', disposeAPI: true, maturiteAPI: 'Mature (e-agrément)', systemeSource: 'e-agrément / OMAR', protocoleAPI: 'REST/JSON', observations: 'APIX attend fortement PINS pour structurer ses échanges. Hébergement SENUM SA en évaluation pour OMAR.', prochainJalon: 'Évaluation hébergement SENUM SA + cadrage technique OMAR-PINS' },
  });
  console.log('✅ XRoadReadiness APIX');

  // --- 6. Compléments DGID ---
  // XRoadReadiness DGID (mise à jour)
  await prisma.xRoadReadiness.upsert({
    where: { institutionId: dgid.id },
    update: { connectiviteReseau: 'TERMINE', certificatsSSL: 'EN_COURS', securityServerInstall: 'EN_COURS', observations: 'Security Server hébergé par SENUM en transitoire. SENTAX en développement — opportunité intégration PINS native.', prochainJalon: 'Installation Security Server + cadrage intégration SENTAX-PINS' },
    create: { institutionId: dgid.id, serveurDedie: 'EN_COURS', connectiviteReseau: 'TERMINE', certificatsSSL: 'EN_COURS', securityServerInstall: 'EN_COURS', premierServicePublie: 'NON_DEMARRE', premierEchangeReussi: 'NON_DEMARRE', hebergement: 'SENUM_CENTRALISE', hebergementCible: 'HEBERGEMENT_PROPRE', disposeAPI: false, maturiteAPI: 'Non — accompagnement nécessaire', systemeSource: 'SAP Data Lake / SIGTAS → SENTAX', protocoleAPI: 'Aucun (consommateur)', observations: 'Security Server hébergé par SENUM. SENTAX en développement.' },
  });
  console.log('✅ XRoadReadiness DGID mis à jour');

  // --- 7. Soumission APIX (pour que le dashboard institution fonctionne) ---
  let apixSub = await prisma.submission.findFirst({ where: { institutionId: apix.id } });
  if (!apixSub) {
    apixSub = await prisma.submission.create({ data: { institutionId: apix.id, status: 'DRAFT', currentStep: 0 } });
  }
  await prisma.submission.update({
    where: { id: apixSub.id },
    data: {
      currentStep: 5, status: 'SUBMITTED', submittedAt: new Date(),
      dataOwnerNom: 'Maïmouna Dia', dataOwnerFonction: 'DSI APIX',
      dataStewardNom: 'Équipe SI APIX', dataStewardEmail: 'dsi@apix.sn',
      maturiteInfra: 3, maturiteDonnees: 3, maturiteCompetences: 4, maturiteGouvernance: 3,
      forces: 'Plateformes opérationnelles (e-agrément, e-NINEA intégré). Convention active avec ANSD. Équipe SI expérimentée. Plateforme OMAR en lancement stratégique.',
      faiblesses: 'Pas encore connecté à PINS/X-Road. Convention tripartite APIX-DGD-DGID non finalisée. Hébergement OMAR non décidé.',
      attentes: 'Connexion rapide à PINS pour structurer les échanges avec DGD et DGID. Hébergement OMAR chez SENUM SA. Intégration PKI nationale pour signature électronique.',
      contributions: 'Exposer les données d\'agréments et d\'exonérations via API REST. Partager le référentiel investisseurs. Contribuer au Guichet Unique.',
    },
  });

  // Données à consommer APIX
  await prisma.donneeConsommer.deleteMany({ where: { submissionId: apixSub.id } });
  await prisma.donneeConsommer.createMany({ data: [
    { submissionId: apixSub.id, donnee: 'Données NINEA entreprises', source: 'ANSD', usage: 'Vérification identité entreprises dans e-agrément et OMAR', priorite: 5, ordre: 0 },
    { submissionId: apixSub.id, donnee: 'Déclarations douanières', source: 'DGD', usage: 'Suivi des importations des investisseurs agréés', priorite: 4, ordre: 1 },
    { submissionId: apixSub.id, donnee: 'Données fiscales investisseurs', source: 'DGID', usage: 'Vérification conformité fiscale pour agréments', priorite: 4, ordre: 2 },
    { submissionId: apixSub.id, donnee: 'Données RCCM entreprises', source: 'GREFFE', usage: 'Vérification statut juridique des investisseurs', priorite: 3, ordre: 3 },
  ] });

  // Données à fournir APIX
  await prisma.donneeFournir.deleteMany({ where: { submissionId: apixSub.id } });
  await prisma.donneeFournir.createMany({ data: [
    { submissionId: apixSub.id, donnee: 'Projets agréés et décisions IPCE', destinataires: 'DGD, DGID', frequence: 'Mensuel', format: 'API REST / Fichier', ordre: 0 },
    { submissionId: apixSub.id, donnee: 'Exonérations accordées', destinataires: 'DGD, DGID, DGCPT', frequence: 'Mensuel', format: 'API REST', ordre: 1 },
    { submissionId: apixSub.id, donnee: 'Référentiel investisseurs agréés', destinataires: 'DGID, DGD, DGCPT', frequence: 'Temps réel', format: 'API REST', ordre: 2 },
  ] });

  // Flux existants APIX
  await prisma.fluxExistant.deleteMany({ where: { submissionId: apixSub.id } });
  await prisma.fluxExistant.createMany({ data: [
    { submissionId: apixSub.id, source: 'APIX', destination: 'ANSD', donnee: 'Données NINEA via greffe', mode: 'API REST', frequence: 'Temps réel', ordre: 0 },
    { submissionId: apixSub.id, source: 'ANSD', destination: 'APIX', donnee: 'Retour données NINEA entreprises', mode: 'API REST', frequence: 'Temps réel', ordre: 1 },
    { submissionId: apixSub.id, source: 'APIX', destination: 'DGD', donnee: 'Projets agréés, IPCE, exonérations', mode: 'Fichier (CSV/Excel)', frequence: 'Mensuel', ordre: 2 },
    { submissionId: apixSub.id, source: 'APIX', destination: 'DGID', donnee: 'Données fiscales investisseurs (prévu)', mode: 'Manuel', frequence: 'À définir', ordre: 3 },
    { submissionId: apixSub.id, source: 'DGD', destination: 'APIX', donnee: 'Statut dédouanement investisseurs', mode: 'Fichier (CSV/Excel)', frequence: 'Mensuel', ordre: 4 },
  ] });

  // Cas d'usage APIX
  await prisma.casUsage.deleteMany({ where: { submissionId: apixSub.id } });
  await prisma.casUsage.createMany({ data: [
    { submissionId: apixSub.id, titre: 'Transmission agréments vers GAINDE via PINS', description: 'Automatiser la transmission mensuelle des projets agréés vers la DGD', acteurs: 'APIX, DGD', priorite: 5, ordre: 0 },
    { submissionId: apixSub.id, titre: 'Interopérabilité OMAR avec l\'écosystème', description: 'Connecter OMAR à ANSD (NINEA), DGD (douanes), DGID (fiscal) via PINS', acteurs: 'APIX, ANSD, DGD, DGID', priorite: 5, ordre: 1 },
    { submissionId: apixSub.id, titre: 'Gestion exonérations tripartite', description: 'Suivi des exonérations APIX-DGD-DGID avec traçabilité complète', acteurs: 'APIX, DGD, DGID', priorite: 4, ordre: 2 },
  ] });

  console.log('✅ Soumission APIX complète (consommer:4, fournir:3, flux:5, CU:3)');

  // --- Stats ---
  console.log('\n=== STATS ===');
  console.log(`Institutions: ${await prisma.institution.count()}`);
  console.log(`CasUsageMVP: ${await prisma.casUsageMVP.count()}`);
  console.log(`Conventions: ${await prisma.convention.count()}`);
  console.log(`XRoadReadiness: ${await prisma.xRoadReadiness.count()}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
