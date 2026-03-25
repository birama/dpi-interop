import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Questionnaire Interopérabilité SENUM',
        description: 'API pour le questionnaire de collecte des besoins d\'interopérabilité',
        version: '1.0.0',
        contact: {
          name: 'SENUM - MCTN',
          email: 'dpi.interrop@numerique.gouv.sn',
        },
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Development' },
        { url: 'https://api.questionnaire.senum.sn', description: 'Production' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Institutions', description: 'Institution management' },
        { name: 'Submissions', description: 'Questionnaire submissions' },
        { name: 'Reports', description: 'Reports and exports' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

export default fp(swaggerPlugin, {
  name: 'swagger',
});
