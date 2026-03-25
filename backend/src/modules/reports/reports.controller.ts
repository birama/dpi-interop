import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportsService } from './reports.service.js';
import {
  generateReportSchema,
  reportQuerySchema,
  GenerateReportInput,
  ReportQuery,
} from './reports.schema.js';

export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  async generate(
    request: FastifyRequest<{ Body: GenerateReportInput }>,
    reply: FastifyReply
  ) {
    try {
      const input = generateReportSchema.parse(request.body);
      const result = await this.reportsService.generate(input, request.user.id);

      // Set appropriate content type for download
      if (input.format === 'csv') {
        const csvData = this.convertToCSV(result.data);
        return reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="${result.report.filename}"`)
          .send(csvData);
      }

      return reply.send(result);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error.errors) {
        return reply.status(400).send({ error: 'Validation failed', details: error.errors });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async findAll(
    request: FastifyRequest<{ Querystring: ReportQuery }>,
    reply: FastifyReply
  ) {
    try {
      const query = reportQuerySchema.parse(request.query);
      const result = await this.reportsService.findAll(query);
      return reply.send(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  async findOne(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const report = await this.reportsService.findOne(request.params.id);
      return reply.send(report);
    } catch (error: any) {
      if (error.statusCode) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  }

  private convertToCSV(data: any): string {
    if (!data || typeof data !== 'object') return '';

    // Handle different data structures
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const rows = data.map(item =>
        headers.map(h => {
          const val = item[h];
          if (typeof val === 'object') return JSON.stringify(val);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    // For nested objects, flatten to key-value pairs
    const flatten = (obj: any, prefix = ''): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, flatten(value, newKey));
        } else {
          result[newKey] = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
        }
      }
      return result;
    };

    const flat = flatten(data);
    const headers = Object.keys(flat);
    const values = Object.values(flat).map(v => `"${v.replace(/"/g, '""')}"`);
    return [headers.join(','), values.join(',')].join('\n');
  }
}
