/**
 * Routes Contrat de Données — Édition versionnée avec historique
 *
 * GET  /api/use-cases/:id/contrat-donnees           — Courant + flag _editable
 * GET  /api/use-cases/:id/contrat-donnees/versions   — Historique complet
 * POST /api/use-cases/:id/contrat-donnees            — Nouvelle version
 *
 * RBAC : FULL/DETAILED peuvent éditer ; METADATA lit seulement ; NONE → 404
 */

import { FastifyInstance } from 'fastify';
import { computeVisibility, UserContext } from '../../services/useCaseVisibility.js';

async function resolveVisibility(app: any, req: any, casUsageId: string) {
  const cu = await app.prisma.casUsageMVP.findUnique({
    where: { id: casUsageId },
    select: {
      id: true, institutionSourceCode: true,
      stakeholders360: { select: { institutionId: true, role: true, actif: true } },
    },
  });
  if (!cu) return { level: 'NONE' as const, user: null, cu: null };

  let userInstitutionCode: string | undefined;
  if (req.user.institutionId) {
    const inst = await app.prisma.institution.findUnique({
      where: { id: req.user.institutionId }, select: { code: true },
    });
    userInstitutionCode = inst?.code;
  }

  const user: UserContext = {
    id: req.user.id, email: req.user.email, role: req.user.role,
    institutionId: req.user.institutionId, institutionCode: userInstitutionCode,
  };

  const visibility = computeVisibility(user, cu.stakeholders360 || [], cu.institutionSourceCode);
  return { level: visibility.level, user, cu };
}

export async function contratDonneesRoutes(app: FastifyInstance) {

  // GET /:id/contrat-donnees — Valeurs courantes + flag _editable
  app.get('/:id/contrat-donnees', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { level, cu } = await resolveVisibility(app, req, id);
    if (level === 'NONE' || !cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    const casUsage = await app.prisma.casUsageMVP.findUnique({
      where: { id },
      select: {
        donneesEntree: true, donneesSortie: true, donneesLecture: true,
        baseLegale: true, dureeRetention: true,
      },
    });

    const lastVersion = await app.prisma.contratDonneesVersion.findFirst({
      where: { casUsageId: id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true, createdAt: true, auteurNom: true, auteurInstitution: true },
    });

    return reply.send({
      ...casUsage,
      derniereVersion: lastVersion?.versionNumber || 0,
      derniereModification: lastVersion?.createdAt || null,
      dernierAuteur: lastVersion ? { nom: lastVersion.auteurNom, institution: lastVersion.auteurInstitution } : null,
      _editable: ['FULL', 'DETAILED'].includes(level),
    });
  });

  // GET /:id/contrat-donnees/versions — Historique complet
  app.get('/:id/contrat-donnees/versions', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { level, cu } = await resolveVisibility(app, req, id);
    if (level === 'NONE' || !cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    const versions = await app.prisma.contratDonneesVersion.findMany({
      where: { casUsageId: id },
      orderBy: { versionNumber: 'desc' },
    });

    return reply.send(versions);
  });

  // POST /:id/contrat-donnees — Créer une nouvelle version
  app.post('/:id/contrat-donnees', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { donneesEntree, donneesSortie, donneesLecture, baseLegale, dureeRetention } = req.body as any;

    const { level, cu, user } = await resolveVisibility(app, req, id);
    if (level === 'NONE' || !cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });
    if (!['FULL', 'DETAILED'].includes(level)) {
      return reply.status(403).send({ error: 'Vous n\'êtes pas autorisé à modifier le contrat de données' });
    }

    // Résoudre le nom de l'institution de l'auteur
    let auteurInstitution = 'SENUM SA';
    if (user!.institutionId) {
      const inst = await app.prisma.institution.findUnique({
        where: { id: user!.institutionId }, select: { nom: true },
      });
      auteurInstitution = inst?.nom || 'SENUM SA';
    }

    // Calculer le numéro de version suivant
    const lastVersion = await app.prisma.contratDonneesVersion.findFirst({
      where: { casUsageId: id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    // Transaction : créer la version + mettre à jour les champs courants sur CasUsageMVP
    const result = await app.prisma.$transaction(async (tx: any) => {
      const version = await tx.contratDonneesVersion.create({
        data: {
          casUsageId: id,
          versionNumber: nextVersion,
          donneesEntree: donneesEntree || null,
          donneesSortie: donneesSortie || null,
          donneesLecture: donneesLecture || null,
          baseLegale: baseLegale || null,
          dureeRetention: dureeRetention || null,
          auteurUserId: user!.id,
          auteurNom: req.user.email,
          auteurInstitution,
        },
      });

      await tx.casUsageMVP.update({
        where: { id },
        data: {
          donneesEntree: donneesEntree || null,
          donneesSortie: donneesSortie || null,
          donneesLecture: donneesLecture || null,
          baseLegale: baseLegale || null,
          dureeRetention: dureeRetention || null,
        },
      });

      return version;
    });

    // Audit log
    try {
      await app.prisma.auditLog.create({
        data: {
          userId: req.user.id, userEmail: req.user.email, userRole: req.user.role,
          action: 'UPDATE', resource: 'contrat-donnees', resourceId: id,
          resourceLabel: `v${nextVersion}`,
          details: {
            version: nextVersion,
            champs: Object.entries({ donneesEntree, donneesSortie, donneesLecture, baseLegale, dureeRetention })
              .filter(([, v]) => v !== undefined && v !== null)
              .map(([k]) => k),
          },
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    return reply.status(201).send(result);
  });
}
