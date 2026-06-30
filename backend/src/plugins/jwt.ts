import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Vérifie que la session liée au JWT est encore active en base.
// Inactivité > 10min ou logout forcé => 401.
async function assertSessionActive(app: FastifyInstance, request: any): Promise<boolean> {
  const authHeader = request.headers.authorization;
  if (!authHeader) return true;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return true;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  try {
    const session = await (app as any).prisma.userSession.findUnique({
      where: { tokenHash },
      select: { isActive: true },
    });
    if (session && !session.isActive) return false;
    return true;
  } catch {
    return true;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTITUTION' | 'BAILLEUR' | 'PARTENAIRE_TECHNIQUE';
      institutionId?: string;
      ptfId?: string;
      organisationId?: string;
      cguAccepted?: boolean;
    };
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTITUTION' | 'BAILLEUR' | 'PARTENAIRE_TECHNIQUE';
      institutionId?: string;
      ptfId?: string;
      organisationId?: string;
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
      if (!(await assertSessionActive(fastify, request))) {
        return reply.status(401).send({ error: 'SessionExpired', message: 'Votre session a expiré après 10 minutes d\'inactivité. Veuillez vous reconnecter.' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  fastify.decorate('authenticateAdmin', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
      if (!(await assertSessionActive(fastify, request))) {
        return reply.status(401).send({ error: 'SessionExpired', message: 'Votre session a expiré après 10 minutes d\'inactivité. Veuillez vous reconnecter.' });
      }
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
      if (!(await assertSessionActive(fastify, request))) {
        return reply.status(401).send({ error: 'SessionExpired', message: 'Votre session a expiré après 10 minutes d\'inactivité. Veuillez vous reconnecter.' });
      }
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

  // P13-CONC — Middleware Partenaire Technique (AMO/prestataire)
  // Vérifie : JWT valide + role=PARTENAIRE_TECHNIQUE + organisationId présent
  fastify.decorate('authenticatePartenaireTechnique', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
      if (!(await assertSessionActive(fastify, request))) {
        return reply.status(401).send({ error: 'SessionExpired', message: 'Votre session a expiré après 10 minutes d\'inactivité. Veuillez vous reconnecter.' });
      }
      if (request.user.role !== 'PARTENAIRE_TECHNIQUE') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Accès réservé aux Partenaires Techniques (AMO)' });
      }
      if (!request.user.organisationId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Compte partenaire technique non rattaché à une organisation' });
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
    authenticatePartenaireTechnique: (request: any, reply: any) => Promise<void>;
  }
}

export default fp(jwtPlugin, {
  name: 'jwt',
});
