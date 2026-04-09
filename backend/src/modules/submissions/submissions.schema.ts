import { z } from 'zod';

// Application schema
const applicationSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional().nullable(),
  editeur: z.string().optional().nullable(),
  anneeInstallation: z.number().int().min(1990).max(2030).optional().nullable(),
});

// Registre schema
const registreSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional().nullable(),
  volumetrie: z.string().optional().nullable(),
});

// Données à consommer
const donneeConsommerSchema = z.object({
  donnee: z.string().min(1, 'Donnée requise'),
  source: z.string().min(1, 'Source requise'),
  usage: z.string().optional().nullable(),
  priorite: z.number().int().min(1).max(5).default(3).nullable(),
});

// Données à fournir
const donneeFournirSchema = z.object({
  donnee: z.string().min(1, 'Donnée requise'),
  destinataires: z.string().optional().nullable(),
  frequence: z.string().optional().nullable(),
  format: z.string().optional().nullable(),
});

// Flux existants
const fluxExistantSchema = z.object({
  source: z.string().min(1, 'Source requise'),
  destination: z.string().min(1, 'Destination requise'),
  donnee: z.string().optional().nullable(),
  mode: z.string().optional().nullable(),
  frequence: z.string().optional().nullable(),
});

// Cas d'usage
const casUsageSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().min(1, 'Description requise'),
  acteurs: z.string().optional().nullable(),
  priorite: z.number().int().min(1).max(5).default(3).nullable(),
});

// Infrastructure JSON schema
const infrastructureSchema = z.object({
  serveurs: z.string().optional(),
  sgbd: z.array(z.string()).optional(),
  reseau: z.string().optional(),
  securite: z.string().optional(),
}).optional();

// Create submission
export const createSubmissionSchema = z.object({
  institutionId: z.string().uuid(),
});

// Update submission (step by step)
export const updateSubmissionSchema = z.object({
  // Section A - Gouvernance des données
  dataOwnerNom: z.string().optional(),
  dataOwnerFonction: z.string().optional(),
  dataOwnerEmail: z.string().optional(),
  dataOwnerTelephone: z.string().optional(),
  dataStewardNom: z.string().optional(),
  dataStewardProfil: z.string().optional(),
  dataStewardFonction: z.string().optional(),
  dataStewardEmail: z.string().optional(),
  dataStewardTelephone: z.string().optional(),

  // Section B - Systèmes d'information
  applications: z.array(applicationSchema).optional(),
  registres: z.array(registreSchema).optional(),
  infrastructure: infrastructureSchema,

  // Section C - Besoins échanges
  donneesConsommer: z.array(donneeConsommerSchema).optional(),
  donneesFournir: z.array(donneeFournirSchema).optional(),
  fluxExistants: z.array(fluxExistantSchema).optional(),
  casUsage: z.array(casUsageSchema).optional(),

  // Section D - Contraintes et maturité
  contraintesJuridiques: z.string().optional(),
  contraintesTechniques: z.string().optional(),
  maturiteInfra: z.number().int().min(1).max(5).optional(),
  maturiteDonnees: z.number().int().min(1).max(5).optional(),
  maturiteCompetences: z.number().int().min(1).max(5).optional(),
  maturiteGouvernance: z.number().int().min(1).max(5).optional(),

  // Section E - Auto-diagnostic
  forces: z.string().optional(),
  faiblesses: z.string().optional(),

  // Section F - Attentes
  attentes: z.string().optional(),
  contributions: z.string().optional(),

  // Workflow
  currentStep: z.number().int().min(0).max(7).optional(),
});

// Query submissions
export const submissionQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED']).optional(),
  institutionId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
});

// Status update
export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED']),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type SubmissionQuery = z.infer<typeof submissionQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type RegistreInput = z.infer<typeof registreSchema>;
export type DonneeConsommerInput = z.infer<typeof donneeConsommerSchema>;
export type DonneeFournirInput = z.infer<typeof donneeFournirSchema>;
export type FluxExistantInput = z.infer<typeof fluxExistantSchema>;
export type CasUsageInput = z.infer<typeof casUsageSchema>;
