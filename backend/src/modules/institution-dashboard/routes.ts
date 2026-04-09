// @ts-nocheck
import { FastifyInstance } from 'fastify';

export async function institutionDashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });

    const institution = await app.prisma.institution.findUnique({ where: { id: instId } });
    if (!institution) return reply.status(404).send({ error: 'Institution non trouvée' });
    const instCode = institution.code;

    const [submission, conventions, casUsages, readiness, demandes] = await Promise.all([
      app.prisma.submission.findFirst({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' }, include: { donneesConsommer: true, donneesFournir: true, fluxExistants: true, casUsage: true } }),
      app.prisma.convention.findMany({ where: { OR: [{ institutionAId: instId }, { institutionBId: instId }] }, include: { institutionA: { select: { id: true, code: true, nom: true } }, institutionB: { select: { id: true, code: true, nom: true } } } }),
      app.prisma.casUsageMVP.findMany({ where: { OR: [{ institutionSourceCode: instCode }, { institutionCibleCode: instCode }] }, include: { phaseMVP: true, financements: { include: { programme: { include: { ptf: true } } } } } }),
      app.prisma.xRoadReadiness.findFirst({ where: { institutionId: instId } }),
      app.prisma.demandeInterop.findMany({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    // === AGRÉGATION DES FLUX ===
    // Source 1: Questionnaire (donneesConsommer, donneesFournir, fluxExistants)
    const fluxQuestionnaire = (submission?.fluxExistants || []).map((f: any) => ({
      partenaire: f.source === instCode ? f.destination : f.source,
      donnees: f.donnee, mode: f.mode || 'Manuel', frequence: f.frequence,
      direction: f.source === instCode ? 'ENVOI' : 'RECEPTION',
      source: 'questionnaire',
    }));

    const consommerQuestionnaire = (submission?.donneesConsommer || []).map((d: any) => ({
      partenaire: d.source, donnees: d.donnee, usage: d.usage, priorite: d.priorite,
      source: 'questionnaire',
    }));

    const fournirQuestionnaire = (submission?.donneesFournir || []).map((d: any) => ({
      destinataires: d.destinataires, donnees: d.donnee, frequence: d.frequence, format: d.format,
      source: 'questionnaire',
    }));

    // Source 2: Cas d'usage MVP (flux implicites)
    const fluxMVP = casUsages.map((cu: any) => ({
      partenaire: cu.institutionSourceCode === instCode ? cu.institutionCibleCode : cu.institutionSourceCode,
      donnees: cu.donneesEchangees || cu.titre,
      mode: ['EN_TEST', 'EN_PRODUCTION'].includes(cu.statutImpl) ? 'PINS/X-Road' : 'À définir',
      direction: cu.institutionSourceCode === instCode ? 'ENVOI' : 'RECEPTION',
      statut: cu.statutImpl, phase: cu.phaseMVP?.code,
      financement: cu.financements?.[0]?.programme?.ptf?.acronyme,
      source: 'mvp', code: cu.code,
    }));

    const consommerMVP = casUsages
      .filter((cu: any) => cu.institutionCibleCode === instCode)
      .map((cu: any) => ({
        partenaire: cu.institutionSourceCode, donnees: cu.donneesEchangees || cu.titre,
        usage: cu.description, source: 'mvp', code: cu.code, phase: cu.phaseMVP?.code,
      }));

    const fournirMVP = casUsages
      .filter((cu: any) => cu.institutionSourceCode === instCode)
      .map((cu: any) => ({
        destinataires: cu.institutionCibleCode, donnees: cu.donneesEchangees || cu.titre,
        source: 'mvp', code: cu.code, phase: cu.phaseMVP?.code,
      }));

    // Fusionner
    const tousFlux = [...fluxQuestionnaire, ...fluxMVP];
    const toutConsommer = [...consommerQuestionnaire, ...consommerMVP];
    const toutFournir = [...fournirQuestionnaire, ...fournirMVP];

    // Actions requises
    const actions: any[] = [];
    if (!submission || submission.status === 'DRAFT') actions.push({ type: 'warning', message: 'Questionnaire non soumis', link: '/questionnaire' });
    if (submission && !submission.dataOwnerNom) actions.push({ type: 'warning', message: 'Data Owner non désigné', link: '/questionnaire' });
    conventions.filter((c: any) => ['EN_ATTENTE_SIGNATURE_A', 'EN_ATTENTE_SIGNATURE_B'].includes(c.statut))
      .forEach((c: any) => actions.push({ type: 'action', message: `Convention "${c.objet.substring(0, 50)}" en attente de signature` }));
    if (!readiness) actions.push({ type: 'info', message: 'Votre institution n\'est pas encore dans le pipeline PINS' });
    else if (readiness.securityServerInstall === 'NON_DEMARRE') actions.push({ type: 'warning', message: 'Security Server non installé — bloque les cas d\'usage PINS' });
    casUsages.filter((cu: any) => cu.statutImpl === 'EN_PREPARATION')
      .forEach((cu: any) => actions.push({ type: 'action', message: `Cas d'usage ${cu.code} : votre participation est requise` }));

    return reply.send({
      institution, submission, conventions, casUsages, readiness, demandes, actions,
      flux: { tous: tousFlux, consommer: toutConsommer, fournir: toutFournir },
      stats: {
        nbFlux: tousFlux.length,
        nbConsommer: toutConsommer.length,
        nbFournir: toutFournir.length,
        nbCasUsages: casUsages.length,
        nbConventions: conventions.length,
        maturiteMoyenne: submission ? Math.round((submission.maturiteInfra + submission.maturiteDonnees + submission.maturiteCompetences + submission.maturiteGouvernance) / 4 * 10) / 10 : 0,
      },
    });
  });

  app.get('/flux', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const inst = await app.prisma.institution.findUnique({ where: { id: instId } });
    const sub = await app.prisma.submission.findFirst({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' }, include: { donneesConsommer: true, donneesFournir: true, fluxExistants: true } });
    return reply.send({ institution: inst, submission: sub });
  });

  app.get('/conventions', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const conventions = await app.prisma.convention.findMany({ where: { OR: [{ institutionAId: instId }, { institutionBId: instId }] }, include: { institutionA: { select: { code: true, nom: true } }, institutionB: { select: { code: true, nom: true } } } });
    return reply.send(conventions);
  });

  app.get('/readiness', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const readiness = await app.prisma.xRoadReadiness.findFirst({ where: { institutionId: instId } });
    return reply.send(readiness);
  });
}

export async function demandesRoutes(app: FastifyInstance) {
  app.post('/', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const demande = await app.prisma.demandeInterop.create({ data: { ...req.body, institutionId: instId } });
    return reply.status(201).send(demande);
  });

  app.get('/mine', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const demandes = await app.prisma.demandeInterop.findMany({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' } });
    return reply.send(demandes);
  });

  app.get('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { statut, type, institutionId } = req.query as any;
    const where: any = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (institutionId) where.institutionId = institutionId;
    const demandes = await app.prisma.demandeInterop.findMany({ where, orderBy: { createdAt: 'desc' } });
    const instIds = [...new Set(demandes.map((d: any) => d.institutionId))];
    const institutions = await app.prisma.institution.findMany({ where: { id: { in: instIds } }, select: { id: true, code: true, nom: true } });
    const instMap = Object.fromEntries(institutions.map((i: any) => [i.id, i]));
    return reply.send(demandes.map((d: any) => ({ ...d, institution: instMap[d.institutionId] || null })));
  });

  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const data: any = { ...req.body };
    if (data.statut === 'RESOLUE' || data.statut === 'REJETEE') data.traiteeAt = new Date();
    const demande = await app.prisma.demandeInterop.update({ where: { id: req.params.id }, data });
    return reply.send(demande);
  });

  app.get('/stats', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const all = await app.prisma.demandeInterop.findMany();
    const byStatut: Record<string, number> = {};
    const byType: Record<string, number> = {};
    all.forEach((d: any) => { byStatut[d.statut] = (byStatut[d.statut] || 0) + 1; byType[d.type] = (byType[d.type] || 0) + 1; });
    return reply.send({ total: all.length, byStatut, byType, nonTraitees: all.filter((d: any) => d.statut === 'SOUMISE').length });
  });
}
