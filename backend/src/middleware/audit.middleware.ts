import { FastifyRequest } from 'fastify';
import { Prisma, PrismaClient } from '@prisma/client';
import { getClientIP, getUserAgent } from '../utils/security.js';

const prisma = new PrismaClient();

/**
 * Log an action to the audit log
 */
export async function logAuditEvent(
  request: FastifyRequest,
  action: string,
  entity?: string,
  entityId?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: request.user?.id || null,
        action,
        entity: entity || null,
        entityId: entityId || null,
        changes: changes as Prisma.InputJsonValue | undefined,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the request
  }
}

/**
 * Middleware to log successful authentication
 */
export async function logLogin(request: FastifyRequest, userId: string): Promise<void> {
  await logAuditEvent(request, 'LOGIN', 'User', userId);
}

/**
 * Middleware to log logout
 */
export async function logLogout(request: FastifyRequest): Promise<void> {
  await logAuditEvent(request, 'LOGOUT', 'User', request.user?.id);
}

/**
 * Middleware to log data access
 */
export async function logDataAccess(
  request: FastifyRequest,
  entity: string,
  entityId: string
): Promise<void> {
  await logAuditEvent(request, 'READ', entity, entityId);
}

/**
 * Middleware to log data creation
 */
export async function logDataCreation(
  request: FastifyRequest,
  entity: string,
  entityId: string,
  data?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent(request, 'CREATE', entity, entityId, data);
}

/**
 * Middleware to log data update
 */
export async function logDataUpdate(
  request: FastifyRequest,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent(request, 'UPDATE', entity, entityId, changes);
}

/**
 * Middleware to log data deletion
 */
export async function logDataDeletion(
  request: FastifyRequest,
  entity: string,
  entityId: string
): Promise<void> {
  await logAuditEvent(request, 'DELETE', entity, entityId);
}

/**
 * Middleware to log export actions
 */
export async function logExport(
  request: FastifyRequest,
  reportType: string,
  parameters?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent(request, 'EXPORT', 'Report', undefined, {
    type: reportType,
    parameters,
  });
}

/**
 * Middleware to log failed authentication attempts
 */
export async function logFailedLogin(
  request: FastifyRequest,
  email: string,
  reason: string
): Promise<void> {
  await logAuditEvent(request, 'LOGIN_FAILED', 'User', undefined, {
    email,
    reason,
  });
}
