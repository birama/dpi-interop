// @ts-nocheck
import { FastifyInstance } from 'fastify';

export async function institutionDashboardRoutes(app: FastifyInstance) {
  // Dashboard consolidé pour l'institution connectée
  app.get('/dashboard', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });

    const [institution, submission, conventions, casUsages, readiness, demandes] = await Promise.all([
      app.prisma.institution.findUnique({ where: { id: instId } }),
      app.prisma.submission.findFirst({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' }, include: { donneesConsommer: true, donneesFournir: true, fluxExistants: true, casUsage: true } }),
      app.prisma.convention.findMany({ where: { OR: [{ institutionAId: instId }, { institutionBId: instId }] }, include: { institutionA: { select: { code: true, nom: true } }, institutionB: { select: { code: true, nom: true } } } }),
      app.prisma.casUsageMVP.findMany({ where: { OR: [{ institutionSourceCode: (await app.prisma.institution.findUnique({ where: { id: instId } }))?.code }, { institutionCibleCode: (await app.prisma.institution.findUnique({ where: { id: instId } }))?.code }] }, include: { phaseMVP: true, financements: { include: { programme: { include: { ptf: true } } } } } }),
      app.prisma.xRoadReadiness.findFirst({ where: { institutionId: instId }, include: { institution: true } }),
      app.prisma.demandeInterop.findMany({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    // Flux entrants (autres institutions déclarent fournir à cette institution)
    const instCode = institution?.code;
    const fluxEntrants = instCode ? await app.prisma.donneeConsommer.findMany({
      where: { source: instCode },
      include: { submission: { include: { institution: { select: { code: true, nom: true } } } } },
    }) : [];

    // Actions requises
    const actions = [];
    if (!submission || submission.status === 'DRAFT') actions.push({ type: 'warning', message: 'Questionnaire non soumis', link: '/questionnaire' });
    if (!submission?.dataOwnerNom) actions.push({ type: 'warning', message: 'Data Owner non désigné' });
    const convAttente = conventions.filter(c => ['EN_ATTENTE_SIGNATURE_A', 'EN_ATTENTE_SIGNATURE_B'].includes(c.statut));
    convAttente.forEach(c => actions.push({ type: 'action', message: `Convention "${c.objet}" en attente de signature` }));
    if (!readiness) actions.push({ type: 'info', message: 'Votre institution n\'est pas encore dans le pipeline PINS' });
    else if (readiness.securityServerInstall === 'NON_DEMARRE') actions.push({ type: 'warning', message: 'Security Server non installé' });
    const demandesNonTraitees = demandes.filter(d => d.statut === 'SOUMISE').length;

    return reply.send({
      institution, submission, conventions, casUsages, readiness,
      demandes, fluxEntrants, actions, demandesNonTraitees,
      stats: {
        nbFlux: (submission?.fluxExistants?.length || 0) + (submission?.donneesConsommer?.length || 0) + (submission?.donneesFournir?.length || 0),
        nbCasUsages: casUsages.length,
        nbConventions: conventions.length,
        maturiteMoyenne: submission ? Math.round((submission.maturiteInfra + submission.maturiteDonnees + submission.maturiteCompetences + submission.maturiteGouvernance) / 4 * 10) / 10 : 0,
      },
    });
  });

  // Flux de l'institution
  app.get('/flux', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const inst = await app.prisma.institution.findUnique({ where: { id: instId } });
    const sub = await app.prisma.submission.findFirst({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' }, include: { donneesConsommer: true, donneesFournir: true, fluxExistants: true } });
    return reply.send({ institution: inst, submission: sub });
  });

  // Conventions de l'institution
  app.get('/conventions', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const conventions = await app.prisma.convention.findMany({ where: { OR: [{ institutionAId: instId }, { institutionBId: instId }] }, include: { institutionA: { select: { code: true, nom: true } }, institutionB: { select: { code: true, nom: true } } } });
    return reply.send(conventions);
  });

  // Readiness X-Road
  app.get('/readiness', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const readiness = await app.prisma.xRoadReadiness.findFirst({ where: { institutionId: instId } });
    return reply.send(readiness);
  });
}

export async function demandesRoutes(app: FastifyInstance) {
  // Institution: créer une demande
  app.post('/', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const demande = await app.prisma.demandeInterop.create({ data: { ...req.body, institutionId: instId } });
    return reply.status(201).send(demande);
  });

  // Institution: mes demandes
  app.get('/mine', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const instId = req.user.institutionId;
    if (!instId) return reply.status(400).send({ error: 'Pas d\'institution liée' });
    const demandes = await app.prisma.demandeInterop.findMany({ where: { institutionId: instId }, orderBy: { createdAt: 'desc' } });
    return reply.send(demandes);
  });

  // Admin: toutes les demandes
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { statut, type, institutionId } = req.query as any;
    const where: any = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (institutionId) where.institutionId = institutionId;
    const demandes = await app.prisma.demandeInterop.findMany({ where, orderBy: { createdAt: 'desc' } });
    // Enrichir avec institution
    const instIds = [...new Set(demandes.map(d => d.institutionId))];
    const institutions = await app.prisma.institution.findMany({ where: { id: { in: instIds } }, select: { id: true, code: true, nom: true } });
    const instMap = Object.fromEntries(institutions.map(i => [i.id, i]));
    const enriched = demandes.map(d => ({ ...d, institution: instMap[d.institutionId] || null }));
    return reply.send(enriched);
  });

  // Admin: traiter une demande
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const data: any = { ...req.body };
    if (data.statut === 'RESOLUE' || data.statut === 'REJETEE') data.traiteeAt = new Date();
    const demande = await app.prisma.demandeInterop.update({ where: { id: req.params.id }, data });
    return reply.send(demande);
  });

  // Admin: stats
  app.get('/stats', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const all = await app.prisma.demandeInterop.findMany();
    const byStatut: Record<string, number> = {};
    const byType: Record<string, number> = {};
    all.forEach(d => { byStatut[d.statut] = (byStatut[d.statut] || 0) + 1; byType[d.type] = (byType[d.type] || 0) + 1; });
    return reply.send({ total: all.length, byStatut, byType, nonTraitees: all.filter(d => d.statut === 'SOUMISE').length });
  });
}
