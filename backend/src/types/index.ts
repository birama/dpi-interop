import {
  User,
  Institution,
  Submission,
  SubmissionStatus,
  Role,
  Application,
  Registre,
  DonneeConsommer,
  DonneeFournir,
  FluxExistant,
  CasUsage,
  Report,
  ReportType
} from '@prisma/client';

// Re-export Prisma types
export { Role, SubmissionStatus, ReportType } from '@prisma/client';

// JWT Payload
export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  institutionId: string | null;
}

// User without password
export type SafeUser = Omit<User, 'password'>;

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
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

// API Response
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

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SafeUser;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  institutionId?: string;
}

// Institution
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

export interface InstitutionWithRelations extends Institution {
  users?: SafeUser[];
  submissions?: Submission[];
  _count?: {
    users: number;
    submissions: number;
  };
}

// Submission
export interface CreateSubmissionRequest {
  institutionId: string;
}

export interface UpdateSubmissionRequest {
  currentStep?: number;
  status?: SubmissionStatus;
  infrastructure?: Record<string, unknown>;
  contraintesJuridiques?: string;
  contraintesTechniques?: string;
  maturiteInfra?: number;
  maturiteDonnees?: number;
  maturiteCompetences?: number;
  maturiteGouvernance?: number;
  forces?: string;
  faiblesses?: string;
  attentes?: string;
  contributions?: string;
}

export interface SubmissionWithRelations extends Submission {
  institution?: Institution;
  applications?: Application[];
  registres?: Registre[];
  donneesConsommer?: DonneeConsommer[];
  donneesFournir?: DonneeFournir[];
  fluxExistants?: FluxExistant[];
  casUsage?: CasUsage[];
}

// Application
export interface CreateApplicationRequest {
  submissionId: string;
  nom: string;
  description?: string;
  editeur?: string;
  anneeInstallation?: number;
  ordre?: number;
}

// Registre
export interface CreateRegistreRequest {
  submissionId: string;
  nom: string;
  description?: string;
  volumetrie?: string;
  ordre?: number;
}

// DonneeConsommer
export interface CreateDonneeConsommerRequest {
  submissionId: string;
  donnee: string;
  source: string;
  usage?: string;
  priorite?: number;
  ordre?: number;
}

// DonneeFournir
export interface CreateDonneeFournirRequest {
  submissionId: string;
  donnee: string;
  destinataires?: string;
  frequence?: string;
  format?: string;
  ordre?: number;
}

// FluxExistant
export interface CreateFluxExistantRequest {
  submissionId: string;
  source: string;
  destination: string;
  donnee?: string;
  mode?: string;
  frequence?: string;
  ordre?: number;
}

// CasUsage
export interface CreateCasUsageRequest {
  submissionId: string;
  titre: string;
  description: string;
  acteurs?: string;
  priorite?: number;
  ordre?: number;
}

// Reports
export interface DashboardStats {
  totalInstitutions: number;
  totalSubmissions: number;
  submissionsByStatus: Record<SubmissionStatus, number>;
  recentSubmissions: SubmissionWithRelations[];
}

export interface CreateReportRequest {
  type: ReportType;
  format: 'PDF' | 'CSV' | 'XLSX' | 'JSON';
  parameters?: Record<string, unknown>;
}

export interface ReportWithMeta extends Report {
  downloadUrl?: string;
}

// Filters
export interface SubmissionFilters {
  status?: SubmissionStatus;
  institutionId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface InstitutionFilters {
  ministere?: string;
  search?: string;
}

// Note: Fastify and JWT extensions are declared in src/plugins/jwt.ts
