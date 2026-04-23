/**
 * Routes notifications in-app Vue 360°
 *
 * GET   /api/me/notifications          — Liste paginee des notifications de l'user
 * PATCH /api/notifications/:id/read    — Marquer une notification comme lue
 * PATCH /api/me/notifications/read-all — Tout marquer comme lu
 */

import { FastifyInstance } from 'fastify';

export async function notificationsMeRoutes(app: FastifyInstance) {
  // GET /api/me/notifications
  app.get('/notifications', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const userId = req.user.id;
    const { unreadOnly, limit = '50', cursor } = req.query as any;
    const take = Math.min(parseInt(limit) || 50, 100);

    const where: any = { userId };
    if (unreadOnly === 'true') where.lu = false;

    const paginationArgs: any = { take: take + 1 };
    if (cursor) {
      paginationArgs.cursor = { id: cursor };
      paginationArgs.skip = 1;
    }

    const notifications = await app.prisma.notification.findMany({
      where,
      orderBy: { dateCreation: 'desc' },
      ...paginationArgs,
    });

    const unreadCount = await app.prisma.notification.count({ where: { userId, lu: false } });

    const hasMore = notifications.length > take;
    const items = hasMore ? notifications.slice(0, take) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return reply.send({
      data: items,
      unreadCount,
      nextCursor,
      hasMore,
    });
  });

  // PATCH /api/me/notifications/read-all
  app.patch('/notifications/read-all', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const userId = req.user.id;
    const result = await app.prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true, dateLu: new Date() },
    });
    return reply.send({ updated: result.count });
  });
}

export async function notificationsRoutes(app: FastifyInstance) {
  // PATCH /api/notifications/:id/read
  app.patch('/:id/read', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const userId = req.user.id;
    const { id } = req.params;

    // Verifier que la notification appartient bien a l'utilisateur
    const notif = await app.prisma.notification.findUnique({ where: { id } });
    if (!notif) return reply.status(404).send({ error: 'Notification non trouvee' });
    if (notif.userId !== userId) return reply.status(403).send({ error: 'Notification non accessible' });

    const updated = await app.prisma.notification.update({
      where: { id },
      data: { lu: true, dateLu: new Date() },
    });
    return reply.send(updated);
  });
}
