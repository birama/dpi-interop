import { FastifyRequest, FastifyReply } from 'fastify';
import { RecensementService } from './service.js';
import { recensementSchema, recensementMultiSchema } from './schema.js';

export class RecensementController {
  constructor(private service: RecensementService) {}

  async submit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;

      // Honeypot
      if (body?.website && body.website.length > 0) {
        request.log.warn({ ip: request.ip }, 'honeypot triggered');
        return reply.send({ id: 'ok', sessionRef: '' });
      }

      // IP tronquée
      const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.ip;
      const ipParts = ip.split('.');
      const ipTronquee = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.0.0` : ip;

      const user = (request as any).user;
      const origine = user?.role ? 'AUTHENTIFIEE' : 'PUBLIQUE';
      const institutionId = user?.institutionId || null;

      // Détection mode multi-projets (body.projets est un tableau)
      if (body?.projets && Array.isArray(body.projets)) {
        const parsed = recensementMultiSchema.safeParse(body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Données invalides',
            details: parsed.error.flatten().fieldErrors,
          });
        }

        const data = parsed.data;
        let currentSessionRef = data.sessionRef || undefined;
        const ids: string[] = [];

        for (const projet of data.projets) {
          const result = await this.service.createFromProjet(
            projet,
            {
              ministereTutelle: data.ministereTutelle,
              ministereAutre: data.ministereAutre,
              structureNom: data.structureNom,
              typeStructure: data.typeStructure,
              contactNom: data.contactNom,
              contactFonction: data.contactFonction,
              contactEmail: data.contactEmail,
              contactTelephone: data.contactTelephone,
            },
            ipTronquee,
            currentSessionRef,
            origine,
            institutionId,
          );
          ids.push(result.id);
          // La première création génère un sessionRef, on le propage aux suivantes
          if (!currentSessionRef) currentSessionRef = result.sessionRef;
        }

        const sessionRef = currentSessionRef || '';

        request.log.info({ count: ids.length, origine, institutionId }, 'recensement multi submitted');
        return reply.status(201).send({ ids, count: ids.length, sessionRef });
      }

      // Mode unitaire (rétrocompatible)
      const parsed = recensementSchema.safeParse(body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Données invalides',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
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
