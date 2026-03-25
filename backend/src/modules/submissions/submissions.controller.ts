import { FastifyRequest, FastifyReply } from 'fastify';
import { SubmissionsService } from './submissions.service.js';
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  submissionQuerySchema,
  updateStatusSchema,
  CreateSubmissionInput,
  UpdateSubmissionInput,
  SubmissionQuery,
  UpdateStatusInput,
} from './submissions.schema.js';

export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  async create(
    request: FastifyRequest<{ Body: CreateSubmissionInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = createSubmissionSchema.parse(request.body);
      const submission = await this.submissionsService.create(input, request.user.id);
      return reply.status(201).send(submission);
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
    request: FastifyRequest<{ Querystring: SubmissionQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = submissionQuerySchema.parse(request.query);
      const result = await this.submissionsService.findAll(
        query,
        request.user.role,
        request.user.institutionId
      );
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
      const submission = await this.submissionsService.findOne(
        request.params.id,
        request.user.role,
        request.user.institutionId
      );
      return reply.send(submission);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateSubmissionInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = updateSubmissionSchema.parse(request.body);
      const submission = await this.submissionsService.update(
        request.params.id,
        input,
        request.user.id
      );
      return reply.send(submission);
    } catch (error: any) {
      // Log validation errors for debugging
      if (error.errors) {
        request.log.error({ validationErrors: error.errors, bodyKeys: Object.keys(request.body as any) }, 'Validation failed on update');
      }
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

  async updateStatus(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = updateStatusSchema.parse(request.body);
      const submission = await this.submissionsService.updateStatus(
        request.params.id,
        input,
        request.user.id
      );
      return reply.send(submission);
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
      const result = await this.submissionsService.delete(request.params.id, request.user.id);
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
      const stats = await this.submissionsService.getStats();
      return reply.send(stats);
    } catch (error: any) {
      _request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }
}
