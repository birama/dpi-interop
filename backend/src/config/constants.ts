// Application constants

export const APP_NAME = 'Questionnaire Interopérabilité SENUM';
export const APP_VERSION = '1.0.0';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// JWT
export const JWT_EXPIRES_IN = '7d';
export const JWT_REFRESH_EXPIRES_IN = '30d';

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

// Rate limiting
export const RATE_LIMIT = {
  global: {
    max: 100,
    timeWindow: '1 minute',
  },
  auth: {
    max: 5,
    timeWindow: '15 minutes',
  },
  api: {
    max: 60,
    timeWindow: '1 minute',
  },
};

// Institution types
export const INSTITUTION_TYPES = [
  'Ministère',
  'Agence',
  'Direction',
  'Établissement public',
  'Collectivité locale',
  'Autorité administrative indépendante',
  'Entreprise publique',
  'Autre',
] as const;

// Institution sectors
export const INSTITUTION_SECTORS = [
  'Administration générale',
  'Agriculture',
  'Commerce',
  'Culture',
  'Défense',
  'Économie et finances',
  'Éducation',
  'Emploi',
  'Énergie',
  'Environnement',
  'Équipement',
  'Industrie',
  'Infrastructure',
  'Intérieur',
  'Justice',
  'Mines',
  'Pêche',
  'Santé',
  'Sécurité sociale',
  'Sports',
  'Télécommunications',
  'Tourisme',
  'Transport',
  'Urbanisme',
  'Autre',
] as const;

// Submission statuses with labels
export const SUBMISSION_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  UNDER_REVIEW: 'En cours de revue',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  NEEDS_REVISION: 'Révision nécessaire',
} as const;

// User role labels
export const USER_ROLE_LABELS = {
  ADMIN: 'Administrateur',
  REVIEWER: 'Réviseur',
  INSTITUTION_ADMIN: 'Admin Institution',
  INSTITUTION_USER: 'Utilisateur Institution',
} as const;

// Data exchange frequencies
export const DATA_EXCHANGE_FREQUENCIES = [
  { value: 'realtime', label: 'Temps réel' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'on-demand', label: 'À la demande' },
] as const;

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 'high', label: 'Haute', color: 'red' },
  { value: 'medium', label: 'Moyenne', color: 'yellow' },
  { value: 'low', label: 'Basse', color: 'green' },
] as const;

// API technologies
export const API_TECHNOLOGIES = [
  'REST',
  'SOAP',
  'GraphQL',
  'gRPC',
  'WebSocket',
  'Autre',
] as const;

// Data formats
export const DATA_FORMATS = [
  'JSON',
  'XML',
  'CSV',
  'PDF',
  'Excel',
  'Autre',
] as const;

// Infrastructure types
export const INFRASTRUCTURE_TYPES = [
  { value: 'on-premise', label: 'Sur site (On-premise)' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'hybrid', label: 'Hybride' },
] as const;

// Network connectivity types
export const NETWORK_CONNECTIVITY_TYPES = [
  { value: 'fiber', label: 'Fibre optique' },
  { value: 'adsl', label: 'ADSL' },
  { value: 'mobile', label: 'Mobile (3G/4G/5G)' },
  { value: 'other', label: 'Autre' },
] as const;

// Budget ranges
export const BUDGET_RANGES = [
  { value: 'low', label: 'Faible (< 10M FCFA)' },
  { value: 'medium', label: 'Moyen (10-50M FCFA)' },
  { value: 'high', label: 'Élevé (> 50M FCFA)' },
  { value: 'unknown', label: 'Non défini' },
] as const;

// File upload limits
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10 MB
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'],
};
