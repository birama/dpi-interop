/**
 * Service de visibilité Vue 360° — Transparence contrôlée
 *
 * Règles (section 4.3 du document de conception v1.0) :
 * - DU / ADMIN → FULL (toutes les données + logs audit)
 * - Initiateur du cas d'usage → DETAILED (robuste : reconnu via institutionSourceCode)
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
  institutionCode?: string;  // Code resolu (ex: "DGID")
}

export interface StakeholderInfo {
  institutionId: string;
  role: string;
  actif: boolean | null;
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
  'stakeholders360.institutionId',
  'stakeholders360.role',
  'stakeholders360.actif',
];

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
  'stakeholders360.*',
  'financements',
  'registresAssocies',
  'statusHistory',
  'stakeholders360.consultations',
  'stakeholders360.feedbacks',
];

export const FULL_ADDITIONAL_FIELDS = [
  'timeline',
  'auditLogs',
];

/**
 * Calcule le niveau de visibilité d'un utilisateur sur un cas d'usage.
 *
 * @param user               Contexte utilisateur (role, institutionId, institutionCode optionnel)
 * @param stakeholders       Liste complete des stakeholders du CU (actifs et inactifs)
 * @param institutionSourceCode  Code institution initiatrice du CU (pour reconnaissance robuste)
 */
export function computeVisibility(
  user: UserContext,
  stakeholders: StakeholderInfo[],
  institutionSourceCode?: string | null
): VisibilityResult {
  // DU / SENUM_ADMIN : visibilité totale
  if (user.role === 'ADMIN') {
    return {
      level: 'FULL',
      fields: [...PUBLIC_METADATA_FIELDS, ...DETAILED_ADDITIONAL_FIELDS, ...FULL_ADDITIONAL_FIELDS],
    };
  }

  if (user.institutionId) {
    // 1. Initiateur : niveau FULL (auteur du cas d'usage, visibilite totale hors audit logs DU)
    //    Reconnaissance robuste : (a) via institutionSourceCode, (b) via role=INITIATEUR sur un
    //    stakeholder. L'INITIATEUR ne peut par definition ni etre evince ni se retirer — son
    //    identite est constitutive du cas d'usage, independante du champ actif.
    const isInitiateurByCode =
      !!user.institutionCode && !!institutionSourceCode && user.institutionCode === institutionSourceCode;
    const isInitiateurByStakeholder = stakeholders.some(
      s => s.institutionId === user.institutionId && s.role === 'INITIATEUR'
    );
    if (isInitiateurByCode || isInitiateurByStakeholder) {
      return {
        level: 'FULL',
        fields: [...PUBLIC_METADATA_FIELDS, ...DETAILED_ADDITIONAL_FIELDS, ...FULL_ADDITIONAL_FIELDS],
      };
    }

    // 2. Partie prenante active (FOURNISSEUR / CONSOMMATEUR / PARTIE_PRENANTE) : DETAILED
    const isActiveStakeholder = stakeholders.some(
      s => s.institutionId === user.institutionId
        && s.actif === true
        && ['FOURNISSEUR', 'CONSOMMATEUR', 'PARTIE_PRENANTE'].includes(s.role)
    );
    if (isActiveStakeholder) {
      return {
        level: 'DETAILED',
        fields: [...PUBLIC_METADATA_FIELDS, ...DETAILED_ADDITIONAL_FIELDS],
      };
    }

    // 3. Institution connectee PINS mais non stakeholder (ou evincee/retiree) : METADATA
    return {
      level: 'METADATA',
      fields: [...PUBLIC_METADATA_FIELDS],
    };
  }

  return { level: 'NONE', fields: [] };
}
