// @ts-nocheck
import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { parseDocx, matchInstitution, confirmImport } from './import.service.js';

export async function importRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Preview — parse sans insérer
  app.post('/questionnaire', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    try {
      const data = await req.file();
      if (!data) return reply.status(400).send({ error: 'Fichier .docx requis' });

      const buffer = await data.toBuffer();
      const filename = data.filename;

      if (!filename.endsWith('.docx')) {
        return reply.status(400).send({ error: 'Seuls les fichiers .docx sont acceptés' });
      }

      const parsed = await parseDocx(buffer);
      const matched = await matchInstitution(app, parsed);
      return reply.send({ ...matched, filename, filesize: buffer.length });
    } catch (e: any) {
      return reply.status(400).send({ error: 'Erreur de parsing', details: e.message });
    }
  });

  // Confirm — insérer en base
  app.post('/questionnaire/confirm', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    try {
      const body = req.body;
      if (!body.institutionId) return reply.status(400).send({ error: 'institutionId requis' });
      const result = await confirmImport(app, body);
      return reply.status(201).send(result);
    } catch (e: any) {
      return reply.status(500).send({ error: 'Erreur import', details: e.message });
    }
  });
}
