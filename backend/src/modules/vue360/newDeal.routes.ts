/**
 * Routes New Deal Technologique — Programmes prioritaires et projets nationaux
 *
 *   GET    /new-deal/programmes              — Liste des 12 PRPs
 *   GET    /new-deal/projets                 — Liste des 48 projets (avec PRP parent)
 *   GET    /new-deal/use-cases/:id/projets   — Projets associés à un cas d'usage
 *   PUT    /new-deal/use-cases/:id/projets   — MAJ projets associés (ADMIN only)
 */

import { FastifyInstance } from 'fastify';

export async function newDealRoutes(app: FastifyInstance) {

  // GET /programmes — Liste des 12 PRPs
  app.get('/programmes', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (_req: any, _reply: any) => {
    const programmes = await app.prisma.programmePrioritaire.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { projets: true } } },
    });
    return { data: programmes, total: programmes.length };
  });

  // GET /projets — Liste des 48 projets (avec PRP parent)
  app.get('/projets', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (_req: any, _reply: any) => {
    const projets = await app.prisma.projetNational.findMany({
      orderBy: { code: 'asc' },
      include: { programmePrioritaire: true, _count: { select: { casUsageProjets: true } } },
    });
    return { data: projets, total: projets.length };
  });

  // GET /use-cases/:id/projets — Projets associés à un cas d'usage
  app.get('/use-cases/:id/projets', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, _reply: any) => {
    const rows = await app.prisma.casUsageProjet.findMany({
      where: { casUsageMVPId: req.params.id },
      include: { projetNational: { include: { programmePrioritaire: true } } },
      orderBy: { projetNational: { code: 'asc' } },
    });
    return { data: rows.map((r: any) => r.projetNational), total: rows.length };
  });

  // PUT /use-cases/:id/projets — MAJ projets associés (ADMIN only)
  app.put('/use-cases/:id/projets', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { projetIds } = req.body as any;
    if (!Array.isArray(projetIds)) return reply.status(400).send({ error: 'projetIds (array) requis' });

    const casUsageId = req.params.id;

    // Supprimer toutes les associations existantes pour ce CU
    await app.prisma.casUsageProjet.deleteMany({ where: { casUsageMVPId: casUsageId } });

    // Recréer avec la nouvelle liste
    if (projetIds.length > 0) {
      await app.prisma.casUsageProjet.createMany({
        data: projetIds.map((pid: string) => ({ casUsageMVPId: casUsageId, projetNationalId: pid })),
      });
    }

    await app.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'CAS_USAGE_PROJETS_UPDATE',
        resource: 'CasUsageMVP',
        resourceId: casUsageId,
        details: { projetIds },
      },
    });

    return { success: true, count: projetIds.length };
  });
}
