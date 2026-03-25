import { FastifyRequest, FastifyReply } from 'fastify';
import { InstitutionsService } from './institutions.service.js';
import {
  createInstitutionSchema,
  updateInstitutionSchema,
  institutionQuerySchema,
  CreateInstitutionInput,
  UpdateInstitutionInput,
  InstitutionQuery,
} from './institutions.schema.js';

export class InstitutionsController {
  constructor(private institutionsService: InstitutionsService) {}

  async create(
    request: FastifyRequest<{ Body: CreateInstitutionInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = createInstitutionSchema.parse(request.body);
      const institution = await this.institutionsService.create(input);
      return reply.status(201).send(institution);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error.errors) {
        return reply.status(400).send({ error: 'Validation failed', details: error.errors });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async findAll(
    request: FastifyRequest<{ Querystring: InstitutionQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = institutionQuerySchema.parse(request.query);
      const result = await this.institutionsService.findAll(query);
      return reply.send(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async findOne(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const institution = await this.institutionsService.findOne(request.params.id);
      return reply.send(institution);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateInstitutionInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = updateInstitutionSchema.parse(request.body);
      const institution = await this.institutionsService.update(request.params.id, input);
      return reply.send(institution);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error.errors) {
        return reply.status(400).send({ error: 'Validation failed', details: error.errors });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.institutionsService.delete(request.params.id);
      return reply.send(result);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async getStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.institutionsService.getStats();
      return reply.send(stats);
    } catch (error: any) {
      _request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }
}
