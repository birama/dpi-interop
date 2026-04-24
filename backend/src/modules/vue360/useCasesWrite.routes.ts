/**
 * Routes Vue 360° — Endpoints d'écriture
 *
 * POST /api/use-cases                    — Création d'un cas d'usage
 * POST /api/use-cases/:id/transition     — Transition d'état
 * POST /api/use-cases/:id/stakeholders   — Ajout stakeholder / auto-saisine
 * POST /api/consultations/:id/feedback   — Soumission d'un avis formel
 * PATCH /api/feedback/:id/amend          — Amendement d'un avis
 * POST /api/consultations/:id/relance    — Relance stakeholder en retard
 * GET  /api/du/arbitrage                 — File d'arbitrage DU
 *
 * Rappels conventions :
 * - UseCaseStatus.EN_PRODUCTION_360 / SUSPENDU_360 (suffixés)
 * - institutionInitiatrice = CasUsageMVP.institutionSourceCode (string code)
 */

import { FastifyInstance } from 'fastify';

// Matrice de transitions autorisées : from → [to...]
const TRANSITION_MATRIX: Record<string, string[]> = {
  PROPOSE:              ['DECLARE', 'ARCHIVE', 'FUSIONNE'], // P8 : adoption -> DECLARE, sortie catalogue -> ARCHIVE/FUSIONNE
  DECLARE:              ['EN_CONSULTATION', 'SUSPENDU_360', 'RETIRE'],
  EN_CONSULTATION:      ['VALIDATION_CONJOINTE', 'SUSPENDU_360', 'RETIRE'],
  VALIDATION_CONJOINTE: ['QUALIFIE', 'EN_CONSULTATION', 'SUSPENDU_360', 'RETIRE'], // retour en consultation si besoin
  QUALIFIE:             ['PRIORISE', 'SUSPENDU_360', 'RETIRE'],
  PRIORISE:             ['FINANCEMENT_OK', 'SUSPENDU_360', 'RETIRE'],
  FINANCEMENT_OK:       ['CONVENTIONNE', 'SUSPENDU_360', 'RETIRE'],
  CONVENTIONNE:         ['EN_PRODUCTION_360', 'SUSPENDU_360', 'RETIRE'],
  EN_PRODUCTION_360:    ['SUSPENDU_360', 'RETIRE'],
  SUSPENDU_360:         ['EN_CONSULTATION', 'QUALIFIE', 'RETIRE'], // reprise possible
  RETIRE:               [], // état final
  ARCHIVE:              ['PROPOSE'],  // P8 : DU peut desarchiver (reconsiderer)
  FUSIONNE:             [],           // P8 : etat final, le CU cible prend le relais
};

// Transitions réservées à la DU (ADMIN)
const DU_ONLY_TARGETS = ['QUALIFIE', 'PRIORISE', 'FINANCEMENT_OK', 'SUSPENDU_360', 'RETIRE', 'ARCHIVE', 'FUSIONNE', 'PROPOSE'];

export async function useCasesWriteRoutes(app: FastifyInstance) {

  // =========================================================================
  // POST / — Création d'un cas d'usage (déclaration)
  // =========================================================================
  app.post('/', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { titre, resumeMetier, baseLegale, description, donneesEchangees,
            institutionCibleCode, axePrioritaire, impact, complexite,
            stakeholders, registresAssocies } = req.body as any;

    if (!titre) return reply.status(400).send({ error: 'Titre requis' });

    const user = req.user;
    // Résoudre le code de l'institution de l'utilisateur
    let institutionSourceCode: string | null = null;
    if (user.institutionId) {
      const inst = await app.prisma.institution.findUnique({
        where: { id: user.institutionId },
        select: { code: true },
      });
      institutionSourceCode = inst?.code || null;
    }

    // Générer un code PINS-CU-XXX
    const lastCU = await app.prisma.casUsageMVP.findFirst({ orderBy: { code: 'desc' }, where: { code: { startsWith: 'PINS-CU-' } } });
    const nextNum = lastCU ? parseInt(lastCU.code.replace('PINS-CU-', '')) + 1 : 1;
    const code = `PINS-CU-${String(nextNum).padStart(3, '0')}`;

    const cu = await app.prisma.casUsageMVP.create({
      data: {
        code, titre, description, resumeMetier, baseLegale,
        institutionSourceCode,
        institutionCibleCode: institutionCibleCode || null,
        donneesEchangees: donneesEchangees || null,
        axePrioritaire: axePrioritaire || null,
        impact: impact || 'MOYEN',
        complexite: complexite || 'MOYEN',
        statutImpl: 'IDENTIFIE',
        statutVueSection: 'DECLARE',
        dateIdentification: new Date(),
      },
    });

    // Stakeholder INITIATEUR automatique
    if (user.institutionId) {
      await app.prisma.useCaseStakeholder.create({
        data: {
          casUsageId: cu.id,
          institutionId: user.institutionId,
          role: 'INITIATEUR',
          ajoutePar: user.id,
        },
      });
    }

    // Resolution de l'institution user (partagee ensuite pour statusHistory)
    const userInst = user.institutionId
      ? await app.prisma.institution.findUnique({ where: { id: user.institutionId }, select: { nom: true } })
      : null;

    // Stakeholders additionnels + consultations automatiques (SLA 15j)
    const SLA_DAYS = 15;
    const dateEcheance = new Date(Date.now() + SLA_DAYS * 86400000);
    if (stakeholders && Array.isArray(stakeholders)) {
      for (const sh of stakeholders) {
        if (sh.institutionId && sh.role) {
          const createdSh = await app.prisma.useCaseStakeholder.upsert({
            where: { casUsageId_institutionId_role: { casUsageId: cu.id, institutionId: sh.institutionId, role: sh.role } },
            update: {},
            create: { casUsageId: cu.id, institutionId: sh.institutionId, role: sh.role, ajoutePar: user.id },
          });

          // Ouvrir une consultation automatiquement pour FOURNISSEUR et CONSOMMATEUR
          if (['FOURNISSEUR', 'CONSOMMATEUR'].includes(sh.role)) {
            try {
              await app.prisma.useCaseConsultation.create({
                data: {
                  stakeholderId: createdSh.id,
                  dateEcheance,
                  status: 'EN_ATTENTE',
                  ouvertePar: user.id,
                  motifSollicit: 'Consultation ouverte automatiquement a la declaration du cas d\'usage (SLA ' + SLA_DAYS + ' jours).',
                },
              });
            } catch {}
          }

          // Notification CONSULTATION_OUVERTE aux users de l'institution
          try {
            const instUsers = await app.prisma.user.findMany({
              where: { institutionId: sh.institutionId },
              select: { id: true },
            });
            for (const u of instUsers) {
              await app.prisma.notification.create({
                data: {
                  userId: u.id,
                  institutionId: sh.institutionId,
                  type: 'CONSULTATION_OUVERTE',
                  titre: `Sollicitation sur "${cu.titre}"`,
                  message: `Votre institution est sollicitee comme ${sh.role.replace('_', ' ').toLowerCase()} sur un cas d'usage. Echeance ${SLA_DAYS} jours.`,
                  lienUrl: '/mes-cas-usage',
                  refType: 'CAS_USAGE',
                  refId: cu.id,
                },
              });
            }
          } catch {}
        }
      }

      // Si on a des stakeholders FOURNISSEUR/CONSOMMATEUR, passer en EN_CONSULTATION
      const hasConsultableStakeholders = stakeholders.some((s: any) => ['FOURNISSEUR', 'CONSOMMATEUR'].includes(s.role));
      if (hasConsultableStakeholders) {
        await app.prisma.casUsageMVP.update({
          where: { id: cu.id },
          data: { statutVueSection: 'EN_CONSULTATION' },
        });
        // Transition supplementaire dans statusHistory
        await app.prisma.useCaseStatusHistory.create({
          data: {
            casUsageId: cu.id,
            statusFrom: 'DECLARE',
            statusTo: 'EN_CONSULTATION',
            auteurUserId: user.id,
            auteurNom: user.email,
            auteurInstitution: userInst?.nom || 'SENUM SA',
            motif: `Ouverture de consultation aupres de ${stakeholders.filter((s: any) => ['FOURNISSEUR', 'CONSOMMATEUR'].includes(s.role)).length} partie(s) prenante(s).`,
          },
        });
      }
    }

    // Status history : null → DECLARE
    await app.prisma.useCaseStatusHistory.create({
      data: {
        casUsageId: cu.id,
        statusFrom: null,
        statusTo: 'DECLARE',
        auteurUserId: user.id,
        auteurNom: user.email,
        auteurInstitution: userInst?.nom || 'SENUM SA',
        motif: 'Déclaration initiale du cas d\'usage',
      },
    });

    // Registres associés
    if (registresAssocies && Array.isArray(registresAssocies)) {
      for (const ra of registresAssocies) {
        if (ra.registreId && ra.mode) {
          await app.prisma.casUsageRegistre.upsert({
            where: { casUsageId_registreId_mode: { casUsageId: cu.id, registreId: ra.registreId, mode: ra.mode } },
            update: {},
            create: {
              casUsageId: cu.id, registreId: ra.registreId, mode: ra.mode,
              champsConcernes: ra.champsConcernes || null,
              criticite: ra.criticite || null,
              ajoutePar: user.id,
            },
          });
        }
      }
    }

    // Audit log
    try { await app.prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, userRole: user.role, action: 'CREATE', resource: 'use-case-360', resourceId: cu.id, resourceLabel: cu.code, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}

    return reply.status(201).send(cu);
  });

  // =========================================================================
  // POST /:id/transition — Transition d'état
  // =========================================================================
  app.post('/:id/transition', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { statusTo, motif, pieceJustif } = req.body as any;
    const user = req.user;

    if (!statusTo) return reply.status(400).send({ error: 'statusTo requis' });

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    const currentStatus = cu.statutVueSection;

    // Vérifier que la transition est légale
    const allowed = TRANSITION_MATRIX[currentStatus] || [];
    if (!allowed.includes(statusTo)) {
      return reply.status(400).send({ error: `Transition ${currentStatus} → ${statusTo} non autorisée`, allowedTransitions: allowed });
    }

    // Vérifier les droits
    if (DU_ONLY_TARGETS.includes(statusTo) && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: `Seule la DU peut effectuer la transition vers ${statusTo}` });
    }

    // Initiateur peut faire DECLARE→EN_CONSULTATION et EN_CONSULTATION→VALIDATION_CONJOINTE
    if (user.role !== 'ADMIN') {
      const isInitiator = user.institutionId
        ? await app.prisma.useCaseStakeholder.findFirst({
            where: { casUsageId: id, institutionId: user.institutionId, role: 'INITIATEUR', actif: true },
          })
        : null;

      const initiatorAllowed = [
        { from: 'DECLARE', to: 'EN_CONSULTATION' },
        { from: 'EN_CONSULTATION', to: 'VALIDATION_CONJOINTE' },
      ];

      const isAllowed = isInitiator && initiatorAllowed.some(t => t.from === currentStatus && t.to === statusTo);
      if (!isAllowed) {
        return reply.status(403).send({ error: 'Vous n\'êtes pas autorisé à effectuer cette transition' });
      }
    }

    // Résoudre auteur
    const userInst = user.institutionId
      ? await app.prisma.institution.findUnique({ where: { id: user.institutionId }, select: { nom: true } })
      : null;

    // Status history
    await app.prisma.useCaseStatusHistory.create({
      data: {
        casUsageId: id,
        statusFrom: currentStatus,
        statusTo,
        motif: motif || null,
        pieceJustif: pieceJustif || null,
        auteurUserId: user.id,
        auteurNom: user.email,
        auteurInstitution: userInst?.nom || 'SENUM SA',
      },
    });

    // Mettre à jour le statut
    const updated = await app.prisma.casUsageMVP.update({
      where: { id },
      data: { statutVueSection: statusTo },
    });

    // Notifications aux stakeholders
    const stakeholders = await app.prisma.useCaseStakeholder.findMany({
      where: { casUsageId: id, actif: true },
      include: { institution: { include: { users: { select: { id: true } } } } },
    });
    for (const sh of stakeholders) {
      for (const u of sh.institution.users) {
        try {
          await app.prisma.notification.create({
            data: {
              userId: u.id,
              institutionId: sh.institutionId,
              type: 'TRANSITION',
              titre: `Changement de statut — ${cu.titre}`,
              message: `Le cas d'usage est passé en "${statusTo.replace('_360', '').replace('_', ' ').toLowerCase()}".`,
              lienUrl: `/admin/cas-usage/${id}`,
              refType: 'CAS_USAGE',
              refId: id,
            },
          });
        } catch {}
      }
    }

    try { await app.prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, userRole: user.role, action: 'UPDATE', resource: 'use-case-360', resourceId: id, resourceLabel: `${cu.code}: ${currentStatus}→${statusTo}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}

    return reply.send(updated);
  });

  // =========================================================================
  // POST /:id/stakeholders — Ajout stakeholder / auto-saisine
  // =========================================================================
  app.post('/:id/stakeholders', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { institutionId, role, motifAutoSaisine, typeConcernement } = req.body as any;
    const user = req.user;

    if (!institutionId || !role) return reply.status(400).send({ error: 'institutionId et role requis' });

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    // Auto-saisine : l'utilisateur ajoute sa propre institution
    const autoSaisine = institutionId === user.institutionId;

    // Validation : motif obligatoire pour auto-saisine (min 50 car) + typologie
    if (autoSaisine) {
      if (!motifAutoSaisine || motifAutoSaisine.trim().length < 50) {
        return reply.status(400).send({ error: 'Un motif d\'au moins 50 caractères est requis pour l\'auto-saisine.' });
      }
      const validTypes = ['DONNEES_DETENUES', 'PROCESSUS_IMPACTE', 'GOUVERNANCE_TRANSVERSE', 'AUTRE'];
      if (!typeConcernement || !validTypes.includes(typeConcernement)) {
        return reply.status(400).send({ error: 'Un type de concernement valide est requis.' });
      }
    }

    // Vérifier unicité + anti-réinscription après éviction DU
    const existing = await app.prisma.useCaseStakeholder.findUnique({
      where: { casUsageId_institutionId_role: { casUsageId: id, institutionId, role } },
    });
    if (existing && existing.actif) {
      return reply.status(409).send({ error: 'Ce stakeholder existe déjà avec ce rôle' });
    }
    if (existing && existing.evictionParDU && autoSaisine) {
      return reply.status(409).send({
        error: 'Votre institution a été retirée de ce cas d\'usage par la Delivery Unit. Réinscription possible uniquement sur validation DU explicite.',
      });
    }

    const stakeholder = await app.prisma.useCaseStakeholder.upsert({
      where: { casUsageId_institutionId_role: { casUsageId: id, institutionId, role } },
      update: {
        actif: true,
        dateRetrait: null,
        motifRetrait: null,
        retireParUserId: null,
        // Si eviction DU, seul un non-auto-saisine peut passer (= DU/initiateur reintegre manuellement)
        ...(existing?.evictionParDU && !autoSaisine ? { evictionParDU: false, evictionMotif: null } : {}),
        ...(autoSaisine ? { autoSaisine: true, motifAutoSaisine, typeConcernement } : {}),
      },
      create: {
        casUsageId: id,
        institutionId,
        role,
        autoSaisine,
        motifAutoSaisine: autoSaisine ? motifAutoSaisine : null,
        typeConcernement: autoSaisine ? typeConcernement : null,
        ajoutePar: user.id,
      },
      include: { institution: { select: { id: true, code: true, nom: true } } },
    });

    try { await app.prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, userRole: user.role, action: 'CREATE', resource: 'stakeholder', resourceId: stakeholder.id, resourceLabel: `${cu.code}: ${stakeholder.institution.code} (${role})${autoSaisine ? ' [auto-saisine]' : ''}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}

    // Notification CONSULTATION_OUVERTE aux users de l'institution ajoutee
    // (sauf auto-saisine : l'utilisateur n'a pas besoin de se notifier lui-meme)
    if (!autoSaisine && role !== 'INITIATEUR') {
      const instUsers = await app.prisma.user.findMany({
        where: { institutionId },
        select: { id: true },
      });
      for (const u of instUsers) {
        try {
          await app.prisma.notification.create({
            data: {
              userId: u.id,
              institutionId,
              type: 'CONSULTATION_OUVERTE',
              titre: `Sollicitation sur "${cu.titre}"`,
              message: `Votre institution est sollicitee comme ${role.replace('_', ' ').toLowerCase()} sur un cas d'usage. Donnez votre avis depuis l'espace "Mes cas d'usage".`,
              lienUrl: '/mes-cas-usage',
              refType: 'CAS_USAGE',
              refId: cu.id,
            },
          });
        } catch {}
      }
    }

    // Notification a l'initiateur en cas d'auto-saisine (principe de transparence)
    if (autoSaisine && cu.institutionSourceCode) {
      try {
        const initInst = await app.prisma.institution.findUnique({
          where: { code: cu.institutionSourceCode },
          include: { users: { select: { id: true } } },
        });
        const motifAbrege = motifAutoSaisine.substring(0, 50) + (motifAutoSaisine.length > 50 ? '…' : '');
        if (initInst) {
          for (const u of initInst.users) {
            await app.prisma.notification.create({
              data: {
                userId: u.id,
                institutionId: initInst.id,
                type: 'CONSULTATION_OUVERTE',
                titre: `Nouvelle partie prenante — ${cu.titre}`,
                message: `${stakeholder.institution.code} s'est portée partie prenante — motif : ${motifAbrege}`,
                lienUrl: `/admin/cas-usage/${cu.id}`,
                refType: 'CAS_USAGE',
                refId: cu.id,
              },
            });
          }
        }
      } catch {}
    }

    return reply.status(201).send(stakeholder);
  });

  // =========================================================================
  // POST /:id/stakeholders/:sid/withdraw — Retrait spontane par l'institution
  // =========================================================================
  app.post('/:id/stakeholders/:sid/withdraw', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id, sid } = req.params;
    const { motif } = req.body as any;
    const user = req.user;

    const sh = await app.prisma.useCaseStakeholder.findUnique({
      where: { id: sid },
      include: { institution: { select: { id: true, code: true, nom: true } }, feedbacks: { select: { id: true }, take: 1 }, casUsage: { select: { id: true, code: true, titre: true, institutionSourceCode: true } } },
    });
    if (!sh || sh.casUsageId !== id) return reply.status(404).send({ error: 'Partie prenante non trouvée' });

    // Seul le proprietaire de l'institution peut se retirer, et seulement si auto-saisine
    if (!user.institutionId || user.institutionId !== sh.institutionId) {
      return reply.status(403).send({ error: 'Vous ne pouvez retirer que votre propre institution.' });
    }
    if (!sh.autoSaisine) {
      return reply.status(403).send({ error: 'Seules les parties prenantes auto-saisies peuvent se retirer. Les institutions désignées doivent émettre un avis formel.' });
    }
    if (sh.feedbacks.length > 0) {
      return reply.status(409).send({ error: 'Vous avez déjà émis un avis. Amendez-le plutôt que de vous retirer.' });
    }
    if (!sh.actif) {
      return reply.status(409).send({ error: 'Cette partie prenante est déjà retirée.' });
    }

    const updated = await app.prisma.useCaseStakeholder.update({
      where: { id: sid },
      data: {
        actif: false,
        dateRetrait: new Date(),
        motifRetrait: motif || null,
        retireParUserId: user.id,
      },
    });

    // Trace dans UseCaseStatusHistory (non inaltérable pour cette transition, mais journalisée)
    try {
      const userInst = await app.prisma.institution.findUnique({ where: { id: user.institutionId }, select: { nom: true } });
      await app.prisma.useCaseStatusHistory.create({
        data: {
          casUsageId: id,
          statusFrom: sh.casUsage ? undefined : null,
          statusTo: 'DECLARE',  // pas de transition de statut du CU, juste une trace informative
          motif: `Retrait volontaire — ${sh.institution.code}${motif ? ' — ' + motif.substring(0, 100) : ''}`,
          auteurUserId: user.id,
          auteurNom: user.email,
          auteurInstitution: userInst?.nom || sh.institution.nom,
        },
      });
    } catch {}

    // Notification a l'initiateur
    if (sh.casUsage?.institutionSourceCode) {
      try {
        const initInst = await app.prisma.institution.findUnique({
          where: { code: sh.casUsage.institutionSourceCode },
          include: { users: { select: { id: true } } },
        });
        if (initInst) {
          for (const u of initInst.users) {
            await app.prisma.notification.create({
              data: {
                userId: u.id,
                institutionId: initInst.id,
                type: 'STAKEHOLDER_WITHDRAWN',
                titre: `Retrait — ${sh.casUsage.titre}`,
                message: `${sh.institution.code} s'est retirée du cas d'usage${motif ? '. Motif : ' + motif.substring(0, 100) : '.'}`,
                lienUrl: `/admin/cas-usage/${id}`,
                refType: 'CAS_USAGE',
                refId: id,
              },
            });
          }
        }
      } catch {}
    }

    try { await app.prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, userRole: user.role, action: 'UPDATE', resource: 'stakeholder', resourceId: sid, resourceLabel: `retrait volontaire ${sh.institution.code}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}

    return reply.send(updated);
  });

  // =========================================================================
  // DELETE /:id/stakeholders/:sid — Eviction DU (motivee, anti-reinscription)
  // =========================================================================
  app.delete('/:id/stakeholders/:sid', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { id, sid } = req.params;
    const { motif } = req.body as any;
    const user = req.user;

    if (!motif || motif.trim().length < 50) {
      return reply.status(400).send({ error: 'Un motif d\'éviction d\'au moins 50 caractères est obligatoire (principe du contradictoire).' });
    }

    const sh = await app.prisma.useCaseStakeholder.findUnique({
      where: { id: sid },
      include: { institution: { select: { id: true, code: true, nom: true, users: { select: { id: true } } } }, casUsage: { select: { id: true, code: true, titre: true } } },
    });
    if (!sh || sh.casUsageId !== id) return reply.status(404).send({ error: 'Partie prenante non trouvée' });
    if (sh.role === 'INITIATEUR') {
      return reply.status(403).send({ error: 'L\'initiateur ne peut pas être évincé. Utilisez une transition de statut (SUSPENDU / RETIRE).' });
    }

    const updated = await app.prisma.useCaseStakeholder.update({
      where: { id: sid },
      data: {
        actif: false,
        dateRetrait: new Date(),
        evictionParDU: true,
        evictionMotif: motif,
        retireParUserId: user.id,
      },
    });

    // Notification motivee a l'institution evincee (principe contradictoire)
    for (const u of sh.institution.users) {
      try {
        await app.prisma.notification.create({
          data: {
            userId: u.id,
            institutionId: sh.institution.id,
            type: 'STAKEHOLDER_EVICTED',
            titre: `Éviction — ${sh.casUsage.titre}`,
            message: `La Delivery Unit a retiré votre institution de ce cas d'usage. Motif : ${motif.substring(0, 200)}${motif.length > 200 ? '…' : ''}`,
            lienUrl: `/admin/cas-usage/${id}`,
            refType: 'CAS_USAGE',
            refId: id,
          },
        });
      } catch {}
    }

    // Trace dans status history (inalterable)
    try {
      await app.prisma.useCaseStatusHistory.create({
        data: {
          casUsageId: id,
          statusFrom: undefined,
          statusTo: 'DECLARE',
          motif: `Éviction DU — ${sh.institution.code} — ${motif.substring(0, 150)}`,
          auteurUserId: user.id,
          auteurNom: user.email,
          auteurInstitution: 'SENUM SA',
        },
      });
    } catch {}

    try { await app.prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, userRole: user.role, action: 'DELETE', resource: 'stakeholder', resourceId: sid, resourceLabel: `éviction DU ${sh.institution.code}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}

    return reply.send(updated);
  });
}

// =========================================================================
// Routes consultations et feedbacks (préfixe séparé)
// =========================================================================
export async function consultationRoutes(app: FastifyInstance) {

  // POST /:id/feedback — Soumission d'un avis formel
  app.post('/:id/feedback', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id: consultationId } = req.params;
    const { type, motivation, piecesJointes } = req.body as any;
    const user = req.user;

    if (!type || !motivation) return reply.status(400).send({ error: 'type et motivation requis' });

    // Validation longueur motivation
    if (['RESERVE', 'REFUS_MOTIVE', 'QUESTION'].includes(type) && motivation.length < 50) {
      return reply.status(400).send({ error: `La motivation doit faire au moins 50 caractères pour un avis de type ${type} (actuellement ${motivation.length})` });
    }

    const consultation = await app.prisma.useCaseConsultation.findUnique({
      where: { id: consultationId },
      include: {
        stakeholder: {
          include: {
            casUsage: { select: { id: true, code: true, titre: true, institutionSourceCode: true } },
            institution: { select: { id: true, code: true, nom: true } },
          },
        },
      },
    });
    if (!consultation) return reply.status(404).send({ error: 'Consultation non trouvée' });

    // Vérifier que l'utilisateur appartient à l'institution du stakeholder
    if (user.institutionId !== consultation.stakeholder.institutionId) {
      return reply.status(403).send({ error: 'Vous ne pouvez donner un avis que pour votre institution' });
    }

    // Snapshots auteur
    const userInst = await app.prisma.institution.findUnique({ where: { id: user.institutionId! }, select: { nom: true } });

    const feedback = await app.prisma.useCaseFeedback.create({
      data: {
        consultationId,
        stakeholderId: consultation.stakeholderId,
        type,
        motivation,
        piecesJointes: piecesJointes || null,
        auteurUserId: user.id,
        auteurNom: user.email,
        auteurFonction: 'Point Focal',
        auteurInstitutionNom: userInst?.nom || '',
      },
    });

    // Mettre à jour la consultation → REPONDU
    await app.prisma.useCaseConsultation.update({
      where: { id: consultationId },
      data: { status: 'REPONDU' },
    });

    // Notification à l'initiateur
    const cu = consultation.stakeholder.casUsage;
    if (cu.institutionSourceCode) {
      const initInst = await app.prisma.institution.findUnique({
        where: { code: cu.institutionSourceCode },
        include: { users: { select: { id: true } } },
      });
      if (initInst) {
        for (const u of initInst.users) {
          try {
            await app.prisma.notification.create({
              data: {
                userId: u.id,
                institutionId: initInst.id,
                type: 'AVIS_RECU',
                titre: `Avis reçu — ${cu.titre}`,
                message: `${consultation.stakeholder.institution.code} a rendu un avis de type ${type.replace('_', ' ').toLowerCase()}.`,
                lienUrl: `/admin/cas-usage/${cu.id}`,
                refType: 'CAS_USAGE',
                refId: cu.id,
              },
            });
          } catch {}
        }
      }
    }

    try { await app.prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, userRole: user.role, action: 'CREATE', resource: 'feedback', resourceId: feedback.id, resourceLabel: `${cu.code}: ${type} par ${consultation.stakeholder.institution.code}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}

    return reply.status(201).send(feedback);
  });

  // POST /:id/relance — Relance d'un stakeholder en retard
  app.post('/:id/relance', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id: consultationId } = req.params;

    const consultation = await app.prisma.useCaseConsultation.findUnique({
      where: { id: consultationId },
      include: {
        stakeholder: {
          include: {
            casUsage: { select: { id: true, code: true, titre: true } },
            institution: { include: { users: { select: { id: true } } } },
          },
        },
      },
    });
    if (!consultation) return reply.status(404).send({ error: 'Consultation non trouvée' });

    const updated = await app.prisma.useCaseConsultation.update({
      where: { id: consultationId },
      data: {
        relances: { increment: 1 },
        derniereRelance: new Date(),
      },
    });

    // Notification au stakeholder relancé
    for (const u of consultation.stakeholder.institution.users) {
      try {
        await app.prisma.notification.create({
          data: {
            userId: u.id,
            institutionId: consultation.stakeholder.institutionId,
            type: 'RELANCE',
            titre: `Relance — ${consultation.stakeholder.casUsage.titre}`,
            message: `Vous êtes relancé pour donner votre avis (${updated.relances} relance${updated.relances > 1 ? 's' : ''}).`,
            lienUrl: `/admin/cas-usage/${consultation.stakeholder.casUsage.id}`,
            refType: 'CAS_USAGE',
            refId: consultation.stakeholder.casUsage.id,
          },
        });
      } catch {}
    }

    return reply.send(updated);
  });
}

// =========================================================================
// Routes feedback amendement (préfixe séparé)
// =========================================================================
export async function feedbackRoutes(app: FastifyInstance) {

  // PATCH /:id/amend — Amendement d'un avis (crée un nouvel enregistrement lié)
  app.patch('/:id/amend', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id: feedbackId } = req.params;
    const { type, motivation, piecesJointes } = req.body as any;
    const user = req.user;

    if (!motivation) return reply.status(400).send({ error: 'motivation requise pour un amendement' });

    const original = await app.prisma.useCaseFeedback.findUnique({
      where: { id: feedbackId },
      include: { stakeholder: { select: { id: true, institutionId: true } } },
    });
    if (!original) return reply.status(404).send({ error: 'Avis non trouvé' });

    if (user.institutionId !== original.stakeholder.institutionId) {
      return reply.status(403).send({ error: 'Vous ne pouvez amender que les avis de votre institution' });
    }

    const userInst = await app.prisma.institution.findUnique({ where: { id: user.institutionId! }, select: { nom: true } });

    // Créer un NOUVEL enregistrement lié (pas de modification de l'original)
    const amendment = await app.prisma.useCaseFeedback.create({
      data: {
        consultationId: original.consultationId,
        stakeholderId: original.stakeholderId,
        type: type || original.type,
        motivation,
        piecesJointes: piecesJointes || null,
        auteurUserId: user.id,
        auteurNom: user.email,
        auteurFonction: 'Point Focal',
        auteurInstitutionNom: userInst?.nom || '',
        amendeDe: feedbackId,
      },
    });

    return reply.status(201).send(amendment);
  });
}

// =========================================================================
// Route arbitrage DU (préfixe séparé)
// =========================================================================
export async function duArbitrageRoutes(app: FastifyInstance) {

  // GET / — File d'arbitrage DU
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {

    // Cas d'usage en consultation ou validation conjointe
    const ouverts = await app.prisma.casUsageMVP.findMany({
      where: {
        statutVueSection: { in: ['EN_CONSULTATION', 'VALIDATION_CONJOINTE'] },
      },
      include: {
        stakeholders360: {
          where: { actif: true },
          include: {
            institution: { select: { code: true, nom: true } },
            consultations: {
              include: { feedbacks: { select: { type: true } } },
              orderBy: { dateDemande: 'desc' },
            },
          },
        },
        phaseMVP: { select: { code: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Classifier
    const enRetard: any[] = [];
    const desaccords: any[] = [];
    const now = new Date();

    for (const cu of ouverts) {
      let hasRetard = false;
      let hasDesaccord = false;

      for (const sh of cu.stakeholders360) {
        for (const co of sh.consultations) {
          if (co.status === 'EN_ATTENTE' && new Date(co.dateEcheance) < now) {
            hasRetard = true;
          }
          for (const fb of co.feedbacks) {
            if (['RESERVE', 'REFUS_MOTIVE'].includes(fb.type)) {
              hasDesaccord = true;
            }
          }
        }
      }

      if (hasRetard) enRetard.push(cu);
      if (hasDesaccord) desaccords.push(cu);
    }

    // KPIs
    // declares = tous les CU en statut DECLARE (inclut le stock pre-existant seed)
    // declaresPipelineActif = CU en DECLARE ayant au moins une entree dans statusHistory
    // (= CU reellement touches par le pipeline applicatif Vue 360°, cree via POST /use-cases
    //  ou deja transites). Les CU du seed principal n'ont pas de statusHistory.
    const declaresPipelineActif = await app.prisma.casUsageMVP.count({
      where: {
        statutVueSection: 'DECLARE',
        statusHistory: { some: {} },
      },
    });

    const kpi = {
      declares: await app.prisma.casUsageMVP.count({ where: { statutVueSection: 'DECLARE' } }),
      declaresPipelineActif,
      enConsultation: await app.prisma.casUsageMVP.count({ where: { statutVueSection: 'EN_CONSULTATION' } }),
      desaccords: desaccords.length,
      qualifies: await app.prisma.casUsageMVP.count({ where: { statutVueSection: 'QUALIFIE' } }),
      enProduction: await app.prisma.casUsageMVP.count({ where: { statutVueSection: 'EN_PRODUCTION_360' } }),
    };

    return reply.send({
      ouverts: ouverts.length,
      enRetard,
      desaccords,
      kpi,
    });
  });
}
