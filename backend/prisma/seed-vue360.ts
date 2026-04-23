/**
 * Seed Vue 360° — Données de test représentatives
 *
 * Usage : npx tsx prisma/seed-vue360.ts
 *
 * Crée 4 cas d'usage avec stakeholders, consultations, feedbacks,
 * status history, notifications et rattachements registres.
 *
 * 100% idempotent : utilise upsert sur des identifiants stables (CUID déterministes).
 * Pré-requis : les institutions et users du seed principal doivent exister.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Identifiants stables pour idempotence (préfixe vue360-)
const IDS = {
  // Stakeholders
  sh_cu008_dgcpt: 'vue360-sh-cu008-dgcpt-init',
  sh_cu008_dgid: 'vue360-sh-cu008-dgid-four',
  sh_cu008_mfb: 'vue360-sh-cu008-mfb-cons',
  sh_cu008_cdp: 'vue360-sh-cu008-cdp-part',
  sh_cu011_dgid: 'vue360-sh-cu011-dgid-init',
  sh_cu011_dgd: 'vue360-sh-cu011-dgd-four',
  sh_cu011_dgcpt: 'vue360-sh-cu011-dgcpt-part',
  sh_cu012_dgpsn: 'vue360-sh-cu012-dgpsn-init',
  sh_cu012_dgid: 'vue360-sh-cu012-dgid-four',
  sh_cu012_ansd: 'vue360-sh-cu012-ansd-four',
  sh_cu012_cdp: 'vue360-sh-cu012-cdp-part',
  sh_cu019_dgid: 'vue360-sh-cu019-dgid-four',
  sh_cu019_dgd: 'vue360-sh-cu019-dgd-four',
  sh_cu019_mj: 'vue360-sh-cu019-mj-four',
  // Consultations
  co_cu008_dgid: 'vue360-co-cu008-dgid',
  co_cu008_mfb: 'vue360-co-cu008-mfb',
  co_cu008_cdp: 'vue360-co-cu008-cdp',
  co_cu012_dgid: 'vue360-co-cu012-dgid',
  co_cu019_mj: 'vue360-co-cu019-mj',
  // Feedbacks
  fb_cu008_mfb: 'vue360-fb-cu008-mfb-valid',
  fb_cu008_cdp: 'vue360-fb-cu008-cdp-reserv',
  fb_cu019_mj: 'vue360-fb-cu019-mj-refus',
  // Status history
  hist_cu008_1: 'vue360-hist-cu008-declare',
  hist_cu008_2: 'vue360-hist-cu008-consult',
  hist_cu011_1: 'vue360-hist-cu011-declare',
  hist_cu011_2: 'vue360-hist-cu011-consult',
  hist_cu011_3: 'vue360-hist-cu011-prod',
  hist_cu012_1: 'vue360-hist-cu012-declare',
  hist_cu012_2: 'vue360-hist-cu012-consult',
  hist_cu019_1: 'vue360-hist-cu019-declare',
  hist_cu019_2: 'vue360-hist-cu019-consult',
  // Notifications
  notif_dgid_cu008: 'vue360-notif-dgid-cu008',
  // CasUsageRegistre
  cur_cu008_ninea: 'vue360-cur-cu008-ninea',
  cur_cu008_sigtas: 'vue360-cur-cu008-sigtas',
  cur_cu011_ninea: 'vue360-cur-cu011-ninea',
  cur_cu012_ninea: 'vue360-cur-cu012-ninea',
  cur_cu012_rnu: 'vue360-cur-cu012-rnu',
  cur_cu019_casier: 'vue360-cur-cu019-casier',
};

async function main() {
  console.log('=== Seed Vue 360° — Données de test ===\n');

  // --- Résolution des entités existantes ---
  const instByCode = async (code: string) => {
    const inst = await prisma.institution.findUnique({ where: { code } });
    if (!inst) throw new Error(`Institution ${code} introuvable — lancer le seed principal d'abord`);
    return inst;
  };

  const userByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`User ${email} introuvable — lancer le seed principal d'abord`);
    return user;
  };

  const registreByCode = async (code: string) => {
    const reg = await prisma.registreNational.findUnique({ where: { code } });
    if (!reg) throw new Error(`Registre ${code} introuvable — lancer seed_registres_nationaux.ts d'abord`);
    return reg;
  };

  // Institutions
  const dgid = await instByCode('DGID');
  const dgd = await instByCode('DGD');
  const ansd = await instByCode('ANSD');
  const dgcpt = await instByCode('DGCPT');
  const dgpsn = await instByCode('DGPSN').catch(() => null);

  // Créer les institutions manquantes (CDP, MFB, Primature, MJ, DGPSN)
  const ensureInst = async (code: string, nom: string, ministere: string, email: string) => {
    return prisma.institution.upsert({
      where: { code },
      update: {},
      create: {
        code, nom, ministere,
        responsableNom: `Responsable ${code}`,
        responsableFonction: 'Directeur SI',
        responsableEmail: email,
        responsableTel: '+221 33 800 00 00',
      },
    });
  };

  const cdp = await ensureInst('CDP', 'Commission de Protection des Données Personnelles', 'Primature', 'contact@cdp.sn');
  const mfb = await ensureInst('MFB', 'Ministère des Finances et du Budget — Cabinet', 'Ministère des Finances et du Budget', 'cab@mfb.gouv.sn');
  const mj = await ensureInst('MJ', 'Ministère de la Justice', 'Ministère de la Justice', 'dsi@justice.gouv.sn');
  const dgpsnInst = dgpsn || await ensureInst('DGPSN', 'Délégation Générale à la Protection Sociale et à la Solidarité Nationale', 'Ministère de la Famille', 'dsi@dgpsn.sn');

  console.log('  Institutions: DGID, DGD, ANSD, DGCPT, CDP, MFB, MJ, DGPSN OK');

  // Admin user (pour les ouvertures de consultation)
  const admin = await userByEmail('admin@senum.sn');

  // Registres
  const ninea = await registreByCode('NINEA');
  const rnu = await registreByCode('RNU').catch(() => null);
  const sigtas = await registreByCode('SIGTAS').catch(() => null);

  // --- Résolution des CasUsageMVP existants ---
  // On cherche par titre partiel, sinon on crée des stubs
  const ensureCU = async (code: string, titre: string, src: string, cible: string, desc: string) => {
    let cu = await prisma.casUsageMVP.findUnique({ where: { code } });
    if (!cu) {
      cu = await prisma.casUsageMVP.create({
        data: {
          code, titre, description: desc,
          institutionSourceCode: src, institutionCibleCode: cible,
          statutImpl: 'IDENTIFIE', impact: 'ELEVE',
        },
      });
      console.log(`  CU ${code} créé (stub)`);
    }
    return cu;
  };

  const cu008 = await ensureCU('PINS-CU-008', 'Réconciliation fiscale DGID ↔ DGCPT', 'DGCPT', 'DGID',
    'Rapprochement automatique des recettes fiscales entre le système SIGTAS de la DGID et le système comptable ASTER/SIGIF de la DGCPT.');
  const cu011 = await ensureCU('PINS-CU-011', 'Exposition Douanes.GetDeclarations', 'DGD', 'DGID',
    'Service PINS permettant à la DGID de consommer les déclarations douanières DGD pour le rapprochement des droits et taxes.');
  const cu012 = await ensureCU('PINS-CU-012', 'Qualification fiscale bénéficiaires RNU', 'DGPSN', 'DGID',
    'La DGPSN interroge la DGID et l\'ANSD pour qualifier fiscalement les bénéficiaires du RNU avant versement des allocations.');
  const cu019 = await ensureCU('PINS-CU-019', 'Plateforme anti-fraude inter-administrations', 'DGID', 'DGD',
    'Plateforme transversale de détection de fraude croisant NINEA, déclarations douanières, casier judiciaire et données fiscales.');

  // Mettre à jour les statutVueSection
  await prisma.casUsageMVP.update({ where: { id: cu008.id }, data: { statutVueSection: 'EN_CONSULTATION', resumeMetier: 'Rapprochement automatique des recettes fiscales DGID/DGCPT pour éliminer les écarts de comptabilisation mensuels.', baseLegale: 'Code Général des Impôts, Art. 23 — Obligation de transmission des données fiscales.' } });
  await prisma.casUsageMVP.update({ where: { id: cu011.id }, data: { statutVueSection: 'EN_PRODUCTION_360', resumeMetier: 'Service X-Road exposant les déclarations douanières DGD pour consommation par la DGID (rapprochement fiscal).', baseLegale: 'Protocole d\'échange DGID-DGD signé mars 2026.' } });
  await prisma.casUsageMVP.update({ where: { id: cu012.id }, data: { statutVueSection: 'EN_CONSULTATION', resumeMetier: 'Interrogation croisée NINEA+RNU pour qualifier le statut fiscal des bénéficiaires de la protection sociale.', baseLegale: 'Décret 2025-1431 sur l\'interopérabilité des données publiques.' } });
  await prisma.casUsageMVP.update({ where: { id: cu019.id }, data: { statutVueSection: 'EN_CONSULTATION', resumeMetier: 'Plateforme transversale anti-fraude croisant données fiscales, douanières et judiciaires.', baseLegale: 'Directive UEMOA sur la lutte contre la fraude fiscale.' } });
  console.log('  CasUsageMVP: CU-008, CU-011, CU-012, CU-019 mis à jour');

  // =========================================================================
  //  STAKEHOLDERS
  // =========================================================================
  const upsertStakeholder = async (id: string, casUsageId: string, institutionId: string, role: any, autoSaisine = false) => {
    await prisma.useCaseStakeholder.upsert({
      where: { id },
      update: { actif: true },
      create: { id, casUsageId, institutionId, role, autoSaisine, ajoutePar: admin.id },
    });
  };

  // CU-008: DGCPT(INIT), DGID(FOUR), MFB(CONS), CDP(PART)
  await upsertStakeholder(IDS.sh_cu008_dgcpt, cu008.id, dgcpt.id, 'INITIATEUR');
  await upsertStakeholder(IDS.sh_cu008_dgid, cu008.id, dgid.id, 'FOURNISSEUR');
  await upsertStakeholder(IDS.sh_cu008_mfb, cu008.id, mfb.id, 'CONSOMMATEUR');
  await upsertStakeholder(IDS.sh_cu008_cdp, cu008.id, cdp.id, 'PARTIE_PRENANTE');

  // CU-011: DGID(INIT+CONS), DGD(FOUR), DGCPT(PART)
  await upsertStakeholder(IDS.sh_cu011_dgid, cu011.id, dgid.id, 'INITIATEUR');
  await upsertStakeholder(IDS.sh_cu011_dgd, cu011.id, dgd.id, 'FOURNISSEUR');
  await upsertStakeholder(IDS.sh_cu011_dgcpt, cu011.id, dgcpt.id, 'PARTIE_PRENANTE');

  // CU-012: DGPSN(INIT), DGID(FOUR), ANSD(FOUR), CDP(PART)
  await upsertStakeholder(IDS.sh_cu012_dgpsn, cu012.id, dgpsnInst.id, 'INITIATEUR');
  await upsertStakeholder(IDS.sh_cu012_dgid, cu012.id, dgid.id, 'FOURNISSEUR');
  await upsertStakeholder(IDS.sh_cu012_ansd, cu012.id, ansd.id, 'FOURNISSEUR');
  await upsertStakeholder(IDS.sh_cu012_cdp, cu012.id, cdp.id, 'PARTIE_PRENANTE');

  // CU-019: DGID(FOUR), DGD(FOUR), MJ(FOUR)
  await upsertStakeholder(IDS.sh_cu019_dgid, cu019.id, dgid.id, 'FOURNISSEUR');
  await upsertStakeholder(IDS.sh_cu019_dgd, cu019.id, dgd.id, 'FOURNISSEUR');
  await upsertStakeholder(IDS.sh_cu019_mj, cu019.id, mj.id, 'FOURNISSEUR');

  console.log('  Stakeholders: 14 créés/mis à jour');

  // =========================================================================
  //  CONSULTATIONS
  // =========================================================================
  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  const upsertConsultation = async (id: string, stakeholderId: string, status: any, dateEcheance: Date, relances = 0) => {
    await prisma.useCaseConsultation.upsert({
      where: { id },
      update: { status, relances },
      create: { id, stakeholderId, dateEcheance, status, ouvertePar: admin.id, motifSollicit: 'Sollicitation formelle dans le cadre du pipeline Vue 360°.', relances },
    });
  };

  // CU-008: DGID(EN_ATTENTE, J+3), MFB(REPONDU), CDP(REPONDU)
  await upsertConsultation(IDS.co_cu008_dgid, IDS.sh_cu008_dgid, 'EN_ATTENTE', daysFromNow(3));
  await upsertConsultation(IDS.co_cu008_mfb, IDS.sh_cu008_mfb, 'REPONDU', daysAgo(2));
  await upsertConsultation(IDS.co_cu008_cdp, IDS.sh_cu008_cdp, 'REPONDU', daysAgo(1));

  // CU-012: DGID(EN_ATTENTE)
  await upsertConsultation(IDS.co_cu012_dgid, IDS.sh_cu012_dgid, 'EN_ATTENTE', daysFromNow(5));

  // CU-019: MJ(EN_ATTENTE)
  await upsertConsultation(IDS.co_cu019_mj, IDS.sh_cu019_mj, 'EN_ATTENTE', daysFromNow(7));

  console.log('  Consultations: 5 créées/mises à jour');

  // =========================================================================
  //  FEEDBACKS
  // =========================================================================
  const upsertFeedback = async (id: string, consultationId: string | null, stakeholderId: string, type: any, motivation: string, auteurNom: string, auteurInstitutionNom: string) => {
    await prisma.useCaseFeedback.upsert({
      where: { id },
      update: {},
      create: {
        id, consultationId, stakeholderId, type, motivation,
        auteurUserId: admin.id,
        auteurNom,
        auteurFonction: 'Directeur SI',
        auteurInstitutionNom,
        dateAvis: daysAgo(5),
      },
    });
  };

  // CU-008: Validation MFB
  await upsertFeedback(IDS.fb_cu008_mfb, IDS.co_cu008_mfb, IDS.sh_cu008_mfb,
    'VALIDATION',
    'Le MFB valide le principe de réconciliation automatique des recettes fiscales. Le rapprochement DGID/DGCPT est une priorité budgétaire.',
    'Amadou Ba', 'Ministère des Finances et du Budget');

  // CU-008: Réserve CDP
  await upsertFeedback(IDS.fb_cu008_cdp, IDS.co_cu008_cdp, IDS.sh_cu008_cdp,
    'RESERVE',
    'La CDP émet une réserve sur le périmètre des données transmises : les données nominatives des contribuables ne doivent pas transiter en clair. Un chiffrement bout-en-bout ou une pseudonymisation préalable est exigée conformément à la loi 2008-12 sur les données personnelles.',
    'Awa Ndiaye', 'Commission de Protection des Données Personnelles');

  // CU-019: Refus motivé MJ
  await upsertFeedback(IDS.fb_cu019_mj, IDS.co_cu019_mj, IDS.sh_cu019_mj,
    'REFUS_MOTIVE',
    'Le Ministère de la Justice refuse catégoriquement la mise à disposition du casier judiciaire dans une plateforme inter-administrations sans base légale spécifique. L\'article 777 du Code de procédure pénale encadre strictement les conditions de communication du B1, B2 et B3. Une modification législative est nécessaire avant toute exposition via PINS.',
    'Moussa Diop', 'Ministère de la Justice');

  console.log('  Feedbacks: 3 créés');

  // =========================================================================
  //  STATUS HISTORY (journal inaltérable)
  // =========================================================================
  const upsertHistory = async (id: string, casUsageId: string, statusFrom: any, statusTo: any, dateTransition: Date, auteurNom: string, auteurInstitution: string) => {
    const exists = await prisma.useCaseStatusHistory.findUnique({ where: { id } });
    if (!exists) {
      await prisma.useCaseStatusHistory.create({
        data: {
          id, casUsageId, statusFrom, statusTo,
          auteurUserId: admin.id,
          auteurNom, auteurInstitution,
          dateTransition,
          motif: `Transition ${statusFrom || 'création'} → ${statusTo}`,
        },
      });
    }
  };

  // CU-008: DECLARE → EN_CONSULTATION
  await upsertHistory(IDS.hist_cu008_1, cu008.id, null, 'DECLARE', daysAgo(15), 'Abdoulaye Fall', 'DGCPT');
  await upsertHistory(IDS.hist_cu008_2, cu008.id, 'DECLARE', 'EN_CONSULTATION', daysAgo(10), 'DU SENUM', 'SENUM SA');

  // CU-011: DECLARE → EN_CONSULTATION → EN_PRODUCTION_360
  await upsertHistory(IDS.hist_cu011_1, cu011.id, null, 'DECLARE', daysAgo(90), 'Mamadou Diallo', 'DGID');
  await upsertHistory(IDS.hist_cu011_2, cu011.id, 'DECLARE', 'EN_CONSULTATION', daysAgo(75), 'DU SENUM', 'SENUM SA');
  await upsertHistory(IDS.hist_cu011_3, cu011.id, 'EN_CONSULTATION', 'EN_PRODUCTION_360', daysAgo(30), 'DU SENUM', 'SENUM SA');

  // CU-012: DECLARE → EN_CONSULTATION
  await upsertHistory(IDS.hist_cu012_1, cu012.id, null, 'DECLARE', daysAgo(20), 'DSI DGPSN', 'DGPSN');
  await upsertHistory(IDS.hist_cu012_2, cu012.id, 'DECLARE', 'EN_CONSULTATION', daysAgo(12), 'DU SENUM', 'SENUM SA');

  // CU-019: DECLARE → EN_CONSULTATION
  await upsertHistory(IDS.hist_cu019_1, cu019.id, null, 'DECLARE', daysAgo(8), 'Mamadou Diallo', 'DGID');
  await upsertHistory(IDS.hist_cu019_2, cu019.id, 'DECLARE', 'EN_CONSULTATION', daysAgo(5), 'DU SENUM', 'SENUM SA');

  console.log('  StatusHistory: 9 entrées créées');

  // =========================================================================
  //  NOTIFICATIONS
  // =========================================================================
  const dgidUser = await prisma.user.findFirst({ where: { institution: { code: 'DGID' } } });
  if (dgidUser) {
    await prisma.notification.upsert({
      where: { id: IDS.notif_dgid_cu008 },
      update: {},
      create: {
        id: IDS.notif_dgid_cu008,
        userId: dgidUser.id,
        institutionId: dgid.id,
        type: 'CONSULTATION_OUVERTE',
        titre: 'Avis requis — Réconciliation fiscale DGID ↔ DGCPT',
        message: 'Votre institution est sollicitée comme FOURNISSEUR sur le cas d\'usage PINS-CU-008 "Réconciliation fiscale DGID ↔ DGCPT". Échéance de réponse : 3 jours.',
        lienUrl: `/admin/cas-usage/${cu008.id}`,
        refType: 'CAS_USAGE',
        refId: cu008.id,
        lu: false,
      },
    });
    console.log('  Notification DGID pour CU-008 créée');
  }

  // =========================================================================
  //  CAS USAGE ↔ REGISTRES (Addendum v1.1)
  // =========================================================================
  const upsertCUR = async (id: string, casUsageId: string, registreId: string, mode: any, champs: string[], criticite?: string) => {
    await prisma.casUsageRegistre.upsert({
      where: { id },
      update: {},
      create: {
        id, casUsageId, registreId, mode,
        champsConcernes: champs,
        criticite: criticite || 'MOYENNE',
        ajoutePar: admin.id,
      },
    });
  };

  // CU-008: NINEA (CONSOMME), SIGTAS (ALIMENTE)
  await upsertCUR(IDS.cur_cu008_ninea, cu008.id, ninea.id, 'CONSOMME', ['ninea', 'raisonSociale', 'adresseSiege'], 'CRITIQUE');
  if (sigtas) {
    await upsertCUR(IDS.cur_cu008_sigtas, cu008.id, sigtas.id, 'ALIMENTE', ['montantImpose', 'dateDeclaration', 'regimeFiscal']);
  }

  // CU-011: NINEA (CONSOMME)
  await upsertCUR(IDS.cur_cu011_ninea, cu011.id, ninea.id, 'CONSOMME', ['ninea', 'raisonSociale', 'statutFiscal']);

  // CU-012: NINEA (CONSOMME), RNU (CONSOMME)
  await upsertCUR(IDS.cur_cu012_ninea, cu012.id, ninea.id, 'CONSOMME', ['ninea', 'raisonSociale']);
  if (rnu) {
    await upsertCUR(IDS.cur_cu012_rnu, cu012.id, rnu.id, 'CONSOMME', ['referenceMenuage', 'scorePMT', 'regionResidence']);
  }

  // CU-019: on ne crée le rattachement casier que si le registre existe
  // (le registre Casier judiciaire n'est pas dans le seed standard)

  console.log('  CasUsageRegistre: liaisons créées');

  // =========================================================================
  //  STATS FINALES
  // =========================================================================
  const [nbSH, nbCO, nbFB, nbHist, nbNotif, nbCUR] = await Promise.all([
    prisma.useCaseStakeholder.count(),
    prisma.useCaseConsultation.count(),
    prisma.useCaseFeedback.count(),
    prisma.useCaseStatusHistory.count(),
    prisma.notification.count(),
    prisma.casUsageRegistre.count(),
  ]);

  console.log(`
=== SEED VUE 360° TERMINÉ ===
  Stakeholders:      ${nbSH}
  Consultations:     ${nbCO}
  Feedbacks:         ${nbFB}
  Status History:    ${nbHist}
  Notifications:     ${nbNotif}
  CasUsageRegistre:  ${nbCUR}
`);
}

main()
  .catch(e => { console.error('Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
