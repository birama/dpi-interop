import { FastifyInstance } from 'fastify';
import prismaPlugin from './prisma.js';
import jwtPlugin from './jwt.js';
import corsPlugin from './cors.js';
import helmetPlugin from './helmet.js';
import rateLimitPlugin from './rateLimit.js';
import swaggerPlugin from './swagger.js';

export async function registerPlugins(app: FastifyInstance) {
  // Security plugins first
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);

  // Database
  await app.register(prismaPlugin);

  // Auth
  await app.register(jwtPlugin);

  // Documentation
  await app.register(swaggerPlugin);

  app.log.info('All plugins registered');
}
