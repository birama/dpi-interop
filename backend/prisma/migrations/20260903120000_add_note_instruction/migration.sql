-- Note d'instruction DU (atelier 02/09/2026) — document AS-IS/TO-BE en markdown
-- par cas d'usage. dateNoteInstruction est mise à jour côté route à chaque écriture.

ALTER TABLE "cas_usage_mvp" ADD COLUMN "noteInstruction" TEXT;
ALTER TABLE "cas_usage_mvp" ADD COLUMN "dateNoteInstruction" TIMESTAMP(3);
