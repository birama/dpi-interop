import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTITUTION' | 'BAILLEUR';
      institutionId?: string;
      ptfId?: string;
      cguAccepted?: boolean;
    };
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTITUTION' | 'BAILLEUR';
      institutionId?: string;
      ptfId?: string;
      cguAccepted?: boolean;
    };
  }
}

async function jwtPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  fastify.decorate('authenticateAdmin', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'ADMIN') {
        reply.status(403).send({ error: 'Forbidden', message: 'Admin access required' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  // PTF Phase 1 — Middleware Partenaire Technique et Financier
  // Vérifie : JWT valide + role=BAILLEUR + ptfId présent + CGU acceptées
  fastify.decorate('authenticateBailleur', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'BAILLEUR') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Accès réservé aux Partenaires Techniques et Financiers' });
      }
      if (!request.user.ptfId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Compte partenaire non rattaché à un PTF' });
      }
      if (!request.user.cguAccepted) {
        return reply.status(403).send({ error: 'CguRequired', message: 'Acceptation des CGU requise', requireCguAcceptance: true });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    authenticateAdmin: (request: any, reply: any) => Promise<void>;
    authenticateBailleur: (request: any, reply: any) => Promise<void>;
  }
}

export default fp(jwtPlugin, {
  name: 'jwt',
});
