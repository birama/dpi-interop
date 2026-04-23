import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/index.js';
import { institutionsRoutes } from './institutions/index.js';
import { submissionsRoutes } from './submissions/index.js';
import { reportsRoutes } from './reports/index.js';
import { importRoutes } from './import/import.routes.js';
import { institutionDashboardRoutes, demandesRoutes } from './institution-dashboard/routes.js';
import { useCasesRoutes } from './vue360/useCases.routes.js';
import { useCasesMeRoutes } from './vue360/useCasesMe.routes.js';
import { useCasesWriteRoutes, consultationRoutes, feedbackRoutes, duArbitrageRoutes } from './vue360/useCasesWrite.routes.js';
import { registresCouvertureRoutes, registresUseCaseRoutes } from './vue360/registres.routes.js';

// Inline routes for conventions and xroad
async function conventionsRoutes(app: FastifyInstance) {
  // List all
  app.get('/', { onRequest: [app.authenticateAdmin], schema: { tags: ['Conventions'] } }, async (_req: any, reply: any) => {
    const conventions = await app.prisma.convention.findMany({
      include: { institutionA: { select: { id: true, code: true, nom: true } }, institutionB: { select: { id: true, code: true, nom: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return reply.send(conventions);
  });

  // Create
  app.post('/', { onRequest: [app.authenticateAdmin], schema: { tags: ['Conventions'] } }, async (req: any, reply: any) => {
    const convention = await app.prisma.convention.create({
      data: { ...req.body, createdBy: req.user.id },
      include: { institutionA: { select: { id: true, code: true, nom: true } }, institutionB: { select: { id: true, code: true, nom: true } } },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'convention', resourceId: convention.id, resourceLabel: convention.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(convention);
  });

  // Update
  app.patch('/:id', { onRequest: [app.authenticateAdmin], schema: { tags: ['Conventions'] } }, async (req: any, reply: any) => {
    const convention = await app.prisma.convention.update({
      where: { id: req.params.id },
      data: req.body,
      include: { institutionA: { select: { id: true, code: true, nom: true } }, institutionB: { select: { id: true, code: true, nom: true } } },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'convention', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(convention);
  });

  // Delete
  app.delete('/:id', { onRequest: [app.authenticateAdmin], schema: { tags: ['Conventions'] } }, async (req: any, reply: any) => {
    await app.prisma.convention.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'convention', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

async function xroadRoutes(app: FastifyInstance) {
  // Overview
  app.get('/', { onRequest: [app.authenticateAdmin], schema: { tags: ['X-Road'] } }, async (_req: any, reply: any) => {
    const readiness = await app.prisma.xRoadReadiness.findMany({
      include: { institution: { select: { id: true, code: true, nom: true, ministere: true } } },
      orderBy: { institution: { code: 'asc' } },
    });
    return reply.send(readiness);
  });

  // Upsert (create or update)
  app.put('/:institutionId', { onRequest: [app.authenticateAdmin], schema: { tags: ['X-Road'] } }, async (req: any, reply: any) => {
    const { institutionId } = req.params;
    const readiness = await app.prisma.xRoadReadiness.upsert({
      where: { institutionId },
      update: { ...req.body, updatedBy: req.user.id },
      create: { institutionId, ...req.body, updatedBy: req.user.id },
      include: { institution: { select: { id: true, code: true, nom: true } } },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'xroad-readiness', resourceId: institutionId, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(readiness);
  });
}

// Graphe endpoint — agrège questionnaires + CasUsageMVP
async function grapheRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticateAdmin], schema: { tags: ['Reports'] } }, async (_req: any, reply: any) => {
    const submissions = await app.prisma.submission.findMany({
      include: {
        institution: true,
        fluxExistants: true,
        donneesConsommer: true,
        donneesFournir: true,
      },
    });

    // Charger les institutions pour enrichir les nœuds
    const allInstitutions = await app.prisma.institution.findMany({ select: { code: true, nom: true, ministere: true } });
    const instMap = new Map(allInstitutions.map(i => [i.code, i]));

    const nodesMap = new Map<string, any>();
    const links: any[] = [];

    function ensureNode(code: string) {
      if (!code || nodesMap.has(code)) return;
      const inst = instMap.get(code);
      nodesMap.set(code, {
        id: code,
        label: inst ? `${code} — ${inst.nom}` : code,
        group: inst?.ministere || 'Autre',
        submissionStatus: 'UNKNOWN',
      });
    }

    // SOURCE 1 — Questionnaires
    submissions.forEach((sub) => {
      const inst = sub.institution;
      if (!nodesMap.has(inst.code)) {
        nodesMap.set(inst.code, {
          id: inst.code,
          label: `${inst.code} — ${inst.nom}`,
          group: inst.ministere,
          submissionStatus: sub.status,
          maturite: Math.round((sub.maturiteInfra + sub.maturiteDonnees + sub.maturiteCompetences + sub.maturiteGouvernance) / 4),
        });
      }

      sub.fluxExistants.forEach((f) => {
        if (f.source && f.destination && f.source !== f.destination) {
          ensureNode(f.source);
          ensureNode(f.destination);
          links.push({ id: f.id, type: 'flux', source: f.source, target: f.destination, donnee: f.donnee || '', mode: f.mode || 'Manuel', frequence: f.frequence || '' });
        }
      });

      sub.donneesConsommer.forEach((dc) => {
        if (dc.source && inst.code !== dc.source) {
          ensureNode(dc.source);
          links.push({ source: dc.source, target: inst.code, donnee: dc.donnee, mode: 'Déclaré', frequence: '' });
        }
      });
    });

    // SOURCE 2 — CasUsageMVP (référence + historique + MVP)
    const casUsages = await app.prisma.casUsageMVP.findMany();
    casUsages.forEach((cu) => {
      if (!cu.institutionSourceCode || !cu.institutionCibleCode) return;
      if (cu.institutionSourceCode === cu.institutionCibleCode) return;

      ensureNode(cu.institutionSourceCode);
      ensureNode(cu.institutionCibleCode);

      // Déterminer le mode
      let mode = 'X-Road';
      if (cu.observations?.includes('Manuel')) mode = 'Manuel';
      else if (cu.observations?.includes('Fichier')) mode = 'Fichier (CSV/Excel)';
      else if (cu.statutImpl === 'EN_PRODUCTION') mode = 'X-Road';
      else if (cu.statutImpl === 'IDENTIFIE' && cu.code.startsWith('HIST-')) mode = cu.observations?.includes('Manuel') ? 'Manuel' : 'Fichier (CSV/Excel)';

      links.push({
        id: cu.id,
        type: 'casUsageMVP',
        source: cu.institutionSourceCode,
        target: cu.institutionCibleCode,
        donnee: cu.donneesEchangees || cu.titre,
        mode,
        frequence: '',
      });
    });

    return reply.send({ nodes: Array.from(nodesMap.values()), links });
  });

  // PATCH flux — modifier un lien du graphe
  app.patch('/flux/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { donnee, mode, frequence, type } = req.body as any;

    if (type === 'casUsageMVP') {
      const cu = await app.prisma.casUsageMVP.update({
        where: { id },
        data: { ...(donnee !== undefined && { donneesEchangees: donnee }), ...(mode !== undefined && { observations: `Mode: ${mode}` }) },
      });
      try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'flux', resourceId: id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
      return reply.send(cu);
    }

    // Default: FluxExistant
    const flux = await app.prisma.fluxExistant.update({
      where: { id },
      data: { ...(donnee !== undefined && { donnee }), ...(mode !== undefined && { mode }), ...(frequence !== undefined && { frequence }) },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'flux', resourceId: id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(flux);
  });
}

// PTF & MVP routes
async function ptfRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const ptfs = await app.prisma.pTF.findMany({ include: { programmes: { include: { financements: { include: { casUsageMVP: true } }, expertises: true } } }, orderBy: { code: 'asc' } });
    return reply.send(ptfs);
  });
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const ptf = await app.prisma.pTF.create({ data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'ptf', resourceId: ptf.id, resourceLabel: ptf.code || ptf.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(ptf);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const ptf = await app.prisma.pTF.update({ where: { id: req.params.id }, data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'ptf', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(ptf);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.financement.deleteMany({ where: { programme: { ptfId: req.params.id } } });
    await app.prisma.expertise.deleteMany({ where: { programme: { ptfId: req.params.id } } });
    await app.prisma.programme.deleteMany({ where: { ptfId: req.params.id } });
    await app.prisma.pTF.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'ptf', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

async function programmesRoutes(app: FastifyInstance) {
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const prog = await app.prisma.programme.create({ data: req.body, include: { ptf: true } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'programme', resourceId: prog.id, resourceLabel: prog.code || prog.nom || prog.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(prog);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const prog = await app.prisma.programme.update({ where: { id: req.params.id }, data: req.body, include: { ptf: true } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'programme', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(prog);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.financement.deleteMany({ where: { programmeId: req.params.id } });
    await app.prisma.expertise.deleteMany({ where: { programmeId: req.params.id } });
    await app.prisma.programme.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'programme', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

// Financements CRUD
async function financementsRoutes(app: FastifyInstance) {
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const fin = await app.prisma.financement.update({ where: { id: req.params.id }, data: req.body, include: { casUsageMVP: true, programme: { include: { ptf: true } } } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'financement', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(fin);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.financement.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'financement', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

// Expertises CRUD
async function expertisesRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const experts = await app.prisma.expertise.findMany({ include: { programme: { include: { ptf: true } } }, orderBy: { nom: 'asc' } });
    return reply.send(experts);
  });
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const expert = await app.prisma.expertise.create({ data: req.body, include: { programme: { include: { ptf: true } } } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'expertise', resourceId: expert.id, resourceLabel: expert.nom || expert.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(expert);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const expert = await app.prisma.expertise.update({ where: { id: req.params.id }, data: req.body, include: { programme: { include: { ptf: true } } } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'expertise', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(expert);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.expertise.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'expertise', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

async function phasesMvpRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const phases = await app.prisma.phaseMVP.findMany({ include: { casUsageMVP: { include: { financements: { include: { programme: { include: { ptf: true } } } } } } }, orderBy: { code: 'asc' } });
    return reply.send(phases);
  });
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const phase = await app.prisma.phaseMVP.create({ data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'phase-mvp', resourceId: phase.id, resourceLabel: phase.code || phase.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(phase);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const phase = await app.prisma.phaseMVP.update({ where: { id: req.params.id }, data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'phase-mvp', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(phase);
  });
}

async function casUsageMvpRoutes(app: FastifyInstance) {
  // List with filters
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { axe, statut, nonFinance } = req.query as any;
    const where: any = {};
    if (axe) where.axePrioritaire = axe;
    if (statut) where.statutImpl = statut;

    const casUsages = await app.prisma.casUsageMVP.findMany({
      where,
      include: { phaseMVP: true, financements: { include: { programme: { include: { ptf: true } } } }, declarationsInst: { include: { submission: { include: { institution: { select: { code: true, nom: true } } } } } } },
      orderBy: { code: 'asc' },
    });

    if (nonFinance === 'true') {
      const orphelins = casUsages.filter(cu => !cu.financements.some(f => f.statut !== 'REFUSE'));
      return reply.send(orphelins);
    }
    return reply.send(casUsages);
  });

  // Orphelins endpoint
  app.get('/orphelins', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const all = await app.prisma.casUsageMVP.findMany({
      include: { financements: true, phaseMVP: true },
      orderBy: [{ impact: 'desc' }, { code: 'asc' }],
    });
    const orphelins = all.filter(cu => !cu.financements.some(f => f.statut !== 'REFUSE'));
    return reply.send(orphelins);
  });

  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const cu = await app.prisma.casUsageMVP.create({ data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'cas-usage-mvp', resourceId: cu.id, resourceLabel: cu.code || cu.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(cu);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const cu = await app.prisma.casUsageMVP.update({ where: { id: req.params.id }, data: req.body, include: { financements: { include: { programme: { include: { ptf: true } } } } } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'cas-usage-mvp', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(cu);
  });

  // Add financement
  app.post('/:id/financement', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    try {
      const { programmeId, statut, typeFinancement, montantAlloue, observations } = req.body as any;
      if (!programmeId) return reply.status(400).send({ error: 'programmeId requis' });
      const programme = await app.prisma.programme.findUnique({ where: { id: programmeId } });
      if (!programme) return reply.status(400).send({ error: 'Programme introuvable' });
      const fin = await app.prisma.financement.create({
        data: { casUsageMVPId: req.params.id, programmeId, statut: statut || 'IDENTIFIE', typeFinancement, montantAlloue, observations },
        include: { casUsageMVP: true, programme: { include: { ptf: true } } },
      });
      try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'financement', resourceId: fin.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
      return reply.status(201).send(fin);
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(400).send({ error: 'Ce cas d\'usage est déjà financé par ce programme' });
      throw e;
    }
  });

  // Financement overview
  app.get('/overview/stats', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const all = await app.prisma.casUsageMVP.findMany({ include: { financements: { include: { programme: { include: { ptf: true } } } }, phaseMVP: true } });
    const finances = all.filter(cu => cu.financements.some(f => f.statut !== 'REFUSE'));
    const orphelins = all.filter(cu => !cu.financements.some(f => f.statut !== 'REFUSE'));

    const parPTF: Record<string, { count: number; montant: number }> = {};
    all.forEach(cu => {
      cu.financements.forEach(f => {
        const ptfCode = f.programme.ptf.code;
        if (!parPTF[ptfCode]) parPTF[ptfCode] = { count: 0, montant: 0 };
        parPTF[ptfCode].count++;
        parPTF[ptfCode].montant += f.montantAlloue || 0;
      });
    });

    return reply.send({
      totalCasUsage: all.length,
      casUsageFinances: finances.length,
      casUsageOrphelins: orphelins.length,
      parPTF: Object.entries(parPTF).map(([ptf, data]) => ({ ptf, ...data })),
      parStatut: Object.entries(all.reduce((acc: any, cu) => { acc[cu.statutImpl] = (acc[cu.statutImpl] || 0) + 1; return acc; }, {})).map(([statut, count]) => ({ statut, count })),
    });
  });
}

// FluxInstitution (registre unique)
async function fluxInstitutionRoutes(app: FastifyInstance) {
  // Get flux for a submission
  app.get('/submission/:submissionId', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const flux = await app.prisma.fluxInstitution.findMany({
      where: { submissionId: req.params.submissionId },
      include: { casUsageMVP: { select: { code: true, titre: true, institutionSourceCode: true, institutionCibleCode: true, donneesEchangees: true } } },
    });
    return reply.send(flux);
  });

  // Get all CasUsageMVP for an institution (to show in questionnaire)
  app.get('/available/:institutionCode', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const code = req.params.institutionCode;
    const cas = await app.prisma.casUsageMVP.findMany({
      where: { OR: [{ institutionSourceCode: code }, { institutionCibleCode: code }] },
      orderBy: { code: 'asc' },
    });
    return reply.send(cas);
  });

  // Bulk upsert flux institutions for a submission
  app.put('/submission/:submissionId', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { submissionId } = req.params;
    const items = req.body as any[];

    // Delete existing and recreate
    await app.prisma.fluxInstitution.deleteMany({ where: { submissionId } });
    if (items.length > 0) {
      await app.prisma.fluxInstitution.createMany({
        data: items.map((item: any) => ({
          submissionId,
          casUsageMVPId: item.casUsageMVPId,
          roleInstitution: item.roleInstitution || 'CONSOMMATEUR',
          modeActuel: item.modeActuel || null,
          frequence: item.frequence || null,
          conventionSignee: item.conventionSignee || false,
          volumeEstime: item.volumeEstime || null,
          observations: item.observations || null,
          priorite: item.priorite || 3,
        })),
      });
    }
    const result = await app.prisma.fluxInstitution.findMany({
      where: { submissionId },
      include: { casUsageMVP: true },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'flux', resourceId: submissionId, resourceLabel: `bulk-upsert ${items.length} flux`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(result);
  });

  // Propose new flux (creates CasUsageMVP + FluxInstitution)
  app.post('/propose', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { submissionId, institutionSourceCode, institutionCibleCode, donneesEchangees, description, roleInstitution, modeActuel, frequence } = req.body;

    // Create new CasUsageMVP
    const code = `NEW-${Date.now().toString(36).toUpperCase()}`;
    const cu = await app.prisma.casUsageMVP.create({
      data: {
        code,
        titre: `${institutionSourceCode} → ${institutionCibleCode}: ${donneesEchangees}`,
        description,
        institutionSourceCode,
        institutionCibleCode,
        donneesEchangees,
        statutImpl: 'IDENTIFIE',
        impact: 'MOYEN',
      },
    });

    // Create FluxInstitution
    const fi = await app.prisma.fluxInstitution.create({
      data: {
        submissionId,
        casUsageMVPId: cu.id,
        roleInstitution: roleInstitution || 'FOURNISSEUR',
        modeActuel,
        frequence,
      },
      include: { casUsageMVP: true },
    });

    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'flux', resourceId: fi.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(fi);
  });
}

// Registres Nationaux
async function registresNationauxRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticate] }, async (_req: any, reply: any) => {
    const registres = await app.prisma.registreNational.findMany({ orderBy: [{ domaine: 'asc' }, { code: 'asc' }] });
    return reply.send(registres);
  });
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const reg = await app.prisma.registreNational.create({ data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'registre-national', resourceId: reg.id, resourceLabel: reg.code || reg.nom || reg.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(reg);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const reg = await app.prisma.registreNational.update({ where: { id: req.params.id }, data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'registre-national', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(reg);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.registreNational.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'registre-national', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

// Building Blocks DPI
async function buildingBlocksRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticate] }, async (_req: any, reply: any) => {
    const blocks = await app.prisma.buildingBlock.findMany({ orderBy: [{ couche: 'asc' }, { ordre: 'asc' }] });
    return reply.send(blocks);
  });
  app.get('/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const block = await app.prisma.buildingBlock.findUnique({ where: { id: req.params.id } });
    if (!block) return reply.status(404).send({ error: 'Non trouvé' });
    return reply.send(block);
  });
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const block = await app.prisma.buildingBlock.create({ data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'building-block', resourceId: block.id, resourceLabel: block.nom || block.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(block);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const block = await app.prisma.buildingBlock.update({ where: { id: req.params.id }, data: req.body });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'building-block', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(block);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.buildingBlock.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'building-block', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

// Qualification
async function qualificationRoutes(app: FastifyInstance) {
  const IMPACT_SCORES: Record<string, number> = { CRITIQUE: 4, ELEVE: 3, MOYEN: 2, FAIBLE: 1 };
  const STATUT_URGENCE: Record<string, number> = { EN_PRODUCTION: 5, EN_TEST: 4, EN_DEVELOPPEMENT: 4, EN_PREPARATION: 3, PRIORISE: 3, IDENTIFIE: 2, SUSPENDU: 1 };

  // GET / — Fusion CasUsageMVP + FluxInstitution
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    // 1. Tous les CasUsageMVP
    const casUsages = await app.prisma.casUsageMVP.findMany({
      include: { phaseMVP: true, financements: { include: { programme: { include: { ptf: true } } } }, fluxInstitutions: { include: { submission: { include: { institution: { select: { id: true, code: true, nom: true, ministere: true } } } } } } },
      orderBy: { code: 'asc' },
    });

    // 2. FluxInstitution orphelins (sans CasUsageMVP valide déjà couvert)
    const coveredCuIds = casUsages.map(cu => cu.id);
    const orphanFlux = await app.prisma.fluxInstitution.findMany({
      where: { justificationMetier: { not: null }, casUsageMVPId: { notIn: coveredCuIds } },
      include: { casUsageMVP: { include: { phaseMVP: true } }, submission: { include: { institution: { select: { id: true, code: true, nom: true, ministere: true } } } } },
    });

    // 3. Construire items fusionnés
    const items: any[] = [];

    for (const cu of casUsages) {
      const fluxLie = cu.fluxInstitutions?.[0]; // Premier FluxInstitution lié
      const urgence = fluxLie?.urgence || STATUT_URGENCE[cu.statutImpl] || 2;
      const impact = IMPACT_SCORES[cu.impact] || 2;
      const complexite = IMPACT_SCORES[cu.complexite] || 2;
      const score = Math.round((impact * urgence * 10) / complexite);
      const fin = cu.financements?.[0];

      items.push({
        id: cu.id,
        source: 'registre',
        code: cu.code,
        titre: cu.titre,
        description: cu.description,
        institutionSource: cu.institutionSourceCode,
        institutionCible: cu.institutionCibleCode,
        donneesEchangees: cu.donneesEchangees,
        modeActuel: ['EN_TEST', 'EN_PRODUCTION'].includes(cu.statutImpl) ? 'X-Road' : 'Manuel',
        justificationMetier: fluxLie?.justificationMetier || cu.observations,
        problemeActuel: fluxLie?.problemeActuel || null,
        beneficeAttendu: fluxLie?.beneficeAttendu || null,
        impactEstime: fluxLie?.impactEstime || cu.impact,
        urgence,
        pretTechniquement: fluxLie?.pretTechniquement || null,
        qualifie: ['PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION'].includes(cu.statutImpl),
        impactValide: cu.impact,
        complexiteTechnique: cu.complexite,
        scoreTotal: score,
        statutImpl: cu.statutImpl,
        phaseMVP: cu.phaseMVP?.code || null,
        phaseMVPId: cu.phaseMVPId,
        financement: fin ? `${fin.programme?.ptf?.acronyme || fin.programme?.code} — ${fin.statut.replace('_', ' ')}` : null,
        financementStatut: fin?.statut || null,
        institutionDeclarante: fluxLie?.submission?.institution?.code || null,
        observations: cu.observations,
        casUsageMVPId: cu.id,
      });
    }

    // Orphelins
    for (const f of orphanFlux) {
      const impact = IMPACT_SCORES[f.impactValide || f.impactEstime || 'MOYEN'] || 2;
      const complexite = IMPACT_SCORES[f.complexiteTechnique || 'MOYEN'] || 2;
      const score = f.scoreTotal || Math.round((impact * (f.urgence || 3) * 10) / complexite);
      items.push({
        id: f.id,
        source: 'questionnaire',
        code: f.casUsageMVP?.code || null,
        titre: f.casUsageMVP?.titre || `Flux déclaré par ${f.submission?.institution?.code}`,
        institutionSource: f.casUsageMVP?.institutionSourceCode || null,
        institutionCible: f.casUsageMVP?.institutionCibleCode || null,
        donneesEchangees: f.casUsageMVP?.donneesEchangees || null,
        modeActuel: f.modeActuel || 'Manuel',
        justificationMetier: f.justificationMetier, problemeActuel: f.problemeActuel, beneficeAttendu: f.beneficeAttendu,
        impactEstime: f.impactEstime, urgence: f.urgence, pretTechniquement: f.pretTechniquement,
        qualifie: f.qualifie, impactValide: f.impactValide, complexiteTechnique: f.complexiteTechnique,
        scoreTotal: score, statutImpl: f.qualifie ? 'PRIORISE' : 'IDENTIFIE',
        phaseMVP: f.casUsageMVP?.phaseMVP?.code || null, phaseMVPId: f.casUsageMVP?.phaseMVPId || null,
        financement: null, financementStatut: null,
        institutionDeclarante: f.submission?.institution?.code || null,
        casUsageMVPId: f.casUsageMVPId,
      });
    }

    items.sort((a, b) => (b.scoreTotal || 0) - (a.scoreTotal || 0));
    return reply.send(items);
  });

  // Stats pipeline (fusion)
  app.get('/stats', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const totalCU = await app.prisma.casUsageMVP.count();
    const totalFlux = await app.prisma.fluxInstitution.count({ where: { justificationMetier: { not: null } } });
    const qualifiesInst = await app.prisma.fluxInstitution.count({ where: { justificationMetier: { not: null } } });
    const qualifiesSenum = await app.prisma.casUsageMVP.count({ where: { statutImpl: { in: ['PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION'] } } });
    const retenusMVP = await app.prisma.casUsageMVP.count({ where: { phaseMVPId: { not: null } } });
    return reply.send({ total: totalCU + totalFlux, qualifiesInst, qualifiesSenum, retenusMVP });
  });

  // Qualify a flux (admin)
  app.patch('/:id/qualifier', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const body = req.body as any;

    // Calculate score
    const impactScores: Record<string, number> = { CRITIQUE: 4, ELEVE: 3, MOYEN: 2, FAIBLE: 1 };
    const impact = impactScores[body.impactValide] || 2;
    const urgence = body.urgence || 3;
    const complexite = impactScores[body.complexiteTechnique] || 2;
    const scoreTotal = Math.round((impact * urgence * 10) / complexite);

    const flux = await app.prisma.fluxInstitution.update({
      where: { id },
      data: {
        ...body,
        qualifie: true,
        dateQualification: new Date(),
        qualifiePar: req.user.id,
        scoreTotal,
      },
      include: { casUsageMVP: true, submission: { include: { institution: { select: { code: true, nom: true } } } } },
    });

    // Update CasUsageMVP status if not already higher
    if (body.phaseMVPId) {
      await app.prisma.casUsageMVP.update({
        where: { id: flux.casUsageMVPId },
        data: { statutImpl: 'PRIORISE', phaseMVPId: body.phaseMVPId, impact: body.impactValide, complexite: body.complexiteTechnique },
      });
    }

    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'qualification', resourceId: id, resourceLabel: 'qualifier', ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(flux);
  });

  // Reject
  app.patch('/:id/rejeter', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const flux = await app.prisma.fluxInstitution.update({
      where: { id: req.params.id },
      data: { qualifie: false, dateQualification: new Date(), qualifiePar: req.user.id, noteQualification: req.body.motif },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'qualification', resourceId: req.params.id, resourceLabel: 'rejeter', ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(flux);
  });
}

// Users Admin
async function usersAdminRoutes(app: FastifyInstance) {
  // GET / — list users
  app.get('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { role, search } = req.query as any;
    const where: any = {};
    if (role) where.role = role;
    if (search) where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { institution: { code: { contains: search, mode: 'insensitive' } } },
      { institution: { nom: { contains: search, mode: 'insensitive' } } },
    ];
    const users = await app.prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true, institutionId: true, institution: { select: { id: true, code: true, nom: true } }, mustChangePassword: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(users);
  });

  // POST / — create user
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { email, password, role, institutionId, mustChangePassword } = req.body as any;
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await app.prisma.user.create({
      data: { email, password: hashedPassword, role: role || 'INSTITUTION', institutionId: institutionId || null, mustChangePassword: mustChangePassword !== false },
      select: { id: true, email: true, role: true, institutionId: true, institution: { select: { code: true, nom: true } }, mustChangePassword: true },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'user', resourceId: user.id, resourceLabel: user.email, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(user);
  });

  // PATCH /:id — update user
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { email, role, institutionId, mustChangePassword } = req.body as any;
    const user = await app.prisma.user.update({
      where: { id: req.params.id },
      data: { ...(email && { email }), ...(role && { role }), ...(institutionId !== undefined && { institutionId: institutionId || null }), ...(mustChangePassword !== undefined && { mustChangePassword }) },
      select: { id: true, email: true, role: true, institutionId: true, institution: { select: { code: true, nom: true } }, mustChangePassword: true },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'user', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(user);
  });

  // POST /:id/reset-password
  app.post('/:id/reset-password', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { newPassword } = req.body as any;
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await app.prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword, mustChangePassword: true } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'user', resourceId: req.params.id, resourceLabel: 'reset-password', ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });

  // DELETE /:id
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    if (req.params.id === req.user.id) return reply.status(400).send({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    const adminCount = await app.prisma.user.count({ where: { role: 'ADMIN' } });
    const targetUser = await app.prisma.user.findUnique({ where: { id: req.params.id } });
    if (targetUser?.role === 'ADMIN' && adminCount <= 1) return reply.status(400).send({ error: 'Impossible de supprimer le dernier admin' });
    await app.prisma.user.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'user', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });

  // POST /bulk-create
  app.post('/bulk-create', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { users: usersList } = req.body as any;
    const bcrypt = await import('bcrypt');
    const results = [];
    for (const u of usersList) {
      const password = u.password || 'Atelier@2026';
      const hashedPassword = await bcrypt.hash(password, 10);
      const institution = await app.prisma.institution.findUnique({ where: { code: u.institutionCode } });
      if (!institution) { results.push({ email: u.email, institutionCode: u.institutionCode, error: 'Institution introuvable' }); continue; }
      try {
        const user = await app.prisma.user.create({
          data: { email: u.email, password: hashedPassword, role: 'INSTITUTION', institutionId: institution.id, mustChangePassword: true },
          select: { id: true, email: true, role: true, institution: { select: { code: true, nom: true } } },
        });
        results.push({ ...user, password, institutionCode: u.institutionCode });
      } catch (e: any) {
        results.push({ email: u.email, institutionCode: u.institutionCode, error: e.code === 'P2002' ? 'Email déjà utilisé' : e.message });
      }
    }
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'user', resourceLabel: `bulk-create ${usersList.length} users`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(results);
  });
}

// Notifications
async function notificationRoutes(app: FastifyInstance) {
  const { EmailService } = await import('./notifications/email.service.js');
  const emailService = new EmailService(app);

  app.post('/invite/:institutionId', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const inst = await app.prisma.institution.findUnique({ where: { id: req.params.institutionId }, include: { users: true } });
    if (!inst) return reply.status(404).send({ error: 'Institution non trouvée' });
    const user = inst.users[0];
    if (!user) return reply.status(400).send({ error: 'Aucun compte utilisateur pour cette institution' });
    const sent = await emailService.sendInvitation(user.email, inst.nom, user.email, 'Atelier@2026');
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'notification', resourceId: req.params.institutionId, resourceLabel: `invite ${user.email}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ sent, email: user.email });
  });

  app.post('/relance/:institutionId', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const inst = await app.prisma.institution.findUnique({ where: { id: req.params.institutionId }, include: { users: true } });
    if (!inst) return reply.status(404).send({ error: 'Institution non trouvée' });
    const user = inst.users[0];
    if (!user) return reply.status(400).send({ error: 'Aucun compte utilisateur' });
    const sent = await emailService.sendRelance(user.email, inst.nom);
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'notification', resourceId: req.params.institutionId, resourceLabel: `relance ${user.email}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ sent, email: user.email });
  });

  app.post('/invite-all', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const institutions = await app.prisma.institution.findMany({
      include: { users: true, submissions: { where: { status: { in: ['SUBMITTED', 'VALIDATED'] } } } },
    });
    const toInvite = institutions.filter(i => i.users.length > 0 && i.submissions.length === 0);
    let sent = 0;
    for (const inst of toInvite) {
      const user = inst.users[0];
      const ok = await emailService.sendInvitation(user.email, inst.nom, user.email, 'Atelier@2026');
      if (ok) sent++;
    }
    try { await app.prisma.auditLog.create({ data: { userId: _req.user.id, userEmail: _req.user.email, userRole: _req.user.role, action: 'CREATE', resource: 'notification', resourceLabel: `invite-all ${sent}/${toInvite.length}`, ipAddress: _req.headers['x-forwarded-for']?.toString() || _req.ip, userAgent: _req.headers['user-agent'] } }); } catch {}
    return reply.send({ total: toInvite.length, sent });
  });
}

// Audit & Session tracking
async function auditRoutes(app: FastifyInstance) {
  // GET /api/audit/logs — List audit logs with filters
  app.get('/logs', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { page = '1', limit = '50', userId, action, resource, dateFrom, dateTo } = req.query as any;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      app.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
      app.prisma.auditLog.count({ where }),
    ]);

    return reply.send({ data: logs, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  });

  // GET /api/audit/sessions/active — Active sessions with user info
  app.get('/sessions/active', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const sessions = await app.prisma.userSession.findMany({
      where: { isActive: true, lastActivityAt: { gte: thirtyMinAgo } },
      include: { user: { select: { email: true, role: true, institution: { select: { code: true, nom: true } } } } },
      orderBy: { lastActivityAt: 'desc' },
    });
    return reply.send(sessions);
  });

  // GET /api/audit/stats — Dashboard stats
  app.get('/stats', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const now = new Date();
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const [totalLogins24h, failedLogins24h, modifications24h, activeSessionsNow] = await Promise.all([
      app.prisma.auditLog.count({ where: { action: 'LOGIN_SUCCESS', createdAt: { gte: h24ago } } }),
      app.prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: h24ago } } }),
      app.prisma.auditLog.count({ where: { action: { in: ['CREATE', 'UPDATE', 'DELETE'] }, createdAt: { gte: h24ago } } }),
      app.prisma.userSession.count({ where: { isActive: true, lastActivityAt: { gte: thirtyMinAgo } } }),
    ]);

    return reply.send({ totalLogins24h, activeSessionsNow, failedLogins24h, modifications24h });
  });

  // GET /api/audit/logs/export — CSV export
  app.get('/logs/export', { onRequest: [app.authenticateAdmin] }, async (_req: any, reply: any) => {
    const logs = await app.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10000 });
    const csv = 'Date,Email,Role,Action,Resource,ResourceId,ResourceLabel,IP\n' +
      logs.map((l: any) => `${l.createdAt.toISOString()},${l.userEmail},${l.userRole},${l.action},${l.resource},${l.resourceId || ''},${(l.resourceLabel || '').replace(/,/g, ';')},${l.ipAddress || ''}`).join('\n');
    reply.header('Content-Type', 'text/csv').header('Content-Disposition', 'attachment; filename=audit-logs.csv').send(csv);
  });

  // DELETE /api/audit/sessions/:id — Force logout
  app.delete('/sessions/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const session = await app.prisma.userSession.update({
      where: { id: req.params.id },
      data: { isActive: false, logoutAt: new Date() },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'session', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(session);
  });
}

// ============================================================================
// RECHERCHE GLOBALE
// ============================================================================
async function searchRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { q, limit = '10' } = req.query as any;
    if (!q || q.trim().length < 2) return reply.send({ casUsage: [], institutions: [], conventions: [], users: [] });

    const term = q.trim();
    const lim = Math.min(parseInt(limit), 20);

    const [casUsage, institutions, conventions, users] = await Promise.all([
      app.prisma.casUsageMVP.findMany({
        where: { OR: [{ code: { contains: term, mode: 'insensitive' } }, { titre: { contains: term, mode: 'insensitive' } }, { institutionSourceCode: { contains: term, mode: 'insensitive' } }, { institutionCibleCode: { contains: term, mode: 'insensitive' } }] },
        select: { id: true, code: true, titre: true, statutImpl: true, institutionSourceCode: true, institutionCibleCode: true },
        take: lim, orderBy: { code: 'asc' },
      }),
      app.prisma.institution.findMany({
        where: { OR: [{ code: { contains: term, mode: 'insensitive' } }, { nom: { contains: term, mode: 'insensitive' } }, { ministere: { contains: term, mode: 'insensitive' } }] },
        select: { id: true, code: true, nom: true, ministere: true },
        take: lim, orderBy: { code: 'asc' },
      }),
      app.prisma.convention.findMany({
        where: { OR: [{ objet: { contains: term, mode: 'insensitive' } }] },
        select: { id: true, objet: true, statut: true, institutionA: { select: { code: true, nom: true } }, institutionB: { select: { code: true, nom: true } } },
        take: lim, orderBy: { updatedAt: 'desc' },
      }),
      req.user.role === 'ADMIN' ? app.prisma.user.findMany({
        where: { OR: [{ email: { contains: term, mode: 'insensitive' } }] },
        select: { id: true, email: true, role: true, institution: { select: { code: true, nom: true } } },
        take: lim, orderBy: { email: 'asc' },
      }) : [],
    ]);

    return reply.send({ casUsage, institutions, conventions, users });
  });
}

// ============================================================================
// CAS D'USAGE 360° — VUE DÉTAILLÉE
// ============================================================================
async function casUsageDetailRoutes(app: FastifyInstance) {
  app.get('/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const cu = await app.prisma.casUsageMVP.findUnique({
      where: { id: req.params.id },
      include: {
        phaseMVP: true,
        financements: { include: { programme: { include: { ptf: true } } } },
        fluxInstitutions: { include: { submission: { include: { institution: { select: { id: true, code: true, nom: true } } } } } },
        declarationsInst: { include: { submission: { include: { institution: { select: { code: true, nom: true } } } } } },
      },
    });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    // Charger les institutions source et cible par code
    const [instSource, instCible] = await Promise.all([
      cu.institutionSourceCode ? app.prisma.institution.findUnique({ where: { code: cu.institutionSourceCode }, select: { id: true, code: true, nom: true, ministere: true } }) : null,
      cu.institutionCibleCode ? app.prisma.institution.findUnique({ where: { code: cu.institutionCibleCode }, select: { id: true, code: true, nom: true, ministere: true } }) : null,
    ]);

    // Conventions entre source et cible
    let conventions: any[] = [];
    if (instSource && instCible) {
      conventions = await app.prisma.convention.findMany({
        where: {
          OR: [
            { institutionAId: instSource.id, institutionBId: instCible.id },
            { institutionAId: instCible.id, institutionBId: instSource.id },
          ],
        },
        include: { institutionA: { select: { code: true, nom: true } }, institutionB: { select: { code: true, nom: true } } },
      });
    }

    // X-Road readiness des deux institutions
    const [xroadSource, xroadCible] = await Promise.all([
      instSource ? app.prisma.xRoadReadiness.findUnique({ where: { institutionId: instSource.id }, include: { institution: { select: { code: true, nom: true } } } }) : null,
      instCible ? app.prisma.xRoadReadiness.findUnique({ where: { institutionId: instCible.id }, include: { institution: { select: { code: true, nom: true } } } }) : null,
    ]);

    // Audit logs pour timeline
    const auditLogs = await app.prisma.auditLog.findMany({
      where: { resourceId: cu.id, resource: 'cas-usage-mvp' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return reply.send({
      ...cu,
      institutionSource: instSource,
      institutionCible: instCible,
      conventions,
      xroadSource,
      xroadCible,
      auditLogs,
    });
  });

  // Update notes
  app.patch('/:id/notes', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { notes } = req.body as any;
    const cu = await app.prisma.casUsageMVP.update({
      where: { id: req.params.id },
      data: { notes },
    });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'UPDATE', resource: 'cas-usage-mvp', resourceId: req.params.id, resourceLabel: `notes: ${cu.code}`, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send(cu);
  });
}

// ============================================================================
// DOCUMENTS RÉFÉRENCE
// ============================================================================
async function documentsRoutes(app: FastifyInstance) {
  // List (accessible à tous les utilisateurs connectés)
  app.get('/', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const where: any = {};
    if (req.user.role !== 'ADMIN') where.actif = true;
    const docs = await app.prisma.documentReference.findMany({ where, orderBy: [{ categorie: 'asc' }, { datePublication: 'desc' }] });
    return reply.send(docs);
  });

  // Create (admin + upload)
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const data = req.body;
    const doc = await app.prisma.documentReference.create({ data: { ...data, uploadePar: req.user.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'CREATE', resource: 'document', resourceId: doc.id, resourceLabel: doc.titre, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.status(201).send(doc);
  });

  // Update
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const doc = await app.prisma.documentReference.update({ where: { id: req.params.id }, data: req.body });
    return reply.send(doc);
  });

  // Delete
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.documentReference.delete({ where: { id: req.params.id } });
    try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'DELETE', resource: 'document', resourceId: req.params.id, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
    return reply.send({ success: true });
  });
}

export async function registerRoutes(app: FastifyInstance) {
  // Update session activity on every authenticated request
  app.addHook('onResponse', async (request: any, reply: any) => {
    if (!request.user?.id) return;
    if (['GET', 'OPTIONS', 'HEAD'].includes(request.method)) return;
    if (reply.statusCode >= 400) return;
    try {
      await app.prisma.userSession.updateMany({
        where: { userId: request.user.id, isActive: true },
        data: { lastActivityAt: new Date() },
      });
    } catch {}
  });

  app.register(
    async function (api) {
      api.register(authRoutes, { prefix: '/auth' });
      api.register(institutionsRoutes, { prefix: '/institutions' });
      api.register(submissionsRoutes, { prefix: '/submissions' });
      api.register(reportsRoutes, { prefix: '/reports' });
      api.register(conventionsRoutes, { prefix: '/conventions' });
      api.register(xroadRoutes, { prefix: '/xroad-readiness' });
      api.register(grapheRoutes, { prefix: '/graphe' });
      api.register(ptfRoutes, { prefix: '/ptf' });
      api.register(programmesRoutes, { prefix: '/programmes' });
      api.register(phasesMvpRoutes, { prefix: '/phases-mvp' });
      api.register(casUsageMvpRoutes, { prefix: '/cas-usage-mvp' });
      api.register(notificationRoutes, { prefix: '/notifications' });
      api.register(fluxInstitutionRoutes, { prefix: '/flux-institutions' });
      api.register(usersAdminRoutes, { prefix: '/users' });
      api.register(qualificationRoutes, { prefix: '/qualification' });
      api.register(buildingBlocksRoutes, { prefix: '/building-blocks' });
      api.register(financementsRoutes, { prefix: '/financements' });
      api.register(expertisesRoutes, { prefix: '/expertises' });
      api.register(registresNationauxRoutes, { prefix: '/registres-nationaux' });
      api.register(importRoutes, { prefix: '/import' });
      api.register(auditRoutes, { prefix: '/audit' });
      api.register(institutionDashboardRoutes, { prefix: '/institution' });
      api.register(demandesRoutes, { prefix: '/demandes' });
      api.register(searchRoutes, { prefix: '/search' });
      api.register(casUsageDetailRoutes, { prefix: '/cas-usage-detail' });
      api.register(documentsRoutes, { prefix: '/documents' });

      // Vue 360°
      api.register(useCasesRoutes, { prefix: '/use-cases' });
      api.register(useCasesWriteRoutes, { prefix: '/use-cases' });
      api.register(useCasesMeRoutes, { prefix: '/me/use-cases' });
      api.register(consultationRoutes, { prefix: '/consultations' });
      api.register(feedbackRoutes, { prefix: '/feedback' });
      api.register(duArbitrageRoutes, { prefix: '/du/arbitrage' });
      api.register(registresCouvertureRoutes, { prefix: '/registres' });
      api.register(registresUseCaseRoutes, { prefix: '/use-cases' });
    },
    { prefix: '/api' }
  );

  app.log.info('All routes registered');
}
