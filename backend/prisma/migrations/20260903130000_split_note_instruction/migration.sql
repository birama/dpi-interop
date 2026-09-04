-- Scission de la note d'instruction en deux régimes de visibilité opposés
-- (atelier 03/09/2026) : notePartagee (factuel, visible parties prenantes) et
-- noteInterne (appréciation DU, ADMIN only, filtrée serveur).
-- Le champ noteInstruction n'a jamais été peuplé en production ; le renommage
-- préserve simplement le contenu local éventuel comme partagée par défaut.

ALTER TABLE "cas_usage_mvp" RENAME COLUMN "noteInstruction" TO "notePartagee";
ALTER TABLE "cas_usage_mvp" RENAME COLUMN "dateNoteInstruction" TO "dateNotePartagee";
ALTER TABLE "cas_usage_mvp" ADD COLUMN "noteInterne" TEXT;
ALTER TABLE "cas_usage_mvp" ADD COLUMN "dateNoteInterne" TIMESTAMP(3);
