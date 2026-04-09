import { FastifyInstance } from 'fastify';
import { SubmissionsService } from './submissions.service.js';
import { SubmissionsController } from './submissions.controller.js';

export async function submissionsRoutes(app: FastifyInstance) {
  const submissionsService = new SubmissionsService(app);
  const submissionsController = new SubmissionsController(submissionsService);

  // Get all submissions (paginated)
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Lister les soumissions',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED'],
          },
          institutionId: { type: 'string', format: 'uuid' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 500, default: 20 },
        },
      },
    },
    handler: submissionsController.findAll.bind(submissionsController),
  });

  // Get submission stats (admin only)
  app.get('/stats', {
    onRequest: [app.authenticateAdmin],
    schema: {
      tags: ['Submissions'],
      description: 'Statistiques des soumissions',
      security: [{ bearerAuth: [] }],
    },
    handler: submissionsController.getStats.bind(submissionsController),
  });

  // Get single submission
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Détails d\'une soumission',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: submissionsController.findOne.bind(submissionsController),
  });

  // Create submission
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Créer une nouvelle soumission',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['institutionId'],
        properties: {
          institutionId: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: submissionsController.create.bind(submissionsController),
  });

  // Update submission (save progress)
  app.patch('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Mettre à jour une soumission (sauvegarde)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: submissionsController.update.bind(submissionsController),
  });

  // Update status (submit, review, validate)
  app.patch('/:id/status', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Changer le statut d\'une soumission',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED'],
          },
        },
      },
    },
    handler: submissionsController.updateStatus.bind(submissionsController),
  });

  // Delete submission (draft only)
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Supprimer une soumission (brouillon uniquement)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: submissionsController.delete.bind(submissionsController),
  });

  // ============================================================================
  // INFRASTRUCTURE ITEMS (Section B.3)
  // ============================================================================

  // Add/upsert infrastructure item
  app.post('/:id/infrastructure', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Ajouter/mettre à jour un item d\'infrastructure',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: any, reply: any) => {
      const { id } = request.params;
      const { domain, element, disponibilite, qualifications, observations } = request.body;

      const item = await app.prisma.infrastructureItem.upsert({
        where: {
          submissionId_domain_element: { submissionId: id, domain, element },
        },
        update: { disponibilite, qualifications, observations },
        create: { submissionId: id, domain, element, disponibilite, qualifications, observations },
      });

      return reply.send(item);
    },
  });

  // Bulk upsert infrastructure items
  app.put('/:id/infrastructure', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Mettre à jour tous les items d\'infrastructure',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: any, reply: any) => {
      const { id } = request.params;
      const items = request.body as any[];

      const results = await app.prisma.$transaction(
        items.map((item: any) =>
          app.prisma.infrastructureItem.upsert({
            where: {
              submissionId_domain_element: {
                submissionId: id,
                domain: item.domain,
                element: item.element,
              },
            },
            update: {
              disponibilite: item.disponibilite,
              qualifications: item.qualifications,
              observations: item.observations,
            },
            create: {
              submissionId: id,
              domain: item.domain,
              element: item.element,
              disponibilite: item.disponibilite,
              qualifications: item.qualifications,
              observations: item.observations,
            },
          })
        )
      );

      return reply.send(results);
    },
  });

  // Delete infrastructure item
  app.delete('/:id/infrastructure/:itemId', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Submissions'],
      description: 'Supprimer un item d\'infrastructure',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: any, reply: any) => {
      const { itemId } = request.params as { itemId: string };
      await app.prisma.infrastructureItem.delete({ where: { id: itemId } });
      return reply.send({ success: true });
    },
  });

  // ============================================================================
  // F.1 — NIVEAUX D'INTEROPÉRABILITÉ
  // ============================================================================
  app.put('/:id/niveaux-interop', {
    onRequest: [app.authenticate],
    schema: { tags: ['Submissions'], description: 'Sauvegarder diagnostic niveaux interop', security: [{ bearerAuth: [] }] },
    handler: async (request: any, reply: any) => {
      const { id } = request.params;
      const items = request.body as any[];
      const results = await app.prisma.$transaction(
        items.map((item: any) =>
          app.prisma.niveauInterop.upsert({
            where: { submissionId_niveau_question: { submissionId: id, niveau: item.niveau, question: item.question } },
            update: { reponse: item.reponse, details: item.details || null },
            create: { submissionId: id, niveau: item.niveau, question: item.question, reponse: item.reponse, details: item.details || null },
          })
        )
      );
      return reply.send(results);
    },
  });

  // ============================================================================
  // F.3 — CONFORMITÉ PRINCIPES
  // ============================================================================
  app.put('/:id/conformite-principes', {
    onRequest: [app.authenticate],
    schema: { tags: ['Submissions'], description: 'Sauvegarder conformité aux 13 principes', security: [{ bearerAuth: [] }] },
    handler: async (request: any, reply: any) => {
      const { id } = request.params;
      const items = request.body as any[];
      const results = await app.prisma.$transaction(
        items.map((item: any) =>
          app.prisma.conformitePrincipe.upsert({
            where: { submissionId_principeNumero: { submissionId: id, principeNumero: item.principeNumero } },
            update: { score: item.score, commentaire: item.commentaire || null, categorie: item.categorie },
            create: { submissionId: id, principeNumero: item.principeNumero, categorie: item.categorie, score: item.score, commentaire: item.commentaire || null },
          })
        )
      );
      return reply.send(results);
    },
  });

  // ============================================================================
  // F.4 — DICTIONNAIRE DE DONNÉES
  // ============================================================================
  app.put('/:id/dictionnaire', {
    onRequest: [app.authenticate],
    schema: { tags: ['Submissions'], description: 'Sauvegarder dictionnaire de données', security: [{ bearerAuth: [] }] },
    handler: async (request: any, reply: any) => {
      const { id } = request.params;
      const items = request.body as any[];
      // Delete existing and recreate
      await app.prisma.dictionnaireDonnee.deleteMany({ where: { submissionId: id } });
      if (items.length > 0) {
        await app.prisma.dictionnaireDonnee.createMany({
          data: items.map((item: any) => ({ ...item, submissionId: id })),
        });
      }
      const result = await app.prisma.dictionnaireDonnee.findMany({ where: { submissionId: id } });
      return reply.send(result);
    },
  });

  // ============================================================================
  // F.5 — PRÉPARATION DÉCRET
  // ============================================================================
  app.put('/:id/preparation-decret', {
    onRequest: [app.authenticate],
    schema: { tags: ['Submissions'], description: 'Sauvegarder préparation au décret', security: [{ bearerAuth: [] }] },
    handler: async (request: any, reply: any) => {
      const { id } = request.params;
      const items = request.body as any[];
      const results = await app.prisma.$transaction(
        items.map((item: any) =>
          app.prisma.preparationDecret.upsert({
            where: { submissionId_chapitre_question: { submissionId: id, chapitre: item.chapitre, question: item.question } },
            update: { reponse: item.reponse, details: item.details || null },
            create: { submissionId: id, chapitre: item.chapitre, question: item.question, reponse: item.reponse, details: item.details || null },
          })
        )
      );
      return reply.send(results);
    },
  });
}
