-- Suppression des délégations ministérielles du référentiel des tutelles.
-- Les ministres délégués ne sont pas des entités de tutelle.
-- Aucune institution n'est rattachée à ces entités (vérifié avant suppression).

DELETE FROM "entites_tutelle" WHERE "code" IN (
  'MIN-CHARGE-BUDGET-2026-1130',
  'MIN-CHARGE-CULTURE-INDUSTRIES-CREATIVES-PATRIMOINE-HISTORIQUE-2026-1130',
  'MIN-CHARGE-ECONOMIE-PLAN-COOPERATION-2026-1130',
  'MIN-CHARGE-ELEVAGE-2026-1130'
);
