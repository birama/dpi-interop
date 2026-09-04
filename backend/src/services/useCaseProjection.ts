/**
 * Service de projection Vue 360°
 *
 * Filtre les champs d'un cas d'usage selon le niveau de visibilité.
 * Garantit qu'aucune fuite de champ sensible n'est possible.
 */

import { VisibilityLevel } from './useCaseVisibility.js';

/**
 * Projette un cas d'usage selon le niveau de visibilité.
 * METADATA → métadonnées uniquement (titre, statut, initiateur, rôles stakeholders)
 * DETAILED → tout sauf audit logs
 * FULL → tout
 */
export function projectUseCase(casUsage: any, level: VisibilityLevel): any {
  if (level === 'NONE') return null;
  if (level === 'FULL') return casUsage;

  if (level === 'METADATA') {
    return {
      id: casUsage.id,
      code: casUsage.code,
      titre: casUsage.titre,
      resumeMetier: casUsage.resumeMetier,
      baseLegale: casUsage.baseLegale,
      institutionSourceCode: casUsage.institutionSourceCode,
      institutionCibleCode: casUsage.institutionCibleCode,
      statutVueSection: casUsage.statutVueSection,
      statutImpl: casUsage.statutImpl,
      impact: casUsage.impact,
      axePrioritaire: casUsage.axePrioritaire,
      // PTF Phase 2 — exposition du domaine et de l'éligibilité au financement (panel démo)
      domaine: casUsage.domaine,
      aFinancer: casUsage.aFinancer,
      dateIdentification: casUsage.dateIdentification,
      createdAt: casUsage.createdAt,
      updatedAt: casUsage.updatedAt,
      // Stakeholders : seulement institution + rôle (pas feedbacks/consultations)
      stakeholders360: casUsage.stakeholders360?.map((s: any) => ({
        id: s.id,
        institutionId: s.institutionId,
        institution: s.institution ? { id: s.institution.id, code: s.institution.code, nom: s.institution.nom } : undefined,
        role: s.role,
        actif: s.actif,
      })),
      // Pas de : description, donneesEchangees, observations, notes,
      // financements, registresAssocies, consultations, feedbacks, statusHistory
      _visibility: 'METADATA',
    };
  }

  // DETAILED : tout sauf timeline et auditLogs
  const { timeline, ...rest } = casUsage;
  return {
    ...rest,
    _visibility: 'DETAILED',
  };
}

/**
 * Projette une liste de cas d'usage pour le catalogue.
 * Applique la projection individuellement à chaque élément.
 */
export function projectUseCaseList(
  casUsages: any[],
  computeVisibilityFn: (cu: any) => VisibilityLevel
): any[] {
  return casUsages
    .map(cu => {
      const level = computeVisibilityFn(cu);
      if (level === 'NONE') return null;
      return projectUseCase(cu, level);
    })
    .filter(Boolean);
}

// Coordonnées nominatives des correspondants désignés (atelier 01/09/2026) :
// données personnelles au sens de la loi 2008-12, réservées à l'ADMIN DU.
// À appeler sur tout payload renvoyé à un utilisateur non-ADMIN.
export function stripStakeholderCorrespondants<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') return payload;
  const stakeholders = (payload as any).stakeholders360;
  if (Array.isArray(stakeholders)) {
    (payload as any).stakeholders360 = stakeholders.map((sh: any) => {
      if (!sh || typeof sh !== 'object') return sh;
      const {
        correspondantNom,
        correspondantFonction,
        correspondantEmail,
        correspondantTelephone,
        correspondantDateDesignation,
        ...rest
      } = sh;
      return rest;
    });
  }
  return payload;
}

// Blocages Pilotage : `personneAttendue` est nominative (loi 2008-12),
// on retire tout le tableau pour les non-ADMIN.
export function stripBlocages<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') return payload;
  if ('blocages' in (payload as any)) {
    delete (payload as any).blocages;
  }
  return payload;
}

// Note interne DU (appréciation, points durs, positions à tenir) :
// jamais exposée hors ADMIN, même au niveau de visibilité FULL.
export function stripNoteInterne<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') return payload;
  const p = payload as any;
  if ('noteInterne' in p) delete p.noteInterne;
  if ('dateNoteInterne' in p) delete p.dateNoteInterne;
  return payload;
}
