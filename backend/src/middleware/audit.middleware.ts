import { FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getClientIP, getUserAgent } from '../utils/security.js';

const prisma = new PrismaClient();

export async function logAuditEvent(
  request: FastifyRequest,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: (request as any).user?.id || null,
        userEmail: (request as any).user?.email || 'system',
        userRole: (request as any).user?.role || 'UNKNOWN',
        action,
        resource: resource || 'system',
        resourceId: resourceId || null,
        details: details as any,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function logLogin(request: FastifyRequest, userId: string): Promise<void> {
  await logAuditEvent(request, 'LOGIN', 'auth', userId);
}

export async function logLogout(request: FastifyRequest): Promise<void> {
  await logAuditEvent(request, 'LOGOUT', 'auth', (request as any).user?.id);
}

export async function logDataAccess(request: FastifyRequest, resource: string, resourceId: string): Promise<void> {
  await logAuditEvent(request, 'READ', resource, resourceId);
}

export async function logDataCreation(request: FastifyRequest, resource: string, resourceId: string, data?: Record<string, unknown>): Promise<void> {
  await logAuditEvent(request, 'CREATE', resource, resourceId, data);
}

export async function logDataUpdate(request: FastifyRequest, resource: string, resourceId: string, changes?: Record<string, unknown>): Promise<void> {
  await logAuditEvent(request, 'UPDATE', resource, resourceId, changes);
}

export async function logDataDeletion(request: FastifyRequest, resource: string, resourceId: string): Promise<void> {
  await logAuditEvent(request, 'DELETE', resource, resourceId);
}

export async function logExport(request: FastifyRequest, reportType: string, parameters?: Record<string, unknown>): Promise<void> {
  await logAuditEvent(request, 'EXPORT', 'report', undefined, { type: reportType, parameters });
}

export async function logFailedLogin(request: FastifyRequest, email: string, reason: string): Promise<void> {
  await logAuditEvent(request, 'LOGIN_FAILED', 'auth', undefined, { email, reason });
}
