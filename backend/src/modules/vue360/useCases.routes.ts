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
    const { limit = '20', cursor, status, search } = req.query as any;
    const take = Math.min(parseInt(limit) || 20, 100);

    const user: UserContext = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      institutionId: req.user.institutionId,
    };

    // Build where clause
    const where: any = {};
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      where.statutVueSection = { in: statuses };
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
      const visibility = computeVisibility(user, cu.stakeholders360 || []);
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

    const user: UserContext = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      institutionId: req.user.institutionId,
    };

    const casUsage = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });

    if (!casUsage) {
      return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });
    }

    // Calculer la visibilité
    const visibility = computeVisibility(user, casUsage.stakeholders360 || []);

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
}
