import { z } from 'zod';

// Décret n° 2026-1130 du 1er juin 2026 fixant la composition du Gouvernement
const ministeres = [
  'Présidence de la République',
  'Primature',
  'Ministère des Forces Armées',
  'Ministère de l\'Economie, des Finances et du Plan',
  'Ministère chargé du Budget',
  'Ministère chargé de l\'Economie, du Plan et de la Coopération',
  'Ministère de l\'Intérieur et de la Sécurité publique',
  'Ministère de l\'Intégration Africaine, des Affaires étrangères et des Sénégalais de l\'Extérieur',
  'Ministère de la Justice, Garde des Sceaux',
  'Ministère de la Famille, de l\'Action sociale et des Solidarités',
  'Ministère de l\'Enseignement supérieur, de la Recherche et de l\'Innovation',
  'Ministère de l\'Energie et du Pétrole',
  'Ministère des Mines et de la Géologie',
  'Ministère de l\'Industrie et du Commerce',
  'Ministère de l\'Hydraulique et de l\'Assainissement',
  'Ministère de l\'Education Nationale',
  'Ministère de la Santé et de l\'Hygiène Publique',
  'Ministère de l\'Urbanisme, des Collectivités Territoriales et de l\'Aménagement des Territoires',
  'Ministère des Infrastructures',
  'Ministère des Transports terrestres et aériens',
  'Ministère de la Communication et des Relations avec les Institutions',
  'Ministère des Télécommunications et du Numérique',
  'Ministère de la Microfinance et de l\'Economie Sociale et Solidaire',
  'Ministère de l\'Agriculture, de la Souveraineté Alimentaire et de l\'Elevage',
  'Ministère chargé de l\'Elevage',
  'Ministère de la Fonction Publique, du Travail et de la Réforme du Service Public',
  'Ministère de l\'Emploi et de la Formation Professionnelle et Technique',
  'Ministère de la Jeunesse et des Sports',
  'Ministère de la Culture, de l\'Artisanat et du Tourisme',
  'Ministère chargé de la Culture, des Industries créatives et du Patrimoine historique',
  'Ministère des Pêches et de l\'Economie maritime',
  'Ministère de l\'Environnement et de la Transition Ecologique',
  'Autre',
] as const;

// Schéma d'un projet individuel (sans structure ni contact — portés par le parent)
const projetSchema = z.object({
  intitule: z.string().min(1, 'L\'intitulé est requis').max(500),
  description: z.string().min(1, 'La description est requise').max(500),
  natures: z.array(z.string().max(200)).min(1, 'Au moins une nature est requise'),
  statutAvancement: z.enum([
    'IDEE_CONCEPTION', 'ETUDE_CADRAGE', 'EN_REALISATION',
    'EN_PRODUCTION', 'EN_REFONTE', 'SUSPENDU',
  ]),
  anneeDebut: z.number().int().min(1990).max(2100).optional().nullable(),
  anneeFin: z.number().int().min(1990).max(2100).optional().nullable(),
  budgetFourchette: z.enum([
    'MOINS_50_MILLIONS', 'DE_50_A_200_MILLIONS',
    'DE_200_MILLIONS_A_1_MILLIARD', 'PLUS_1_MILLIARD', 'NON_CHIFFRE',
  ]),
  budgetMontant: z.number().min(0).optional().nullable(),
  sourceFinancement: z.enum([
    'BUDGET_NATIONAL', 'PARTENAIRE_TECHNIQUE_FINANCIER',
    'PARTENARIAT_PUBLIC_PRIVE', 'RESSOURCES_PROPRES', 'NON_FINANCE', 'AUTRE',
  ]),
  sourceFinancementPrecision: z.string().max(300).optional().or(z.literal('')),

  // Qualification (facultatif)
  echangeDonnees: z.enum(['OUI', 'NON', 'PREVU']).optional().nullable(),
  echangeDonneesDetail: z.string().max(500).optional().or(z.literal('')),
  registresConcernes: z.array(z.string().max(200)).optional().default([]),
  hebergement: z.enum([
    'CLOUD_SOUVERAIN_SENUM', 'DATACENTER_STRUCTURE', 'CLOUD_ETRANGER', 'NON_DEFINI',
  ]).optional().nullable(),
  dossierArchitecture: z.enum(['OUI', 'NON', 'EN_COURS']).optional().nullable(),
  souhaitAccompagnement: z.enum(['OUI', 'NON', 'A_DETERMINER']).optional().nullable(),
  observations: z.string().max(2000).optional().or(z.literal('')),
});

// Schéma unitaire historique (rétrocompatible)
export const recensementSchema = z.object({
  ministereTutelle: z.enum(ministeres),
  ministereAutre: z.string().max(200).optional(),
  structureNom: z.string().min(1, 'La structure est requise').max(300),
  typeStructure: z.enum([
    'MINISTERE', 'DIRECTION', 'AGENCE', 'ETABLISSEMENT_PUBLIC',
    'SOCIETE_NATIONALE', 'PROJET_PROGRAMME', 'AUTRE',
  ]),
  contactNom: z.string().min(1, 'Le nom est requis').max(200),
  contactFonction: z.string().min(1, 'La fonction est requise').max(300),
  contactEmail: z.string().email('Email invalide').max(200),
  contactTelephone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().max(0).optional().or(z.literal('')),
  sessionRef: z.string().max(100).optional(),
}).merge(projetSchema);

// Schéma multi-projets : structure + contact en tête, projets en tableau
export const recensementMultiSchema = z.object({
  ministereTutelle: z.enum(ministeres),
  ministereAutre: z.string().max(200).optional(),
  structureNom: z.string().min(1, 'La structure est requise').max(300),
  typeStructure: z.enum([
    'MINISTERE', 'DIRECTION', 'AGENCE', 'ETABLISSEMENT_PUBLIC',
    'SOCIETE_NATIONALE', 'PROJET_PROGRAMME', 'AUTRE',
  ]),
  contactNom: z.string().min(1, 'Le nom est requis').max(200),
  contactFonction: z.string().min(1, 'La fonction est requise').max(300),
  contactEmail: z.string().email('Email invalide').max(200),
  contactTelephone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().max(0).optional().or(z.literal('')),
  sessionRef: z.string().max(100).optional(),
  projets: z.array(projetSchema).min(1, 'Au moins un projet est requis').max(20),
});

export type RecensementInput = z.infer<typeof recensementSchema>;
export type RecensementMultiInput = z.infer<typeof recensementMultiSchema>;
export type ProjetInput = z.infer<typeof projetSchema>;
