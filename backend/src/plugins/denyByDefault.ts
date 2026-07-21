import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

type AccessPolicy = 'public' | 'authenticated' | string[];

declare module 'fastify' {
  interface FastifyContextConfig {
    /**
     * Politique d'accès obligatoire (deny-by-default).
     * - 'public'         : aucune authentification requise
     * - 'authenticated'  : session JWT valide, tout rôle (sauf PENDING)
     * - ['ADMIN', ...]   : session JWT + rôle listé obligatoire
     *
     * Absent → refus automatique (503 dev, 403 prod).
     */
    access?: AccessPolicy;
  }
}

async function denyByDefaultPlugin(fastify: FastifyInstance) {
  const isDev = process.env.NODE_ENV === 'development';

  // preHandler global — exécuté après onRequest mais avant le handler.
  // Les onRequest existants (app.authenticate, etc.) vérifient déjà le JWT
  // pour les routes qui en ont un ; ce hook applique la couche RBAC déclarative.
  fastify.addHook('preHandler', async (request, reply) => {
    const routeAccess = request.routeOptions.config?.access;

    // Règle 1 : toute route DOIT déclarer sa politique d'accès
    if (routeAccess === undefined) {
      const msg = `Route sans config.access : ${request.method} ${request.url}`;
      if (isDev) {
        fastify.log.error(msg);
        return reply.status(503).send({
          error: 'Route access policy not declared',
          message: msg,
        });
      }
      return reply.status(403).send({ error: 'Forbidden' });
    }

    // Règle 2 : 'public' — laisser passer sans vérification
    if (routeAccess === 'public') {
      return;
    }

    // Règle 3 : toute autre politique exige un utilisateur authentifié.
    // Si aucun onRequest n'a décodé le JWT, on le fait ici.
    let user = (request as any).user;
    if (!user?.role) {
      try {
        await request.jwtVerify();
        user = (request as any).user;
      } catch {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }
    }
    if (!user?.role) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }

    // Règle 4 : le rôle PENDING n'a accès à rien
    if (user.role === 'PENDING') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Account pending approval' });
    }

    // Règle 5 : 'authenticated' — tout rôle non-PENDING accepté
    if (routeAccess === 'authenticated') {
      return;
    }

    // Règle 6 : liste de rôles — le rôle doit être dans la liste
    if (Array.isArray(routeAccess)) {
      if (!routeAccess.includes(user.role)) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Insufficient role' });
      }
      return;
    }

    // Règle 7 : cas imprévu → refus
    fastify.log.error({ routeAccess }, `Politique d'accès inconnue pour ${request.method} ${request.url}`);
    return reply.status(403).send({ error: 'Forbidden' });
  });
}

export default fp(denyByDefaultPlugin, {
  name: 'deny-by-default',
});
