import { FastifyInstance } from 'fastify';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { WordExportService } from './word-export.service.js';

export async function reportsRoutes(app: FastifyInstance) {
  const reportsService = new ReportsService(app);
  const reportsController = new ReportsController(reportsService);

  // Get all reports (history)
  app.get('/', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Reports'],
      description: 'Historique des rapports générés',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['COMPILATION', 'MATRICE_FLUX', 'STATISTIQUES', 'EXPORT_INSTITUTION', 'EXPORT_COMPLET'],
          },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
    handler: reportsController.findAll.bind(reportsController),
  });

  // Get single report
  app.get('/:id', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Reports'],
      description: 'Détails d\'un rapport',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: reportsController.findOne.bind(reportsController),
  });

  // Generate report
  app.post('/generate', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Reports'],
      description: 'Générer un nouveau rapport',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['COMPILATION', 'MATRICE_FLUX', 'STATISTIQUES', 'EXPORT_INSTITUTION', 'EXPORT_COMPLET'],
          },
          format: {
            type: 'string',
            enum: ['json', 'csv'],
            default: 'json',
          },
          institutionId: { type: 'string', format: 'uuid' },
          filters: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED'],
              },
              dateFrom: { type: 'string', format: 'date-time' },
              dateTo: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    handler: reportsController.generate.bind(reportsController),
  });

  // ============================================================================
  // EXPORT WORD
  // ============================================================================
  const wordExportService = new WordExportService(app);

  // Export Word par institution
  app.get('/institution/:submissionId/word', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Reports'],
      description: 'Exporter une soumission en Word (.docx)',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: any, reply: any) => {
      const { submissionId } = request.params;
      const buffer = await wordExportService.generateInstitutionReport(submissionId);

      reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        .header('Content-Disposition', `attachment; filename=rapport-${submissionId}.docx`)
        .send(buffer);
    },
  });

  // Export note de financement pour un PTF
  app.get('/note-financement/:ptfCode/word', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Reports'],
      description: 'Générer une note de financement pour un PTF (.docx)',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: any, reply: any) => {
      const { ptfCode } = request.params;
      const buffer = await wordExportService.generateNoteFinancement(ptfCode);

      reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        .header('Content-Disposition', `attachment; filename=note-financement-${ptfCode}.docx`)
        .send(buffer);
    },
  });

  // Export Word compilation (toutes les institutions)
  app.get('/compilation/word', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Reports'],
      description: 'Exporter la compilation de toutes les soumissions en Word (.docx)',
      security: [{ bearerAuth: [] }],
    },
    handler: async (_request: any, reply: any) => {
      const buffer = await wordExportService.generateCompilation();
      const date = new Date().toISOString().split('T')[0];

      reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        .header('Content-Disposition', `attachment; filename=compilation-interop-${date}.docx`)
        .send(buffer);
    },
  });
}
