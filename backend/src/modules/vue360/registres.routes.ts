/**
 * Routes Vue 360° — Couverture par référentiel (addendum v1.1)
 *
 * GET  /api/registres/couverture       — Couverture agrégée par référentiel
 * GET  /api/registres/:id/cas-usages   — Cas d'usage associés à un référentiel
 * POST /api/use-cases/:id/registres    — Rattacher un registre à un cas d'usage
 * GET  /api/use-cases/:id/similaires   — Détecteur de doublons
 */

import { FastifyInstance } from 'fastify';

export async function registresCouvertureRoutes(app: FastifyInstance) {

  // =========================================================================
  // GET /couverture — Vue agrégée par référentiel
  // =========================================================================
  app.get('/couverture', { onRequest: [app.authenticate] }, async (_req: any, reply: any) => {
    // Tous les registres avec compteurs
    const registres = await app.prisma.registreNational.findMany({
      orderBy: [{ domaine: 'asc' }, { code: 'asc' }],
    });

    const result = [];
    for (const reg of registres) {
      // Compteurs par mode
      const liens = await app.prisma.casUsageRegistre.findMany({
        where: { registreId: reg.id },
        include: {
          casUsage: {
            select: { id: true, code: true, titre: true, institutionSourceCode: true, institutionCibleCode: true, statutVueSection: true },
          },
        },
      });

      const consomme = liens.filter(l => l.mode === 'CONSOMME').length;
      const alimente = liens.filter(l => l.mode === 'ALIMENTE').length;
      const cree = liens.filter(l => l.mode === 'CREE').length;

      // Institutions consommatrices (distinct)
      const consommateurs = new Set<string>();
      for (const l of liens) {
        if (l.casUsage.institutionSourceCode) consommateurs.add(l.casUsage.institutionSourceCode);
        if (l.casUsage.institutionCibleCode) consommateurs.add(l.casUsage.institutionCibleCode);
      }

      // Doublons potentiels : paires de CU avec recouvrement champs > 50%
      let doublonsPotentiels = 0;
      const consommeLinks = liens.filter(l => l.mode === 'CONSOMME' && l.champsConcernes);
      for (let i = 0; i < consommeLinks.length; i++) {
        for (let j = i + 1; j < consommeLinks.length; j++) {
          const a = consommeLinks[i].champsConcernes as string[];
          const b = consommeLinks[j].champsConcernes as string[];
          if (a && b) {
            const intersection = a.filter(x => b.includes(x));
            const union = [...new Set([...a, ...b])];
            if (union.length > 0 && intersection.length / union.length >= 0.5) {
              doublonsPotentiels++;
            }
          }
        }
      }

      result.push({
        id: reg.id,
        code: reg.code,
        nom: reg.nom,
        domaine: reg.domaine,
        detenteurCode: reg.institutionCode,
        detenteurNom: reg.institutionNom,
        disposeAPI: reg.disposeAPI,
        compteurs: { consomme, alimente, cree, total: consomme + alimente + cree },
        consommateurs: [...consommateurs],
        doublonsPotentiels,
      });
    }

    return reply.send(result);
  });

  // =========================================================================
  // GET /:id/cas-usages — Cas d'usage associés à un référentiel
  // =========================================================================
  app.get('/:id/cas-usages', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;

    const registre = await app.prisma.registreNational.findUnique({ where: { id } });
    if (!registre) return reply.status(404).send({ error: 'Référentiel non trouvé' });

    const liens = await app.prisma.casUsageRegistre.findMany({
      where: { registreId: id },
      include: {
        casUsage: {
          select: {
            id: true, code: true, titre: true, resumeMetier: true,
            institutionSourceCode: true, institutionCibleCode: true,
            statutVueSection: true, statutImpl: true, impact: true,
            phaseMVP: { select: { code: true } },
          },
        },
      },
      orderBy: { mode: 'asc' },
    });

    // Grouper par mode
    const grouped = {
      CONSOMME: liens.filter(l => l.mode === 'CONSOMME'),
      ALIMENTE: liens.filter(l => l.mode === 'ALIMENTE'),
      CREE: liens.filter(l => l.mode === 'CREE'),
    };

    return reply.send({ registre, casUsages: grouped });
  });
}

export async function registresUseCaseRoutes(app: FastifyInstance) {

  // =========================================================================
  // POST /:id/registres — Rattacher un registre à un cas d'usage
  // =========================================================================
  app.post('/:id/registres', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id: casUsageId } = req.params;
    const { registreId, mode, champsConcernes, volumetrieEst, criticite } = req.body as any;
    const user = req.user;

    if (!registreId || !mode) return reply.status(400).send({ error: 'registreId et mode requis' });

    const cu = await app.prisma.casUsageMVP.findUnique({ where: { id: casUsageId } });
    if (!cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    // Vérifier unicité
    const existing = await app.prisma.casUsageRegistre.findUnique({
      where: { casUsageId_registreId_mode: { casUsageId, registreId, mode } },
    });
    if (existing) return reply.status(409).send({ error: 'Ce rattachement existe déjà' });

    const link = await app.prisma.casUsageRegistre.create({
      data: {
        casUsageId, registreId, mode,
        champsConcernes: champsConcernes || null,
        volumetrieEst: volumetrieEst || null,
        criticite: criticite || null,
        ajoutePar: user.id,
      },
      include: { registre: { select: { code: true, nom: true } } },
    });

    return reply.status(201).send(link);
  });

  // =========================================================================
  // GET /:id/similaires — Détecteur de doublons
  // =========================================================================
  app.get('/:id/similaires', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id: casUsageId } = req.params;

    // Trouver les registres du CU courant
    const myLinks = await app.prisma.casUsageRegistre.findMany({
      where: { casUsageId },
      include: { registre: { select: { code: true, nom: true } } },
    });

    if (myLinks.length === 0) return reply.send([]);

    // Pour chaque registre+mode, chercher les autres CU qui ont le même
    const similaires: any[] = [];
    const seen = new Set<string>();

    for (const myLink of myLinks) {
      const others = await app.prisma.casUsageRegistre.findMany({
        where: {
          registreId: myLink.registreId,
          mode: myLink.mode,
          casUsageId: { not: casUsageId },
        },
        include: {
          casUsage: { select: { id: true, code: true, titre: true, institutionSourceCode: true, statutVueSection: true } },
          registre: { select: { code: true, nom: true } },
        },
      });

      for (const other of others) {
        if (seen.has(other.casUsageId)) continue;

        // Calculer recouvrement champs
        const myChamps = (myLink.champsConcernes as string[]) || [];
        const otherChamps = (other.champsConcernes as string[]) || [];
        let recouvrement = 0;
        if (myChamps.length > 0 && otherChamps.length > 0) {
          const intersection = myChamps.filter(x => otherChamps.includes(x));
          const union = [...new Set([...myChamps, ...otherChamps])];
          recouvrement = union.length > 0 ? Math.round((intersection.length / union.length) * 100) : 0;
        } else {
          recouvrement = 50; // si pas de champs renseignés, on considère 50% par défaut
        }

        if (recouvrement >= 50) {
          seen.add(other.casUsageId);
          similaires.push({
            casUsage: other.casUsage,
            registre: other.registre,
            mode: other.mode,
            recouvrement,
            champsCommunsCount: myChamps.filter(x => otherChamps.includes(x)).length,
          });
        }
      }
    }

    return reply.send(similaires);
  });
}
