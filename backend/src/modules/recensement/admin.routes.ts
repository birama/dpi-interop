import { FastifyInstance } from 'fastify';
import { RecensementService } from './service.js';

export async function recensementAdminRoutes(app: FastifyInstance) {
  const service = new RecensementService(app);

  // Helper : extrait le rôle et l'institutionId pour le filtrage RBAC
  const authInfo = (req: any) => ({
    userRole: req.user?.role as string | undefined,
    userInstitutionId: req.user?.institutionId as string | null | undefined,
  });

  // Indicateurs
  app.get('/stats', {
    onRequest: [app.authenticate],
    config: { access: ['ADMIN', 'INSTITUTION'] },
    schema: { tags: ['Admin - Recensement'], description: 'Indicateurs du recensement' },
    handler: async (req: any, reply: any) => {
      const { userRole, userInstitutionId } = authInfo(req);
      const stats = await service.stats(userRole, userInstitutionId);
      return reply.send(stats);
    },
  });

  // Liste paginée avec filtres
  app.get('/', {
    onRequest: [app.authenticate],
    config: { access: ['ADMIN', 'INSTITUTION'] },
    schema: { tags: ['Admin - Recensement'], description: 'Liste des soumissions' },
    handler: async (req: any, reply: any) => {
      const {
        ministere, typeStructure, statutAvancement, budgetFourchette,
        souhaitAccompagnement, echangeDonnees, statutTraitement,
        search, page, limit, sortBy, sortOrder,
      } = req.query;

      const { userRole, userInstitutionId } = authInfo(req);
      const result = await service.list({
        ministere, typeStructure, statutAvancement, budgetFourchette,
        souhaitAccompagnement, echangeDonnees, statutTraitement,
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sortBy, sortOrder,
        userRole, userInstitutionId,
      });
      return reply.send(result);
    },
  });

  // Fiche détaillée
  app.get('/:id', {
    onRequest: [app.authenticate],
    config: { access: ['ADMIN', 'INSTITUTION'] },
    schema: { tags: ['Admin - Recensement'], description: 'Détail d\'une soumission' },
    handler: async (req: any, reply: any) => {
      const { userRole, userInstitutionId } = authInfo(req);
      const projet = await service.getById(req.params.id, userRole, userInstitutionId);
      if (!projet) return reply.status(404).send({ error: 'Soumission introuvable' });
      return reply.send(projet);
    },
  });

  // Qualification interne (ADMIN uniquement)
  app.patch('/:id/qualification', {
    onRequest: [app.authenticateAdmin],
    config: { access: ['ADMIN'] },
    schema: {
      tags: ['Admin - Recensement'],
      description: 'Mettre à jour la qualification interne',
      body: {
        type: 'object',
        required: ['statutTraitement'],
        properties: {
          statutTraitement: { type: 'string', enum: ['A_QUALIFIER', 'QUALIFIE', 'RETENU_COMITE', 'ECARTE'] },
          notesInternes: { type: 'string' },
        },
      },
    },
    handler: async (req: any, reply: any) => {
      const projet = await service.updateQualification(req.params.id, req.body, req.user?.id || 'ADMIN');
      return reply.send(projet);
    },
  });

  // Export
  app.get('/export/csv', {
    onRequest: [app.authenticate],
    config: { access: ['ADMIN', 'INSTITUTION'] },
    schema: { tags: ['Admin - Recensement'], description: 'Export CSV des soumissions' },
    handler: async (req: any, reply: any) => {
      const { ministere, statutAvancement, statutTraitement, souhaitAccompagnement } = req.query;
      const { userRole, userInstitutionId } = authInfo(req);
      const data = await service.exportAll({
        ministere, statutAvancement, statutTraitement, souhaitAccompagnement,
        userRole, userInstitutionId,
      });

      const headers = [
        'ID', 'Date soumission', 'Origine', 'Institution ID',
        'Ministère', 'Structure', 'Type structure',
        'Contact nom', 'Contact fonction', 'Contact email', 'Contact tel',
        'Intitulé', 'Description', 'Natures', 'Statut avancement',
        'Année début', 'Année fin', 'Budget fourchette', 'Budget montant',
        'Source financement', 'Précision financement',
        'Échange données', 'Détail échange', 'Registres concernés',
        'Hébergement', 'Dossier architecture', 'Souhait accompagnement',
        'Observations', 'Session ref', 'Statut traitement', 'Notes internes',
      ].join(',');

      const rows = data.map(p => [
        p.id, p.dateSoumission.toISOString(), p.origine, p.institutionId || '',
        csvEscape(p.ministereTutelle),
        csvEscape(p.structureNom), p.typeStructure,
        csvEscape(p.contactNom), csvEscape(p.contactFonction), p.contactEmail, p.contactTelephone || '',
        csvEscape(p.intitule), csvEscape(p.description), (p.natures || []).join('; '),
        p.statutAvancement,
        p.anneeDebut || '', p.anneeFin || '', p.budgetFourchette, p.budgetMontant || '',
        p.sourceFinancement, csvEscape(p.sourceFinancementPrecision || ''),
        p.echangeDonnees || '', csvEscape(p.echangeDonneesDetail || ''),
        (p.registresConcernes || []).join('; '),
        p.hebergement || '', p.dossierArchitecture || '', p.souhaitAccompagnement || '',
        csvEscape(p.observations || ''), p.sessionRef, p.statutTraitement, csvEscape(p.notesInternes || ''),
      ].join(','));

      const csv = '﻿' + [headers, ...rows].join('\n');
      return reply.header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename=recensement_${new Date().toISOString().slice(0, 10)}.csv`)
        .send(csv);
    },
  });
}

function csvEscape(val: string | null | undefined): string {
  if (!val) return '';
  const escaped = val.replace(/"/g, '""');
  return `"${escaped}"`;
}
