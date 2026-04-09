// @ts-nocheck
import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { parseDocx, matchInstitution, confirmImport } from './import.service.js';

const UPLOADS_DIR = '/app/uploads';
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export async function importRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Preview — parse sans insérer, sauvegarder le fichier temporairement
  app.post('/questionnaire', { onRequest: [app.authenticateAdmin] }, async (req: any, reply: any) => {
    try {
      const data = await req.file();
      if (!data) return reply.status(400).send({ error: 'Fichier .docx requis' });

      const buffer = await data.toBuffer();
      const filename = data.filename;

      if (!filename.endsWith('.docx')) {
        return reply.status(400).send({ error: 'Seuls les fichiers .docx sont acceptés' });
      }

      const contentHash = crypto.createHash('md5').update(buffer).digest('hex');

      // Sauvegarder le fichier avec le hash comme nom
      const storedFilename = `${contentHash}_${filename}`;
      const filepath = path.join(UPLOADS_DIR, storedFilename);
      fs.writeFileSync(filepath, buffer);

      const parsed = await parseDocx(buffer);
      const matched = await matchInstitution(app, parsed);

      // Vérifier les doublons
      const duplicateInfo: any = { isDuplicate: false, existingSubmission: null, sameFile: false };

      if (matched.institutionId) {
        const existing = await app.prisma.submission.findFirst({
          where: { institutionId: matched.institutionId },
          orderBy: { createdAt: 'desc' },
          include: { institution: { select: { code: true, nom: true } } },
        });

        if (existing) {
          duplicateInfo.existingSubmission = {
            id: existing.id, status: existing.status, createdAt: existing.createdAt,
            importHash: existing.importHash || null, importFilename: existing.importFilename || null,
          };

          if (existing.importHash === contentHash) {
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

      return reply.send({ ...matched, filename, filesize: buffer.length, contentHash, storedFilename, ...duplicateInfo });
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
      try { await app.prisma.auditLog.create({ data: { userId: req.user.id, userEmail: req.user.email, userRole: req.user.role, action: 'IMPORT_QUESTIONNAIRE', resource: 'submission', resourceId: result.submissionId, resourceLabel: result.institutionCode, details: { nbApps: result.nbApps, nbFlux: result.nbFlux, nbInfra: result.nbInfra }, ipAddress: req.headers['x-forwarded-for']?.toString() || req.ip, userAgent: req.headers['user-agent'] } }); } catch {}
      return reply.status(201).send(result);
    } catch (e: any) {
      return reply.status(500).send({ error: 'Erreur import', details: e.message });
    }
  });

  // Liste des fichiers importés
  app.get('/files', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const where: any = {};
    // Institution users can only see their own
    if (req.user.role !== 'ADMIN' && req.user.institutionId) {
      where.institutionId = req.user.institutionId;
    }
    where.importFilename = { not: null };

    const submissions = await app.prisma.submission.findMany({
      where,
      select: {
        id: true, importFilename: true, importHash: true, importedAt: true, status: true,
        institution: { select: { id: true, code: true, nom: true } },
      },
      orderBy: { importedAt: 'desc' },
    });

    return reply.send(submissions);
  });

  // Télécharger un fichier importé
  app.get('/files/:submissionId/download', { onRequest: [app.authenticate] }, async (req: any, reply: any) => {
    const sub = await app.prisma.submission.findUnique({
      where: { id: req.params.submissionId },
      select: { importFilename: true, importHash: true, institutionId: true },
    });

    if (!sub || !sub.importFilename || !sub.importHash) {
      return reply.status(404).send({ error: 'Fichier non trouvé' });
    }

    // Institution users can only download their own
    if (req.user.role !== 'ADMIN' && req.user.institutionId !== sub.institutionId) {
      return reply.status(403).send({ error: 'Accès refusé' });
    }

    const storedFilename = `${sub.importHash}_${sub.importFilename}`;
    const filepath = path.join(UPLOADS_DIR, storedFilename);

    if (!fs.existsSync(filepath)) {
      return reply.status(404).send({ error: 'Fichier non trouvé sur le serveur' });
    }

    const fileBuffer = fs.readFileSync(filepath);
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${sub.importFilename}"`)
      .send(fileBuffer);
  });
}
