// @ts-nocheck
import { FastifyInstance } from 'fastify';
import multer from 'multer';
import { parseDocx, matchInstitution, confirmImport } from './import.service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.originalname.endsWith('.docx')) cb(null, true);
  else cb(new Error('Seuls les fichiers .docx sont acceptés'));
}});

export async function importRoutes(app: FastifyInstance) {
  // Preview — parse sans insérer
  app.post('/questionnaire', {
    onRequest: [app.authenticateAdmin],
    preHandler: upload.single('file'),
  }, async (req: any, reply: any) => {
    try {
      if (!req.file) return reply.status(400).send({ error: 'Fichier .docx requis' });
      const parsed = await parseDocx(req.file.buffer);
      const matched = await matchInstitution(app, parsed);
      return reply.send({ ...matched, filename: req.file.originalname, filesize: req.file.size });
    } catch (e: any) {
      return reply.status(400).send({ error: 'Erreur de parsing', details: e.message });
    }
  });

  // Confirm — insérer en base
  app.post('/questionnaire/confirm', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    try {
      const data = req.body;
      if (!data.institutionId) return reply.status(400).send({ error: 'institutionId requis' });
      const result = await confirmImport(app, data);
      return reply.status(201).send(result);
    } catch (e: any) {
      return reply.status(500).send({ error: 'Erreur import', details: e.message });
    }
  });
}
