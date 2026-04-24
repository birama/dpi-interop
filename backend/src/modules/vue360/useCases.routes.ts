/**
 * Routes Vue 360° — Catalogue des cas d'usage
 *
 * GET /api/use-cases/catalog  — Liste paginée avec visibilité conditionnelle
 * GET /api/use-cases/:id      — Détail avec visibilité conditionnelle
 *
 * Rappels conventions :
 * - institutionInitiatrice = CasUsageMVP.institutionSourceCode (string code)
 * - UseCaseStatus.EN_PRODUCTION_360 / SUSPENDU_360 (suffixés)
 */

import { FastifyInstance } from 'fastify';
import { computeVisibility, UserContext } from '../../services/useCaseVisibility.js';
import { projectUseCase } from '../../services/useCaseProjection.js';

// Include complet pour les requêtes détaillées
const FULL_INCLUDE = {
  phaseMVP: true,
  financements: { include: { programme: { include: { ptf: true } } } },
  stakeholders360: {
    include: {
      institution: { select: { id: true, code: true, nom: true, ministere: true } },
      consultations: {
        include: {
          feedbacks: {
            orderBy: { dateAvis: 'desc' as const },
          },
        },
        orderBy: { dateDemande: 'desc' as const },
      },
      feedbacks: {
        orderBy: { dateAvis: 'desc' as const },
      },
    },
    orderBy: { dateAjout: 'asc' as const },
  },
  statusHistory: {
    orderBy: { dateTransition: 'desc' as const },
  },
  registresAssocies: {
    include: {
      registre: { select: { id: true, code: true, nom: true, domaine: true, institutionCode: true, institutionNom: true } },
    },
  },
};

// Include léger pour le catalogue (METADATA)
const CATALOG_INCLUDE = {
  phaseMVP: { select: { id: true, code: true, nom: true } },
  stakeholders360: {
    where: { actif: true },
    select: {
      id: true,
      institutionId: true,
      role: true,
      actif: true,
      institution: { select: { id: true, code: true, nom: true } },
    },
  },
};

export async function useCasesRoutes(app: FastifyInstance) {
  // =========================================================================
  // GET /catalog — Liste paginée de tous les cas d'usage
  // =========================================================================
  app.get('/catalog', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { limit = '20', cursor, status, search, typologie, includePropose } = req.query as any;
    const take = Math.min(parseInt(limit) || 20, 100);

    // Resoudre le code de l'institution de l'utilisateur (pour reconnaissance initiateur robuste)
    let userInstitutionCode: string | undefined;
    if (req.user.institutionId) {
      const inst = await app.prisma.institution.findUnique({
        where: { id: req.user.institutionId },
        select: { code: true },
      });
      userInstitutionCode = inst?.code;
    }

    const user: UserContext = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      institutionId: req.user.institutionId,
      institutionCode: userInstitutionCode,
    };

    // Build where clause
    // Par defaut : exclure le catalogue (PROPOSE, ARCHIVE, FUSIONNE) — reserve a /catalogue/propositions
    const where: any = {};
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      where.statutVueSection = { in: statuses };
    } else if (includePropose !== 'true') {
      where.statutVueSection = { notIn: ['PROPOSE', 'ARCHIVE', 'FUSIONNE'] };
    }
    if (typologie && ['METIER', 'TECHNIQUE'].includes(typologie)) {
      where.typologie = typologie;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { titre: { contains: search, mode: 'insensitive' } },
        { resumeMetier: { contains: search, mode: 'insensitive' } },
        { institutionSourceCode: { contains: search, mode: 'insensitive' } },
        { institutionCibleCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination par curseur
    const paginationArgs: any = { take: take + 1 }; // +1 pour savoir s'il y a une page suivante
    if (cursor) {
      paginationArgs.cursor = { id: cursor };
      paginationArgs.skip = 1; // skip the cursor item
    }

    const casUsages = await app.prisma.casUsageMVP.findMany({
      where,
      include: CATALOG_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
      ...paginationArgs,
    });

    // Total (sans pagination, pour les compteurs dashboard)
    const total = await app.prisma.casUsageMVP.count({ where });

    // Déterminer s'il y a une page suivante
    const hasMore = casUsages.length > take;
    const items = hasMore ? casUsages.slice(0, take) : casUsages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Appliquer la projection de visibilité
    const projected = items.map((cu: any) => {
      const visibility = computeVisibility(user, cu.stakeholders360 || [], cu.institutionSourceCode);
      if (visibility.level === 'NONE') return null;
      return projectUseCase(cu, visibility.level);
    }).filter(Boolean);

    return reply.send({
      data: projected,
      total,
      nextCursor,
      hasMore,
    });
  });

  // =========================================================================
  // GET /:id — Détail d'un cas d'usage avec visibilité conditionnelle
  // =========================================================================
  app.get('/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;

    // Resoudre le code institution de l'utilisateur (pour reconnaissance initiateur robuste)
    let userInstitutionCode: string | undefined;
    if (req.user.institutionId) {
      const inst = await app.prisma.institution.findUnique({
        where: { id: req.user.institutionId },
        select: { code: true },
      });
      userInstitutionCode = inst?.code;
    }

    const user: UserContext = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      institutionId: req.user.institutionId,
      institutionCode: userInstitutionCode,
    };

    const casUsage = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });

    if (!casUsage) {
      return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });
    }

    // Calculer la visibilité (robuste : reconnaît l'initiateur via institutionSourceCode)
    const visibility = computeVisibility(user, casUsage.stakeholders360 || [], casUsage.institutionSourceCode);

    // NONE → 404 (pas 403, pour ne pas révéler l'existence)
    if (visibility.level === 'NONE') {
      return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });
    }

    // Enrichir avec les institutions source/cible résolues
    const [institutionSource, institutionCible] = await Promise.all([
      casUsage.institutionSourceCode
        ? app.prisma.institution.findUnique({
            where: { code: casUsage.institutionSourceCode },
            select: { id: true, code: true, nom: true, ministere: true },
          })
        : null,
      casUsage.institutionCibleCode
        ? app.prisma.institution.findUnique({
            where: { code: casUsage.institutionCibleCode },
            select: { id: true, code: true, nom: true, ministere: true },
          })
        : null,
    ]);

    // Charger les conventions entre source et cible (si DETAILED ou FULL)
    let conventions: any[] = [];
    if (visibility.level !== 'METADATA' && institutionSource && institutionCible) {
      conventions = await app.prisma.convention.findMany({
        where: {
          OR: [
            { institutionAId: institutionSource.id, institutionBId: institutionCible.id },
            { institutionAId: institutionCible.id, institutionBId: institutionSource.id },
          ],
        },
        include: {
          institutionA: { select: { code: true, nom: true } },
          institutionB: { select: { code: true, nom: true } },
        },
      });
    }

    // Charger X-Road readiness (si DETAILED ou FULL)
    let xroadSource = null;
    let xroadCible = null;
    if (visibility.level !== 'METADATA') {
      [xroadSource, xroadCible] = await Promise.all([
        institutionSource
          ? app.prisma.xRoadReadiness.findUnique({
              where: { institutionId: institutionSource.id },
              include: { institution: { select: { code: true, nom: true } } },
            })
          : null,
        institutionCible
          ? app.prisma.xRoadReadiness.findUnique({
              where: { institutionId: institutionCible.id },
              include: { institution: { select: { code: true, nom: true } } },
            })
          : null,
      ]);
    }

    // Projeter selon la visibilité
    const projected = projectUseCase(casUsage, visibility.level);

    return reply.send({
      ...projected,
      institutionSource,
      institutionCible,
      conventions: visibility.level !== 'METADATA' ? conventions : undefined,
      xroadSource: visibility.level !== 'METADATA' ? xroadSource : undefined,
      xroadCible: visibility.level !== 'METADATA' ? xroadCible : undefined,
      _visibility: visibility.level,
    });
  });

  // =========================================================================
  // GET /:id/relations — Relations de service metier <-> technique (P9)
  // =========================================================================
  app.get('/:id/relations', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      select: { id: true, typologie: true },
    });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouve' });

    if (cu.typologie === 'METIER') {
      const relations = await app.prisma.relationCasUsage.findMany({
        where: { casUsageMetierId: id },
        include: {
          casUsageTechnique: {
            select: {
              id: true, code: true, titre: true, statutVueSection: true,
              institutionSourceCode: true,
            },
          },
        },
        orderBy: { ordre: 'asc' },
      });
      return reply.send({ typologie: 'METIER', relations });
    }
    // TECHNIQUE : CU metier servis
    const relations = await app.prisma.relationCasUsage.findMany({
      where: { casUsageTechniqueId: id },
      include: {
        casUsageMetier: {
          select: {
            id: true, code: true, titre: true, statutVueSection: true,
            institutionSourceCode: true,
          },
        },
      },
    });
    // Calcul criticite = nombre de CU metier servis
    let criticite: 'SPECIFIQUE' | 'MUTUALISE' | 'CRITIQUE' | 'HYPER_CRITIQUE' = 'SPECIFIQUE';
    if (relations.length >= 10) criticite = 'HYPER_CRITIQUE';
    else if (relations.length >= 5) criticite = 'CRITIQUE';
    else if (relations.length >= 2) criticite = 'MUTUALISE';
    return reply.send({ typologie: 'TECHNIQUE', relations, criticite, nbConsommateurs: relations.length });
  });

  // =========================================================================
  // POST /:id/relations — Ajout d'une relation metier -> technique (P9)
  // =========================================================================
  app.post('/:id/relations', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { casUsageTechniqueId, ordre, obligatoire, commentaire } = req.body as any;
    const user = req.user;

    if (!casUsageTechniqueId) return reply.status(400).send({ error: 'casUsageTechniqueId requis' });

    const [metier, technique] = await Promise.all([
      app.prisma.casUsageMVP.findUnique({
        where: { id },
        include: { stakeholders360: { where: { role: 'INITIATEUR', actif: true }, select: { institutionId: true } } },
      }),
      app.prisma.casUsageMVP.findUnique({
        where: { id: casUsageTechniqueId },
        select: { id: true, typologie: true },
      }),
    ]);
    if (!metier) return reply.status(404).send({ error: 'Cas d\'usage metier non trouve' });
    if (!technique) return reply.status(404).send({ error: 'Cas d\'usage technique non trouve' });
    if (metier.typologie !== 'METIER') {
      return reply.status(400).send({ error: 'Seul un cas d\'usage METIER peut mobiliser des services techniques' });
    }
    if (technique.typologie !== 'TECHNIQUE') {
      return reply.status(400).send({ error: 'La cible d\'une relation doit etre de typologie TECHNIQUE' });
    }

    // Autorisation : DU ou institution initiatrice du CU metier
    const isAdmin = user.role === 'ADMIN';
    const isInitiateur = metier.stakeholders360.some((s: any) => s.institutionId === user.institutionId);
    if (!isAdmin && !isInitiateur) {
      return reply.status(403).send({ error: 'Seule l\'institution initiatrice ou la DU peut ajouter une relation' });
    }

    const relation = await app.prisma.relationCasUsage.create({
      data: {
        casUsageMetierId: id,
        casUsageTechniqueId,
        ordre: ordre || null,
        obligatoire: obligatoire !== false,
        commentaire: commentaire || null,
        createdBy: user.id,
      },
      include: {
        casUsageTechnique: { select: { id: true, code: true, titre: true, institutionSourceCode: true } },
      },
    });
    return reply.status(201).send(relation);
  });

  // =========================================================================
  // DELETE /:id/relations/:relationId (P9)
  // =========================================================================
  app.delete('/:id/relations/:relationId', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id, relationId } = req.params;
    const user = req.user;

    const [rel, metier] = await Promise.all([
      app.prisma.relationCasUsage.findUnique({ where: { id: relationId } }),
      app.prisma.casUsageMVP.findUnique({
        where: { id },
        include: { stakeholders360: { where: { role: 'INITIATEUR', actif: true }, select: { institutionId: true } } },
      }),
    ]);
    if (!rel || rel.casUsageMetierId !== id) return reply.status(404).send({ error: 'Relation non trouvee' });
    if (!metier) return reply.status(404).send({ error: 'Cas d\'usage non trouve' });

    const isAdmin = user.role === 'ADMIN';
    const isInitiateur = metier.stakeholders360.some((s: any) => s.institutionId === user.institutionId);
    if (!isAdmin && !isInitiateur) {
      return reply.status(403).send({ error: 'Operation reservee a l\'institution initiatrice ou a la DU' });
    }

    await app.prisma.relationCasUsage.delete({ where: { id: relationId } });
    return reply.send({ ok: true });
  });

  // =========================================================================
  // PATCH /:id/typologie (DU only) — Reclassement typologique motive (P9)
  // =========================================================================
  app.patch('/:id/typologie', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { typologie, motif } = req.body as any;
    const user = req.user;

    if (!typologie || !['METIER', 'TECHNIQUE'].includes(typologie)) {
      return reply.status(400).send({ error: 'Typologie requise (METIER ou TECHNIQUE)' });
    }
    if (!motif || motif.trim().length < 50) {
      return reply.status(400).send({ error: 'Motif du reclassement requis, min 50 caracteres' });
    }

    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      select: {
        id: true, code: true, typologie: true, reclassementsTypologie: true,
        stakeholders360: { where: { role: 'INITIATEUR', actif: true }, select: { institutionId: true } },
      },
    });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouve' });
    if (cu.typologie === typologie) {
      return reply.status(409).send({ error: 'Le cas d\'usage est deja dans cette typologie' });
    }

    // Historiser dans reclassementsTypologie (JSON append-only)
    const prevLog = Array.isArray(cu.reclassementsTypologie) ? cu.reclassementsTypologie : [];
    const newLog = [
      ...prevLog,
      {
        from: cu.typologie,
        to: typologie,
        motif: motif.trim(),
        auteurUserId: user.id,
        auteurNom: user.email,
        date: new Date().toISOString(),
      },
    ];

    await app.prisma.casUsageMVP.update({
      where: { id },
      data: { typologie, reclassementsTypologie: newLog },
    });

    // Notifier l'initiateur
    const initInstId = cu.stakeholders360[0]?.institutionId;
    if (initInstId) {
      const users = await app.prisma.user.findMany({ where: { institutionId: initInstId }, select: { id: true } });
      for (const u of users) {
        try {
          await app.prisma.notification.create({
            data: {
              userId: u.id,
              institutionId: initInstId,
              type: 'ARBITRAGE',
              titre: `Reclassement typologique — ${cu.code}`,
              message: `La Delivery Unit a reclasse ce cas d'usage en ${typologie}. Motif : ${motif.substring(0, 150)}`,
              lienUrl: `/admin/cas-usage/${id}`,
              refType: 'CAS_USAGE',
              refId: id,
            },
          });
        } catch {}
      }
    }
    return reply.send({ ok: true, typologie });
  });
}
