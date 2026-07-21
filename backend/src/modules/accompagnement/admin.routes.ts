import { FastifyInstance } from 'fastify';

export async function adminAccompagnementRoutes(app: FastifyInstance) {
  // GET / — Liste paginée avec filtres
  app.get('/', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, _reply: any) => {
    const { organisationId, casUsageMVPId, statut, type, page = '1', pageSize = '20', q } = req.query as any;
    const p = Math.max(parseInt(page) || 1, 1);
    const ps = Math.min(parseInt(pageSize) || 20, 100);

    const where: any = {};
    if (organisationId) where.organisationId = organisationId;
    if (casUsageMVPId) where.casUsageMVPId = casUsageMVPId;
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { casUsageMVP: { code: { contains: q, mode: 'insensitive' } } },
        { casUsageMVP: { titre: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      app.prisma.accompagnementAMO.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { updatedAt: 'desc' },
        include: {
          organisation: { select: { id: true, nom: true, type: true } },
          casUsageMVP: { select: { id: true, code: true, titre: true, statutVueSection: true, domaine: true } },
          _count: { select: { jalons: true, commentaires: true } },
        },
      }),
      app.prisma.accompagnementAMO.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps };
  });

  // POST / — Créer un accompagnement
  app.post('/', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { organisationId, casUsageMVPId, type, statut, scoreMaturite, description, dateDebut, dateFinPrevue } = req.body || {};
    if (!organisationId || !casUsageMVPId || !type) {
      return reply.status(400).send({ error: 'organisationId, casUsageMVPId, et type requis' });
    }

    const org = await app.prisma.organisation.findUnique({ where: { id: organisationId } });
    if (!org) return reply.status(400).send({ error: 'Organisation introuvable' });

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id: casUsageMVPId } });
    if (!cu) return reply.status(400).send({ error: 'Cas d\'usage introuvable' });

    const existing = await app.prisma.accompagnementAMO.findUnique({
      where: { organisationId_casUsageMVPId: { organisationId, casUsageMVPId } },
    });
    if (existing) return reply.status(409).send({ error: 'Cet accompagnement existe déjà' });

    try {
      const acc = await app.prisma.accompagnementAMO.create({
        data: {
          organisationId, casUsageMVPId, type,
          statut: statut || 'ACTIF',
          scoreMaturite: scoreMaturite ? Math.min(5, Math.max(1, parseInt(scoreMaturite))) : null,
          description, dateDebut: dateDebut ? new Date(dateDebut) : null,
          dateFinPrevue: dateFinPrevue ? new Date(dateFinPrevue) : null,
        },
        include: {
          organisation: { select: { id: true, nom: true, type: true } },
          casUsageMVP: { select: { id: true, code: true, titre: true } },
        },
      });

      try {
        await app.prisma.auditLog.create({
          data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'ACCOMPAGNEMENT_CREATE', resource: 'AccompagnementAMO', resourceId: acc.id, details: { organisationId, casUsageMVPId, type } },
        });
      } catch {}

      return reply.status(201).send(acc);
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(409).send({ error: 'Cet accompagnement existe déjà' });
      throw e;
    }
  });

  // GET /:id — Détail
  app.get('/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const acc = await app.prisma.accompagnementAMO.findUnique({
      where: { id: req.params.id },
      include: {
        organisation: { select: { id: true, nom: true, type: true } },
        casUsageMVP: { select: { id: true, code: true, titre: true, description: true, statutVueSection: true, statutImpl: true, domaine: true } },
        jalons: { orderBy: { ordre: 'asc' } },
        commentaires: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!acc) return reply.status(404).send({ error: 'Accompagnement introuvable' });
    return acc;
  });

  // PATCH /:id — Modifier un accompagnement
  app.patch('/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const acc = await app.prisma.accompagnementAMO.findUnique({ where: { id: req.params.id } });
    if (!acc) return reply.status(404).send({ error: 'Accompagnement introuvable' });

    const { type, statut, scoreMaturite, description, dateDebut, dateFinPrevue, dateFinEffective } = req.body || {};
    const data: any = {};
    if (type !== undefined) data.type = type;
    if (statut !== undefined) data.statut = statut;
    if (scoreMaturite !== undefined) data.scoreMaturite = scoreMaturite ? Math.min(5, Math.max(1, parseInt(scoreMaturite))) : null;
    if (description !== undefined) data.description = description;
    if (dateDebut !== undefined) data.dateDebut = dateDebut ? new Date(dateDebut) : null;
    if (dateFinPrevue !== undefined) data.dateFinPrevue = dateFinPrevue ? new Date(dateFinPrevue) : null;
    if (dateFinEffective !== undefined) data.dateFinEffective = dateFinEffective ? new Date(dateFinEffective) : null;

    const updated = await app.prisma.accompagnementAMO.update({
      where: { id: req.params.id },
      data,
      include: {
        organisation: { select: { id: true, nom: true, type: true } },
        casUsageMVP: { select: { id: true, code: true, titre: true } },
        _count: { select: { jalons: true, commentaires: true } },
      },
    });

    try {
      await app.prisma.auditLog.create({
        data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'ACCOMPAGNEMENT_UPDATE', resource: 'AccompagnementAMO', resourceId: updated.id, details: data },
      });
    } catch {}

    return updated;
  });

  // DELETE /:id — Soft delete
  app.delete('/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const acc = await app.prisma.accompagnementAMO.findUnique({ where: { id: req.params.id } });
    if (!acc) return reply.status(404).send({ error: 'Accompagnement introuvable' });

    await app.prisma.accompagnementAMO.update({
      where: { id: req.params.id },
      data: { statut: 'TERMINE', dateFinEffective: new Date() },
    });

    try {
      await app.prisma.auditLog.create({
        data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'ACCOMPAGNEMENT_DELETE', resource: 'AccompagnementAMO', resourceId: acc.id },
      });
    } catch {}

    return { success: true };
  });

  // POST /:id/jalons — Ajouter un jalon
  app.post('/:id/jalons', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const acc = await app.prisma.accompagnementAMO.findUnique({ where: { id: req.params.id } });
    if (!acc) return reply.status(404).send({ error: 'Accompagnement introuvable' });

    const { type, libelle, description, trimestre, statut, ordre, datePrevue } = req.body || {};
    if (!type || !libelle) return reply.status(400).send({ error: 'type et libelle requis' });

    const jalon = await app.prisma.jalonAccompagnement.create({
      data: {
        accompagnementId: req.params.id,
        type, libelle,
        description: description || null,
        trimestre: trimestre || null,
        statut: statut || 'PLANIFIE',
        ordre: ordre || 0,
        datePrevue: datePrevue ? new Date(datePrevue) : null,
      },
    });

    try {
      await app.prisma.auditLog.create({
        data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'JALON_CREATE', resource: 'JalonAccompagnement', resourceId: jalon.id, details: { accompagnementId: req.params.id, type, libelle } },
      });
    } catch {}

    return reply.status(201).send(jalon);
  });

  // PATCH /:accompagnementId/jalons/:jalonId
  app.patch('/:accompagnementId/jalons/:jalonId', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const jalon = await app.prisma.jalonAccompagnement.findFirst({
      where: { id: req.params.jalonId, accompagnementId: req.params.accompagnementId },
    });
    if (!jalon) return reply.status(404).send({ error: 'Jalon introuvable' });

    const { type, libelle, description, trimestre, statut, ordre, datePrevue, dateReelle } = req.body || {};
    const data: any = {};
    if (type !== undefined) data.type = type;
    if (libelle !== undefined) data.libelle = libelle;
    if (description !== undefined) data.description = description;
    if (trimestre !== undefined) data.trimestre = trimestre;
    if (statut !== undefined) data.statut = statut;
    if (ordre !== undefined) data.ordre = ordre;
    if (datePrevue !== undefined) data.datePrevue = datePrevue ? new Date(datePrevue) : null;
    if (dateReelle !== undefined) data.dateReelle = dateReelle ? new Date(dateReelle) : null;

    const updated = await app.prisma.jalonAccompagnement.update({ where: { id: jalon.id }, data });
    return updated;
  });

  // DELETE /:accompagnementId/jalons/:jalonId
  app.delete('/:accompagnementId/jalons/:jalonId', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const jalon = await app.prisma.jalonAccompagnement.findFirst({
      where: { id: req.params.jalonId, accompagnementId: req.params.accompagnementId },
    });
    if (!jalon) return reply.status(404).send({ error: 'Jalon introuvable' });

    await app.prisma.jalonAccompagnement.delete({ where: { id: jalon.id } });
    return { success: true };
  });
}
