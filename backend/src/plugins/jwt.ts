import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTITUTION';
      institutionId?: string;
    };
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTITUTION';
      institutionId?: string;
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
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    authenticateAdmin: (request: any, reply: any) => Promise<void>;
  }
}

export default fp(jwtPlugin, {
  name: 'jwt',
});
