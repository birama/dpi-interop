/**
 * Service de visibilité Vue 360° — Transparence contrôlée
 *
 * Règles (section 4.3 du document de conception v1.0) :
 * - DU / ADMIN → FULL (toutes les données + logs audit)
 * - Stakeholder actif → DETAILED (métadonnées + spécifications + fil d'avis)
 * - Institution connectée PINS → METADATA (titre, statut, initiateur, rôles)
 * - Sinon → NONE (aucun accès, retourne 404)
 *
 * Rappels conventions :
 * - institutionInitiatrice = CasUsageMVP.institutionSourceCode (string code, pas UUID)
 * - UseCaseStatus.EN_PRODUCTION_360 / SUSPENDU_360 (suffixés)
 */

export type VisibilityLevel = 'NONE' | 'METADATA' | 'DETAILED' | 'FULL';

export interface VisibilityResult {
  level: VisibilityLevel;
  fields: string[];
}

export interface UserContext {
  id: string;
  email: string;
  role: 'ADMIN' | 'INSTITUTION';
  institutionId?: string;
}

export interface StakeholderInfo {
  institutionId: string;
  role: string;
  actif: boolean;
}

// Champs visibles en mode METADATA (toute admin connectée PINS)
export const PUBLIC_METADATA_FIELDS = [
  'id',
  'code',
  'titre',
  'resumeMetier',
  'baseLegale',
  'institutionSourceCode',
  'institutionCibleCode',
  'statutVueSection',
  'statutImpl',
  'impact',
  'axePrioritaire',
  'phaseMVPId',
  'dateIdentification',
  'createdAt',
  'updatedAt',
  // Stakeholders : seulement institutionId + role (pas les détails)
  'stakeholders360.institutionId',
  'stakeholders360.role',
  'stakeholders360.actif',
];

// Champs supplémentaires en mode DETAILED (parties prenantes formelles)
export const DETAILED_ADDITIONAL_FIELDS = [
  'description',
  'donneesEchangees',
  'registresConcernes',
  'complexite',
  'prerequis',
  'conventionRequise',
  'conventionSignee',
  'observations',
  'notes',
  // Relations détaillées
  'stakeholders360.*',
  'financements',
  'registresAssocies',
  'statusHistory',
  // Consultations et feedbacks
  'stakeholders360.consultations',
  'stakeholders360.feedbacks',
];

// FULL = tout + audit logs
export const FULL_ADDITIONAL_FIELDS = [
  'timeline',
  'auditLogs',
];

/**
 * Calcule le niveau de visibilité d'un utilisateur sur un cas d'usage.
 */
export function computeVisibility(
  user: UserContext,
  stakeholders: StakeholderInfo[]
): VisibilityResult {
  // DU / SENUM_ADMIN : visibilité totale
  if (user.role === 'ADMIN') {
    return {
      level: 'FULL',
      fields: [...PUBLIC_METADATA_FIELDS, ...DETAILED_ADDITIONAL_FIELDS, ...FULL_ADDITIONAL_FIELDS],
    };
  }

  // Partie prenante formelle : visibilité détaillée
  if (user.institutionId) {
    const isStakeholder = stakeholders.some(
      s => s.institutionId === user.institutionId && s.actif
    );
    if (isStakeholder) {
      return {
        level: 'DETAILED',
        fields: [...PUBLIC_METADATA_FIELDS, ...DETAILED_ADDITIONAL_FIELDS],
      };
    }
  }

  // Toute institution connectée PINS (a un institutionId = est connectée)
  if (user.institutionId) {
    return {
      level: 'METADATA',
      fields: [...PUBLIC_METADATA_FIELDS],
    };
  }

  // Par défaut : aucun accès
  return { level: 'NONE', fields: [] };
}
