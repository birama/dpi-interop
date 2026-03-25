import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Import Building Blocks DPI ===');

  const blocks = [
    // COUCHE FONDATION
    { code: 'DIGITAL-IDENTITY', nom: 'Digital Identity (NIN/NINEA)', description: 'Identité numérique citoyens, entreprises, agents et objets', couche: 'FONDATION' as const, statut: 'PLANIFIE' as const, operateur: 'ANEC / SENUM', compatibleXRoad: true, technologie: 'MOSIP (prévu)', observations: 'MOSIP mentionné dans le Plan d\'opérationnalisation DPI mais pas encore implémenté. NIN/NINEA existants utilisés comme identifiants pivots des flux X-Road.', ordre: 1 },
    { code: 'DATA-EXCHANGE', nom: 'Data Exchange (e-jokkoo)', description: 'Plateforme X-Road / e-jokkoo pour l\'échange sécurisé inter-administrations', couche: 'FONDATION' as const, statut: 'EN_DEPLOIEMENT' as const, operateur: 'SENUM SA', compatibleXRoad: true, technologie: 'X-Road 7, REST/SOAP', observations: 'MVP 1.0 en cours — 2 cas d\'usage (Protection Sociale, Finances), 4 agences pilotes. Partenaire technique: Accenture/JICA.', ordre: 2 },
    { code: 'PAYMENT-GATEWAY', nom: 'Payment Gateway (SENTRESOR)', description: 'Passerelle de paiement SENTRESOR pour les services gouvernementaux', couche: 'FONDATION' as const, statut: 'PLANIFIE' as const, operateur: 'DGCPT', compatibleXRoad: false, technologie: 'SENTRESOR', observations: 'Trésor Public via SENTRESOR. Intégration X-Road prévue à terme.', ordre: 3 },

    // COUCHE INTÉGRATION
    { code: 'API-MANAGEMENT', nom: 'API Management', description: 'Gestion centralisée des API gouvernementales', couche: 'INTEGRATION' as const, statut: 'PLANIFIE' as const, operateur: 'SENUM SA', compatibleXRoad: true, ordre: 1 },
    { code: 'MESSAGING-JOKKO', nom: 'Messaging & Notification (JOKKO)', description: 'Messagerie gouvernementale et notifications multi-canal (Boîte Postale Numérique du Citoyen)', couche: 'INTEGRATION' as const, statut: 'PLANIFIE' as const, operateur: 'SENUM SA / SN La Poste', compatibleXRoad: false, observations: 'JOKKO est positionné comme service Layer 2 applicatif. À reclasser éventuellement.', ordre: 2 },
    { code: 'E-SIGNATURE', nom: 'E-Signature', description: 'Signature électronique qualifiée pour l\'administration', couche: 'INTEGRATION' as const, statut: 'PLANIFIE' as const, operateur: 'SENUM SA', compatibleXRoad: false, observations: 'Dépend de la PKI nationale opérationnelle.', ordre: 3 },
    { code: 'WORKFLOW-ENGINE', nom: 'Workflow Engine', description: 'Moteur de processus métier pour la dématérialisation', couche: 'INTEGRATION' as const, statut: 'PLANIFIE' as const, operateur: 'SENUM SA', compatibleXRoad: false, ordre: 4 },
    { code: 'CONSENT-MANAGEMENT', nom: 'Consent Management', description: 'Gestion du consentement pour le partage de données personnelles', couche: 'INTEGRATION' as const, statut: 'NON_DEMARRE' as const, operateur: 'CDP / SENUM SA', compatibleXRoad: true, ordre: 5 },

    // COUCHE INFRASTRUCTURE
    { code: 'SOVEREIGN-CLOUD', nom: 'Cloud Souverain', description: 'Infrastructure cloud hébergée au Sénégal par SENUM SA', couche: 'INFRASTRUCTURE' as const, statut: 'EN_DEPLOIEMENT' as const, operateur: 'SENUM SA', compatibleXRoad: false, observations: 'Opérationnel pour l\'hébergement des Security Servers X-Road.', ordre: 1 },
    { code: 'PKI', nom: 'PKI (Infrastructure à clés publiques)', description: 'Infrastructure à clés publiques nationale (PKISN)', couche: 'INFRASTRUCTURE' as const, statut: 'PLANIFIE' as const, operateur: 'SENUM SA', compatibleXRoad: true, observations: 'PKI Lite temporaire déployée par SENUM en attendant la PKISN opérationnelle. Financement via PAENS (Banque Mondiale) en négociation.', ordre: 2 },
    { code: 'CONNECTIVITY', nom: 'Connectivity (Intranet gouvernemental)', description: 'Réseau fibre inter-administrations géré par l\'ADIE', couche: 'INFRASTRUCTURE' as const, statut: 'OPERATIONNEL' as const, operateur: 'ADIE', compatibleXRoad: true, ordre: 3 },
    { code: 'DBAAS', nom: 'Database as a Service', description: 'Bases de données managées sur le cloud souverain', couche: 'INFRASTRUCTURE' as const, statut: 'PLANIFIE' as const, operateur: 'SENUM SA', compatibleXRoad: false, ordre: 4 },
    { code: 'MONITORING', nom: 'Monitoring', description: 'Surveillance centralisée des services numériques', couche: 'INFRASTRUCTURE' as const, statut: 'EN_DEPLOIEMENT' as const, operateur: 'SENUM SA', compatibleXRoad: false, observations: 'Site de monitoring X-Road développé par PexOne.', ordre: 5 },
    { code: 'SECURITY', nom: 'Security (Chiffrement, Audit)', description: 'Services de sécurité transversaux', couche: 'INFRASTRUCTURE' as const, statut: 'EN_DEPLOIEMENT' as const, operateur: 'ADIE', compatibleXRoad: true, ordre: 6 },

    // COUCHE APPLICATION
    { code: 'EGOV-BACKOFFICE', nom: 'E-Gov Backoffice & Portals', description: 'Applications de back-office pour les administrations', couche: 'APPLICATION' as const, statut: 'OPERATIONNEL' as const, operateur: 'SENUM SA / Ministères', compatibleXRoad: false, ordre: 1 },
    { code: 'E-CITOYEN', nom: 'E-Citoyen (senegalservices.sn)', description: 'Portail citoyen pour les démarches en ligne', couche: 'APPLICATION' as const, statut: 'OPERATIONNEL' as const, operateur: 'SENUM SA', compatibleXRoad: true, ordre: 2 },
    { code: 'GOV-ANALYTICS', nom: 'Reporting & Gov Analytics', description: 'Tableaux de bord et analyses pour la décision publique', couche: 'APPLICATION' as const, statut: 'PLANIFIE' as const, operateur: 'ANSD / SENUM SA', compatibleXRoad: false, ordre: 3 },
    { code: 'REFERENTIELS', nom: 'Référentiels (NINEA, NNI, BAN)', description: 'Bases de référence partagées entre administrations', couche: 'APPLICATION' as const, statut: 'EN_DEPLOIEMENT' as const, operateur: 'ANSD / ANEC', compatibleXRoad: true, ordre: 4 },
  ];

  for (const b of blocks) {
    await prisma.buildingBlock.upsert({
      where: { code: b.code },
      update: { ...b },
      create: { ...b },
    });
    console.log(`✅ ${b.couche} — ${b.code}: ${b.statut}`);
  }

  const stats = await prisma.buildingBlock.groupBy({ by: ['couche'], _count: true });
  console.log('\n=== Stats ===');
  stats.forEach(s => console.log(`${s.couche}: ${s._count}`));
  console.log(`Total: ${blocks.length}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
