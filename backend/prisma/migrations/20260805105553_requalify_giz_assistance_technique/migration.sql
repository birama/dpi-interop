-- Requalification des 11 financements GIZ en assistance technique hors mandat
-- Idempotent : ne modifie que les lignes qui n'ont pas encore été traitées.
-- Cf. arbitrage 05/08/2026 — la GIZ est partenaire technique, ne finance pas la mise en œuvre.

UPDATE financements
SET "natureAppui" = 'ASSISTANCE_TECHNIQUE',
    statut = 'HORS_MANDAT',
    observations = 'Périmètre hors mandat GIZ. La GIZ n''intervient pas en financement de mise en œuvre. Demande issue de la liste soumise en juin 2026.'
WHERE "programmeId" IN (
  SELECT id FROM programmes WHERE "ptfId" IN (SELECT id FROM ptf WHERE acronyme = 'GIZ')
)
AND (statut != 'HORS_MANDAT' OR "natureAppui" IS DISTINCT FROM 'ASSISTANCE_TECHNIQUE');
