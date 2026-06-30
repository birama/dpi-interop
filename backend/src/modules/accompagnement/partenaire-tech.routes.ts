import { FastifyInstance } from 'fastify';

export async function partenaireTechAccompagnementRoutes(app: FastifyInstance) {
  // GET / — Liste des accompagnements de l'org du partenaire connecté
  app.get('/', { onRequest: [app.authenticatePartenaireTechnique] }, async (req: any, _reply: any) => {
    const { statut, type, page = '1', pageSize = '20', q } = req.query as any;
    const p = Math.max(parseInt(page) || 1, 1);
    const ps = Math.min(parseInt(pageSize) || 20, 100);
    const organisationId = req.user.organisationId;

    const where: any = { organisationId };
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
          casUsageMVP: { select: { id: true, code: true, titre: true, statutVueSection: true, statutImpl: true, domaine: true } },
          _count: { select: { jalons: true, commentaires: true } },
        },
      }),
      app.prisma.accompagnementAMO.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps };
  });

  // GET /:id — Détail (vérifie proprio)
  app.get('/:id', { onRequest: [app.authenticatePartenaireTechnique] }, async (req: any, reply: any) => {
    const acc = await app.prisma.accompagnementAMO.findUnique({
      where: { id: req.params.id },
      include: {
        organisation: { select: { id: true, nom: true, type: true } },
        casUsageMVP: { select: { id: true, code: true, titre: true, description: true, statutVueSection: true, statutImpl: true, domaine: true, resumeMetier: true } },
        jalons: { orderBy: { ordre: 'asc' } },
        commentaires: {
          where: { visibilite: { in: ['DU_ET_AMO', 'AMO_ONLY'] } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!acc) return reply.status(404).send({ error: 'Accompagnement introuvable' });

    if (acc.organisationId !== req.user.organisationId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Accès non autorisé à cet accompagnement' });
    }

    return acc;
  });

  // POST /:id/commentaires — Ajouter un commentaire
  app.post('/:id/commentaires', { onRequest: [app.authenticatePartenaireTechnique] }, async (req: any, reply: any) => {
    const acc = await app.prisma.accompagnementAMO.findUnique({ where: { id: req.params.id } });
    if (!acc) return reply.status(404).send({ error: 'Accompagnement introuvable' });

    if (acc.organisationId !== req.user.organisationId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Accès non autorisé à cet accompagnement' });
    }

    const { contenu, visibilite } = req.body || {};
    if (!contenu) return reply.status(400).send({ error: 'contenu requis' });

    if (visibilite === 'DU_ONLY') {
      return reply.status(400).send({ error: 'Visibilité DU_ONLY non autorisée pour un partenaire technique' });
    }

    const commentaire = await app.prisma.commentaireAMO.create({
      data: {
        accompagnementId: req.params.id,
        contenu,
        visibilite: visibilite || 'DU_ET_AMO',
        createdBy: req.user.email,
      },
    });

    return reply.status(201).send(commentaire);
  });

  // PATCH /commentaires/:id — Modifier son propre commentaire
  app.patch('/commentaires/:id', { onRequest: [app.authenticatePartenaireTechnique] }, async (req: any, reply: any) => {
    const commentaire = await app.prisma.commentaireAMO.findUnique({
      where: { id: req.params.id },
      include: { accompagnement: { select: { organisationId: true } } },
    });
    if (!commentaire) return reply.status(404).send({ error: 'Commentaire introuvable' });

    if (commentaire.createdBy !== req.user.email) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Vous ne pouvez modifier que vos propres commentaires' });
    }

    if (commentaire.accompagnement.organisationId !== req.user.organisationId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Accès non autorisé' });
    }

    const { contenu, visibilite } = req.body || {};
    const data: any = {};
    if (contenu !== undefined) data.contenu = contenu;
    if (visibilite !== undefined) {
      if (visibilite === 'DU_ONLY') return reply.status(400).send({ error: 'Visibilité DU_ONLY non autorisée pour un partenaire technique' });
      data.visibilite = visibilite;
    }

    const updated = await app.prisma.commentaireAMO.update({ where: { id: commentaire.id }, data });
    return updated;
  });

  // DELETE /commentaires/:id — Supprimer son propre commentaire
  app.delete('/commentaires/:id', { onRequest: [app.authenticatePartenaireTechnique] }, async (req: any, reply: any) => {
    const commentaire = await app.prisma.commentaireAMO.findUnique({
      where: { id: req.params.id },
      include: { accompagnement: { select: { organisationId: true } } },
    });
    if (!commentaire) return reply.status(404).send({ error: 'Commentaire introuvable' });

    if (commentaire.createdBy !== req.user.email) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Vous ne pouvez supprimer que vos propres commentaires' });
    }

    if (commentaire.accompagnement.organisationId !== req.user.organisationId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Accès non autorisé' });
    }

    await app.prisma.commentaireAMO.delete({ where: { id: commentaire.id } });
    return { success: true };
  });
}
