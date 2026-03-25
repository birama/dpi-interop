import { z } from 'zod';

export const generateReportSchema = z.object({
  type: z.enum(['COMPILATION', 'MATRICE_FLUX', 'STATISTIQUES', 'EXPORT_INSTITUTION', 'EXPORT_COMPLET']),
  format: z.enum(['json', 'csv']).default('json'),
  institutionId: z.string().uuid().optional(),
  filters: z.object({
    status: z.enum(['DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
});

export const reportQuerySchema = z.object({
  type: z.enum(['COMPILATION', 'MATRICE_FLUX', 'STATISTIQUES', 'EXPORT_INSTITUTION', 'EXPORT_COMPLET']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
