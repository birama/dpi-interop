-- Suppression de 2 financements Banque Mondiale issus du seed initial
-- (artefacts sans échange réel, cf. commit cdcf788 et arbitrage 05/08/2026).
--
-- Lignes supprimées :
--   PINS-TECH-0053 — Infrastructure PKI nationale (seed 09/04/2026, EN_NEGOCIATION)
--   PINS-TECH-0043 — Vérification éligibilité RNU (seed 15/04/2026, IDENTIFIE)
--
-- Motif : aucun échange réel avec la Banque Mondiale. Ces lignes ne correspondent
-- à aucune demande, négociation ou engagement. Conservation = affirmation fausse
-- dans le portefeuille PTF.
--
-- Idempotent : ne supprime que si les lignes existent encore.

DELETE FROM financements
WHERE "programmeId" IN (
  SELECT id FROM programmes WHERE "ptfId" IN (SELECT id FROM ptf WHERE acronyme = 'Banque Mondiale')
);
