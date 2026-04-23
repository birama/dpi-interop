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
