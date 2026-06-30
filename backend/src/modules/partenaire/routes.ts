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

  // =========================================================================
  // Manifestations d'intérêt — dépôt et suivi côté PTF
  //
  // Cycle de vie : DRAFT (modifiable / supprimable par le PTF) ->
  // EN_VALIDATION (verrouillé côté PTF, en attente DU) -> PUBLIE / REJETE.
  // Une seule manifestation "active" (statut != REJETE/RETIRE) par couple
  // (casUsageId, ptfId) : un PTF qui veut relancer après refus crée une
  // nouvelle manifestation.
  //
  // Le champ "fenêtreTemporelle" (Q3 2026, S1 2027...) est préfixé au
  // commentaire côté backend pour éviter une migration prod à 4 jours du
  // code freeze atelier (cf. note articulation manifestation ↔ financement).
  // =========================================================================

  const ACTIVE_STATUTS = ['DRAFT', 'EN_VALIDATION', 'PUBLIE'];
  const FENETRE_PREFIX = 'Fenêtre temporelle';

  function buildCommentaire(commentaire: string, fenetre?: string | null): string {
    const base = (commentaire || '').trim();
    if (!fenetre || !fenetre.trim()) return base;
    return `${FENETRE_PREFIX}: ${fenetre.trim()}\n\n${base}`;
  }

  function parseCommentaire(stored: string | null | undefined): { fenetreTemporelle: string | null; commentaire: string } {
    if (!stored) return { fenetreTemporelle: null, commentaire: '' };
    const m = stored.match(/^Fenêtre temporelle:\s*([^\n]+)\n\n([\s\S]*)$/);
    if (m) return { fenetreTemporelle: m[1].trim(), commentaire: m[2] };
    return { fenetreTemporelle: null, commentaire: stored };
  }

  function validateManifestationInput(body: any): { ok: true; data: any } | { ok: false; error: string } {
    const type = body?.type;
    if (type !== 'INTERET' && type !== 'FINANCEMENT') {
      return { ok: false, error: 'Champ "type" requis (INTERET ou FINANCEMENT)' };
    }
    const commentaire = typeof body?.commentaire === 'string' ? body.commentaire.trim() : '';
    if (commentaire.length < 200) return { ok: false, error: 'Le commentaire doit faire au moins 200 caractères' };
    if (commentaire.length > 2000) return { ok: false, error: 'Le commentaire ne peut pas dépasser 2000 caractères' };

    const fenetreTemporelle = body?.fenetreTemporelle ? String(body.fenetreTemporelle).trim() : null;
    if (fenetreTemporelle && fenetreTemporelle.length > 80) {
      return { ok: false, error: 'La fenêtre temporelle est limitée à 80 caractères' };
    }

    let montantEstime: number | null = null;
    let devise: string | null = null;
    let instrumentFinancier: string | null = null;

    if (type === 'FINANCEMENT') {
      const raw = body?.montantEstime;
      const parsed = typeof raw === 'number' ? raw : parseFloat(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { ok: false, error: 'Montant estimé requis (> 0) pour une manifestation de type FINANCEMENT' };
      }
      montantEstime = parsed;

      devise = body?.devise || null;
      if (!devise || !['XOF', 'EUR', 'USD'].includes(devise)) {
        return { ok: false, error: 'Devise requise (XOF, EUR ou USD)' };
      }

      instrumentFinancier = body?.instrumentFinancier || null;
      const ALLOWED = ['DON', 'PRET_CONCESSIONNEL', 'PRET_SOUVERAIN', 'ASSISTANCE_TECHNIQUE', 'MIXTE'];
      if (!instrumentFinancier || !ALLOWED.includes(instrumentFinancier)) {
        return { ok: false, error: 'Instrument financier requis (DON, PRET_CONCESSIONNEL, PRET_SOUVERAIN, ASSISTANCE_TECHNIQUE, MIXTE)' };
      }
    }

    return {
      ok: true,
      data: {
        type,
        commentaire,
        fenetreTemporelle,
        montantEstime,
        devise,
        instrumentFinancier,
      },
    };
  }

  function clientIp(req: any): string | undefined {
    return req.headers['x-forwarded-for']?.toString() || req.ip;
  }

  async function logPtfAudit(action: string, userId: string, objetId: string, details: any, req: any) {
    try {
      await app.prisma.journalAuditPtf.create({
        data: {
          userId,
          action: action as any,
          objetType: 'manifestation',
          objetId,
          details,
          ipAddress: clientIp(req),
          userAgent: req.headers['user-agent'],
        },
      });
    } catch (e) {
      app.log.warn({ err: e }, 'journal_audit_ptf write failed');
    }
  }

  // Vérifie que le cas d'usage est éligible au périmètre BAILLEUR (PRIORISE/EN_PROD + aFinancer + domaine).
  async function assertCasInPerimetre(casUsageId: string, ptfId: string): Promise<{ ok: true; cas: any } | { ok: false; status: number; error: string }> {
    const cas = await app.prisma.casUsageMVP.findUnique({
      where: { id: casUsageId },
      select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true, aFinancer: true },
    });
    if (!cas) return { ok: false, status: 404, error: 'Cas d\'usage introuvable' };
    if (!cas.aFinancer || !['PRIORISE', 'EN_PRODUCTION_360'].includes(cas.statutVueSection)) {
      return { ok: false, status: 403, error: 'Ce cas n\'est pas dans le périmètre partenaire' };
    }
    const domaines = await getDomainesPtf(app, ptfId);
    if (domaines.length > 0 && cas.domaine && !domaines.includes(cas.domaine)) {
      return { ok: false, status: 403, error: 'Ce cas n\'est pas dans vos domaines d\'intérêt' };
    }
    return { ok: true, cas };
  }

  // GET /partenaire/manifestations — liste des manifestations du PTF connecté
  // Query: statut?, casUsageId?
  app.get('/manifestations', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const { statut, casUsageId } = req.query as any;
    const where: any = { ptfId };
    if (statut) where.statut = statut;
    if (casUsageId) where.casUsageId = casUsageId;

    const items = await app.prisma.manifestationInteret.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        casUsage: { select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true } },
      },
    });

    const data = items.map((m: any) => {
      const parsed = parseCommentaire(m.commentaire);
      return {
        id: m.id,
        casUsageId: m.casUsageId,
        casUsage: m.casUsage,
        type: m.type,
        statut: m.statut,
        commentaire: parsed.commentaire,
        fenetreTemporelle: parsed.fenetreTemporelle,
        montantEstime: m.montantEstime,
        devise: m.devise,
        instrumentFinancier: m.instrumentFinancier,
        motifRejet: m.motifRejet,
        dateValidation: m.dateValidation,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });

    return reply.send({ data, total: data.length });
  });

  // GET /partenaire/manifestations/:id — détail
  app.get('/manifestations/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const m = await app.prisma.manifestationInteret.findUnique({
      where: { id: req.params.id },
      include: { casUsage: { select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true } } },
    });
    if (!m || m.ptfId !== ptfId) return reply.status(404).send({ error: 'Manifestation introuvable' });

    const parsed = parseCommentaire(m.commentaire);
    return reply.send({
      id: m.id,
      casUsageId: m.casUsageId,
      casUsage: (m as any).casUsage,
      type: m.type,
      statut: m.statut,
      commentaire: parsed.commentaire,
      fenetreTemporelle: parsed.fenetreTemporelle,
      montantEstime: m.montantEstime,
      devise: m.devise,
      instrumentFinancier: m.instrumentFinancier,
      motifRejet: m.motifRejet,
      dateValidation: m.dateValidation,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  });

  // POST /partenaire/manifestations — création en DRAFT
  // Body: { casUsageId, type, commentaire, fenetreTemporelle?, montantEstime?, devise?, instrumentFinancier? }
  app.post('/manifestations', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const { casUsageId } = req.body as any;
    if (!casUsageId) return reply.status(400).send({ error: 'casUsageId requis' });

    const perim = await assertCasInPerimetre(casUsageId, ptfId);
    if (!perim.ok) return reply.status(perim.status).send({ error: perim.error });

    const v = validateManifestationInput(req.body);
    if (!v.ok) return reply.status(400).send({ error: v.error });

    // Unicité fonctionnelle : une seule manifestation active (DRAFT/EN_VALIDATION/PUBLIE) par (cas, PTF)
    const existing = await app.prisma.manifestationInteret.findFirst({
      where: { casUsageId, ptfId, statut: { in: ACTIVE_STATUTS as any } },
      select: { id: true, statut: true },
    });
    if (existing) {
      return reply.status(409).send({
        error: 'Une manifestation existe déjà pour ce cas',
        existingId: existing.id,
        existingStatut: existing.statut,
      });
    }

    const created = await app.prisma.manifestationInteret.create({
      data: {
        casUsageId,
        ptfId,
        userId: req.user.id,
        type: v.data.type,
        statut: 'DRAFT',
        commentaire: buildCommentaire(v.data.commentaire, v.data.fenetreTemporelle),
        montantEstime: v.data.montantEstime,
        devise: v.data.devise,
        instrumentFinancier: v.data.instrumentFinancier,
      },
    });

    await logPtfAudit('CREATION_MANIFESTATION', req.user.id, created.id, {
      casUsageId, casCode: perim.cas.code, type: v.data.type,
    }, req);

    return reply.status(201).send({ id: created.id, statut: created.statut });
  });

  // PUT /partenaire/manifestations/:id — modification (uniquement si DRAFT)
  app.put('/manifestations/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const m = await app.prisma.manifestationInteret.findUnique({ where: { id: req.params.id } });
    if (!m || m.ptfId !== ptfId) return reply.status(404).send({ error: 'Manifestation introuvable' });
    if (m.statut !== 'DRAFT') {
      return reply.status(409).send({ error: 'Seules les manifestations en brouillon (DRAFT) peuvent être modifiées' });
    }

    const v = validateManifestationInput(req.body);
    if (!v.ok) return reply.status(400).send({ error: v.error });

    const updated = await app.prisma.manifestationInteret.update({
      where: { id: m.id },
      data: {
        type: v.data.type,
        commentaire: buildCommentaire(v.data.commentaire, v.data.fenetreTemporelle),
        montantEstime: v.data.montantEstime,
        devise: v.data.devise,
        instrumentFinancier: v.data.instrumentFinancier,
      },
    });

    await logPtfAudit('MODIFICATION_MANIFESTATION', req.user.id, updated.id, {
      casUsageId: m.casUsageId,
      diff: { typeAvant: m.type, typeApres: v.data.type },
    }, req);

    return reply.send({ id: updated.id, statut: updated.statut });
  });

  // POST /partenaire/manifestations/:id/submit — DRAFT -> EN_VALIDATION
  app.post('/manifestations/:id/submit', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const m = await app.prisma.manifestationInteret.findUnique({ where: { id: req.params.id } });
    if (!m || m.ptfId !== ptfId) return reply.status(404).send({ error: 'Manifestation introuvable' });
    if (m.statut !== 'DRAFT') {
      return reply.status(409).send({ error: 'Seules les manifestations en brouillon peuvent être soumises' });
    }

    const updated = await app.prisma.manifestationInteret.update({
      where: { id: m.id },
      data: { statut: 'EN_VALIDATION' },
    });

    await logPtfAudit('SOUMISSION_MANIFESTATION', req.user.id, updated.id, {
      casUsageId: m.casUsageId, type: m.type,
    }, req);

    return reply.send({ id: updated.id, statut: updated.statut });
  });

  // DELETE /partenaire/manifestations/:id — uniquement si DRAFT
  app.delete('/manifestations/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    if (!isBailleur(req)) return reply.status(403).send({ error: 'Réservé aux comptes PTF' });
    const ptfId = req.user.ptfId;
    if (!ptfId) return reply.status(400).send({ error: 'Compte PTF non rattaché à un partenaire' });

    const m = await app.prisma.manifestationInteret.findUnique({ where: { id: req.params.id } });
    if (!m || m.ptfId !== ptfId) return reply.status(404).send({ error: 'Manifestation introuvable' });
    if (m.statut !== 'DRAFT') {
      return reply.status(409).send({ error: 'Seules les manifestations en brouillon peuvent être supprimées' });
    }

    await app.prisma.manifestationInteret.delete({ where: { id: m.id } });
    await logPtfAudit('RETRAIT_MANIFESTATION', req.user.id, m.id, {
      casUsageId: m.casUsageId, type: m.type,
    }, req);

    return reply.send({ success: true });
  });
}

// ===========================================================================
// Helpers communs admin (parseur fenêtre temporelle + KPI manifestations)
// ===========================================================================
function parseFenetreCommentaire(stored: string | null | undefined) {
  const s = stored || '';
  const match = s.match(/^Fenêtre temporelle:\s*([^\n]+)\n\n([\s\S]*)$/);
  return {
    fenetreTemporelle: match ? match[1].trim() : null,
    commentaire: match ? match[2] : s,
  };
}

function emptyKpis() {
  return { DRAFT: 0, EN_VALIDATION: 0, PUBLIE: 0, REJETE: 0, RETIRE: 0 } as Record<string, number>;
}

async function computeManifestationKpis(app: FastifyInstance, where: any): Promise<Record<string, number>> {
  const grouped = await app.prisma.manifestationInteret.groupBy({
    by: ['statut'],
    where,
    _count: { _all: true },
  });
  const kpis = emptyKpis();
  grouped.forEach((g: any) => { kpis[g.statut] = g._count._all; });
  return kpis;
}

// ===========================================================================
// Routes admin lecture seule pour les manifestations PTF (v1 atelier 19/05).
// La validation / le rejet seront ajoutés post-atelier (cf. AuditAction
// VALIDATION_MANIFESTATION et REJET_MANIFESTATION déjà présentes côté enum).
// ===========================================================================
export async function adminManifestationsRoutes(app: FastifyInstance) {
  // GET /api/admin/manifestations
  // Query : statut?, ptfId?, casUsageId?, domaine?, dateDebut?, dateFin?, page=1, pageSize=20
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const q = req.query as any;
    const where: any = {};
    if (q.statut) where.statut = q.statut;
    if (q.ptfId) where.ptfId = q.ptfId;
    if (q.casUsageId) where.casUsageId = q.casUsageId;
    if (q.domaine) where.casUsage = { domaine: q.domaine };

    // Période de soumission = createdAt entre dateDebut et dateFin
    if (q.dateDebut || q.dateFin) {
      where.createdAt = {};
      if (q.dateDebut) where.createdAt.gte = new Date(q.dateDebut);
      if (q.dateFin) {
        // Inclure toute la journée de dateFin
        const end = new Date(q.dateFin);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize, 10) || 20));
    const skip = (page - 1) * pageSize;

    const [items, total, kpis] = await Promise.all([
      app.prisma.manifestationInteret.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          ptf: { select: { id: true, code: true, nom: true, acronyme: true } },
          casUsage: { select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true } },
          user: { select: { id: true, email: true } },
        },
      }),
      app.prisma.manifestationInteret.count({ where }),
      computeManifestationKpis(app, {}), // KPI globaux indépendants des filtres
    ]);

    const data = items.map((m: any) => {
      const parsed = parseFenetreCommentaire(m.commentaire);
      return {
        id: m.id,
        statut: m.statut,
        type: m.type,
        commentaire: parsed.commentaire,
        fenetreTemporelle: parsed.fenetreTemporelle,
        montantEstime: m.montantEstime,
        devise: m.devise,
        instrumentFinancier: m.instrumentFinancier,
        motifRejet: m.motifRejet,
        ptf: m.ptf,
        casUsage: m.casUsage,
        user: m.user,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        dateValidation: m.dateValidation,
      };
    });

    return reply.send({
      data, total,
      page, pageSize,
      totalPages: Math.ceil(total / pageSize),
      kpis,
      // Alias historique (compat AdminManifestationsPage v1)
      byStatut: kpis,
    });
  });

  // GET /api/admin/manifestations/:id — détail enrichi + historique journal_audit_ptf
  app.get('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const m: any = await app.prisma.manifestationInteret.findUnique({
      where: { id: req.params.id },
      include: {
        ptf: true,
        casUsage: { select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true, aFinancer: true } },
        user: { select: { id: true, email: true } },
      },
    });
    if (!m) return reply.status(404).send({ error: 'Manifestation introuvable' });

    const parsed = parseFenetreCommentaire(m.commentaire);

    // Historique des actions PTF sur cette manifestation
    const audit = await app.prisma.journalAuditPtf.findMany({
      where: { objetType: 'manifestation', objetId: m.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true } } },
    });

    return reply.send({
      ...m,
      commentaire: parsed.commentaire,
      fenetreTemporelle: parsed.fenetreTemporelle,
      historique: audit.map((a: any) => ({
        id: a.id,
        action: a.action,
        userEmail: a.user?.email,
        createdAt: a.createdAt,
        details: a.details,
      })),
    });
  });
}

// ===========================================================================
// Routes admin pour la file des PTF (BAILLEUR users + organisations PTF)
// Pour l'atelier 19/05, les "PTF actifs" sont les comptes BAILLEUR. La fiche
// est indexée par user.id (BAILLEUR) pour une démo cohérente "1 user = 1 PTF".
// ===========================================================================
export async function adminPtfRoutes(app: FastifyInstance) {
  // GET /api/admin/ptf — liste des comptes BAILLEUR enrichis
  // Query : domaine?, actif? ('true'|'false'), page, pageSize
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const q = req.query as any;
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize, 10) || 20));
    const skip = (page - 1) * pageSize;

    // Le model User n'a pas de champ actif/inactif (cf. schema.prisma) ;
    // pour l'instant on traite tout BAILLEUR ayant un ptfId comme "actif".
    const where: any = { role: 'BAILLEUR' };
    const filtreActif: 'true' | 'false' | null = q.actif === 'true' ? 'true' : q.actif === 'false' ? 'false' : null;

    // Filtre par domaine d'intérêt du PTF
    let ptfIdsByDomaine: string[] | null = null;
    if (q.domaine) {
      const rows = await app.prisma.bailleurDomaineInteret.findMany({
        where: { domaine: q.domaine },
        select: { ptfId: true },
      });
      ptfIdsByDomaine = rows.map((r: any) => r.ptfId);
      if (ptfIdsByDomaine.length === 0) {
        return reply.send({ data: [], total: 0, page, pageSize, totalPages: 0, kpis: ptfListKpisEmpty() });
      }
      where.ptfId = { in: ptfIdsByDomaine };
    }

    const baseUsers = await app.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, createdAt: true, lastLoginAt: true,
        ptfId: true,
        ptf: {
          select: {
            id: true, code: true, nom: true, acronyme: true, type: true, pays: true,
            contactNom: true, contactEmail: true, contactTel: true,
            domainesInteret: { select: { domaine: true } },
          },
        },
      } as any,
    });

    // Stats manifestations par ptfId (groupBy statut)
    const allPtfIds = baseUsers.map((u: any) => u.ptfId).filter(Boolean);
    const manifGroups = allPtfIds.length > 0
      ? await app.prisma.manifestationInteret.groupBy({
          by: ['ptfId', 'statut'],
          where: { ptfId: { in: allPtfIds } },
          _count: { _all: true },
        })
      : [];

    const statsByPtf: Record<string, Record<string, number>> = {};
    manifGroups.forEach((g: any) => {
      if (!statsByPtf[g.ptfId]) statsByPtf[g.ptfId] = emptyKpis();
      statsByPtf[g.ptfId][g.statut] = g._count._all;
    });

    // Cas couverts (distinct casUsageId pour les manifestations actives)
    const casCovered = allPtfIds.length > 0
      ? await app.prisma.manifestationInteret.findMany({
          where: { ptfId: { in: allPtfIds }, statut: { in: ['DRAFT', 'EN_VALIDATION', 'PUBLIE'] as any } },
          select: { casUsageId: true },
          distinct: ['casUsageId'],
        })
      : [];

    const enriched = baseUsers.map((u: any) => {
      const stats = statsByPtf[u.ptfId] || emptyKpis();
      const totalManif = Object.values(stats).reduce((a, b) => a + b, 0);
      const enCours = (stats.DRAFT || 0) + (stats.EN_VALIDATION || 0) + (stats.PUBLIE || 0);
      // Le model User n'a pas de champ actif — proxy : s'est déjà connecté
      const actif = !!u.lastLoginAt;
      return {
        id: u.id,
        email: u.email,
        actif,
        createdAt: u.createdAt,
        derniereConnexion: u.lastLoginAt,
        ptf: u.ptf ? {
          ...u.ptf,
          domainesInteret: u.ptf.domainesInteret.map((d: any) => d.domaine),
        } : null,
        stats: {
          ...stats,
          total: totalManif,
          enCours,
        },
      };
    });

    // Filtre actif/inactif basé sur le proxy lastLoginAt
    let filtered = enriched;
    if (filtreActif === 'true') filtered = filtered.filter((u: any) => u.actif);
    if (filtreActif === 'false') filtered = filtered.filter((u: any) => !u.actif);

    // Tri par activité récente DESC
    filtered.sort((a: any, b: any) => {
      const aT = a.derniereConnexion ? new Date(a.derniereConnexion).getTime() : 0;
      const bT = b.derniereConnexion ? new Date(b.derniereConnexion).getTime() : 0;
      if (aT !== bT) return bT - aT;
      // Tiebreaker : nombre de manifestations
      return b.stats.total - a.stats.total;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + pageSize);

    // KPIs globaux liste PTF — calculés sur enriched (toute la base, hors filtre actif)
    const ptfActifs = enriched.filter((u: any) => u.actif).length;
    const ptfAvecManif = enriched.filter((u: any) => u.stats.total > 0).length;
    const totalManif = enriched.reduce((acc: number, u: any) => acc + u.stats.total, 0);
    const kpis = {
      ptfActifs,
      ptfAvecManifestations: ptfAvecManif,
      totalManifestations: totalManif,
      casCouverts: casCovered.length,
    };

    return reply.send({
      data: paginated,
      total,
      page, pageSize,
      totalPages: Math.ceil(total / pageSize),
      kpis,
    });
  });

  // GET /api/admin/ptf/:id — fiche détaillée d'un BAILLEUR
  app.get('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const u: any = await app.prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, role: true, createdAt: true,
        lastLoginAt: true, cguAccepteesAt: true,
        ptfId: true,
        ptf: {
          select: {
            id: true, code: true, nom: true, acronyme: true, type: true, pays: true,
            contactNom: true, contactEmail: true, contactTel: true,
            domainesInteret: { select: { domaine: true } },
          },
        },
      } as any,
    });
    if (!u || u.role !== 'BAILLEUR') return reply.status(404).send({ error: 'Compte PTF introuvable' });

    // Stats manifestations
    const stats = u.ptfId
      ? await computeManifestationKpis(app, { ptfId: u.ptfId })
      : emptyKpis();

    // Cas couverts (distinct par manifestations actives)
    const casCovered = u.ptfId
      ? await app.prisma.manifestationInteret.findMany({
          where: { ptfId: u.ptfId, statut: { in: ['DRAFT', 'EN_VALIDATION', 'PUBLIE'] as any } },
          select: { casUsageId: true },
          distinct: ['casUsageId'],
        })
      : [];

    // Connexions 30j (audit_logs LOGIN_SUCCESS)
    const trenteJoursAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const connexions30j = await app.prisma.auditLog.count({
      where: { userId: u.id, action: 'LOGIN_SUCCESS' as any, createdAt: { gte: trenteJoursAgo } },
    });

    // Compteurs de cas éligibles par domaine du PTF
    let parDomaine: Array<{ domaine: string; nbEligibles: number }> = [];
    if (u.ptf?.domainesInteret?.length) {
      const groups = await app.prisma.casUsageMVP.groupBy({
        by: ['domaine'],
        where: {
          aFinancer: true,
          statutVueSection: { in: ['PRIORISE', 'EN_PRODUCTION_360'] as any },
          domaine: { in: u.ptf.domainesInteret.map((d: any) => d.domaine) },
        },
        _count: { _all: true },
      });
      parDomaine = u.ptf.domainesInteret.map((d: any) => ({
        domaine: d.domaine,
        nbEligibles: groups.find((g: any) => g.domaine === d.domaine)?._count._all || 0,
      }));
    }

    return reply.send({
      id: u.id,
      email: u.email,
      actif: !!u.lastLoginAt,
      createdAt: u.createdAt,
      derniereConnexion: u.lastLoginAt,
      cguAccepteesAt: u.cguAccepteesAt,
      ptf: u.ptf ? {
        ...u.ptf,
        domainesInteret: u.ptf.domainesInteret.map((d: any) => d.domaine),
      } : null,
      stats: {
        ...stats,
        total: Object.values(stats).reduce((a, b) => a + b, 0),
        casCouverts: casCovered.length,
        connexions30j,
      },
      domainesAvecEligibilite: parDomaine,
    });
  });

  // GET /api/admin/ptf/:id/manifestations — manifestations d'un BAILLEUR
  app.get('/:id/manifestations', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const u: any = await app.prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, ptfId: true, role: true } });
    if (!u || u.role !== 'BAILLEUR' || !u.ptfId) return reply.status(404).send({ error: 'Compte PTF introuvable' });

    const items = await app.prisma.manifestationInteret.findMany({
      where: { ptfId: u.ptfId },
      orderBy: { createdAt: 'desc' },
      include: {
        casUsage: { select: { id: true, code: true, titre: true, domaine: true, statutVueSection: true } },
      },
    });

    const data = items.map((m: any) => {
      const parsed = parseFenetreCommentaire(m.commentaire);
      return {
        id: m.id, statut: m.statut, type: m.type,
        commentaire: parsed.commentaire,
        fenetreTemporelle: parsed.fenetreTemporelle,
        montantEstime: m.montantEstime,
        devise: m.devise,
        instrumentFinancier: m.instrumentFinancier,
        casUsage: m.casUsage,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        dateValidation: m.dateValidation,
      };
    });

    const kpis = await computeManifestationKpis(app, { ptfId: u.ptfId });
    return reply.send({ data, total: data.length, kpis });
  });
}

function ptfListKpisEmpty() {
  return { ptfActifs: 0, ptfAvecManifestations: 0, totalManifestations: 0, casCouverts: 0 };
}
