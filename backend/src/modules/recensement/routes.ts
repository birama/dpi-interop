import { FastifyInstance } from 'fastify';
import { RecensementService } from './service.js';
import { RecensementController } from './controller.js';

export async function recensementRoutes(app: FastifyInstance) {
  const service = new RecensementService(app);
  const controller = new RecensementController(service);

  // Route publique avec authentification OPTIONNELLE.
  // - Sans token : soumission anonyme (origine PUBLIQUE)
  // - Avec token : soumission authentifiée (origine AUTHENTIFIEE, institutionId renseigné)
  app.post('/recensement', {
    schema: {
      tags: ['Public'],
      description: 'Soumettre un projet numérique au recensement GouvNum',
    },
    preHandler: [async (req: any) => {
      // optionalAuth : décode le JWT s'il est présent, ne bloque pas sinon
      try { await req.jwtVerify(); } catch { /* Token absent ou invalide — on continue */ }
    }],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 60 * 60 * 1000, // 10 soumissions par heure
      },
    },
    handler: controller.submit.bind(controller),
  });
}
