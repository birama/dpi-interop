import { PrismaClient, Role, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (Vue 360° tables first, then existing)
  await prisma.notification.deleteMany();
  await prisma.useCaseFeedback.deleteMany();
  await prisma.useCaseConsultation.deleteMany();
  await prisma.useCaseStakeholder.deleteMany();
  await prisma.casUsageRegistre.deleteMany();
  // StatusHistory has immutability trigger — disable temporarily
  try { await prisma.$executeRawUnsafe('ALTER TABLE use_case_status_history DISABLE TRIGGER trg_prevent_statushistory_update'); } catch {}
  await prisma.useCaseStatusHistory.deleteMany();
  try { await prisma.$executeRawUnsafe('ALTER TABLE use_case_status_history ENABLE TRIGGER trg_prevent_statushistory_update'); } catch {}
  await prisma.auditLog.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.report.deleteMany();
  await prisma.financement.deleteMany();
  await prisma.expertise.deleteMany();
  await prisma.casUsage.deleteMany();
  await prisma.fluxExistant.deleteMany();
  await prisma.donneeFournir.deleteMany();
  await prisma.donneeConsommer.deleteMany();
  await prisma.fluxInstitution.deleteMany();
  await prisma.casUsageMVP.deleteMany();
  await prisma.phaseMVP.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.pTF.deleteMany();
  await prisma.registre.deleteMany();
  await prisma.application.deleteMany();
  await prisma.infrastructureItem.deleteMany();
  await prisma.niveauInterop.deleteMany();
  await prisma.conformitePrincipe.deleteMany();
  await prisma.dictionnaireDonnee.deleteMany();
  await prisma.preparationDecret.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.convention.deleteMany();
  await prisma.xRoadReadiness.deleteMany();
  await prisma.demandeInterop.deleteMany();
  await prisma.documentReference.deleteMany();
  await prisma.registreNational.deleteMany();
  await prisma.buildingBlock.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create institutions
  const institutions = await Promise.all([
    prisma.institution.create({
      data: {
        code: 'DGID',
        nom: 'Direction Générale des Impôts et des Domaines',
        ministere: 'Ministère des Finances et du Budget',
        responsableNom: 'Mamadou Diallo',
        responsableFonction: 'Directeur des Systèmes d\'Information',
        responsableEmail: 'dsi@dgid.sn',
        responsableTel: '+221 33 889 20 00',
      },
    }),
    prisma.institution.create({
      data: {
        code: 'DGD',
        nom: 'Direction Générale des Douanes',
        ministere: 'Ministère des Finances et du Budget',
        responsableNom: 'Fatou Ndiaye',
        responsableFonction: 'Chef du Service Informatique',
        responsableEmail: 'informatique@douanes.sn',
        responsableTel: '+221 33 889 30 00',
      },
    }),
    prisma.institution.create({
      data: {
        code: 'ANSD',
        nom: 'Agence Nationale de la Statistique et de la Démographie',
        ministere: 'Ministère de l\'Économie, du Plan et de la Coopération',
        responsableNom: 'Ousmane Sow',
        responsableFonction: 'Directeur des Systèmes d\'Information',
        responsableEmail: 'dsi@ansd.sn',
        responsableTel: '+221 33 869 21 00',
      },
    }),
    prisma.institution.create({
      data: {
        code: 'DGCPT',
        nom: 'Direction Générale de la Comptabilité Publique et du Trésor',
        ministere: 'Ministère des Finances et du Budget',
        responsableNom: 'Abdoulaye Fall',
        responsableFonction: 'Chef de la Division Informatique',
        responsableEmail: 'informatique@dgcpt.sn',
        responsableTel: '+221 33 889 40 00',
      },
    }),
    prisma.institution.create({
      data: {
        code: 'ANEC',
        nom: 'Agence Nationale de l\'État Civil',
        ministere: 'Ministère des Collectivités Territoriales',
        responsableNom: 'Ibrahima Gueye',
        responsableFonction: 'Responsable SI',
        responsableEmail: 'si@anec.sn',
        responsableTel: '+221 33 889 50 00',
      },
    }),
  ]);

  console.log(`✅ Created ${institutions.length} institutions`);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2026', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@senum.sn',
      password: adminPassword,
      role: Role.ADMIN,
      mustChangePassword: false,
    },
  });

  console.log('✅ Created admin user: admin@senum.sn');

  // Create institution users
  const userPassword = await bcrypt.hash('Password@123', SALT_ROUNDS);
  const users = await Promise.all(
    institutions.map(inst =>
      prisma.user.create({
        data: {
          email: inst.responsableEmail,
          password: userPassword,
          role: Role.INSTITUTION,
          institutionId: inst.id,
        },
      })
    )
  );

  console.log(`✅ Created ${users.length} institution users`);

  // Create a sample submission for DGID
  const dgid = institutions.find(i => i.code === 'DGID')!;
  const submission = await prisma.submission.create({
    data: {
      institutionId: dgid.id,
      status: SubmissionStatus.SUBMITTED,
      currentStep: 5,
      submittedAt: new Date(),
      infrastructure: {
        serveurs: '12 serveurs physiques + cluster VMware (48 VMs)',
        sgbd: ['Oracle 19c', 'PostgreSQL 14'],
        reseau: 'Fibre optique dédiée + VPN site-to-site',
        securite: 'Firewall FortiGate, WAF, IDS/IPS, SOC 24/7',
      },
      maturiteInfra: 4,
      maturiteDonnees: 4,
      maturiteCompetences: 3,
      maturiteGouvernance: 3,
      contraintesJuridiques: 'Secret fiscal (Code Général des Impôts), RGPD pour les données personnelles',
      contraintesTechniques: 'Systèmes legacy Oracle Forms en cours de migration',
      forces: 'Infrastructure robuste, équipe technique expérimentée, données de qualité',
      faiblesses: 'Applications vieillissantes, documentation incomplète, manque de standards d\'API',
      attentes: 'Plateforme d\'échange sécurisée, standards d\'interopérabilité, accompagnement technique',
      contributions: 'Partage du référentiel NINEA, expertise en sécurisation des échanges fiscaux',
    },
  });

  // Add applications
  await prisma.application.createMany({
    data: [
      {
        submissionId: submission.id,
        nom: 'SIGTAS',
        description: 'Système Intégré de Gestion des Taxes',
        editeur: 'Crown Agents',
        anneeInstallation: 2008,
        ordre: 0,
      },
      {
        submissionId: submission.id,
        nom: 'NINEAWEB',
        description: 'Gestion du NINEA (Numéro d\'Identification National des Entreprises)',
        editeur: 'Développement interne',
        anneeInstallation: 2015,
        ordre: 1,
      },
      {
        submissionId: submission.id,
        nom: 'e-Tax',
        description: 'Portail de télédéclaration et télépaiement',
        editeur: 'DGID/Partenaire',
        anneeInstallation: 2020,
        ordre: 2,
      },
    ],
  });

  // Add registres
  await prisma.registre.createMany({
    data: [
      {
        submissionId: submission.id,
        nom: 'Registre des Contribuables',
        description: 'Base de données de tous les contribuables (personnes physiques et morales)',
        volumetrie: '2.5 millions de contribuables actifs',
        ordre: 0,
      },
      {
        submissionId: submission.id,
        nom: 'Référentiel NINEA',
        description: 'Identifiant unique des entreprises et établissements',
        volumetrie: '450 000 entreprises enregistrées',
        ordre: 1,
      },
    ],
  });

  // Add données à consommer
  await prisma.donneeConsommer.createMany({
    data: [
      {
        submissionId: submission.id,
        donnee: 'Données d\'importation/exportation',
        source: 'DGD',
        usage: 'Recoupement des déclarations fiscales avec les flux commerciaux',
        priorite: 5,
        ordre: 0,
      },
      {
        submissionId: submission.id,
        donnee: 'État civil (naissances, décès)',
        source: 'ANEC',
        usage: 'Mise à jour du fichier des contribuables',
        priorite: 4,
        ordre: 1,
      },
      {
        submissionId: submission.id,
        donnee: 'Données cadastrales',
        source: 'DGCPT',
        usage: 'Évaluation des impôts fonciers',
        priorite: 3,
        ordre: 2,
      },
    ],
  });

  // Add données à fournir
  await prisma.donneeFournir.createMany({
    data: [
      {
        submissionId: submission.id,
        donnee: 'NINEA et identité des entreprises',
        destinataires: 'DGD, DGCPT, ANSD, Banques',
        frequence: 'Temps réel via API',
        format: 'API REST JSON',
        ordre: 0,
      },
      {
        submissionId: submission.id,
        donnee: 'Situation fiscale des entreprises',
        destinataires: 'Marchés publics, Banques',
        frequence: 'À la demande',
        format: 'API REST avec authentification',
        ordre: 1,
      },
      {
        submissionId: submission.id,
        donnee: 'Attestations fiscales',
        destinataires: 'Entreprises, Administrations',
        frequence: 'À la demande',
        format: 'PDF signé électroniquement',
        ordre: 2,
      },
    ],
  });

  // Add flux existants
  await prisma.fluxExistant.createMany({
    data: [
      {
        submissionId: submission.id,
        source: 'DGID',
        destination: 'DGCPT',
        donnee: 'Émissions fiscales',
        mode: 'Fichier CSV quotidien via SFTP',
        frequence: 'Quotidien',
        ordre: 0,
      },
      {
        submissionId: submission.id,
        source: 'DGD',
        destination: 'DGID',
        donnee: 'Déclarations douanières',
        mode: 'Web service SOAP',
        frequence: 'Temps réel',
        ordre: 1,
      },
    ],
  });

  // Add cas d'usage
  await prisma.casUsage.createMany({
    data: [
      {
        submissionId: submission.id,
        titre: 'Liaison NINEA-RCCM',
        description: 'Automatiser la création du NINEA dès l\'immatriculation au RCCM pour éviter les doublons et accélérer le démarrage des entreprises',
        acteurs: 'DGID, APIX, Tribunaux de Commerce',
        priorite: 5,
        ordre: 0,
      },
      {
        submissionId: submission.id,
        titre: 'Croisement fiscal-douanier',
        description: 'Comparer automatiquement les déclarations fiscales avec les données douanières pour détecter les incohérences',
        acteurs: 'DGID, DGD',
        priorite: 5,
        ordre: 1,
      },
      {
        submissionId: submission.id,
        titre: 'Mise à jour automatique des décès',
        description: 'Recevoir les données de décès de l\'état civil pour mettre à jour le fichier des contribuables',
        acteurs: 'DGID, ANEC',
        priorite: 4,
        ordre: 2,
      },
    ],
  });

  console.log('✅ Created sample submission for DGID with full data');

  // Create audit log for seeding
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userEmail: admin.email,
      userRole: admin.role,
      action: 'SEED',
      resource: 'database',
      resourceLabel: 'seed initial',
      details: {
        institutions: institutions.length,
        users: users.length + 1,
        submissions: 1,
      },
    },
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ DATABASE SEEDED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('');
  console.log('   Admin:');
  console.log('   └─ Email: admin@senum.sn');
  console.log('   └─ Password: Admin@2026');
  console.log('');
  console.log('   Institutions:');
  institutions.forEach(inst => {
    console.log(`   └─ ${inst.code}: ${inst.responsableEmail} / Password@123`);
  });
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
