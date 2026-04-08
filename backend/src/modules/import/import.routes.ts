// @ts-nocheck
import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import crypto from 'crypto';
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

      // Hash du contenu pour détecter les doublons
      const contentHash = crypto.createHash('md5').update(buffer).digest('hex');

      const parsed = await parseDocx(buffer);
      const matched = await matchInstitution(app, parsed);

      // Vérifier les doublons
      const duplicateInfo: any = { isDuplicate: false, existingSubmission: null, sameFile: false };

      if (matched.institutionId) {
        // Chercher une soumission existante pour cette institution
        const existing = await app.prisma.submission.findFirst({
          where: { institutionId: matched.institutionId },
          orderBy: { createdAt: 'desc' },
          include: { institution: { select: { code: true, nom: true } } },
        });

        if (existing) {
          duplicateInfo.existingSubmission = {
            id: existing.id,
            status: existing.status,
            createdAt: existing.createdAt,
            currentStep: existing.currentStep,
            importHash: (existing as any).importHash || null,
            importFilename: (existing as any).importFilename || null,
          };

          // Même contenu de fichier ?
          if ((existing as any).importHash === contentHash) {
            duplicateInfo.isDuplicate = true;
            duplicateInfo.sameFile = true;
            duplicateInfo.message = 'Ce fichier a déjà été importé (contenu identique). Aucune modification nécessaire.';
          } else {
            duplicateInfo.isDuplicate = true;
            duplicateInfo.sameFile = false;
            duplicateInfo.message = `Une soumission existe déjà pour cette institution (statut: ${existing.status}). L'import écrasera les données existantes.`;
          }
        }
      }

      return reply.send({ ...matched, filename, filesize: buffer.length, contentHash, ...duplicateInfo });
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
