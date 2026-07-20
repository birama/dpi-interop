import { FastifyRequest, FastifyReply } from 'fastify';
import { RecensementService } from './service.js';
import { recensementSchema } from './schema.js';

export class RecensementController {
  constructor(private service: RecensementService) {}

  async submit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = recensementSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Données invalides',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;

      // Honeypot
      if (data.website && data.website.length > 0) {
        request.log.warn({ ip: request.ip }, 'honeypot triggered');
        return reply.send({ id: 'ok', sessionRef: '' });
      }

      // IP tronquée
      const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.ip;
      const ipParts = ip.split('.');
      const ipTronquee = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.0.0` : ip;

      // Origine : si l'utilisateur est connecté (optionalAuth a décodé le JWT),
      // on marque AUTHENTIFIEE et on rattache à son institution.
      const user = (request as any).user;
      const origine = user?.role ? 'AUTHENTIFIEE' : 'PUBLIQUE';
      const institutionId = user?.institutionId || null;

      const existingSessionRef = data.sessionRef || undefined;
      const result = await this.service.create(data, ipTronquee, existingSessionRef, origine, institutionId);

      request.log.info({ id: result.id, origine, institutionId }, 'recensement submitted');

      return reply.status(201).send(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }
}
