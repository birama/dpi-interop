/**
 * Routes Institutions pour la page Catalogue — vue miroir de /services-guichet
 * Préfixe : /catalogue
 * GET  /institutions     — liste agrégée (nb cas fournis/consommés, par statut)
 * GET  /institutions/:id — détail (fournit, consomme, registres opérés, guichet)
 */

import { FastifyInstance } from 'fastify';

export async function institutionsCatalogueRoutes(app: FastifyInstance) {

  // ===========================================================================
  // GET /institutions — Liste agrégée
  // ===========================================================================
  app.get('/institutions', { onRequest: [app.authenticate] }, async (_req: any, reply: any) => {
    const institutions = await app.prisma.institution.findMany({
      select: { id: true, code: true, nom: true, ministere: true },
      orderBy: { code: 'asc' },
    });

    // Agrégats stakeholders
    const shAgg = await app.prisma.useCaseStakeholder.groupBy({
      by: ['institutionId', 'role'],
      where: { actif: true },
      _count: { _all: true },
    });

    // Agrégats par statut
    const shByStatut = await app.prisma.useCaseStakeholder.findMany({
      where: { actif: true },
      select: {
        institutionId: true, role: true,
        casUsage: { select: { statutVueSection: true } },
      },
    });

    // Indexer
    const instMap = new Map<string, any>();
    for (const inst of institutions) {
      instMap.set(inst.id, {
        id: inst.id, code: inst.code, nom: inst.nom, ministere: inst.ministere,
        nbFournisseur: 0, nbConsommateur: 0, nbInitiateur: 0,
        enProduction: 0, qualifie: 0, priorise: 0, propose: 0, autre: 0,
      });
    }

    for (const s of shAgg) {
      const entry = instMap.get(s.institutionId);
      if (!entry) continue;
      if (s.role === 'FOURNISSEUR') entry.nbFournisseur = s._count._all;
      else if (s.role === 'CONSOMMATEUR') entry.nbConsommateur = s._count._all;
      else if (s.role === 'INITIATEUR') entry.nbInitiateur = s._count._all;
    }

    for (const s of shByStatut) {
      const entry = instMap.get(s.institutionId);
      if (!entry) continue;
      const st = s.casUsage.statutVueSection;
      if (st === 'EN_PRODUCTION_360') entry.enProduction++;
      else if (st === 'QUALIFIE') entry.qualifie++;
      else if (st === 'PRIORISE') entry.priorise++;
      else if (st === 'PROPOSE') entry.propose++;
      else entry.autre++;
    }

    const items = [...instMap.values()];
    return reply.send({ total: items.length, items });
  });

  // ===========================================================================
  // GET /institutions/:id — Détail
  // ===========================================================================
  app.get('/institutions/:id', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const inst = await app.prisma.institution.findUnique({
      where: { id: req.params.id },
      select: { id: true, code: true, nom: true, ministere: true,
        responsableNom: true, responsableFonction: true, responsableEmail: true, responsableTel: true },
    });
    if (!inst) return reply.status(404).send({ error: 'Institution non trouvée' });

    // Stakeholders actifs
    const stakeholders = await app.prisma.useCaseStakeholder.findMany({
      where: { institutionId: inst.id, actif: true },
      orderBy: { casUsage: { statutVueSection: 'desc' } },
      include: {
        casUsage: {
          select: { id: true, code: true, titre: true, typologie: true, domaine: true, statutVueSection: true },
        },
      },
    });

    const fournit: any[] = [];
    const consomme: any[] = [];
    const initie: any[] = [];
    for (const sh of stakeholders) {
      const entry = { casId: sh.casUsage.id, code: sh.casUsage.code, titre: sh.casUsage.titre, typologie: sh.casUsage.typologie, domaine: sh.casUsage.domaine, statut: sh.casUsage.statutVueSection };
      if (sh.role === 'FOURNISSEUR') fournit.push(entry);
      else if (sh.role === 'CONSOMMATEUR') consomme.push(entry);
      else if (sh.role === 'INITIATEUR') initie.push(entry);
    }

    // Registres opérés (via institutionCode string, pas FK)
    const registres = await app.prisma.registreNational.findMany({
      where: { institutionCode: inst.code },
      select: { id: true, code: true, nom: true, domaine: true },
    });

    // XRoad readiness
    const xr = await app.prisma.xRoadReadiness.findUnique({
      where: { institutionId: inst.id },
      select: {
        serveurDedie: true, connectiviteReseau: true, certificatsSSL: true,
        securityServerInstall: true, premierServicePublie: true, premierEchangeReussi: true,
        hebergement: true,
      },
    });

    // Liaisons guichet qui dépendent des cas de cette institution
    const casIds = stakeholders.map((s) => s.casUsage.id);
    const liaisonsGuichet = await app.prisma.liaisonGuichet.findMany({
      where: { casUsageId: { in: casIds } },
      distinct: ['serviceGuichetId'],
      include: {
        serviceGuichet: { select: { id: true, code: true, intitule: true, secteur: true, publicCible: true } },
      },
    });

    return reply.send({
      ...inst,
      fournit, consomme, initie,
      registres,
      xroad: xr ? {
        securityServer: xr.securityServerInstall,
        premierService: xr.premierServicePublie,
        premierEchange: xr.premierEchangeReussi,
        hebergement: xr.hebergement,
      } : null,
      liaisonsGuichet: liaisonsGuichet.map((l) => l.serviceGuichet),
    });
  });
}
