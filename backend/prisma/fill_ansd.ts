import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const subId = 'a2685a1a-9c5e-4b25-a8d3-dd344e6f14cc';

  console.log('=== Remplissage questionnaire ANSD ===');

  // Étape 0-1: Gouvernance + Applications
  await prisma.submission.update({
    where: { id: subId },
    data: {
      currentStep: 5,
      dataOwnerNom: 'Abass FALL',
      dataOwnerFonction: 'Directeur Général ANSD',
      dataOwnerEmail: 'dg@ansd.sn',
      dataOwnerTelephone: '+221 33 869 21 00',
      dataStewardNom: 'Ousmane SOW',
      dataStewardProfil: 'Ingénieur Statisticien',
      dataStewardFonction: 'Directeur des Systèmes d\'Information',
      dataStewardEmail: 'dsi@ansd.sn',
      dataStewardTelephone: '+221 33 869 21 50',
      infrastructure: {
        serveurs: '12 serveurs physiques + cluster VMware (64 vCPU, 256 Go RAM)',
        sgbd: ['PostgreSQL 14', 'Oracle 19c', 'MySQL 8'],
        reseau: 'Fibre optique ADIE, LAN Gigabit, VPN site-à-site avec DGID/DGD',
        securite: 'Firewall Fortinet, WAF, certificats SSL, audit sécurité annuel',
      },
      contraintesJuridiques: 'Loi 2004-21 sur la statistique publique (secret statistique). Décret 95-364 sur le NINEA. Loi 2008-12 sur la protection des données personnelles. Convention ANSD-DGID co-gestion NINEA.',
      contraintesTechniques: 'Infrastructure solide mais plateforme TANDEM vieillissante. Migration microservices en cours. Connectivité fibre ADIE opérationnelle vers DGID, DGD, DGCPT.',
      maturiteInfra: 4,
      maturiteDonnees: 5,
      maturiteCompetences: 4,
      maturiteGouvernance: 4,
      forces: 'Référentiel NINEA reconnu nationalement. Plateforme TANDEM opérationnelle (taux synchronisation 97-99%). Équipe SI expérimentée. 63 variables NINEA documentées. Partenariats FMI, BM, UNFPA.',
      faiblesses: 'Harmonisation classification secteurs RCCM/ANSD non résolue depuis 2018. TANDEM technologiquement datée. Pas encore connecté à PINS (X-Road). Dépendance coopération française pour TANDEM.',
      attentes: 'Connexion NINEA à PINS pour remplacer progressivement TANDEM par X-Road. Automatisation flux statistiques (commerce extérieur, démographie). Résolution harmonisation NINEA-RCCM via service interopérabilité.',
      contributions: 'Exposer service NINEA.GetEntreprise (API REST, 63 variables). Partager données RGPH. Contribuer à la normalisation sémantique (nomenclatures, codes secteurs). Équipe technique disponible pour intégration X-Road.',
    },
  });
  console.log('✅ Données de base');

  // Applications
  await prisma.application.createMany({
    data: [
      { submissionId: subId, nom: 'NINEAWEB', description: 'Plateforme web d\'immatriculation au NINEA — gestion du répertoire national des entreprises', editeur: 'ANSD / Partenaires', anneeInstallation: 2010, ordre: 0 },
      { submissionId: subId, nom: 'ModelSIS/TANDEM', description: 'Plateforme de partage temps réel du NINEA entre 4 administrations financières (ANSD, DGID, DGD, DGCPT)', editeur: 'Coopération française', anneeInstallation: 2018, ordre: 1 },
      { submissionId: subId, nom: 'e-NINEA', description: 'Portail citoyen d\'immatriculation en ligne au NINEA', editeur: 'ANSD', anneeInstallation: 2022, ordre: 2 },
      { submissionId: subId, nom: 'RGPH-5', description: 'Application de collecte du 5e Recensement Général de la Population et de l\'Habitat', editeur: 'ANSD / UNFPA', anneeInstallation: 2023, ordre: 3 },
      { submissionId: subId, nom: 'DevInfo / SenInfo', description: 'Base de données des indicateurs de développement du Sénégal', editeur: 'UNICEF / ANSD', anneeInstallation: 2015, ordre: 4 },
    ],
  });
  console.log('✅ 5 applications');

  // Registres
  await prisma.registre.createMany({
    data: [
      { submissionId: subId, nom: 'RNEA (Répertoire National des Entreprises et Associations)', description: 'Base de référence nationale. Co-gérée ANSD+DGID. 63 variables documentées. Identifiant NINEA (7 caractères).', volumetrie: '5M+ entreprises et associations', ordre: 0 },
      { submissionId: subId, nom: 'Base RGPH-5', description: 'Données du 5e recensement général de la population et de l\'habitat (2023)', volumetrie: '18M habitants, 3M ménages', ordre: 1 },
      { submissionId: subId, nom: 'Annuaire Statistique National', description: 'Compilation annuelle de 500+ indicateurs socio-économiques du Sénégal', volumetrie: '500+ indicateurs, séries temporelles 20 ans', ordre: 2 },
    ],
  });
  console.log('✅ 3 registres');

  // Données à consommer
  await prisma.donneeConsommer.createMany({
    data: [
      { submissionId: subId, donnee: 'Actes d\'état civil (naissances, décès, mariages)', source: 'ANEC', usage: 'Mise à jour démographique et calcul des indicateurs de population', priorite: 5, ordre: 0 },
      { submissionId: subId, donnee: 'Données fiscales contribuables', source: 'DGID', usage: 'Rapprochement fichier NINEA pour conformité fiscale', priorite: 4, ordre: 1 },
      { submissionId: subId, donnee: 'Déclarations douanières import/export', source: 'DGD', usage: 'Statistiques commerce extérieur et balance des paiements', priorite: 5, ordre: 2 },
      { submissionId: subId, donnee: 'Données cadastrales (NICAD)', source: 'DGID', usage: 'Géoréférencement entreprises et ménages', priorite: 3, ordre: 3 },
      { submissionId: subId, donnee: 'Données emploi et formation', source: 'MEFP', usage: 'Statistiques marché du travail', priorite: 3, ordre: 4 },
    ],
  });
  console.log('✅ 5 données à consommer');

  // Données à fournir
  await prisma.donneeFournir.createMany({
    data: [
      { submissionId: subId, donnee: 'NINEA (Numéro d\'Identification National des Entreprises)', destinataires: 'DGID, DGD, DGCPT, DGF, APIX, GREFFE', frequence: 'Temps réel', format: 'API REST / Plateforme TANDEM', ordre: 0 },
      { submissionId: subId, donnee: 'Données démographiques RGPH', destinataires: 'Ministères, chercheurs, organisations internationales', frequence: 'Annuel', format: 'CSV / API Open Data', ordre: 1 },
      { submissionId: subId, donnee: 'Indicateurs macroéconomiques', destinataires: 'MEF, BCEAO, FMI, Banque Mondiale', frequence: 'Trimestriel', format: 'Rapports / Open Data', ordre: 2 },
      { submissionId: subId, donnee: 'Fichier immatriculation NINEA (batch)', destinataires: 'DGID, DGD', frequence: 'Quotidien', format: 'Fichier CSV sécurisé', ordre: 3 },
    ],
  });
  console.log('✅ 4 données à fournir');

  // Flux existants
  await prisma.fluxExistant.createMany({
    data: [
      { submissionId: subId, source: 'ANSD', destination: 'DGID', donnee: 'NINEA entreprises', mode: 'API REST', frequence: 'Temps réel', ordre: 0 },
      { submissionId: subId, source: 'ANSD', destination: 'DGD', donnee: 'NINEA importateurs/exportateurs', mode: 'API REST', frequence: 'Temps réel', ordre: 1 },
      { submissionId: subId, source: 'ANSD', destination: 'DGCPT', donnee: 'NINEA fournisseurs État', mode: 'Fichier (CSV/Excel)', frequence: 'Mensuel', ordre: 2 },
      { submissionId: subId, source: 'DGD', destination: 'ANSD', donnee: 'Statistiques commerce extérieur', mode: 'Fichier (CSV/Excel)', frequence: 'Mensuel', ordre: 3 },
      { submissionId: subId, source: 'ANSD', destination: 'APIX', donnee: 'Vérification NINEA investisseurs', mode: 'API REST', frequence: 'À la demande', ordre: 4 },
    ],
  });
  console.log('✅ 5 flux existants');

  // Cas d'usage
  await prisma.casUsage.createMany({
    data: [
      { submissionId: subId, titre: 'Partage NINEA temps réel via PINS', description: 'Exposer NINEA.GetEntreprise via X-Road pour vérification instantanée par toutes les administrations connectées', acteurs: 'ANSD, DGID, DGD, DGCPT, APIX', priorite: 5, ordre: 0 },
      { submissionId: subId, titre: 'Statistiques commerce extérieur automatisées', description: 'Recevoir automatiquement les déclarations douanières de la DGD pour produire les stats commerce extérieur sans ressaisie', acteurs: 'ANSD, DGD', priorite: 4, ordre: 1 },
      { submissionId: subId, titre: 'Couplage NINEA-RCCM', description: 'Relier automatiquement NINEA au numéro RCCM pour cohérence du référentiel entreprises', acteurs: 'ANSD, GREFFE, DGID', priorite: 4, ordre: 2 },
    ],
  });
  console.log('✅ 3 cas d\'usage');

  // Soumettre
  await prisma.submission.update({
    where: { id: subId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
  console.log('✅ Soumission SUBMITTED');

  console.log(`\n=== Questionnaire ANSD rempli et soumis : ${subId} ===`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
