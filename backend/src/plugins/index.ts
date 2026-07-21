import { FastifyInstance } from 'fastify';
import prismaPlugin from './prisma.js';
import jwtPlugin from './jwt.js';
import corsPlugin from './cors.js';
import helmetPlugin from './helmet.js';
import rateLimitPlugin from './rateLimit.js';
import swaggerPlugin from './swagger.js';
import denyByDefaultPlugin from './denyByDefault.js';

export async function registerPlugins(app: FastifyInstance) {
  // Security plugins first
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);

  // Database
  await app.register(prismaPlugin);

  // Auth
  await app.register(jwtPlugin);

  // Deny-by-default — après JWT, avant les routes
  await app.register(denyByDefaultPlugin);

  // Documentation
  await app.register(swaggerPlugin);

  app.log.info('All plugins registered');
}
