/**
 * Routes du module Partenaires Techniques et Financiers — Phase 1 (RBAC).
 *
 * - POST /admin/users/bailleur (ADMIN) : création d'un compte BAILLEUR rattaché à un PTF
 * - POST /partenaire/cgu/accept (BAILLEUR) : acceptation des CGU à la première connexion
 *
 * Routes métier (manifestations, propositions, etc.) : phases 4-5.
 */

import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

function generateTempPassword(): string {
  // 16 caractères alphanumériques + symboles légers (lisibles à l'oral)
  return crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 16);
}

export async function adminBailleurRoutes(app: FastifyInstance) {
  // POST /admin/users/bailleur — création d'un compte BAILLEUR (ADMIN only)
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { email, ptfId, password, nomComplet, fonction } = req.body as {
      email?: string;
      ptfId?: string;
      password?: string;
      nomComplet?: string;
      fonction?: string;
    };

    if (!email || !ptfId) {
      return reply.status(400).send({ error: 'email et ptfId requis' });
    }

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    const ptf = await app.prisma.pTF.findUnique({ where: { id: ptfId } });
    if (!ptf) {
      return reply.status(404).send({ error: 'PTF non trouvé' });
    }

    const finalPassword = password || generateTempPassword();
    const hash = await bcrypt.hash(finalPassword, SALT_ROUNDS);

    const user = await app.prisma.user.create({
      data: {
        email,
        password: hash,
        role: 'BAILLEUR',
        ptfId,
        mustChangePassword: true,
      } as any,
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          action: 'CREATE',
          resource: 'user',
          resourceId: user.id,
          resourceLabel: `bailleur ${email} → PTF ${ptf.code}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
          details: { nomComplet: nomComplet || null, fonction: fonction || null },
        },
      });
    } catch {}

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ptfId: (user as any).ptfId,
        ptf: { code: ptf.code, nom: ptf.nom },
      },
      temporaryPassword: finalPassword, // À transmettre via canal sécurisé
    });
  });
}

export async function partenaireRoutes(app: FastifyInstance) {
  // POST /partenaire/cgu/accept — acceptation des CGU (BAILLEUR, sans vérif CGU préalable)
  app.post('/cgu/accept', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (req.user.role !== 'BAILLEUR') {
      return reply.status(403).send({ error: 'Réservé aux comptes Partenaire Technique et Financier' });
    }

    const updated = await app.prisma.user.update({
      where: { id: req.user.id },
      data: { cguAccepteesAt: new Date() } as any,
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          action: 'UPDATE',
          resource: 'user',
          resourceId: req.user.id,
          resourceLabel: 'cgu-accepted',
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.send({
      ok: true,
      cguAccepteesAt: (updated as any).cguAccepteesAt,
      message: 'CGU acceptées. Le token JWT actuel doit être renouvelé pour refléter ce changement.',
    });
  });
}
