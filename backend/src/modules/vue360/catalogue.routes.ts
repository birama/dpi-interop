/**
 * Routes Vue 360° — Catalogue des propositions (P8)
 *
 * Prefixe d'enregistrement : /catalogue
 *
 *   GET    /propositions                                  — Liste paginee
 *   GET    /propositions/:id                              — Detail
 *   POST   /propositions                                  — Creation (DU only)
 *   PATCH  /propositions/:id                              — Modif (DU only)
 *   POST   /propositions/:id/archive                      — Archiver (DU only)
 *   POST   /propositions/:id/fusionner                    — Fusionner (DU only)
 *   POST   /propositions/:id/adopter                      — Adoption par institution
 *   GET    /adoption-requests                             — Liste des demandes (DU only)
 *   POST   /adoption-requests/:id/valider                 — Valider (DU only)
 *   POST   /adoption-requests/:id/refuser                 — Refuser (DU only)
 *   POST   /suggestions                                   — Detection doublons (fuzzy)
 *
 * Regles de visibilite :
 * - sourceDetail : visible DU + institutions pressenties
 * - Tout le reste des champs est public pour les admins connectees PINS
 */

import { FastifyInstance } from 'fastify';

const MIN_MOTIF_ADOPTION = 50;
const MIN_MOTIF_ARCHIVE = 50;
const SLA_DAYS_CONSULTATION = 15;

export async function catalogueRoutes(app: FastifyInstance) {

  // =========================================================================
  // GET /propositions — Liste paginee des propositions
  // =========================================================================
  app.get('/propositions', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, reply: any) => {
    const {
      q, registres, institutionsPressenties,
      typologie, niveauMaturite, page = '1', pageSize = '12',
    } = req.query as any;
    const p = Math.max(parseInt(page) || 1, 1);
    const ps = Math.min(parseInt(pageSize) || 12, 50);

    const where: any = { statutVueSection: 'PROPOSE' };
    if (typologie && ['METIER', 'TECHNIQUE'].includes(typologie)) where.typologie = typologie;
    if (niveauMaturite && ['ESQUISSE', 'PRE_CADREE', 'PRETE_A_ADOPTER'].includes(niveauMaturite)) {
      where.niveauMaturite = niveauMaturite;
    }
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { titre: { contains: q, mode: 'insensitive' } },
        { resumeMetier: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (registres) {
      const ids = Array.isArray(registres) ? registres : [registres];
      where.registresAssocies = { some: { registreId: { in: ids } } };
    }
    if (institutionsPressenties) {
      const ids = Array.isArray(institutionsPressenties) ? institutionsPressenties : [institutionsPressenties];
      where.institutionsPressenties = { some: { institutionId: { in: ids } } };
    }

    const [total, items] = await Promise.all([
      app.prisma.casUsageMVP.count({ where }),
      app.prisma.casUsageMVP.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: [{ niveauMaturite: 'desc' }, { createdAt: 'desc' }],
        include: {
          institutionsPressenties: {
            include: { institution: { select: { id: true, code: true, nom: true } } },
          },
          registresAssocies: {
            include: { registre: { select: { id: true, code: true, nom: true, domaine: true } } },
          },
        },
      }),
    ]);

    // Masquer sourceDetail si user non DU et non pressentie
    const isAdmin = req.user.role === 'ADMIN';
    const userInstitutionId = req.user.institutionId;
    const projected = items.map((cu: any) => {
      const isPressentie = cu.institutionsPressenties?.some(
        (ip: any) => ip.institutionId === userInstitutionId
      );
      return {
        ...cu,
        sourceDetail: (isAdmin || isPressentie) ? cu.sourceDetail : null,
      };
    });

    return reply.send({
      data: projected,
      pagination: { page: p, pageSize: ps, total, hasMore: p * ps < total },
    });
  });

  // =========================================================================
  // GET /propositions/:id — Detail d'une proposition
  // =========================================================================
  app.get('/propositions/:id', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      include: {
        institutionsPressenties: {
          include: { institution: { select: { id: true, code: true, nom: true, ministere: true } } },
        },
        registresAssocies: {
          include: { registre: { select: { id: true, code: true, nom: true, domaine: true, institutionCode: true } } },
        },
        // Fallback : pour les CU migres en PROPOSE qui n'ont pas de pressenties,
        // on expose les stakeholders existants comme indication des institutions concernees
        stakeholders360: {
          where: { actif: true },
          include: { institution: { select: { id: true, code: true, nom: true } } },
        },
        phaseMVP: true,
        statusHistory: { orderBy: { dateTransition: 'desc' }, take: 20 },
      },
    });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (!['PROPOSE', 'ARCHIVE', 'FUSIONNE'].includes(cu.statutVueSection)) {
      return reply.status(404).send({ error: 'Ce cas d\'usage n\'est plus dans le catalogue' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isPressentie = cu.institutionsPressenties?.some(
      (ip: any) => ip.institutionId === req.user.institutionId
    );
    return reply.send({
      ...cu,
      sourceDetail: (isAdmin || isPressentie) ? cu.sourceDetail : null,
    });
  });

  // =========================================================================
  // POST /propositions — Creation (DU only)
  // =========================================================================
  app.post('/propositions', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const {
      titre, resumeMetier, baseLegale, description,
      typologie, sourceProposition, sourceDetail, niveauMaturite,
      institutionsPressenties, registresAssocies, axePrioritaire, impact,
    } = req.body as any;
    const user = req.user;

    if (!titre) return reply.status(400).send({ error: 'Titre requis' });
    if (!typologie || !['METIER', 'TECHNIQUE'].includes(typologie)) {
      return reply.status(400).send({ error: 'Typologie requise (METIER ou TECHNIQUE)' });
    }

    // Detection de doublon titre exact
    const existing = await app.prisma.casUsageMVP.findFirst({
      where: { titre: { equals: titre, mode: 'insensitive' as const } },
    });
    if (existing) {
      return reply.status(409).send({
        error: `Un cas d'usage existe deja avec ce titre (${existing.code}). Evitez les doublons.`,
      });
    }

    // Generer code PINS-PROP-XXX (numerotation distincte des CU declarees)
    const lastProp = await app.prisma.casUsageMVP.findFirst({
      where: { code: { startsWith: 'PINS-PROP-' } },
      orderBy: { code: 'desc' },
    });
    const propNum = lastProp ? parseInt(lastProp.code.replace('PINS-PROP-', '')) + 1 : 1;
    const code = `PINS-PROP-${String(propNum).padStart(3, '0')}`;

    const created = await app.prisma.$transaction(async (tx: any) => {
      const cu = await tx.casUsageMVP.create({
        data: {
          code, titre, description, resumeMetier, baseLegale,
          statutImpl: 'IDENTIFIE',
          statutVueSection: 'PROPOSE',
          typologie,
          sourceProposition,
          sourceDetail,
          niveauMaturite: niveauMaturite || 'ESQUISSE',
          axePrioritaire: axePrioritaire || null,
          impact: impact || 'MOYEN',
          dateIdentification: new Date(),
        },
      });

      // Institutions pressenties
      if (Array.isArray(institutionsPressenties)) {
        for (const ip of institutionsPressenties) {
          if (ip.institutionId && ip.rolePressenti) {
            await tx.institutionPressentie.create({
              data: {
                casUsageId: cu.id,
                institutionId: ip.institutionId,
                rolePressenti: ip.rolePressenti,
                commentaire: ip.commentaire || null,
              },
            });
          }
        }
      }

      // Registres associes
      if (Array.isArray(registresAssocies)) {
        for (const ra of registresAssocies) {
          if (ra.registreId && ra.mode) {
            await tx.casUsageRegistre.create({
              data: {
                casUsageId: cu.id,
                registreId: ra.registreId,
                mode: ra.mode,
                champsConcernes: ra.champsConcernes || null,
                criticite: ra.criticite || null,
                ajoutePar: user.id,
              },
            });
          }
        }
      }

      // Trace inalterable
      await tx.useCaseStatusHistory.create({
        data: {
          casUsageId: cu.id,
          statusFrom: null,
          statusTo: 'PROPOSE',
          motif: `Creation de proposition — source : ${sourceProposition || 'non precisee'}`,
          auteurUserId: user.id,
          auteurNom: user.email,
          auteurInstitution: 'SENUM SA',
        },
      });

      return cu;
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'CREATE', resource: 'proposition', resourceId: created.id, resourceLabel: created.code,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.status(201).send(created);
  });

  // =========================================================================
  // PATCH /propositions/:id — Modification (DU only)
  // =========================================================================
  app.patch('/propositions/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const body = req.body as any;

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (cu.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Seules les propositions actives peuvent etre modifiees' });
    }

    // Whitelist des champs modifiables
    const data: any = {};
    const modifiables = ['titre', 'resumeMetier', 'baseLegale', 'description',
      'typologie', 'sourceProposition', 'sourceDetail', 'niveauMaturite',
      'axePrioritaire', 'impact'];
    for (const f of modifiables) if (body[f] !== undefined) data[f] = body[f];

    const updated = await app.prisma.casUsageMVP.update({ where: { id }, data });
    return reply.send(updated);
  });

  // =========================================================================
  // POST /propositions/:id/archive (DU only)
  // =========================================================================
  app.post('/propositions/:id/archive', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { motif } = req.body as any;
    const user = req.user;

    if (!motif || motif.trim().length < MIN_MOTIF_ARCHIVE) {
      return reply.status(400).send({ error: `Motif d'archivage requis, min ${MIN_MOTIF_ARCHIVE} caracteres.` });
    }
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      include: {
        institutionsPressenties: {
          include: { institution: { select: { id: true, users: { select: { id: true } } } } },
        },
      },
    });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (cu.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Seules les propositions actives peuvent etre archivees' });
    }

    await app.prisma.$transaction(async (tx: any) => {
      await tx.casUsageMVP.update({ where: { id }, data: { statutVueSection: 'ARCHIVE' } });
      await tx.useCaseStatusHistory.create({
        data: {
          casUsageId: id,
          statusFrom: 'PROPOSE',
          statusTo: 'ARCHIVE',
          motif: `Archivage — ${motif.substring(0, 200)}`,
          auteurUserId: user.id,
          auteurNom: user.email,
          auteurInstitution: 'SENUM SA',
        },
      });
      // Notification aux institutions pressenties
      for (const ip of cu.institutionsPressenties) {
        for (const u of ip.institution.users) {
          try {
            await tx.notification.create({
              data: {
                userId: u.id,
                institutionId: ip.institution.id,
                type: 'ARBITRAGE',
                titre: `Proposition archivee — ${cu.titre}`,
                message: `La Delivery Unit a archive cette proposition. Motif : ${motif.substring(0, 150)}`,
                lienUrl: `/catalogue-propositions/${id}`,
                refType: 'CAS_USAGE',
                refId: id,
              },
            });
          } catch {}
        }
      }
    });
    return reply.send({ ok: true });
  });

  // =========================================================================
  // POST /propositions/:id/fusionner (DU only)
  // =========================================================================
  app.post('/propositions/:id/fusionner', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { cibleId, motif } = req.body as any;
    const user = req.user;

    if (!cibleId) return reply.status(400).send({ error: 'cibleId requis' });
    if (!motif || motif.trim().length < MIN_MOTIF_ARCHIVE) {
      return reply.status(400).send({ error: `Motif de fusion requis, min ${MIN_MOTIF_ARCHIVE} caracteres.` });
    }
    if (id === cibleId) return reply.status(400).send({ error: 'Fusion avec soi-meme impossible' });

    const [source, cible] = await Promise.all([
      app.prisma.casUsageMVP.findUnique({ where: { id } }),
      app.prisma.casUsageMVP.findUnique({ where: { id: cibleId } }),
    ]);
    if (!source) return reply.status(404).send({ error: 'Proposition source non trouvee' });
    if (!cible) return reply.status(404).send({ error: 'Cas d\'usage cible non trouve' });
    if (source.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Seule une proposition PROPOSE peut etre fusionnee' });
    }

    await app.prisma.$transaction(async (tx: any) => {
      await tx.casUsageMVP.update({
        where: { id },
        data: { statutVueSection: 'FUSIONNE', fusionneVersId: cibleId },
      });
      await tx.useCaseStatusHistory.create({
        data: {
          casUsageId: id,
          statusFrom: 'PROPOSE',
          statusTo: 'FUSIONNE',
          motif: `Fusion avec ${cible.code} — ${motif.substring(0, 150)}`,
          auteurUserId: user.id,
          auteurNom: user.email,
          auteurInstitution: 'SENUM SA',
        },
      });
    });
    return reply.send({ ok: true, fusionneVersId: cibleId });
  });

  // =========================================================================
  // POST /propositions/:id/adopter — Adoption par institution (pressentie ou non)
  // =========================================================================
  app.post('/propositions/:id/adopter', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { institutionInitiatriceId, confirmationEngagement, ajustements, motif } = req.body as any;
    const user = req.user;

    if (!confirmationEngagement) {
      return reply.status(400).send({ error: 'Confirmation d\'engagement institutionnel obligatoire' });
    }
    if (!user.institutionId) {
      return reply.status(403).send({ error: 'Utilisateur sans institution — adoption impossible' });
    }
    if (institutionInitiatriceId && institutionInitiatriceId !== user.institutionId) {
      return reply.status(403).send({
        error: 'L\'institution initiatrice doit correspondre a celle de l\'utilisateur connecte.',
      });
    }

    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      include: {
        institutionsPressenties: true,
      },
    });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (cu.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Seule une proposition active peut etre adoptee' });
    }

    const isPressentie = cu.institutionsPressenties.some(
      (ip: any) => ip.institutionId === user.institutionId
    );
    const userInst = await app.prisma.institution.findUnique({
      where: { id: user.institutionId },
      select: { code: true, nom: true, users: { select: { id: true } } },
    });

    // ---- CAS 2 : institution NON pressentie → adoption motivee en file DU
    if (!isPressentie) {
      if (!motif || motif.trim().length < MIN_MOTIF_ADOPTION) {
        return reply.status(400).send({
          error: `Motif d'adoption requis pour une institution non pressentie (min ${MIN_MOTIF_ADOPTION} caracteres).`,
        });
      }
      // Empecher les demandes doublon EN_ATTENTE
      const existing = await app.prisma.adoptionRequest.findFirst({
        where: {
          casUsageId: id,
          institutionDemandeuseId: user.institutionId,
          status: 'EN_ATTENTE',
        },
      });
      if (existing) {
        return reply.status(409).send({ error: 'Une demande d\'adoption est deja en cours pour votre institution' });
      }
      const ar = await app.prisma.adoptionRequest.create({
        data: {
          casUsageId: id,
          institutionDemandeuseId: user.institutionId,
          userDemandeurId: user.id,
          motif: motif.trim(),
          ajustements: ajustements || null,
        },
      });
      // Notifier tous les admins DU
      const admins = await app.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      for (const a of admins) {
        try {
          await app.prisma.notification.create({
            data: {
              userId: a.id,
              type: 'ARBITRAGE',
              titre: `Demande d'adoption — ${cu.titre}`,
              message: `${userInst?.code || 'Une institution'} sollicite l'adoption de cette proposition (non pressentie). Motif : ${motif.substring(0, 100)}`,
              lienUrl: `/catalogue-propositions/${id}`,
              refType: 'CAS_USAGE',
              refId: id,
            },
          });
        } catch {}
      }
      return reply.status(202).send({
        status: 'PENDING_VALIDATION',
        adoptionRequestId: ar.id,
        message: 'Votre demande d\'adoption a ete transmise a la Delivery Unit pour validation.',
      });
    }

    // ---- CAS 1 : institution PRESSENTIE → adoption directe
    const result = await executeAdoption(app, {
      casUsageId: id,
      institutionInitiatriceId: user.institutionId,
      userId: user.id,
      ajustements: ajustements || null,
    });
    return reply.status(201).send(result);
  });

  // =========================================================================
  // GET /adoption-requests — File DU des demandes d'adoption (DU only)
  // =========================================================================
  app.get('/adoption-requests', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { status } = req.query as any;
    const where: any = {};
    if (status && ['EN_ATTENTE', 'VALIDEE', 'REFUSEE'].includes(status)) where.status = status;
    const requests = await app.prisma.adoptionRequest.findMany({
      where,
      include: {
        casUsage: { select: { id: true, code: true, titre: true, typologie: true } },
        institutionDemandeuse: { select: { id: true, code: true, nom: true } },
        userDemandeur: { select: { id: true, email: true } },
        userValideur: { select: { id: true, email: true } },
      },
      orderBy: { dateDemande: 'desc' },
    });
    return reply.send(requests);
  });

  // =========================================================================
  // POST /adoption-requests/:id/valider (DU only) — Declenche adoption effective
  // =========================================================================
  app.post('/adoption-requests/:id/valider', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const user = req.user;

    const ar = await app.prisma.adoptionRequest.findUnique({
      where: { id },
      include: { casUsage: true },
    });
    if (!ar) return reply.status(404).send({ error: 'Demande non trouvee' });
    if (ar.status !== 'EN_ATTENTE') {
      return reply.status(409).send({ error: 'Cette demande a deja ete traitee' });
    }
    if (ar.casUsage.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'La proposition n\'est plus adoptable' });
    }

    const result = await executeAdoption(app, {
      casUsageId: ar.casUsageId,
      institutionInitiatriceId: ar.institutionDemandeuseId,
      userId: ar.userDemandeurId,
      ajustements: ar.ajustements,
    });
    await app.prisma.adoptionRequest.update({
      where: { id },
      data: {
        status: 'VALIDEE',
        dateTraitement: new Date(),
        userValideurId: user.id,
      },
    });
    return reply.send(result);
  });

  // =========================================================================
  // POST /adoption-requests/:id/refuser (DU only)
  // =========================================================================
  app.post('/adoption-requests/:id/refuser', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { motif } = req.body as any;
    const user = req.user;

    if (!motif || motif.trim().length < MIN_MOTIF_ADOPTION) {
      return reply.status(400).send({ error: `Motif de refus requis, min ${MIN_MOTIF_ADOPTION} caracteres.` });
    }
    const ar = await app.prisma.adoptionRequest.findUnique({
      where: { id },
      include: {
        casUsage: { select: { id: true, code: true, titre: true } },
        institutionDemandeuse: { select: { id: true, code: true, users: { select: { id: true } } } },
      },
    });
    if (!ar) return reply.status(404).send({ error: 'Demande non trouvee' });
    if (ar.status !== 'EN_ATTENTE') {
      return reply.status(409).send({ error: 'Cette demande a deja ete traitee' });
    }

    await app.prisma.$transaction(async (tx: any) => {
      await tx.adoptionRequest.update({
        where: { id },
        data: {
          status: 'REFUSEE',
          dateTraitement: new Date(),
          userValideurId: user.id,
          motifTraitement: motif.trim(),
        },
      });
      // Notifier l'institution demandeuse
      for (const u of ar.institutionDemandeuse.users) {
        await tx.notification.create({
          data: {
            userId: u.id,
            institutionId: ar.institutionDemandeuseId,
            type: 'ARBITRAGE',
            titre: `Adoption refusee — ${ar.casUsage.titre}`,
            message: `La Delivery Unit a refuse votre demande d'adoption. Motif : ${motif.substring(0, 150)}`,
            lienUrl: `/catalogue-propositions/${ar.casUsageId}`,
            refType: 'CAS_USAGE',
            refId: ar.casUsageId,
          },
        });
      }
    });
    return reply.send({ ok: true });
  });

  // =========================================================================
  // PATCH /propositions/:id/demander-complement (DU only)
  // Le statut reste PROPOSE — l'admin demande un complement d'info au proposeur
  // =========================================================================
  app.patch('/propositions/:id/demander-complement', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { commentaire } = req.body as any;
    const user = req.user;

    if (!commentaire || commentaire.trim().length < MIN_MOTIF_ARCHIVE) {
      return reply.status(400).send({ error: `Commentaire requis, min ${MIN_MOTIF_ARCHIVE} caracteres.` });
    }
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      include: {
        institutionsPressenties: {
          include: { institution: { select: { id: true, users: { select: { id: true } } } } },
        },
      },
    });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (cu.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Demande de complement uniquement sur proposition active' });
    }

    const timestamp = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const appendNote = `\n\n[${timestamp} — ${user.email}] Demande de complement DU :\n${commentaire.trim()}`;
    const newNotes = (cu.notes || '') + appendNote;

    await app.prisma.$transaction(async (tx: any) => {
      await tx.casUsageMVP.update({ where: { id }, data: { notes: newNotes } });
      // Notifier les institutions pressenties
      for (const ip of cu.institutionsPressenties) {
        for (const u of ip.institution.users) {
          try {
            await tx.notification.create({
              data: {
                userId: u.id,
                institutionId: ip.institution.id,
                type: 'ARBITRAGE',
                titre: `Complement demande — ${cu.titre}`,
                message: `La Delivery Unit demande un complement d'information : ${commentaire.substring(0, 150)}`,
                lienUrl: `/catalogue/propositions/${id}`,
                refType: 'CAS_USAGE',
                refId: id,
              },
            });
          } catch {}
        }
      }
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'UPDATE', resource: 'proposition', resourceId: id, resourceLabel: `demander-complement: ${cu.code}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.send({ ok: true });
  });

  // =========================================================================
  // POST /propositions/:id/qualifier-rapide (DU only)
  // Atomique : adopter + transition jusqu'a QUALIFIE
  // Reserve aux cas de demonstration et arbitrages DU rapides
  // =========================================================================
  app.post('/propositions/:id/qualifier-rapide', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { institutionChefId, motif } = req.body as any;
    const user = req.user;

    if (!institutionChefId) return reply.status(400).send({ error: 'institutionChefId requis (institution cheffe de file)' });
    if (!motif || motif.trim().length < MIN_MOTIF_ARCHIVE) {
      return reply.status(400).send({ error: `Motif requis, min ${MIN_MOTIF_ARCHIVE} caracteres.` });
    }
    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (cu.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Qualification rapide uniquement sur proposition active' });
    }

    // 1. Adoption (PROPOSE -> DECLARE ou EN_CONSULTATION selon stakeholders)
    const adoptionResult = await executeAdoption(app, {
      casUsageId: id,
      institutionInitiatriceId: institutionChefId,
      userId: user.id,
      ajustements: null,
    });

    // 2. Forcer les transitions vers QUALIFIE (toutes les intermediaires)
    await app.prisma.$transaction(async (tx: any) => {
      const cuAfterAdoption = await tx.casUsageMVP.findUnique({ where: { id } });
      const fromStatus = cuAfterAdoption!.statutVueSection; // DECLARE ou EN_CONSULTATION

      // Forcer EN_CONSULTATION -> VALIDATION_CONJOINTE -> QUALIFIE (ou DECLARE -> ... -> QUALIFIE)
      const path = fromStatus === 'EN_CONSULTATION'
        ? ['VALIDATION_CONJOINTE', 'QUALIFIE']
        : ['EN_CONSULTATION', 'VALIDATION_CONJOINTE', 'QUALIFIE'];

      let prev = fromStatus;
      for (const next of path) {
        await tx.casUsageMVP.update({ where: { id }, data: { statutVueSection: next } });
        await tx.useCaseStatusHistory.create({
          data: {
            casUsageId: id,
            statusFrom: prev as any,
            statusTo: next as any,
            motif: `Qualification rapide DU — ${motif.substring(0, 150)}`,
            auteurUserId: user.id,
            auteurNom: user.email,
            auteurInstitution: 'SENUM SA',
          },
        });
        prev = next;
      }
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'UPDATE', resource: 'proposition', resourceId: id, resourceLabel: `qualifier-rapide: ${cu.code}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.send({ ok: true, newCode: adoptionResult.newCode, finalStatus: 'QUALIFIE' });
  });

  // =========================================================================
  // POST /propositions/:id/prioriser-rapide (DU only)
  // Atomique : adopter + transition jusqu'a PRIORISE
  // Action exceptionnelle, reservee aux cas de demonstration ou raccourcis DU
  // =========================================================================
  app.post('/propositions/:id/prioriser-rapide', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { institutionChefId, motif } = req.body as any;
    const user = req.user;

    if (!institutionChefId) return reply.status(400).send({ error: 'institutionChefId requis (institution cheffe de file)' });
    if (!motif || motif.trim().length < MIN_MOTIF_ARCHIVE) {
      return reply.status(400).send({ error: `Motif requis, min ${MIN_MOTIF_ARCHIVE} caracteres.` });
    }
    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Proposition non trouvee' });
    if (cu.statutVueSection !== 'PROPOSE') {
      return reply.status(409).send({ error: 'Priorisation rapide uniquement sur proposition active' });
    }

    // 1. Adoption (PROPOSE -> DECLARE ou EN_CONSULTATION)
    const adoptionResult = await executeAdoption(app, {
      casUsageId: id,
      institutionInitiatriceId: institutionChefId,
      userId: user.id,
      ajustements: null,
    });

    // 2. Transitions jusqu'a PRIORISE
    await app.prisma.$transaction(async (tx: any) => {
      const cuAfterAdoption = await tx.casUsageMVP.findUnique({ where: { id } });
      const fromStatus = cuAfterAdoption!.statutVueSection;

      const path = fromStatus === 'EN_CONSULTATION'
        ? ['VALIDATION_CONJOINTE', 'QUALIFIE', 'PRIORISE']
        : ['EN_CONSULTATION', 'VALIDATION_CONJOINTE', 'QUALIFIE', 'PRIORISE'];

      let prev = fromStatus;
      for (const next of path) {
        await tx.casUsageMVP.update({ where: { id }, data: { statutVueSection: next } });
        await tx.useCaseStatusHistory.create({
          data: {
            casUsageId: id,
            statusFrom: prev as any,
            statusTo: next as any,
            motif: `Priorisation rapide DU — ${motif.substring(0, 150)}`,
            auteurUserId: user.id,
            auteurNom: user.email,
            auteurInstitution: 'SENUM SA',
          },
        });
        prev = next;
      }

      // Aligner statutImpl
      await tx.casUsageMVP.update({ where: { id }, data: { statutImpl: 'PRIORISE' } });
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'UPDATE', resource: 'proposition', resourceId: id, resourceLabel: `prioriser-rapide: ${cu.code}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.send({ ok: true, newCode: adoptionResult.newCode, finalStatus: 'PRIORISE' });
  });
}

// ===========================================================================
// Helper : logique atomique d'adoption d'une proposition
// ===========================================================================

async function executeAdoption(app: any, params: {
  casUsageId: string;
  institutionInitiatriceId: string;
  userId: string;
  ajustements: any;
}) {
  const { casUsageId, institutionInitiatriceId, userId, ajustements } = params;
  const dateEcheance = new Date(Date.now() + SLA_DAYS_CONSULTATION * 86400000);

  return app.prisma.$transaction(async (tx: any) => {
    const cu = await tx.casUsageMVP.findUnique({
      where: { id: casUsageId },
      include: {
        institutionsPressenties: {
          include: { institution: { select: { id: true, code: true, users: { select: { id: true } } } } },
        },
      },
    });
    if (!cu) throw new Error('Proposition non trouvee');

    const inst = await tx.institution.findUnique({
      where: { id: institutionInitiatriceId },
      select: { code: true, nom: true },
    });
    if (!inst) throw new Error('Institution initiatrice non trouvee');

    // Generer le code definitif selon la nature du code existant :
    // - PINS-METIER-* / PINS-TECH-* deja definitif → conserve tel quel, jamais reassigne
    // - PINS-PROP-* (proposition) → genere le prochain sequentiel de la bonne famille
    const oldCode = cu.code;
    let newCode: string;
    let codeHistorique: string | null = cu.codeHistorique;

    if (oldCode.startsWith('PINS-METIER-') || oldCode.startsWith('PINS-TECH-')) {
      // Code deja definitif : ne jamais reassigner (fix bug PINS-CU-XXX)
      newCode = oldCode;
    } else {
      // Proposition : generer le prochain code sequentiel de la famille
      const prefix = cu.typologie === 'METIER' ? 'PINS-METIER-' : 'PINS-TECH-';
      const padding = cu.typologie === 'METIER' ? 3 : 4;

      const lastInFamily = await tx.casUsageMVP.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });

      let nextNum = 1;
      if (lastInFamily) {
        const match = lastInFamily.code.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`));
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      newCode = `${prefix}${String(nextNum).padStart(padding, '0')}`;

      // Preserver l'ancien code proposition dans codeHistorique
      codeHistorique = cu.codeHistorique
        ? `${cu.codeHistorique}, ${oldCode}`
        : oldCode;
    }

    // Bascule PROPOSE -> DECLARE, assigner code definitif, enregistrement adoption
    await tx.casUsageMVP.update({
      where: { id: casUsageId },
      data: {
        statutVueSection: 'DECLARE',
        code: newCode,
        ...(newCode !== oldCode ? { ancienCode: oldCode } : {}),
        codeHistorique,
        institutionSourceCode: inst.code,
        dateAdoption: new Date(),
        adopteParInstitutionId: institutionInitiatriceId,
        adopteParUserId: userId,
        niveauMaturite: null, // sort du catalogue
      },
    });

    // Stakeholder INITIATEUR pour l'institution adoptante
    await tx.useCaseStakeholder.create({
      data: {
        casUsageId: casUsageId,
        institutionId: institutionInitiatriceId,
        role: 'INITIATEUR',
        ajoutePar: userId,
      },
    });

    // Stakeholders depuis institutionsPressenties (sauf l'initiatrice elle-meme)
    // Ajustements permet d'en ajouter/retirer cote UI avant adoption
    const pressentiesInclusesIds: string[] = Array.isArray(ajustements?.pressentiesIncluses)
      ? ajustements.pressentiesIncluses
      : cu.institutionsPressenties.map((ip: any) => ip.institutionId);

    const pressentiesRetenues = cu.institutionsPressenties.filter(
      (ip: any) => pressentiesInclusesIds.includes(ip.institutionId)
        && ip.institutionId !== institutionInitiatriceId
    );

    let hasConsultableStakeholders = false;
    for (const ip of pressentiesRetenues) {
      const role = rolePressentiToRole(ip.rolePressenti);
      if (!role) continue;
      const sh = await tx.useCaseStakeholder.create({
        data: {
          casUsageId: casUsageId,
          institutionId: ip.institutionId,
          role,
          ajoutePar: userId,
        },
      });
      if (['FOURNISSEUR', 'CONSOMMATEUR'].includes(role)) {
        hasConsultableStakeholders = true;
        await tx.useCaseConsultation.create({
          data: {
            stakeholderId: sh.id,
            dateEcheance,
            status: 'EN_ATTENTE',
            ouvertePar: userId,
            motifSollicit: `Consultation ouverte automatiquement a l'adoption (SLA ${SLA_DAYS_CONSULTATION} jours).`,
          },
        });
        // Notifier users de l'institution sollicitee
        for (const u of ip.institution.users) {
          await tx.notification.create({
            data: {
              userId: u.id,
              institutionId: ip.institutionId,
              type: 'CONSULTATION_OUVERTE',
              titre: `Sollicitation sur "${cu.titre}"`,
              message: `Votre institution est sollicitee comme ${role.replace('_', ' ').toLowerCase()} suite a l'adoption de ce cas d'usage.`,
              lienUrl: '/mes-cas-usage',
              refType: 'CAS_USAGE',
              refId: casUsageId,
            },
          });
        }
      }
    }

    // Si consultation ouverte, passer en EN_CONSULTATION
    if (hasConsultableStakeholders) {
      await tx.casUsageMVP.update({
        where: { id: casUsageId },
        data: { statutVueSection: 'EN_CONSULTATION' },
      });
      await tx.useCaseStatusHistory.create({
        data: {
          casUsageId,
          statusFrom: 'DECLARE',
          statusTo: 'EN_CONSULTATION',
          motif: `Ouverture de consultation aupres de ${pressentiesRetenues.length} partie(s) prenante(s).`,
          auteurUserId: userId,
          auteurNom: '(adoption)',
          auteurInstitution: inst.nom,
        },
      });
    }

    // Trace inalterable PROPOSE -> DECLARE (ou EN_CONSULTATION directement)
    await tx.useCaseStatusHistory.create({
      data: {
        casUsageId,
        statusFrom: 'PROPOSE',
        statusTo: 'DECLARE',
        motif: `Adoption — ${inst.code} adopte la proposition (${cu.code} renommee en ${newCode}).`,
        auteurUserId: userId,
        auteurNom: '(adoption)',
        auteurInstitution: inst.nom,
      },
    });

    // Notifier les admins DU
    const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const a of admins) {
      await tx.notification.create({
        data: {
          userId: a.id,
          type: 'TRANSITION',
          titre: `Adoption de proposition — ${cu.titre}`,
          message: `${inst.code} a adopte la proposition (devient ${newCode}).`,
          lienUrl: `/admin/cas-usage/${casUsageId}`,
          refType: 'CAS_USAGE',
          refId: casUsageId,
        },
      });
    }

    return { casUsageId, newCode, institutionInitiatriceId };
  });
}

function rolePressentiToRole(rp: string): string | null {
  switch (rp) {
    case 'INITIATEUR_PRESSENTI': return 'INITIATEUR';
    case 'FOURNISSEUR_PRESSENTI': return 'FOURNISSEUR';
    case 'CONSOMMATEUR_PRESSENTI': return 'CONSOMMATEUR';
    case 'PARTIE_PRENANTE_PRESSENTIE': return 'PARTIE_PRENANTE';
    default: return null;
  }
}

// ===========================================================================
// Suggestions — detection de doublons (fuzzy sur titre + resume)
// ===========================================================================

export async function suggestionsRoutes(app: FastifyInstance) {
  app.post('/', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, reply: any) => {
    const { titre, resumeMetier, typologie } = req.body as any;
    if (!titre || titre.trim().length < 5) return reply.send([]);

    // Recherche simple ILIKE sur quelques mots-cles du titre + resume
    const keywords = [titre, resumeMetier]
      .filter(Boolean)
      .flatMap((s: string) => s.split(/\s+/))
      .filter((w: string) => w.length >= 4)
      .slice(0, 5);
    if (keywords.length === 0) return reply.send([]);

    const where: any = {
      OR: [
        ...keywords.map((k: string) => ({ titre: { contains: k, mode: 'insensitive' as const } })),
        ...keywords.map((k: string) => ({ resumeMetier: { contains: k, mode: 'insensitive' as const } })),
      ],
      statutVueSection: { in: ['PROPOSE', 'DECLARE', 'EN_CONSULTATION', 'VALIDATION_CONJOINTE', 'QUALIFIE'] },
    };
    if (typologie && ['METIER', 'TECHNIQUE'].includes(typologie)) where.typologie = typologie;

    const suggestions = await app.prisma.casUsageMVP.findMany({
      where,
      take: 5,
      select: {
        id: true, code: true, titre: true, resumeMetier: true,
        statutVueSection: true, typologie: true, niveauMaturite: true,
        institutionSourceCode: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Enrichir avec indicateur "adoptable" (si PROPOSE) ou "pipeline actif"
    return reply.send(
      suggestions.map((s: any) => ({
        ...s,
        adoptable: s.statutVueSection === 'PROPOSE',
        kind: s.statutVueSection === 'PROPOSE' ? 'proposition' : 'pipeline',
      }))
    );
  });
}
