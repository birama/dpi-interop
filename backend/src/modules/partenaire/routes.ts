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

// Helper : récupère les domaines d'intérêt du PTF du user connecté
async function getDomainesPtf(app: FastifyInstance, userPtfId: string | null | undefined): Promise<string[]> {
  if (!userPtfId) return [];
  const rows = await app.prisma.bailleurDomaineInteret.findMany({
    where: { ptfId: userPtfId },
    select: { domaine: true },
  });
  return rows.map((r: any) => r.domaine);
}

function isBailleur(req: any): boolean {
  return req.user?.role === 'BAILLEUR';
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

  // ===========================================================================
  // PTF MVP — Routes parcours BAILLEUR (atelier 19/05/2026)
  // ===========================================================================

  // GET /partenaire/dashboard — KPIs + 5 derniers cas éligibles
  app.get('/dashboard', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const domaines = await getDomainesPtf(app, ptfId);
    const where: any = {
      aFinancer: true,
      statutVueSection: { in: ['PRIORISE', 'EN_PRODUCTION_360'] },
    };
    if (domaines.length > 0) where.domaine = { in: domaines };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [nbCasEligibles, recents, recents7d] = await Promise.all([
      app.prisma.casUsageMVP.count({ where }),
      app.prisma.casUsageMVP.findMany({
        where,
        select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true, updatedAt: true, institutionSourceCode: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      app.prisma.casUsageMVP.count({
        where: { ...where, updatedAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const ptf = await app.prisma.pTF.findUnique({ where: { id: ptfId }, select: { code: true, nom: true } });

    return reply.send({
      ptf,
      kpis: {
        casEligibles: nbCasEligibles,
        domainesCouverts: domaines.length,
        recents7Jours: recents7d,
      },
      domainesInteret: domaines,
      recents,
    });
  });

  // GET /partenaire/catalogue — liste filtrée
  app.get('/catalogue', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const { domaine, search, page = '1', pageSize = '20' } = req.query as any;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);

    const domainesPtf = await getDomainesPtf(app, ptfId);
    const where: any = {
      aFinancer: true,
      statutVueSection: { in: ['PRIORISE', 'EN_PRODUCTION_360'] },
    };
    if (domainesPtf.length > 0) where.domaine = { in: domainesPtf };
    if (domaine) where.domaine = domaine; // override (intersection avec domaines PTF si pas dans liste = vide)
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { titre: { contains: search, mode: 'insensitive' } },
        { resumeMetier: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      app.prisma.casUsageMVP.findMany({
        where,
        select: {
          id: true, code: true, titre: true, resumeMetier: true,
          domaine: true, statutVueSection: true, typologie: true,
          institutionSourceCode: true,
          // Indicateur "sans financement identifié" = aucun Financement actif
          _count: { select: { financements: true } },
        },
        orderBy: [{ domaine: 'asc' }, { code: 'asc' }],
        skip, take,
      }),
      app.prisma.casUsageMVP.count({ where }),
    ]);

    return reply.send({
      data: items,
      total,
      page: parseInt(page, 10),
      pageSize: take,
      totalPages: Math.ceil(total / take),
      domainesInteret: domainesPtf,
    });
  });

  // GET /partenaire/cas/:id — Vue 360 BAILLEUR (champs sensibles masqués)
  app.get('/cas/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const domaines = await getDomainesPtf(app, ptfId);

    const cas = await app.prisma.casUsageMVP.findUnique({
      where: { id: req.params.id },
      include: {
        // Stakeholders : seulement institution + rôle (pas feedbacks/consultations)
        stakeholders360: {
          where: { actif: true },
          select: {
            id: true, role: true,
            institution: { select: { id: true, code: true, nom: true, ministere: true } },
          },
        },
        registresAssocies: {
          select: {
            id: true, mode: true,
            registre: { select: { id: true, code: true, nom: true, domaine: true } },
          },
        },
        relationsMetier: {
          select: { id: true, casUsageTechnique: { select: { id: true, code: true, titre: true } } },
        },
        relationsTechnique: {
          select: { id: true, casUsageMetier: { select: { id: true, code: true, titre: true } } },
        },
        phaseMVP: { select: { code: true, nom: true } },
      },
    });

    if (!cas) return reply.status(404).send({ error: 'Cas d\'usage introuvable' });

    // Périmètre BAILLEUR : doit être PRIORISE/EN_PROD + aFinancer + dans domaines (si PTF a déclaré)
    if (!cas.aFinancer || !['PRIORISE', 'EN_PRODUCTION_360'].includes(cas.statutVueSection)) {
      return reply.status(403).send({ error: 'Ce cas n\'est pas dans le périmètre partenaire' });
    }
    if (domaines.length > 0 && cas.domaine && !domaines.includes(cas.domaine)) {
      return reply.status(403).send({ error: 'Ce cas n\'est pas dans vos domaines d\'intérêt' });
    }

    // Projection partenaire — masquage explicite des champs sensibles
    const projection = {
      id: cas.id,
      code: cas.code,
      titre: cas.titre,
      resumeMetier: cas.resumeMetier,
      description: cas.description,
      domaine: cas.domaine,
      axePrioritaire: cas.axePrioritaire,
      typologie: cas.typologie,
      statutVueSection: cas.statutVueSection,
      statutImpl: cas.statutImpl,
      impact: cas.impact,
      complexite: cas.complexite,
      baseLegale: cas.baseLegale,
      donneesEchangees: cas.donneesEchangees,
      registresConcernes: cas.registresConcernes,
      institutionSourceCode: cas.institutionSourceCode,
      institutionCibleCode: cas.institutionCibleCode,
      phaseMVP: cas.phaseMVP,
      dateIdentification: cas.dateIdentification,
      dateLancement: cas.dateLancement,
      dateMiseEnProd: cas.dateMiseEnProd,
      updatedAt: cas.updatedAt,
      stakeholders360: cas.stakeholders360,
      registresAssocies: cas.registresAssocies,
      relationsMetier: cas.relationsMetier,
      relationsTechnique: cas.relationsTechnique,
      // Champs MASQUÉS pour le BAILLEUR (cf. note PTF v0.4 §3.3) :
      // notes, observations, statusHistory, feedbacks, consultations, autres manifestations
      _visibility: 'PARTENAIRE',
    };

    return reply.send(projection);
  });

  // GET /partenaire/profil — Profil PTF connecté (lecture seule)
  app.get('/profil', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, role: true, cguAccepteesAt: true,
        ptf: {
          select: {
            id: true, code: true, nom: true, acronyme: true, type: true, pays: true,
            contactNom: true, contactEmail: true, contactTel: true,
            domainesInteret: { select: { domaine: true } },
          },
        },
      } as any,
    });
    return reply.send(user);
  });
}
