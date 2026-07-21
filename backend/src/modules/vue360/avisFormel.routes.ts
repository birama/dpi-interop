/**
 * Routes Avis Formel — Système append-only, indépendant du workflow consultation
 *
 * GET  /api/use-cases/:id/avis-formel  — Liste chronologique (DETAILED/FULL)
 * POST /api/use-cases/:id/avis-formel  — Déposer un avis (pas de PUT/DELETE)
 *
 * RBAC :
 * - ADMIN : peut déposer, doit choisir une institution (jamais anonyme)
 * - Institution partie prenante active : peut déposer au nom de son institution
 */

import { FastifyInstance } from 'fastify';
import { computeVisibility, UserContext } from '../../services/useCaseVisibility.js';

async function resolveContext(app: any, req: any, casUsageId: string) {
  const cu = await app.prisma.casUsageMVP.findUnique({
    where: { id: casUsageId },
    select: {
      id: true, code: true, titre: true, institutionSourceCode: true,
      stakeholders360: {
        select: { institutionId: true, role: true, actif: true },
      },
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

export async function avisFormelRoutes(app: FastifyInstance) {

  // GET /:id/avis-formel — Liste tous les avis (chronologique ascendant)
  app.get('/:id/avis-formel', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { level, cu } = await resolveContext(app, req, id);
    if (level === 'NONE' || !cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });

    // METADATA : liste vide (pas d'accès au fil)
    if (level === 'METADATA') return reply.send([]);

    const avis = await app.prisma.avisFormel.findMany({
      where: { casUsageId: id },
      include: {
        institution: { select: { id: true, code: true, nom: true } },
      },
      orderBy: { dateDepot: 'asc' },
    });

    return reply.send(avis);
  });

  // POST /:id/avis-formel — Déposer un avis (append-only)
  app.post('/:id/avis-formel', { onRequest: [app.authenticate], config: { access: 'authenticated' } }, async (req: any, reply: any) => {
    const { id } = req.params;
    const { sens, commentaire, institutionId: targetInstitutionId } = req.body as any;

    if (!sens || !['FAVORABLE', 'RESERVE', 'DEFAVORABLE'].includes(sens)) {
      return reply.status(400).send({ error: 'sens requis (FAVORABLE, RESERVE, DEFAVORABLE)' });
    }
    if (!commentaire || commentaire.trim().length < 20) {
      return reply.status(400).send({ error: 'Commentaire requis, minimum 20 caractères' });
    }

    const { level, cu, user } = await resolveContext(app, req, id);
    if (level === 'NONE' || !cu) return reply.status(404).send({ error: 'Cas d\'usage non trouvé' });
    if (!['FULL', 'DETAILED'].includes(level)) {
      return reply.status(403).send({ error: 'Vous n\'êtes pas autorisé à déposer un avis formel' });
    }

    // Déterminer l'institution attributaire
    let institutionId: string;
    let auteurInstitutionNom: string;

    if (req.user.role === 'ADMIN') {
      if (!targetInstitutionId) {
        return reply.status(400).send({ error: 'L\'administrateur doit choisir une institution de rattachement' });
      }
      const targetInst = await app.prisma.institution.findUnique({
        where: { id: targetInstitutionId }, select: { nom: true },
      });
      if (!targetInst) return reply.status(400).send({ error: 'Institution non trouvée' });
      institutionId = targetInstitutionId;
      auteurInstitutionNom = targetInst.nom;
    } else {
      if (!user!.institutionId) {
        return reply.status(403).send({ error: 'Vous devez être rattaché à une institution' });
      }
      // Vérifier que l'institution est partie prenante active
      const isActiveStakeholder = cu.stakeholders360.some(
        (s: any) => s.institutionId === user!.institutionId && s.actif === true,
      );
      if (!isActiveStakeholder) {
        return reply.status(403).send({ error: 'Seules les parties prenantes actives peuvent déposer un avis' });
      }
      institutionId = user!.institutionId;
      const inst = await app.prisma.institution.findUnique({
        where: { id: user!.institutionId }, select: { nom: true },
      });
      auteurInstitutionNom = inst?.nom || 'Institution inconnue';
    }

    // Créer l'avis (pas d'UPDATE ni DELETE possible par conception)
    const avis = await app.prisma.avisFormel.create({
      data: {
        casUsageId: id,
        institutionId,
        sens,
        commentaire: commentaire.trim(),
        auteurUserId: user!.id,
        auteurNom: req.user.email,
        auteurFonction: 'Point Focal',
        auteurInstitutionNom,
      },
      include: {
        institution: { select: { id: true, code: true, nom: true } },
      },
    });

    // Audit log
    try {
      await app.prisma.auditLog.create({
        data: {
          userId: req.user.id, userEmail: req.user.email, userRole: req.user.role,
          action: 'CREATE', resource: 'avis-formel', resourceId: avis.id,
          resourceLabel: `${cu.code}: ${sens} par ${auteurInstitutionNom}`,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {}

    // Notification à l'initiateur
    if (cu.institutionSourceCode) {
      try {
        const initInst = await app.prisma.institution.findUnique({
          where: { code: cu.institutionSourceCode },
          include: { users: { select: { id: true } } },
        });
        if (initInst) {
          for (const u of initInst.users) {
            await app.prisma.notification.create({
              data: {
                userId: u.id,
                institutionId: initInst.id,
                type: 'AVIS_RECU',
                titre: `Avis formel reçu — ${cu.titre}`,
                message: `${auteurInstitutionNom} a déposé un avis ${sens.toLowerCase()} sur le cas ${cu.code}.`,
                lienUrl: `/admin/cas-usage/${id}`,
                refType: 'CAS_USAGE',
                refId: id,
              },
            });
          }
        }
      } catch {}
    }

    return reply.status(201).send(avis);
  });
}
