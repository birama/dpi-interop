import { z } from 'zod';

export const createInstitutionSchema = z.object({
  code: z.string().min(2, 'Code requis').max(20),
  nom: z.string().min(2, 'Nom requis').max(200),
  ministere: z.string().min(2, 'Ministère requis').max(200),
  responsableNom: z.string().min(2, 'Nom du responsable requis'),
  responsableFonction: z.string().min(2, 'Fonction requise'),
  responsableEmail: z.string().email('Email invalide'),
  responsableTel: z.string().min(8, 'Téléphone requis'),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();

export const institutionQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
export type InstitutionQuery = z.infer<typeof institutionQuerySchema>;

export const institutionSchemas = {
  create: {
    body: {
      type: 'object',
      required: ['code', 'nom', 'ministere', 'responsableNom', 'responsableFonction', 'responsableEmail', 'responsableTel'],
      properties: {
        code: { type: 'string' },
        nom: { type: 'string' },
        ministere: { type: 'string' },
        responsableNom: { type: 'string' },
        responsableFonction: { type: 'string' },
        responsableEmail: { type: 'string', format: 'email' },
        responsableTel: { type: 'string' },
      },
    },
  },
  list: {
    querystring: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 500, default: 20 },
      },
    },
  },
};
