import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from './auth.schema.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = registerSchema.parse(request.body);
      const user = await this.authService.register(input);
      return reply.status(201).send({
        message: 'Utilisateur créé avec succès',
        user,
      });
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

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = loginSchema.parse(request.body);
      const result = await this.authService.login(input);
      return reply.send(result);
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

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.authService.getProfile(request.user.id);
      return reply.send(user);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = changePasswordSchema.parse(request.body);
      const result = await this.authService.changePassword(request.user.id, input);
      return reply.send(result);
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
}
