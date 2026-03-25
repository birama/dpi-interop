import { FastifyInstance } from 'fastify';
import { InstitutionsService } from './institutions.service.js';
import { InstitutionsController } from './institutions.controller.js';
import { institutionSchemas } from './institutions.schema.js';

export async function institutionsRoutes(app: FastifyInstance) {
  const institutionsService = new InstitutionsService(app);
  const institutionsController = new InstitutionsController(institutionsService);

  // Get all institutions (paginated)
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Institutions'],
      description: 'Lister toutes les institutions',
      security: [{ bearerAuth: [] }],
      ...institutionSchemas.list,
    },
    handler: institutionsController.findAll.bind(institutionsController),
  });

  // Get institution stats (admin only)
  app.get('/stats', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Institutions'],
      description: 'Statistiques sur les institutions',
      security: [{ bearerAuth: [] }],
    },
    handler: institutionsController.getStats.bind(institutionsController),
  });

  // Get single institution
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Institutions'],
      description: 'Détails d\'une institution',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: institutionsController.findOne.bind(institutionsController),
  });

  // Create institution (admin only)
  app.post('/', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Institutions'],
      description: 'Créer une nouvelle institution',
      security: [{ bearerAuth: [] }],
      ...institutionSchemas.create,
    },
    handler: institutionsController.create.bind(institutionsController),
  });

  // Update institution (admin only)
  app.patch('/:id', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Institutions'],
      description: 'Modifier une institution',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: institutionsController.update.bind(institutionsController),
  });

  // Delete institution (admin only)
  app.delete('/:id', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Institutions'],
      description: 'Supprimer une institution',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: institutionsController.delete.bind(institutionsController),
  });
}
