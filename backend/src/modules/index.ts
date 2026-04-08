import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/index.js';
import { institutionsRoutes } from './institutions/index.js';
import { submissionsRoutes } from './submissions/index.js';
import { reportsRoutes } from './reports/index.js';
import { importRoutes } from './import/import.routes.js';

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
    return reply.status(201).send(convention);
  });

  // Update
  app.patch('/:id', { onRequest: [app.authenticateAdmin], schema: { tags: ['Conventions'] } }, async (req: any, reply: any) => {
    const convention = await app.prisma.convention.update({
      where: { id: req.params.id },
      data: req.body,
      include: { institutionA: { select: { id: true, code: true, nom: true } }, institutionB: { select: { id: true, code: true, nom: true } } },
    });
    return reply.send(convention);
  });

  // Delete
  app.delete('/:id', { onRequest: [app.authenticateAdmin], schema: { tags: ['Conventions'] } }, async (req: any, reply: any) => {
    await app.prisma.convention.delete({ where: { id: req.params.id } });
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
      return reply.send(cu);
    }

    // Default: FluxExistant
    const flux = await app.prisma.fluxExistant.update({
      where: { id },
      data: { ...(donnee !== undefined && { donnee }), ...(mode !== undefined && { mode }), ...(frequence !== undefined && { frequence }) },
    });
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
    return reply.status(201).send(ptf);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const ptf = await app.prisma.pTF.update({ where: { id: req.params.id }, data: req.body });
    return reply.send(ptf);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.financement.deleteMany({ where: { programme: { ptfId: req.params.id } } });
    await app.prisma.expertise.deleteMany({ where: { programme: { ptfId: req.params.id } } });
    await app.prisma.programme.deleteMany({ where: { ptfId: req.params.id } });
    await app.prisma.pTF.delete({ where: { id: req.params.id } });
    return reply.send({ success: true });
  });
}

async function programmesRoutes(app: FastifyInstance) {
  app.post('/', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const prog = await app.prisma.programme.create({ data: req.body, include: { ptf: true } });
    return reply.status(201).send(prog);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const prog = await app.prisma.programme.update({ where: { id: req.params.id }, data: req.body, include: { ptf: true } });
    return reply.send(prog);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.financement.deleteMany({ where: { programmeId: req.params.id } });
    await app.prisma.expertise.deleteMany({ where: { programmeId: req.params.id } });
    await app.prisma.programme.delete({ where: { id: req.params.id } });
    return reply.send({ success: true });
  });
}

// Financements CRUD
async function financementsRoutes(app: FastifyInstance) {
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const fin = await app.prisma.financement.update({ where: { id: req.params.id }, data: req.body, include: { casUsageMVP: true, programme: { include: { ptf: true } } } });
    return reply.send(fin);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.financement.delete({ where: { id: req.params.id } });
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
    return reply.status(201).send(expert);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const expert = await app.prisma.expertise.update({ where: { id: req.params.id }, data: req.body, include: { programme: { include: { ptf: true } } } });
    return reply.send(expert);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.expertise.delete({ where: { id: req.params.id } });
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
    return reply.status(201).send(phase);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const phase = await app.prisma.phaseMVP.update({ where: { id: req.params.id }, data: req.body });
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
    return reply.status(201).send(cu);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const cu = await app.prisma.casUsageMVP.update({ where: { id: req.params.id }, data: req.body, include: { financements: { include: { programme: { include: { ptf: true } } } } } });
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
    return reply.status(201).send(reg);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const reg = await app.prisma.registreNational.update({ where: { id: req.params.id }, data: req.body });
    return reply.send(reg);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.registreNational.delete({ where: { id: req.params.id } });
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
    return reply.status(201).send(block);
  });
  app.patch('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const block = await app.prisma.buildingBlock.update({ where: { id: req.params.id }, data: req.body });
    return reply.send(block);
  });
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    await app.prisma.buildingBlock.delete({ where: { id: req.params.id } });
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

    return reply.send(flux);
  });

  // Reject
  app.patch('/:id/rejeter', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const flux = await app.prisma.fluxInstitution.update({
      where: { id: req.params.id },
      data: { qualifie: false, dateQualification: new Date(), qualifiePar: req.user.id, noteQualification: req.body.motif },
    });
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
    return reply.send(user);
  });

  // POST /:id/reset-password
  app.post('/:id/reset-password', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const { newPassword } = req.body as any;
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await app.prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword, mustChangePassword: true } });
    return reply.send({ success: true });
  });

  // DELETE /:id
  app.delete('/:id', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    if (req.params.id === req.user.id) return reply.status(400).send({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    const adminCount = await app.prisma.user.count({ where: { role: 'ADMIN' } });
    const targetUser = await app.prisma.user.findUnique({ where: { id: req.params.id } });
    if (targetUser?.role === 'ADMIN' && adminCount <= 1) return reply.status(400).send({ error: 'Impossible de supprimer le dernier admin' });
    await app.prisma.user.delete({ where: { id: req.params.id } });
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
    return reply.send({ sent, email: user.email });
  });

  app.post('/relance/:institutionId', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    const inst = await app.prisma.institution.findUnique({ where: { id: req.params.institutionId }, include: { users: true } });
    if (!inst) return reply.status(404).send({ error: 'Institution non trouvée' });
    const user = inst.users[0];
    if (!user) return reply.status(400).send({ error: 'Aucun compte utilisateur' });
    const sent = await emailService.sendRelance(user.email, inst.nom);
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
    return reply.send({ total: toInvite.length, sent });
  });
}

export async function registerRoutes(app: FastifyInstance) {
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
    },
    { prefix: '/api' }
  );

  app.log.info('All routes registered');
}
