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
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 15 * 60 * 1000, // 15 minutes
      },
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

  // Refresh token — génère un nouveau access JWT ET crée une UserSession active
  // associée. Préserve les invariants du module audit (toute activité authentifiée
  // doit être tracée par une session).
  app.post('/refresh', {
    schema: { tags: ['Auth'], description: 'Renouveler le token JWT' },
    handler: async (request: any, reply: any) => {
      try {
        const { refreshToken } = request.body;
        if (!refreshToken) return reply.status(400).send({ error: 'refreshToken requis' });

        const decoded = app.jwt.verify(refreshToken) as any;
        if (decoded.type !== 'refresh') return reply.status(401).send({ error: 'Token invalide' });

        const payload: any = { id: decoded.id, email: decoded.email, role: decoded.role };
        if (decoded.institutionId) payload.institutionId = decoded.institutionId;
        if (decoded.ptfId) payload.ptfId = decoded.ptfId;
        if (decoded.cguAccepted !== undefined) payload.cguAccepted = decoded.cguAccepted;

        const newToken = app.jwt.sign(payload, { expiresIn: '2h' });

        // Désactive les sessions précédentes et crée la nouvelle (dedup).
        // upsert protège du cas où le même JWT serait régénéré dans la même seconde
        // (iat identique → tokenHash identique).
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(newToken).digest('hex');
        await app.prisma.userSession.updateMany({
          where: { userId: decoded.id, isActive: true, NOT: { tokenHash } },
          data: { isActive: false, logoutAt: new Date() },
        });
        await app.prisma.userSession.upsert({
          where: { tokenHash },
          update: { isActive: true, lastActivityAt: new Date(), logoutAt: null, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
          create: {
            userId: decoded.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            isActive: true,
          },
        });

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
