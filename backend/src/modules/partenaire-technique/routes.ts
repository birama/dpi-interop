/**
 * Routes Partenaire Technique (AMO/prestataire) — P13-CONC
 *
 * Espace dédié : /partenaire-tech/*
 *   GET /partenaire-tech/dashboard    — KPIs catalogue
 *   GET /partenaire-tech/catalogue    — Tous les cas (pas de filtre aFinancer)
 *   GET /partenaire-tech/cas/:id      — Fiche détail (lecture seule, sans notes/observations)
 *   GET /partenaire-tech/profil       — Infos organisation
 *
 * Admin Organisations : /admin/organisations
 *   GET    /                         — Liste avec filtres
 *   GET    /:id                      — Détail
 *   POST   /                         — Création (ADMIN)
 *   PATCH  /:id                      — Modification (ADMIN)
 */

import { FastifyInstance } from 'fastify';

// ============================================================================
// PARTENAIRE TECHNIQUE — Espace AMO
// ============================================================================
export async function partenaireTechniqueRoutes(app: FastifyInstance) {

  // GET /dashboard — KPIs catalogue
  app.get('/dashboard', { onRequest: [app.authenticatePartenaireTechnique], config: { access: ['PARTENAIRE_TECHNIQUE'] } }, async (_req: any, _reply: any) => {
    const totalCas = await app.prisma.casUsageMVP.count();
    const parDomaine = await app.prisma.casUsageMVP.groupBy({
      by: ['domaine'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const parStatut = await app.prisma.casUsageMVP.groupBy({
      by: ['statutVueSection'],
      _count: { id: true },
    });
    const casRecents = await app.prisma.casUsageMVP.count({
      where: { updatedAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
    });

    return {
      kpis: {
        totalCas,
        casRecents7j: casRecents,
        domainesCouverts: parDomaine.filter(d => d.domaine).length,
      },
      parDomaine: parDomaine.filter(d => d.domaine).map(d => ({ domaine: d.domaine, count: d._count.id })),
      parStatut: parStatut.map(s => ({ statut: s.statutVueSection, count: s._count.id })),
    };
  });

  // GET /catalogue — Tous les cas (pas de filtre aFinancer)
  app.get('/catalogue', { onRequest: [app.authenticatePartenaireTechnique], config: { access: ['PARTENAIRE_TECHNIQUE'] } }, async (req: any, _reply: any) => {
    const { q, domaine, typologie, statut, page = '1', pageSize = '20' } = req.query as any;
    const p = Math.max(parseInt(page) || 1, 1);
    const ps = Math.min(parseInt(pageSize) || 20, 100);

    const where: any = {};
    if (domaine) where.domaine = domaine;
    if (typologie && ['METIER', 'TECHNIQUE'].includes(typologie)) where.typologie = typologie;
    if (statut) where.statutVueSection = statut;
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { titre: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      app.prisma.casUsageMVP.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, code: true, titre: true, domaine: true, typologie: true,
          statutVueSection: true, statutImpl: true, axePrioritaire: true,
          description: true, resumeMetier: true,
          createdAt: true, updatedAt: true,
        },
      }),
      app.prisma.casUsageMVP.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps };
  });

  // GET /cas/:id — Fiche détail (lecture seule, sans notes/observations/statusHistory)
  app.get('/cas/:id', { onRequest: [app.authenticatePartenaireTechnique], config: { access: ['PARTENAIRE_TECHNIQUE'] } }, async (req: any, reply: any) => {
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id: req.params.id },
      include: {
        stakeholders360: { include: { institution: true } },
        registresAssocies: { include: { registre: true } },
        relationsMetier: { include: { casUsageTechnique: true } },
        relationsTechnique: { include: { casUsageMetier: true } },
        institutionsPressenties: { include: { institution: true } },
      },
    });

    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    // Masquer les champs sensibles pour le partenaire technique
    const { notes, observations, timeline, statusHistory, ...safe } = cu as any;
    return safe;
  });

  // GET /profil — Infos de l'organisation connectée
  app.get('/profil', { onRequest: [app.authenticatePartenaireTechnique], config: { access: ['PARTENAIRE_TECHNIQUE'] } }, async (req: any, reply: any) => {
    const org = await app.prisma.organisation.findUnique({
      where: { id: req.user.organisationId },
      include: { _count: { select: { users: true } } },
    });
    if (!org) return reply.status(404).send({ error: 'Organisation non trouvée' });
    return org;
  });
}

// ============================================================================
// ADMIN — CRUD Organisations
// ============================================================================
export async function adminOrganisationRoutes(app: FastifyInstance) {

  // GET / — Liste
  app.get('/', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, _reply: any) => {
    const { type, statut, q } = req.query as any;
    const where: any = {};
    if (type) where.type = type;
    if (statut) where.statut = statut;
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { nom: { contains: q, mode: 'insensitive' } },
      ];
    }

    const data = await app.prisma.organisation.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { _count: { select: { users: true } } },
    });

    return { data, total: data.length };
  });

  // GET /:id — Détail
  app.get('/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const org = await app.prisma.organisation.findUnique({
      where: { id: req.params.id },
      include: { users: { select: { id: true, email: true, lastLoginAt: true } } },
    });
    if (!org) return reply.status(404).send({ error: 'Organisation non trouvée' });
    return org;
  });

  // POST / — Création
  app.post('/', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id, nom, type, secteurAccompagnement, dateRattachement, dateFinPrevue } = req.body as any;
    if (!id || !nom || !type) {
      return reply.status(400).send({ error: 'id (code), nom, et type requis' });
    }

    const existing = await app.prisma.organisation.findUnique({ where: { id } });
    if (existing) return reply.status(409).send({ error: 'Une organisation avec ce code existe déjà' });

    const org = await app.prisma.organisation.create({
      data: {
        id, nom, type,
        secteurAccompagnement: secteurAccompagnement || null,
        dateRattachement: dateRattachement ? new Date(dateRattachement) : null,
        dateFinPrevue: dateFinPrevue ? new Date(dateFinPrevue) : null,
      },
    });

    await app.prisma.auditLog.create({
      data: {
        userId: req.user.id, userEmail: req.user.email, userRole: req.user.role,
        action: 'ORGANISATION_CREATE', resource: 'Organisation', resourceId: org.id,
        details: { nom, type },
      },
    });

    return reply.status(201).send(org);
  });

  // PATCH /:id — Modification
  app.patch('/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { nom, type, secteurAccompagnement, dateRattachement, dateFinPrevue, statut } = req.body as any;

    const existing = await app.prisma.organisation.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Organisation non trouvée' });

    const org = await app.prisma.organisation.update({
      where: { id: req.params.id },
      data: {
        ...(nom !== undefined && { nom }),
        ...(type !== undefined && { type }),
        ...(secteurAccompagnement !== undefined && { secteurAccompagnement }),
        ...(dateRattachement !== undefined && { dateRattachement: dateRattachement ? new Date(dateRattachement) : null }),
        ...(dateFinPrevue !== undefined && { dateFinPrevue: dateFinPrevue ? new Date(dateFinPrevue) : null }),
        ...(statut !== undefined && { statut }),
      },
    });

    return org;
  });
}
