/**
 * Routes Vue 360° — Vue personnelle (endpoints sectoriels)
 *
 * GET /api/me/use-cases/incoming   — Sollicitations en attente d'avis
 * GET /api/me/use-cases/outgoing   — Cas d'usage initiés par mon institution
 * GET /api/me/use-cases/involved   — Tous les cas qui me concernent
 * GET /api/me/use-cases/radar      — Radar sectoriel (cas qui matchent mon périmètre)
 *
 * Rappels conventions :
 * - institutionInitiatrice = CasUsageMVP.institutionSourceCode (string code)
 */

import { FastifyInstance } from 'fastify';

export async function useCasesMeRoutes(app: FastifyInstance) {
  // =========================================================================
  // GET /incoming — Sollicitations en attente d'avis de mon institution
  // =========================================================================
  app.get('/incoming', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const institutionId = req.user.institutionId;
    if (!institutionId) return reply.status(401).send({ error: 'Institution requise' });

    // Stakeholders de mon institution avec consultation EN_ATTENTE
    const stakeholders = await app.prisma.useCaseStakeholder.findMany({
      where: {
        institutionId,
        actif: true,
        role: { not: 'INITIATEUR' }, // L'initiateur ne se consulte pas lui-même
        consultations: {
          some: { status: 'EN_ATTENTE' },
        },
      },
      include: {
        casUsage: {
          select: {
            id: true, code: true, titre: true, resumeMetier: true,
            statutVueSection: true, institutionSourceCode: true, institutionCibleCode: true,
            impact: true, axePrioritaire: true,
          },
        },
        institution: { select: { id: true, code: true, nom: true } },
        consultations: {
          where: { status: 'EN_ATTENTE' },
          orderBy: { dateEcheance: 'asc' },
        },
      },
      orderBy: { dateAjout: 'asc' },
    });

    // Formatter pour le frontend
    const items = stakeholders.map(sh => ({
      casUsage: sh.casUsage,
      stakeholder: {
        id: sh.id,
        role: sh.role,
        institution: sh.institution,
      },
      consultation: sh.consultations[0] || null,
    }));

    return reply.send(items);
  });

  // =========================================================================
  // GET /outgoing — Cas d'usage initiés par mon institution
  // =========================================================================
  app.get('/outgoing', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const institutionId = req.user.institutionId;
    if (!institutionId) return reply.status(401).send({ error: 'Institution requise' });

    // Trouver le code de mon institution
    const institution = await app.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { code: true },
    });
    if (!institution) return reply.status(404).send({ error: 'Institution introuvable' });

    // Cas d'usage où mon institution est source (initiateur)
    const casUsages = await app.prisma.casUsageMVP.findMany({
      where: { institutionSourceCode: institution.code },
      include: {
        phaseMVP: { select: { code: true, nom: true } },
        stakeholders360: {
          where: { actif: true },
          include: {
            institution: { select: { id: true, code: true, nom: true } },
            consultations: {
              include: { feedbacks: { select: { id: true, type: true, dateAvis: true } } },
              orderBy: { dateDemande: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agréger les stats de consultation par CU
    const items = casUsages.map(cu => {
      const stats = { total: 0, enAttente: 0, repondu: 0, echu: 0, validation: 0, reserve: 0, refus: 0, question: 0 };
      for (const sh of cu.stakeholders360) {
        if (sh.role === 'INITIATEUR') continue; // skip l'initiateur
        for (const co of sh.consultations) {
          stats.total++;
          if (co.status === 'EN_ATTENTE') stats.enAttente++;
          else if (co.status === 'REPONDU') stats.repondu++;
          else if (co.status === 'ECHU') stats.echu++;
          for (const fb of co.feedbacks) {
            if (fb.type === 'VALIDATION') stats.validation++;
            else if (fb.type === 'RESERVE') stats.reserve++;
            else if (fb.type === 'REFUS_MOTIVE') stats.refus++;
            else if (fb.type === 'QUESTION') stats.question++;
          }
        }
      }
      return { casUsage: cu, consultationsStats: stats };
    });

    return reply.send(items);
  });

  // =========================================================================
  // GET /involved — Tous les cas d'usage qui me concernent (vue 360°)
  // =========================================================================
  app.get('/involved', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const institutionId = req.user.institutionId;
    if (!institutionId) return reply.status(401).send({ error: 'Institution requise' });

    const { role, status, search, limit = '50', cursor } = req.query as any;
    const take = Math.min(parseInt(limit) || 50, 100);

    // Trouver tous les cas d'usage où mon institution est stakeholder actif
    const where: any = {
      stakeholders360: { some: { institutionId, actif: true } },
    };

    // Filtres optionnels
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      where.statutVueSection = { in: statuses };
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { titre: { contains: search, mode: 'insensitive' } },
        { institutionSourceCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const paginationArgs: any = { take: take + 1 };
    if (cursor) {
      paginationArgs.cursor = { id: cursor };
      paginationArgs.skip = 1;
    }

    const casUsages = await app.prisma.casUsageMVP.findMany({
      where,
      include: {
        phaseMVP: { select: { code: true, nom: true } },
        stakeholders360: {
          where: { actif: true },
          include: {
            institution: { select: { id: true, code: true, nom: true } },
          },
        },
        financements: { select: { id: true, statut: true, programme: { select: { code: true, ptf: { select: { acronyme: true } } } } } },
      },
      orderBy: { updatedAt: 'desc' },
      ...paginationArgs,
    });

    const hasMore = casUsages.length > take;
    const items = hasMore ? casUsages.slice(0, take) : casUsages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Filtrage par rôle côté serveur si demandé
    let result = items;
    if (role) {
      const roles = Array.isArray(role) ? role : [role];
      result = items.filter((cu: any) =>
        cu.stakeholders360.some((sh: any) =>
          sh.institutionId === institutionId && roles.includes(sh.role)
        )
      );
    }

    // Annoter chaque CU avec le rôle de mon institution
    const annotated = result.map((cu: any) => {
      const myStakeholders = cu.stakeholders360.filter((sh: any) => sh.institutionId === institutionId);
      return {
        ...cu,
        myRoles: myStakeholders.map((sh: any) => sh.role),
      };
    });

    const total = await app.prisma.casUsageMVP.count({ where });

    return reply.send({ data: annotated, total, nextCursor, hasMore });
  });

  // =========================================================================
  // GET /radar — Radar sectoriel (cas qui matchent mon périmètre)
  // =========================================================================
  app.get('/radar', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const institutionId = req.user.institutionId;
    if (!institutionId) return reply.status(401).send({ error: 'Institution requise' });

    const institution = await app.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { code: true, nom: true },
    });
    if (!institution) return reply.status(404).send({ error: 'Institution introuvable' });

    // 1. Trouver les registres sur lesquels mon institution a des CasUsageRegistre
    const myRegistreLinks = await app.prisma.casUsageRegistre.findMany({
      where: {
        casUsage: {
          OR: [
            { institutionSourceCode: institution.code },
            { institutionCibleCode: institution.code },
          ],
        },
      },
      select: { registreId: true },
    });
    const myRegistreIds = [...new Set(myRegistreLinks.map(l => l.registreId))];

    // 2. Trouver les CU qui touchent les mêmes registres mais où je ne suis pas stakeholder
    const radarCandidates = myRegistreIds.length > 0
      ? await app.prisma.casUsageMVP.findMany({
          where: {
            registresAssocies: { some: { registreId: { in: myRegistreIds } } },
            stakeholders360: { none: { institutionId, actif: true } },
            statutVueSection: { notIn: ['RETIRE'] },
          },
          include: {
            phaseMVP: { select: { code: true } },
            registresAssocies: {
              where: { registreId: { in: myRegistreIds } },
              include: { registre: { select: { code: true, nom: true } } },
            },
            stakeholders360: {
              where: { actif: true },
              select: { institution: { select: { code: true, nom: true } }, role: true },
            },
          },
          take: 20,
        })
      : [];

    // 3. Chercher aussi par mention textuelle du code institution
    const mentionCandidates = await app.prisma.casUsageMVP.findMany({
      where: {
        OR: [
          { resumeMetier: { contains: institution.code, mode: 'insensitive' } },
          { description: { contains: institution.code, mode: 'insensitive' } },
          { donneesEchangees: { contains: institution.code, mode: 'insensitive' } },
        ],
        stakeholders360: { none: { institutionId, actif: true } },
        statutVueSection: { notIn: ['RETIRE'] },
        // Exclure ceux déjà trouvés par registre
        id: { notIn: radarCandidates.map(c => c.id) },
      },
      include: {
        phaseMVP: { select: { code: true } },
        stakeholders360: {
          where: { actif: true },
          select: { institution: { select: { code: true, nom: true } }, role: true },
        },
      },
      take: 10,
    });

    // 4. Fusionner et annoter avec raison du match
    const results: any[] = [];

    for (const cu of radarCandidates) {
      const matchRegistres = cu.registresAssocies.map((r: any) => r.registre.code);
      results.push({
        ...cu,
        matchReason: `Registre commun : ${matchRegistres.join(', ')}`,
        matchType: 'registre',
      });
    }

    for (const cu of mentionCandidates) {
      results.push({
        ...cu,
        matchReason: `Mention de ${institution.code} dans la description`,
        matchType: 'mention',
      });
    }

    return reply.send(results);
  });
}
