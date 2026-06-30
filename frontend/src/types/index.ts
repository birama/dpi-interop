// ============================================================================
// USER & AUTH
// ============================================================================

export type Role = 'ADMIN' | 'INSTITUTION' | 'BAILLEUR' | 'PARTENAIRE_TECHNIQUE';

export interface User {
  id: string;
  email: string;
  role: Role;
  institutionId: string | null;
  institution?: Institution;
  ptfId?: string | null;
  organisationId?: string | null;
  cguAccepted?: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  mustChangePassword?: boolean;
}

// ============================================================================
// INSTITUTION
// ============================================================================

export interface Institution {
  id: string;
  code: string;
  nom: string;
  ministere: string;
  responsableNom: string;
  responsableFonction: string;
  responsableEmail: string;
  responsableTel: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    submissions: number;
  };
}

export interface CreateInstitutionRequest {
  code: string;
  nom: string;
  ministere: string;
  responsableNom: string;
  responsableFonction: string;
  responsableEmail: string;
  responsableTel: string;
}

export interface UpdateInstitutionRequest extends Partial<CreateInstitutionRequest> {}

// ============================================================================
// SUBMISSION
// ============================================================================

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'VALIDATED' | 'ARCHIVED';

export interface Submission {
  id: string;
  institutionId: string;
  institution?: Institution;
  status: SubmissionStatus;
  currentStep: number;

  // Section A — Gouvernance
  dataOwnerNom?: string;
  dataOwnerFonction?: string;
  dataOwnerEmail?: string;
  dataOwnerTelephone?: string;
  dataStewardNom?: string;
  dataStewardProfil?: string;
  dataStewardFonction?: string;
  dataStewardEmail?: string;
  dataStewardTelephone?: string;

  // Section B
  applications?: Application[];
  registres?: Registre[];
  infrastructure?: InfrastructureData;
  infrastructureItems?: any[];

  // Section C
  donneesConsommer?: DonneeConsommer[];
  donneesFournir?: DonneeFournir[];
  fluxExistants?: FluxExistant[];
  casUsage?: CasUsage[];

  // Section D
  contraintesJuridiques?: string;
  contraintesTechniques?: string;
  maturiteInfra: number;
  maturiteDonnees: number;
  maturiteCompetences: number;
  maturiteGouvernance: number;

  // Section E
  forces?: string;
  faiblesses?: string;

  // Section F
  attentes?: string;
  contributions?: string;
  niveauxInterop?: any[];
  dictionnaireDonnees?: any[];
  conformitePrincipes?: any[];
  preparationDecret?: any[];

  // Metadata
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  submissionId: string;
  nom: string;
  description?: string;
  editeur?: string;
  anneeInstallation?: number;
  ordre: number;
  createdAt: string;
}

export interface Registre {
  id: string;
  submissionId: string;
  nom: string;
  description?: string;
  volumetrie?: string;
  ordre: number;
  createdAt: string;
}

export interface DonneeConsommer {
  id: string;
  submissionId: string;
  donnee: string;
  source: string;
  usage?: string;
  priorite: number;
  ordre: number;
  createdAt: string;
}

export interface DonneeFournir {
  id: string;
  submissionId: string;
  donnee: string;
  destinataires?: string;
  frequence?: string;
  format?: string;
  ordre: number;
  createdAt: string;
}

export interface FluxExistant {
  id: string;
  submissionId: string;
  source: string;
  destination: string;
  donnee?: string;
  mode?: string;
  frequence?: string;
  ordre: number;
  createdAt: string;
}

export interface CasUsage {
  id: string;
  submissionId: string;
  titre: string;
  description: string;
  acteurs?: string;
  priorite: number;
  ordre: number;
  createdAt: string;
}

export interface InfrastructureData {
  serveurs?: string;
  sgbd?: string;
  reseau?: string;
  securite?: string;
}

// ============================================================================
// REPORTS
// ============================================================================

export type ReportType =
  | 'COMPILATION'
  | 'MATRICE_FLUX'
  | 'STATISTIQUES'
  | 'EXPORT_INSTITUTION'
  | 'EXPORT_COMPLET';

export interface Report {
  id: string;
  type: ReportType;
  format: string;
  filename: string;
  filepath?: string;
  filesize?: number;
  generatedBy?: string;
  parameters?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

export interface DashboardStats {
  totalInstitutions: number;
  totalSubmissions: number;
  submissionsByStatus: Record<SubmissionStatus, number>;
  recentSubmissions: Submission[];
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface QuestionnaireFormData {
  // Step 0 - Institution info (read-only, auto-filled)
  institution?: Institution;

  // Step 1 - Applications
  applications: Omit<Application, 'id' | 'submissionId' | 'createdAt'>[];

  // Step 2 - Registres
  registres: Omit<Registre, 'id' | 'submissionId' | 'createdAt'>[];
  infrastructure: InfrastructureData;

  // Step 3 - Besoins données
  donneesConsommer: Omit<DonneeConsommer, 'id' | 'submissionId' | 'createdAt'>[];
  donneesFournir: Omit<DonneeFournir, 'id' | 'submissionId' | 'createdAt'>[];
  fluxExistants: Omit<FluxExistant, 'id' | 'submissionId' | 'createdAt'>[];
  casUsage: Omit<CasUsage, 'id' | 'submissionId' | 'createdAt'>[];

  // Step 4 - Contraintes et maturité
  contraintesJuridiques: string;
  contraintesTechniques: string;
  maturiteInfra: number;
  maturiteDonnees: number;
  maturiteCompetences: number;
  maturiteGouvernance: number;

  // Step 5 - Auto-diagnostic et attentes
  forces: string;
  faiblesses: string;
  attentes: string;
  contributions: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  REVIEWED: 'Relu',
  VALIDATED: 'Validé',
  ARCHIVED: 'Archivé',
};

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  REVIEWED: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-slate-100 text-slate-800',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  INSTITUTION: 'Institution',
  BAILLEUR: 'Partenaire Technique et Financier',
  PARTENAIRE_TECHNIQUE: 'Partenaire Technique (AMO)',
};

export const QUESTIONNAIRE_STEPS = [
  { id: 0, title: 'Institution', description: 'Informations générales' },
  { id: 1, title: 'Applications', description: 'Systèmes d\'information existants' },
  { id: 2, title: 'Infrastructure', description: 'Registres et infrastructure technique' },
  { id: 3, title: 'Besoins', description: 'Échanges de données' },
  { id: 4, title: 'Maturité', description: 'Contraintes et auto-évaluation' },
  { id: 5, title: 'Attentes', description: 'Attentes et contributions' },
];

// ============================================================================
// ACCOMPAGNEMENT AMO (P14-CONC)
// ============================================================================

export type TypeAccompagnement = 'ROADMAP_V0' | 'ROADMAP_V1' | 'IMPLEMENTATION' | 'AUDIT' | 'STANDARDISATION' | 'FORMATION' | 'AUTRE';
export type StatutAccompagnement = 'ACTIF' | 'SUSPENDU' | 'TERMINE';
export type TypeJalon = 'DIAGNOSTIC' | 'CADRAGE' | 'POC' | 'IMPLEMENTATION' | 'RECETTE' | 'MISE_EN_PRODUCTION' | 'AUDIT_QUALITE' | 'AUTRE';
export type StatutJalon = 'PLANIFIE' | 'EN_COURS' | 'REALISE' | 'REPORTE' | 'ANNULE';
export type VisibiliteCommentaire = 'DU_ET_AMO' | 'DU_ONLY' | 'AMO_ONLY';

export const TYPE_ACCOMPAGNEMENT_LABELS: Record<TypeAccompagnement, string> = {
  ROADMAP_V0: 'Roadmap V0',
  ROADMAP_V1: 'Roadmap V1',
  IMPLEMENTATION: 'Implémentation',
  AUDIT: 'Audit',
  STANDARDISATION: 'Standardisation',
  FORMATION: 'Formation',
  AUTRE: 'Autre',
};

export const STATUT_ACCOMPAGNEMENT_LABELS: Record<StatutAccompagnement, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  TERMINE: 'Terminé',
};

export const TYPE_JALON_LABELS: Record<TypeJalon, string> = {
  DIAGNOSTIC: 'Diagnostic',
  CADRAGE: 'Cadrage',
  POC: 'POC',
  IMPLEMENTATION: 'Implémentation',
  RECETTE: 'Recette',
  MISE_EN_PRODUCTION: 'Mise en production',
  AUDIT_QUALITE: 'Audit qualité',
  AUTRE: 'Autre',
};

export const STATUT_JALON_LABELS: Record<StatutJalon, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  REALISE: 'Réalisé',
  REPORTE: 'Reporté',
  ANNULE: 'Annulé',
};

export const VISIBILITE_LABELS: Record<VisibiliteCommentaire, string> = {
  DU_ET_AMO: 'DU & AMO',
  DU_ONLY: 'DU uniquement',
  AMO_ONLY: 'AMO uniquement',
};

export interface AccompagnementAMO {
  id: string;
  organisationId: string;
  organisation?: { id: string; nom: string; type: string };
  casUsageMVPId: string;
  casUsageMVP?: { id: string; code: string; titre: string; statutVueSection?: string; statutImpl?: string; domaine?: string; description?: string; resumeMetier?: string };
  type: TypeAccompagnement;
  statut: StatutAccompagnement;
  scoreMaturite?: number | null;
  description?: string | null;
  dateDebut?: string | null;
  dateFinPrevue?: string | null;
  dateFinEffective?: string | null;
  jalons?: JalonAccompagnement[];
  commentaires?: CommentaireAMO[];
  _count?: { jalons: number; commentaires: number };
  createdAt: string;
  updatedAt: string;
}

export interface JalonAccompagnement {
  id: string;
  accompagnementId: string;
  type: TypeJalon;
  libelle: string;
  description?: string | null;
  trimestre?: string | null;
  statut: StatutJalon;
  ordre: number;
  datePrevue?: string | null;
  dateReelle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentaireAMO {
  id: string;
  accompagnementId: string;
  contenu: string;
  visibilite: VisibiliteCommentaire;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
