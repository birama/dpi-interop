import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Import Questionnaire ITA — Institut de Technologie Alimentaire ===');

  // 1. Institution
  let institution = await prisma.institution.findFirst({ where: { OR: [{ code: 'ITA' }, { nom: { contains: 'Technologie Alimentaire' } }] } });
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        code: 'ITA', nom: 'Institut de Technologie Alimentaire', ministere: 'Industrie',
        responsableNom: 'Dr Fallou SARR', responsableFonction: 'Directeur des Relations Extérieures',
        responsableEmail: 'dre@ita.sn', responsableTel: '+221 33 859 07 20',
      },
    });
    console.log('✅ Institution ITA créée');
  } else {
    console.log('⏭️ Institution ITA existe');
  }

  // 2. Utilisateur
  const existingUser = await prisma.user.findUnique({ where: { email: 'ptall@ita.sn' } });
  if (!existingUser) {
    const hash = await bcrypt.hash('Password@123', 10);
    await prisma.user.create({ data: { email: 'ptall@ita.sn', password: hash, role: 'INSTITUTION', institutionId: institution.id, mustChangePassword: true } });
    console.log('✅ User ptall@ita.sn créé');
  } else {
    console.log('⏭️ User ptall@ita.sn existe');
  }

  // 3. Submission
  let sub = await prisma.submission.findFirst({ where: { institutionId: institution.id, status: 'DRAFT' } });
  if (!sub) {
    sub = await prisma.submission.create({ data: { institutionId: institution.id, status: 'DRAFT', currentStep: 0 } });
  }
  const subId = sub.id;

  // Update submission data
  await prisma.submission.update({
    where: { id: subId },
    data: {
      currentStep: 7, status: 'SUBMITTED', submittedAt: new Date(),
      dataOwnerNom: 'Dr Fallou SARR', dataOwnerFonction: 'Directeur des Relations Extérieures',
      dataStewardNom: 'Mme DIOP Penda TALL', dataStewardEmail: 'ptall@ita.sn', dataStewardTelephone: '77 579 37 60',
      contraintesJuridiques: 'Données non encore publiées ou brevetées ne sont pas partagées. Données à caractère personnel (conformité CDP). Secret professionnel sur les données de recherche non publiées, processus, formules. Absence de convention d\'échange formalisée.',
      contraintesTechniques: 'Infrastructure réseau vétuste – obsolète (+20 ans) – non redondante – avec coupures et lenteurs fréquentes. Absence d\'API. 1 seul serveur très vétuste et très lent. Problèmes bande passante.',
      maturiteInfra: 1, maturiteDonnees: 2, maturiteCompetences: 2, maturiteGouvernance: 2,
      forces: 'Forte utilisation de données (statistiques agricoles, économique, nutrition, démographie) pour l\'élaboration de projets de recherche. Production de données scientifiques pouvant servir d\'outils de décision. Système de génération de données scientifiques et techniques (laboratoires, unités de recherche, centre de formation et incubateur d\'entreprises). Système d\'information fonctionnel existant.',
      faiblesses: 'Insuffisances majeures liées à l\'obsolescence de l\'infrastructure réseau. Insuffisance en quantité et en qualité du personnel dédié SI. Insuffisance de la culture SI. Capacité énergétique insuffisante.',
      attentes: 'Intérêt et modalités de mise en œuvre de l\'interopérabilité. Formation : Cybersécurité, Expert base de données, gestion et protection des données sensibles (recherche). Contribution : Expertise, données, ressources. Gouvernance : Formation et sensibilisation des acteurs et tournées au sein des administrations cibles.',
      contributions: 'Expertise en technologie alimentaire, données scientifiques, ressources laboratoires. Risque identifié : protection des données scientifiques.',
    },
  });
  console.log('✅ Submission mise à jour');

  // 4. Infrastructure Items (40 items)
  await prisma.infrastructureItem.deleteMany({ where: { submissionId: subId } });
  const infra = [
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Datacenter', disponibilite: false },
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Serveurs en production', disponibilite: true, qualifications: '1 serveur', observations: 'Très vétuste et très lent' },
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Site de backup', disponibilite: false },
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Technologie de virtualisation', disponibilite: false, qualifications: 'Néant' },
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Espace de stockage', disponibilite: true, qualifications: 'NAS sur site', observations: '24 Téraoctets' },
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Backup du SI', disponibilite: true, qualifications: 'Manuelle et Automatique' },
    { domain: 'EQUIPEMENTS_SYSTEME', element: 'Conteneurisation', disponibilite: false },
    { domain: 'RESEAU_CONNECTIVITE', element: 'Type de réseau local', disponibilite: true, qualifications: 'Ligne fibre SONATEL', observations: 'Vitesse : 100MBPs' },
    { domain: 'RESEAU_CONNECTIVITE', element: 'Connexion intranet gouvernemental', disponibilite: false, qualifications: 'Câblage intranet gouv. existant mais non utilisé', observations: 'Câblé par l\'ADIE' },
    { domain: 'RESEAU_CONNECTIVITE', element: 'Fibre optique', disponibilite: false, qualifications: 'Existe mais n\'est pas utilisée' },
    { domain: 'RESEAU_CONNECTIVITE', element: 'Débit Internet', disponibilite: true, qualifications: '100MBPs', observations: 'Ligne de la fibre SONATEL' },
    { domain: 'RESEAU_CONNECTIVITE', element: 'Interconnexions directes', disponibilite: false },
    { domain: 'RESEAU_CONNECTIVITE', element: 'Performances réseau', disponibilite: false, qualifications: 'Néant' },
    { domain: 'RESEAU_CONNECTIVITE', element: 'VPN ou tunnels sécurisés', disponibilite: false },
    { domain: 'API_SERVICES', element: 'API ou services web exposés', disponibilite: false },
    { domain: 'API_SERVICES', element: 'Documentation API', disponibilite: false },
    { domain: 'API_SERVICES', element: 'Bus d\'intégration / ESB', disponibilite: false },
    { domain: 'API_SERVICES', element: 'Format d\'échange de données', disponibilite: false },
    { domain: 'API_SERVICES', element: 'Protocoles d\'échange actuels', disponibilite: false },
    { domain: 'API_SERVICES', element: 'Expérience X-Road', disponibilite: false },
    { domain: 'SECURITE_CERTIFICATS', element: 'Antivirus / EDR serveur', disponibilite: true, qualifications: 'Kaspersky Plus', observations: 'Licence 1an/PC' },
    { domain: 'SECURITE_CERTIFICATS', element: 'Firewall / pare-feu', disponibilite: false },
    { domain: 'SECURITE_CERTIFICATS', element: 'Certificats SSL/TLS', disponibilite: false },
    { domain: 'SECURITE_CERTIFICATS', element: 'Signature électronique', disponibilite: false },
    { domain: 'SECURITE_CERTIFICATS', element: 'Conformité PSSI', disponibilite: false },
    { domain: 'SECURITE_CERTIFICATS', element: 'Gestion des identités', disponibilite: false },
    { domain: 'ENERGIE_CONTINUITE', element: 'Sources d\'énergie datacenter', disponibilite: true, qualifications: 'SENELEC, groupe électrogène, onduleur', observations: 'Arrivée SENELEC + Groupe électrogène + Onduleurs (800VA-600VA-1KVA-2KVA)' },
    { domain: 'ENERGIE_CONTINUITE', element: 'Autonomie des onduleurs', disponibilite: false },
    { domain: 'ENERGIE_CONTINUITE', element: 'PRA/PCA formalisé', disponibilite: false },
    { domain: 'RESSOURCES_HUMAINES', element: 'Ingénieurs RÉSEAU', disponibilite: true, qualifications: '1' },
    { domain: 'RESSOURCES_HUMAINES', element: 'Ingénieurs SYSTÈME', disponibilite: false },
    { domain: 'RESSOURCES_HUMAINES', element: 'Ingénieurs SÉCURITÉ', disponibilite: false },
    { domain: 'RESSOURCES_HUMAINES', element: 'Ingénieurs DBA', disponibilite: false },
    { domain: 'RESSOURCES_HUMAINES', element: 'Développeurs', disponibilite: false },
    { domain: 'RESSOURCES_HUMAINES', element: 'Compétences intégration/API', disponibilite: false },
    { domain: 'LICENCES_LOGICIELS', element: 'Licences Microsoft', disponibilite: true, qualifications: 'Windows Server 2012 - SQL Server 2009', observations: 'Obsolètes — Mise à jour nécessaire' },
    { domain: 'LICENCES_LOGICIELS', element: 'Licences Oracle/SGBD', disponibilite: false },
    { domain: 'LICENCES_LOGICIELS', element: 'Outils monitoring', disponibilite: true, qualifications: 'Zabbix (en test)', observations: 'En phase test' },
    { domain: 'LICENCES_LOGICIELS', element: 'Outils gestion de projet', disponibilite: true, qualifications: 'GLPI', observations: 'En cours de déploiement' },
  ];
  await prisma.infrastructureItem.createMany({ data: infra.map(i => ({ submissionId: subId, ...i })) });
  console.log(`✅ ${infra.length} items infrastructure`);

  // 5. Données à consommer (7)
  await prisma.donneeConsommer.deleteMany({ where: { submissionId: subId } });
  await prisma.donneeConsommer.createMany({ data: [
    { submissionId: subId, donnee: 'Autorisation FRA', source: 'DCI', usage: 'Mieux assister les entreprises agroalimentaires', priorite: 3, ordre: 0 },
    { submissionId: subId, donnee: 'Conditions et exigences pour exporter les produits agro-industriels', source: 'ASEPEX', usage: 'Accompagnement des porteurs de projets bénéficiaires de l\'ITA', priorite: 2, ordre: 1 },
    { submissionId: subId, donnee: 'Disponibilité et conditions d\'accès au financement de projets de recherche', source: 'MESRI', usage: 'Accéder aux sources de financement de la recherche', priorite: 3, ordre: 2 },
    { submissionId: subId, donnee: 'Disponibilité et conditions d\'accès aux financements projets jeunes et femmes', source: 'DER-FJ', usage: 'Participer aux projets d\'appui aux jeunes et aux femmes', priorite: 3, ordre: 3 },
    { submissionId: subId, donnee: 'Statistiques agricoles du Sénégal', source: 'DAPSA', usage: 'Élaboration de projets de recherche et/ou de développement', priorite: 3, ordre: 4 },
    { submissionId: subId, donnee: 'Statistiques démographiques, sociales, économiques, nutrition, industrie', source: 'ANSD', usage: 'Élaboration de projets de recherche et/ou de développement', priorite: 3, ordre: 5 },
    { submissionId: subId, donnee: 'Statistiques d\'importation et d\'exportation', source: 'DCI', usage: 'Élaboration de projets de recherche et/ou de développement', priorite: 3, ordre: 6 },
  ] });
  console.log('✅ 7 données à consommer');

  // 6. Données à fournir (5)
  await prisma.donneeFournir.deleteMany({ where: { submissionId: subId } });
  await prisma.donneeFournir.createMany({ data: [
    { submissionId: subId, donnee: 'Résultats de recherche', destinataires: 'MASAE, MESRI, entreprises agroalimentaires', frequence: 'Annuel', format: 'Papier et version numérique', ordre: 0 },
    { submissionId: subId, donnee: 'Nombre de personnes formées en agroalimentaire', destinataires: 'MASAE, MESRI, ONFP', frequence: 'En continu', format: 'Papier et version numérique', ordre: 1 },
    { submissionId: subId, donnee: 'Nombre d\'échantillons d\'aliments contrôlés par les laboratoires', destinataires: 'DCI, MASAE', frequence: 'Semestriel', format: 'Papier et version numérique', ordre: 2 },
    { submissionId: subId, donnee: 'Nombre de porteurs de projets agroalimentaires accompagnés', destinataires: 'ADEPME, DER-FJ, MASAE', frequence: 'Annuel', format: 'Papier et version numérique', ordre: 3 },
    { submissionId: subId, donnee: 'Nombre de brevets produits par l\'ITA', destinataires: 'MESRI, OAPI', frequence: 'Biannuel', format: 'Papier et version numérique', ordre: 4 },
  ] });
  console.log('✅ 5 données à fournir');

  // 7. Flux existants (9)
  await prisma.fluxExistant.deleteMany({ where: { submissionId: subId } });
  await prisma.fluxExistant.createMany({ data: [
    { submissionId: subId, source: 'ITA', destination: 'ADEPME', donnee: 'Listes porteurs projets, Rapports', mode: 'Fichier (CSV/Excel)', frequence: 'Annuel', ordre: 0 },
    { submissionId: subId, source: 'ITA', destination: 'ISRA', donnee: 'Données scientifiques', mode: 'Fichier (CSV/Excel)', frequence: 'À la demande', ordre: 1 },
    { submissionId: subId, source: 'ITA', destination: 'ANCAR', donnee: 'Données scientifiques et technologies', mode: 'Fichier (CSV/Excel)', frequence: 'À la demande', ordre: 2 },
    { submissionId: subId, source: 'ITA', destination: 'DER-FJ', donnee: 'Rapports et données', mode: 'Fichier (CSV/Excel)', frequence: 'Semestriel', ordre: 3 },
    { submissionId: subId, source: 'ITA', destination: 'MASAE', donnee: 'Rapports et données projets', mode: 'Fichier (CSV/Excel)', frequence: 'Trimestriel', ordre: 4 },
    { submissionId: subId, source: 'MASAE', destination: 'ITA', donnee: 'Rapports et données projets', mode: 'Fichier (CSV/Excel)', frequence: 'Trimestriel', ordre: 5 },
    { submissionId: subId, source: 'ASEPEX', destination: 'ITA', donnee: 'Données export', mode: 'Fichier (CSV/Excel)', frequence: 'À la demande', ordre: 6 },
    { submissionId: subId, source: 'ITA', destination: 'DCI', donnee: 'Données contrôle qualité', mode: 'Manuel', frequence: 'Mensuel', ordre: 7 },
    { submissionId: subId, source: 'ITA', destination: 'ONFP', donnee: 'Données et rapports formation', mode: 'Fichier (CSV/Excel)', frequence: 'À la demande', ordre: 8 },
  ] });
  console.log('✅ 9 flux existants');

  // 8. Niveaux interop / maturité (7)
  await prisma.niveauInterop.deleteMany({ where: { submissionId: subId } });
  await prisma.niveauInterop.createMany({ data: [
    { submissionId: subId, niveau: 'TECHNIQUE', question: 'Infrastructure technique', reponse: '1/5' },
    { submissionId: subId, niveau: 'TECHNIQUE', question: 'Numérisation des processus métier', reponse: '1/5' },
    { submissionId: subId, niveau: 'TECHNIQUE', question: 'Capacité d\'échange de données', reponse: '2/5' },
    { submissionId: subId, niveau: 'ORGANISATIONNEL', question: 'Gouvernance des données', reponse: '2/5' },
    { submissionId: subId, niveau: 'TECHNIQUE', question: 'Compétences SI des équipes', reponse: '2/5' },
    { submissionId: subId, niveau: 'TECHNIQUE', question: 'Expérience en projets d\'interopérabilité', reponse: '1/5' },
    { submissionId: subId, niveau: 'JURIDIQUE', question: 'Conformité juridique', reponse: '1/5' },
  ] });
  console.log('✅ 7 niveaux maturité (moyenne: 1.43/5)');

  console.log(`\n=== Import ITA terminé : ${subId} ===`);
  console.log('  Apps: 0 | Registres: 0 | Infra: 39 | Consommer: 7 | Fournir: 5 | Flux: 9 | Maturité: 7');
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
