import { FastifyInstance } from 'fastify';

// ============================================================================
// MODULE PILOTAGE — portefeuille suivi (pilote=true), blocages, qualification
// RBAC : lecture ADMIN + BAILLEUR, écriture ADMIN
// ============================================================================

const STATUTS_AVANCES = ['EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION'] as const;
const NATURES_BLOCAGE = ['JURIDIQUE', 'TECHNIQUE', 'ORGANISATIONNEL', 'DONNEES', 'CONTRACTUEL', 'ARBITRAGE'] as const;
const STATUTS_IMPL = ['IDENTIFIE', 'PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION', 'SUSPENDU'] as const;

function canRead(user: any): boolean {
  return user?.role === 'ADMIN' || user?.role === 'BAILLEUR';
}

function audit(app: FastifyInstance, req: any, action: string, resource: string, resourceId?: string, resourceLabel?: string) {
  try {
    app.prisma.auditLog.create({
      data: {
        userId: req.user.id, userEmail: req.user.email, userRole: req.user.role,
        action, resource, resourceId, resourceLabel,
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  } catch {}
}

export async function pilotageRoutes(app: FastifyInstance) {
  // --------------------------------------------------------------------------
  // GET / — portefeuille pilote avec blocage ouvert + drapeaux calculés serveur
  // --------------------------------------------------------------------------
  app.get('/', { onRequest: [app.authenticate], config: { access: ['ADMIN', 'BAILLEUR'] } }, async (req: any, reply: any) => {
    if (!canRead(req.user)) return reply.status(403).send({ error: 'Accès réservé aux rôles ADMIN et BAILLEUR' });

    const cas = await app.prisma.casUsageMVP.findMany({
      where: { pilote: true },
      include: {
        blocages: { orderBy: { dateOuverture: 'desc' } },
        phaseMVP: { select: { code: true } },
        stakeholders360: {
          include: { institution: { select: { code: true } } },
        },
      },
      orderBy: { code: 'asc' },
    });

    const now = Date.now();
    const TRENTE_JOURS = 30 * 24 * 60 * 60 * 1000;

    const codesPour = (st: any[], roles: string[]) =>
      [...new Set(st.filter(s => roles.includes(s.role)).map(s => s.institution?.code).filter(Boolean))];

    const items = cas.map((cu: any) => {
      const blocageOuvert = cu.blocages.find((b: any) => !b.dateResolution) || null;
      const joursDansStatut = cu.dateStatutImpl
        ? Math.floor((now - new Date(cu.dateStatutImpl).getTime()) / (24 * 60 * 60 * 1000))
        : null;
      // Administrations : les champs codes du catalogue priment ; sinon, on
      // compose depuis les stakeholders (fournisseur/initiateur → consommateur/parties).
      const st = cu.stakeholders360 || [];
      const source = cu.institutionSourceCode
        ? [cu.institutionSourceCode]
        : (codesPour(st, ['FOURNISSEUR']).length ? codesPour(st, ['FOURNISSEUR']) : codesPour(st, ['INITIATEUR']));
      const cible = cu.institutionCibleCode
        ? [cu.institutionCibleCode]
        : (codesPour(st, ['CONSOMMATEUR']).length ? codesPour(st, ['CONSOMMATEUR']) : codesPour(st, ['PARTIE_PRENANTE']));
      return {
        id: cu.id,
        code: cu.code,
        titre: cu.titre,
        administrations: { source, cible },
        institutionSourceCode: cu.institutionSourceCode,
        institutionCibleCode: cu.institutionCibleCode,
        autresInstitutions: cu.autresInstitutions,
        statutImpl: cu.statutImpl,
        statutVueSection: cu.statutVueSection,
        identifiantPivot: cu.identifiantPivot,
        baseLegale: cu.baseLegale,
        serviceXroad: cu.serviceXroad,
        phaseMVP: cu.phaseMVP?.code || null,
        dateStatutImpl: cu.dateStatutImpl,
        joursDansStatut,
        blocage: blocageOuvert,
        // Drapeaux calculés serveur
        echeanceDepassee: blocageOuvert?.echeance ? new Date(blocageOuvert.echeance).getTime() < now : false,
        statutInchange30j: cu.dateStatutImpl ? now - new Date(cu.dateStatutImpl).getTime() > TRENTE_JOURS : false,
      };
    });

    return reply.send(items);
  });

  // --------------------------------------------------------------------------
  // PATCH /cas-usage/:id — édition directe des champs de qualification
  // --------------------------------------------------------------------------
  app.patch('/cas-usage/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const body = req.body as any;

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    const patch: any = {};
    const champsPermis = ['pilote', 'statutImpl', 'identifiantPivot', 'baseLegale', 'serviceXroad'];
    for (const champ of champsPermis) {
      if (body[champ] !== undefined) patch[champ] = body[champ];
    }

    // Garde-fou 422 : statut d'implémentation avancé sans clé de rapprochement
    if (patch.statutImpl !== undefined) {
      if (!STATUTS_IMPL.includes(patch.statutImpl)) {
        return reply.status(422).send({ error: `statutImpl invalide. Valeurs possibles : ${STATUTS_IMPL.join(', ')}` });
      }
      const pivotFinal = (patch.identifiantPivot !== undefined ? patch.identifiantPivot : cu.identifiantPivot)?.trim();
      if (STATUTS_AVANCES.includes(patch.statutImpl) && !pivotFinal) {
        return reply.status(422).send({ error: 'identifiantPivot requis pour un statut d\'implémentation avancé (EN_DEVELOPPEMENT, EN_TEST, EN_PRODUCTION)' });
      }
      // dateStatutImpl bouge uniquement si la valeur change réellement
      if (patch.statutImpl !== cu.statutImpl) {
        patch.dateStatutImpl = new Date();
      } else {
        delete patch.statutImpl; // pas de changement réel : ne pas toucher à l'ancienneté
      }
    }

    const updated = await app.prisma.casUsageMVP.update({ where: { id }, data: patch });
    audit(app, req, 'UPDATE', 'pilotage-cas-usage', id, `pilotage: ${updated.code}`);
    return reply.send(updated);
  });

  // --------------------------------------------------------------------------
  // POST /cas-usage/:id/blocage — ouvrir un blocage (un seul ouvert par cas)
  // --------------------------------------------------------------------------
  app.post('/cas-usage/:id/blocage', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const body = req.body as any;

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id } });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    // Garde-fou 400 : un blocage attribué à une direction ne se résout jamais
    if (!body.personneAttendue || !String(body.personneAttendue).trim()) {
      return reply.status(400).send({ error: 'personneAttendue est requis : un blocage attribué à une direction ne se résout jamais' });
    }
    if (!body.nature || !NATURES_BLOCAGE.includes(body.nature)) {
      return reply.status(400).send({ error: `nature invalide. Valeurs possibles : ${NATURES_BLOCAGE.join(', ')}` });
    }
    if (!body.libelle || !String(body.libelle).trim()) {
      return reply.status(400).send({ error: 'libelle requis' });
    }

    const dejaOuvert = await app.prisma.blocage.findFirst({ where: { casUsageId: id, dateResolution: null } });
    if (dejaOuvert) {
      return reply.status(409).send({ error: 'Un blocage est déjà ouvert sur ce cas d\'usage. Résolvez-le avant d\'en ouvrir un autre.' });
    }

    try {
      const blocage = await app.prisma.blocage.create({
        data: {
          casUsageId: id,
          nature: body.nature,
          libelle: String(body.libelle).trim(),
          entiteAttendue: body.entiteAttendue || null,
          personneAttendue: String(body.personneAttendue).trim(),
          echeance: body.echeance ? new Date(body.echeance) : null,
          commentaire: body.commentaire || null,
        },
      });
      audit(app, req, 'CREATE', 'pilotage-blocage', blocage.id, `blocage: ${cu.code}`);
      return reply.status(201).send(blocage);
    } catch (e: any) {
      // Contrainte DB « un seul blocage ouvert par cas » (index unique partiel)
      if (e?.code === 'P2002') {
        return reply.status(409).send({ error: 'Un blocage est déjà ouvert sur ce cas d\'usage. Résolvez-le avant d\'en ouvrir un autre.' });
      }
      throw e;
    }
  });

  // --------------------------------------------------------------------------
  // PATCH /blocage/:id — éditer un blocage
  // --------------------------------------------------------------------------
  app.patch('/blocage/:id', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const body = req.body as any;

    const blocage = await app.prisma.blocage.findUnique({ where: { id } });
    if (!blocage) return reply.status(404).send({ error: 'Blocage non trouvé' });

    const patch: any = {};
    if (body.nature !== undefined) {
      if (!NATURES_BLOCAGE.includes(body.nature)) {
        return reply.status(400).send({ error: `nature invalide. Valeurs possibles : ${NATURES_BLOCAGE.join(', ')}` });
      }
      patch.nature = body.nature;
    }
    if (body.libelle !== undefined) patch.libelle = String(body.libelle).trim();
    if (body.entiteAttendue !== undefined) patch.entiteAttendue = body.entiteAttendue || null;
    if (body.personneAttendue !== undefined) {
      const personne = String(body.personneAttendue).trim();
      if (!personne) return reply.status(400).send({ error: 'personneAttendue ne peut pas être vide' });
      patch.personneAttendue = personne;
    }
    if (body.echeance !== undefined) patch.echeance = body.echeance ? new Date(body.echeance) : null;
    if (body.commentaire !== undefined) patch.commentaire = body.commentaire || null;

    const updated = await app.prisma.blocage.update({ where: { id }, data: patch });
    audit(app, req, 'UPDATE', 'pilotage-blocage', id);
    return reply.send(updated);
  });

  // --------------------------------------------------------------------------
  // POST /blocage/:id/resoudre — résoudre un blocage
  // --------------------------------------------------------------------------
  app.post('/blocage/:id/resoudre', { onRequest: [app.authenticateAdmin], config: { access: ['ADMIN'] } }, async (req: any, reply: any) => {
    const { id } = req.params;

    const blocage = await app.prisma.blocage.findUnique({ where: { id } });
    if (!blocage) return reply.status(404).send({ error: 'Blocage non trouvé' });
    if (blocage.dateResolution) return reply.status(409).send({ error: 'Blocage déjà résolu' });

    const updated = await app.prisma.blocage.update({
      where: { id },
      data: { dateResolution: new Date(), commentaire: req.body?.commentaire ?? blocage.commentaire },
    });
    audit(app, req, 'UPDATE', 'pilotage-blocage', id, 'resoudre');
    return reply.send(updated);
  });
}
