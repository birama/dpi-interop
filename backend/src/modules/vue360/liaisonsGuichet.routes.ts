/**
 * Routes Vue 360° — Liaisons CasUsageMVP ↔ ServiceGuichet (frontière backbone/front)
 *
 * Préfixe d'enregistrement : /catalogue
 *
 *   GET    /services-guichet                            — Liste des ServiceGuichet
 *   POST   /cas-usage/:id/liaisons-guichet              — Upsert idempotent (DU only)
 *   GET    /cas-usage/:id/liaisons-guichet              — Liste des liaisons d'un cas
 *   DELETE /liaisons-guichet/:liaisonId                 — Supprimer une liaison (DU only)
 *   GET    /correspondance-esenegal                     — Grille jointe CU ↔ services
 *
 * Règles :
 *   - Une LiaisonGuichet ne modifie JAMAIS le code d'un CasUsage (cf. dette
 *     prioriser-rapide à part).
 *   - Upsert idempotent sur la clé unique (casUsageId, serviceGuichetId) :
 *     re-poster les mêmes ids met juste à jour `note`/`mode`, ne duplique pas.
 *   - publicCible et statutEsenegal sont des propriétés intrinsèques de
 *     ServiceGuichet, jamais portées par la liaison.
 *
 * Réf : MCTN/DU/PROMPTS-PINS-LIAISON-GUICHET-2026 — étape 4.
 */

import { FastifyInstance } from 'fastify';

export async function liaisonsGuichetRoutes(app: FastifyInstance) {

  // ===========================================================================
  // GET /services-guichet/:id — Détail d'un ServiceGuichet
  //   Inclut les liaisons et leur CasUsageMVP
  // ===========================================================================
  app.get('/services-guichet/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const svc = await app.prisma.serviceGuichet.findUnique({
      where: { id: req.params.id },
      include: {
        liaisons: {
          orderBy: { dateAjout: 'desc' },
          select: {
            id: true, mode: true, note: true, dateAjout: true,
            casUsage: { select: { id: true, code: true, titre: true, domaine: true, typologie: true } },
          },
        },
      },
    });
    if (!svc) return reply.status(404).send({ error: 'ServiceGuichet non trouvé' });
    return reply.send(svc);
  });

  // ===========================================================================
  // GET /services-guichet — Liste des ServiceGuichet (filtres optionnels)
  //   ?avecLiaisons=true : inclut les liaisons existantes et leur CasUsageMVP
  // ===========================================================================
  app.get('/services-guichet', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { q, secteur, publicCible, avecBesoinSiTiers, avecLiaisons } = req.query as any;

    const where: any = {};
    if (secteur) where.secteur = secteur;
    if (publicCible && ['CITOYEN', 'ENTREPRISE', 'MIXTE'].includes(publicCible)) {
      where.publicCible = publicCible;
    }
    if (avecBesoinSiTiers === 'true') where.besoinSiTiers = { not: null };
    if (avecBesoinSiTiers === 'false') where.besoinSiTiers = null;
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { intitule: { contains: q, mode: 'insensitive' } },
      ];
    }

    const include: any = {};
    if (avecLiaisons === 'true') {
      include.liaisons = {
        orderBy: { dateAjout: 'desc' },
        select: {
          id: true, mode: true, note: true, dateAjout: true,
          casUsage: { select: { id: true, code: true, titre: true, domaine: true } },
        },
      };
    }

    const items = await app.prisma.serviceGuichet.findMany({
      where,
      orderBy: [{ secteur: 'asc' }, { code: 'asc' }],
      select: {
        id: true, code: true, intitule: true, evenementDeVie: true,
        secteur: true, publicCible: true, statutEsenegal: true,
        ministere: true, besoinSiTiers: true,
        ...(avecLiaisons === 'true' ? { liaisons: include.liaisons } : {}),
      },
    });
    return reply.send({ total: items.length, items });
  });

  // ===========================================================================
  // POST /services-guichet — Ajouter une démarche (DU only)
  //   body : { intitule, secteur?, evenementDeVie?, publicCible?,
  //            statutEsenegal?, besoinSiTiers? }
  //   Code PINS-GUICHET-NNN auto-généré. Idempotent sur (intitule, secteur).
  // ===========================================================================
  app.post('/services-guichet', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { intitule, secteur, evenementDeVie, publicCible, statutEsenegal, besoinSiTiers } = (req.body || {}) as any;
    const user = req.user;

    if (!intitule || typeof intitule !== 'string' || intitule.trim().length === 0) {
      return reply.status(400).send({ error: 'intitule requis (string non vide)' });
    }
    const intituleClean = intitule.trim();
    const secteurClean = typeof secteur === 'string' && secteur.trim().length > 0 ? secteur.trim() : null;

    // Idempotence : lookup par (intitule, secteur)
    const existing = await app.prisma.serviceGuichet.findFirst({
      where: { intitule: intituleClean, ...(secteurClean === null ? { secteur: null } : { secteur: secteurClean }) },
    });
    if (existing) {
      return reply.status(409).send({ error: 'Ce service existe déjà', existing });
    }

    // Générer le prochain code PINS-GUICHET-NNN
    const lastCode = await app.prisma.serviceGuichet.findFirst({
      where: { code: { startsWith: 'PINS-GUICHET-' } },
      orderBy: { code: 'desc' },
    });
    let nextNum = 1;
    if (lastCode) {
      const match = lastCode.code.match(/^PINS-GUICHET-(\d{3})$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    if (nextNum > 999) {
      return reply.status(500).send({ error: 'Capacité PINS-GUICHET-NNN épuisée (999)' });
    }
    const code = `PINS-GUICHET-${String(nextNum).padStart(3, '0')}`;

    const created = await app.prisma.serviceGuichet.create({
      data: {
        code,
        intitule: intituleClean,
        secteur: secteurClean,
        evenementDeVie: typeof evenementDeVie === 'string' && evenementDeVie.trim().length > 0 ? evenementDeVie.trim() : null,
        publicCible: ['CITOYEN', 'ENTREPRISE', 'MIXTE'].includes(publicCible) ? publicCible : null,
        statutEsenegal: typeof statutEsenegal === 'string' && statutEsenegal.trim().length > 0 ? statutEsenegal.trim() : null,
        besoinSiTiers: typeof besoinSiTiers === 'string' && besoinSiTiers.trim().length > 0 ? besoinSiTiers.trim() : null,
        mode: 'AJOUT_MANUEL_DU',
        ajoutePar: user?.id ?? null,
      },
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'CREATE', resource: 'service-guichet', resourceId: created.id,
          resourceLabel: `${code} — ${intituleClean}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.status(201).send(created);
  });

  // ===========================================================================
  // POST /cas-usage/:id/liaisons-guichet — Upsert idempotent
  //   body : { serviceGuichetId: string, note?: string, mode?: string }
  // ===========================================================================
  app.post('/cas-usage/:id/liaisons-guichet', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { id: casUsageId } = req.params;
    const { serviceGuichetId, note, mode } = (req.body || {}) as any;
    const user = req.user;

    if (!serviceGuichetId || typeof serviceGuichetId !== 'string') {
      return reply.status(400).send({ error: 'serviceGuichetId requis (string)' });
    }

    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id: casUsageId },
      select: { id: true, code: true },
    });
    if (!cu) return reply.status(404).send({ error: 'CasUsageMVP non trouvé' });

    const svc = await app.prisma.serviceGuichet.findUnique({
      where: { id: serviceGuichetId },
      select: { id: true, code: true },
    });
    if (!svc) return reply.status(404).send({ error: 'ServiceGuichet non trouvé' });

    const noteClean = typeof note === 'string' && note.trim().length > 0 ? note.trim() : null;
    const modeClean = typeof mode === 'string' && mode.trim().length > 0 ? mode.trim() : null;

    // Upsert idempotent sur la clé unique (casUsageId, serviceGuichetId)
    const liaison = await app.prisma.liaisonGuichet.upsert({
      where: { casUsageId_serviceGuichetId: { casUsageId, serviceGuichetId } },
      create: {
        casUsageId,
        serviceGuichetId,
        note: noteClean,
        mode: modeClean,
        ajoutePar: user?.id ?? null,
      },
      update: {
        note: noteClean,
        mode: modeClean,
      },
      include: {
        serviceGuichet: {
          select: {
            id: true, code: true, intitule: true, secteur: true,
            publicCible: true, statutEsenegal: true,
          },
        },
      },
    });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'UPDATE',
          resource: 'liaison-guichet',
          resourceId: liaison.id,
          resourceLabel: `${cu.code} ↔ ${svc.code}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.send(liaison);
  });

  // ===========================================================================
  // GET /cas-usage/:id/liaisons-guichet — Liste des liaisons d'un cas
  // ===========================================================================
  app.get('/cas-usage/:id/liaisons-guichet', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id: casUsageId } = req.params;
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id: casUsageId },
      select: { id: true },
    });
    if (!cu) return reply.status(404).send({ error: 'CasUsageMVP non trouvé' });

    const items = await app.prisma.liaisonGuichet.findMany({
      where: { casUsageId },
      orderBy: { dateAjout: 'desc' },
      include: {
        serviceGuichet: {
          select: {
            id: true, code: true, intitule: true, evenementDeVie: true,
            secteur: true, publicCible: true, statutEsenegal: true,
            ministere: true,
          },
        },
      },
    });
    return reply.send({ total: items.length, items });
  });

  // ===========================================================================
  // DELETE /liaisons-guichet/:liaisonId — Supprimer (DU only)
  // ===========================================================================
  app.delete('/liaisons-guichet/:liaisonId', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { liaisonId } = req.params;
    const user = req.user;

    const existing = await app.prisma.liaisonGuichet.findUnique({
      where: { id: liaisonId },
      include: {
        casUsage: { select: { code: true } },
        serviceGuichet: { select: { code: true } },
      },
    });
    if (!existing) return reply.status(404).send({ error: 'Liaison non trouvée' });

    await app.prisma.liaisonGuichet.delete({ where: { id: liaisonId } });

    try {
      await app.prisma.auditLog.create({
        data: {
          userId: user.id, userEmail: user.email, userRole: user.role,
          action: 'DELETE',
          resource: 'liaison-guichet',
          resourceId: liaisonId,
          resourceLabel: `${existing.casUsage.code} ↔ ${existing.serviceGuichet.code}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.send({ success: true });
  });

  // ===========================================================================
  // GET /correspondance-esenegal — Grille jointe CasUsageMVP ↔ ServiceGuichet
  //   Source unique pour la page UI et l'export. Renvoie pour chaque CU le
  //   bloc de ses services guichet liés (peut être vide).
  //
  //   Query :
  //     ?seulementAvecLiaisons=true   — filtre les CU sans aucune liaison
  //     ?typologie=METIER|TECHNIQUE
  //     ?domaine=<Domaine>
  //     ?secteurGuichet=<secteur>
  //     ?publicCible=CITOYEN|ENTREPRISE|MIXTE
  // ===========================================================================
  app.get('/correspondance-esenegal', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const {
      seulementAvecLiaisons, typologie, domaine,
      secteurGuichet, publicCible,
    } = req.query as any;

    const whereCU: any = {};
    if (typologie && ['METIER', 'TECHNIQUE'].includes(typologie)) whereCU.typologie = typologie;
    if (domaine) whereCU.domaine = domaine;
    if (seulementAvecLiaisons === 'true') {
      whereCU.liaisonsGuichet = { some: {} };
    }

    // Filtre service guichet : appliqué côté liaison (sous-clause)
    const liaisonsWhere: any = {};
    if (secteurGuichet || publicCible) {
      liaisonsWhere.serviceGuichet = {};
      if (secteurGuichet) liaisonsWhere.serviceGuichet.secteur = secteurGuichet;
      if (publicCible && ['CITOYEN', 'ENTREPRISE', 'MIXTE'].includes(publicCible)) {
        liaisonsWhere.serviceGuichet.publicCible = publicCible;
      }
      // Si on filtre les services, on veut aussi que le CU ait au moins une
      // liaison qui matche le filtre.
      whereCU.liaisonsGuichet = { some: liaisonsWhere };
    }

    const cus = await app.prisma.casUsageMVP.findMany({
      where: whereCU,
      orderBy: [{ typologie: 'asc' }, { code: 'asc' }],
      select: {
        id: true, code: true, titre: true, typologie: true,
        domaine: true, statutVueSection: true,
        liaisonsGuichet: {
          where: Object.keys(liaisonsWhere).length > 0 ? liaisonsWhere : undefined,
          orderBy: { dateAjout: 'desc' },
          select: {
            id: true, note: true, dateAjout: true,
            serviceGuichet: {
              select: {
                id: true, code: true, intitule: true, evenementDeVie: true,
                secteur: true, publicCible: true, statutEsenegal: true,
                ministere: true,
              },
            },
          },
        },
      },
    });

    // KPIs en tête : compteurs citoyen/entreprise/exposés
    let citoyen = 0;
    let entreprise = 0;
    let mixte = 0;
    // Split exposition e-sénégal : "En ligne" et "En ligne mais Non utilisée"
    // sont distinctement utiles. La page UI les somme pour "exposé sur e-sénégal"
    // et affiche la sous-nuance non utilisé au survol.
    let exposeEnLigne = 0;
    let exposeNonUtilise = 0;
    let casAvecLiaison = 0;
    const serviceIdsCount = new Set<string>();
    for (const cu of cus) {
      if (cu.liaisonsGuichet.length > 0) casAvecLiaison++;
      for (const l of cu.liaisonsGuichet) {
        const sg = l.serviceGuichet;
        serviceIdsCount.add(sg.id);
        if (sg.publicCible === 'CITOYEN') citoyen++;
        else if (sg.publicCible === 'ENTREPRISE') entreprise++;
        else if (sg.publicCible === 'MIXTE') mixte++;
        if (sg.statutEsenegal === 'En ligne') exposeEnLigne++;
        else if (sg.statutEsenegal === 'En ligne mais Non utilisée') exposeNonUtilise++;
      }
    }

    const kpis = {
      casUsageTotal: cus.length,
      casUsageAvecLiaison: casAvecLiaison,
      casUsageSansLiaison: cus.length - casAvecLiaison,
      servicesGuichetLies: serviceIdsCount.size,
      liaisonsCitoyen: citoyen,
      liaisonsEntreprise: entreprise,
      liaisonsMixte: mixte,
      liaisonsExposeEnLigne: exposeEnLigne,
      liaisonsExposeNonUtilise: exposeNonUtilise,
    };

    return reply.send({ kpis, items: cus });
  });
}
