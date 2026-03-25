import { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { authSchemas } from './auth.schema.js';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);
  const authController = new AuthController(authService);

  // Public routes
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      description: 'Créer un nouveau compte utilisateur',
      ...authSchemas.register,
    },
    handler: authController.register.bind(authController),
  });

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      description: 'Se connecter et obtenir un token JWT',
      ...authSchemas.login,
    },
    handler: authController.login.bind(authController),
  });

  // Protected routes
  app.get('/me', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Auth'],
      description: 'Obtenir le profil de l\'utilisateur connecté',
      security: [{ bearerAuth: [] }],
    },
    handler: authController.getProfile.bind(authController),
  });

  // Refresh token
  app.post('/refresh', {
    schema: { tags: ['Auth'], description: 'Renouveler le token JWT' },
    handler: async (request: any, reply: any) => {
      try {
        const { refreshToken } = request.body;
        if (!refreshToken) return reply.status(400).send({ error: 'refreshToken requis' });

        const decoded = app.jwt.verify(refreshToken) as any;
        if (decoded.type !== 'refresh') return reply.status(401).send({ error: 'Token invalide' });

        const newToken = app.jwt.sign(
          { id: decoded.id, email: decoded.email, role: decoded.role, institutionId: decoded.institutionId },
          { expiresIn: '2h' }
        );
        return reply.send({ token: newToken });
      } catch {
        return reply.status(401).send({ error: 'Refresh token expiré ou invalide' });
      }
    },
  });

  app.post('/change-password', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Auth'],
      description: 'Changer son mot de passe',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: authController.changePassword.bind(authController),
  });
}
