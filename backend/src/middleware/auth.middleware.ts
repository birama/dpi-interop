import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (error) {
    throw new UnauthorizedError('Token invalide ou expiré');
  }
}

/**
 * Middleware factory to require specific roles
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    try {
      await request.jwtVerify();
    } catch (error) {
      throw new UnauthorizedError('Token invalide ou expiré');
    }

    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Utilisateur non authentifié');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Accès réservé aux rôles: ${allowedRoles.join(', ')}`
      );
    }
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(Role.ADMIN);

/**
 * Middleware to check if user belongs to institution
 */
export function requireInstitutionAccess(institutionIdParam: string = 'institutionId') {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    try {
      await request.jwtVerify();
    } catch (error) {
      throw new UnauthorizedError('Token invalide ou expiré');
    }

    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Utilisateur non authentifié');
    }

    // Admins have access to all institutions
    if (user.role === Role.ADMIN) {
      return;
    }

    const params = request.params as Record<string, string>;
    const institutionId = params[institutionIdParam];

    if (!institutionId) {
      throw new ForbiddenError('Institution non spécifiée');
    }

    if (user.institutionId !== institutionId) {
      throw new ForbiddenError("Vous n'avez pas accès à cette institution");
    }
  };
}

/**
 * Optional auth - sets user if token present, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    // Token absent or invalid - continue without user
  }
}
