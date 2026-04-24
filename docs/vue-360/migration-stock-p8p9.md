# Migration du stock — rapport P8+P9

> Livraison du 25/04/2026 — commits `490371d`, `0a86117`

## Objectif

Faire basculer les cas d'usage dormants (héritage MVP 0) vers le **catalogue des propositions** (`statutVueSection = PROPOSE`), tout en préservant les cas d'usage actifs du pipeline. Initialiser tous les cas d'usage avec la typologie **TECHNIQUE** par défaut.

## Migrations exécutées

Dans l'ordre :

1. `20260425100000_p8p9_enum_values` — `ALTER TYPE UseCaseStatus ADD VALUE PROPOSE | ARCHIVE | FUSIONNE` (split technique : PostgreSQL interdit `ALTER TYPE ADD VALUE` dans un bloc transactionnel, donc fichier dédié)
2. `20260425100100_p8p9_catalogue_et_typologie` — création des nouvelles enums (`TypologieCasUsage`, `SourceProposition`, `NiveauMaturite`, `RolePressenti`, `AdoptionRequestStatus`), enrichissement `cas_usage_mvp` (10 colonnes), création des 3 nouvelles tables (`institution_pressentie`, `relation_cas_usage`, `adoption_request`), FK et index
3. `20260425110000_p8p9_migration_stock` — migration data

## Critères d'identification "CU actif"

Un cas d'usage est **conservé hors catalogue** si **au moins UN critère** est vrai :

| # | Critère | Sémantique |
|---|---|---|
| (a) | code ∈ `{PINS-CU-008, PINS-CU-011, PINS-CU-012, PINS-CU-019, PINS-CU-026}` | Whitelist explicite validée manuellement |
| (b) | `statutVueSection <> 'DECLARE'` | Pipeline Vue 360° a déjà progressé |
| (c) | `statutImpl <> 'IDENTIFIE'` | Implémentation technique démarrée |
| (d) | ∃ `UseCaseStakeholder` avec `actif=true` et `role IN (INITIATEUR, FOURNISSEUR, CONSOMMATEUR)` | Engagement institutionnel effectif |
| (e) | ∃ `UseCaseConsultation` | Consultation ouverte historique |
| (f) | ∃ `UseCaseFeedback` | Avis formel émis |

Tout CU ne remplissant **aucun** de ces critères bascule en PROPOSE.

## Valeurs appliquées aux CU migrés

```sql
UPDATE cas_usage_mvp
SET
  statutVueSection   = 'PROPOSE',
  sourceProposition  = 'ETUDE_SENUM',
  sourceDetail       = 'Cas d''usage issu du seed MVP 0, catalogue historique',
  niveauMaturite     = 'ESQUISSE'
WHERE id NOT IN (SELECT id FROM cu_actifs)
  AND statutVueSection <> 'PROPOSE';
```

La colonne `typologie` prend le défaut `TECHNIQUE` de l'ALTER TABLE précédent pour tous les CU (actifs et dormants).

## Trace inaltérable

Chaque CU migré reçoit une insertion dans `use_case_status_history` :

```
statusFrom        = 'DECLARE'
statusTo          = 'PROPOSE'
motif             = 'Migration — basculement en catalogue des propositions (livraison du 25/04/2026)'
auteurUserId      = admin@senum.sn (ou plus ancien ADMIN en fallback)
auteurNom         = 'Système — Migration catalogue'
auteurInstitution = 'Delivery Unit — MCTN'
```

Le trigger `prevent_status_history_modification` autorise les INSERT mais bloque UPDATE/DELETE — les traces de migration sont **inaltérables** et auditables.

## Résultats sur la base locale (25/04/2026)

| Groupe | Compte |
|---|---|
| Total cas d'usage | 49 |
| Basculés en PROPOSE | 41 |
| Préservés DECLARE (critère c — implémentation démarrée) | 4 (`MVP1-CU-01`, `MVP1-CU-02`, `UC-GIZ-FIN-01`, `XRN-CU-20`) |
| Préservés EN_CONSULTATION | 3 |
| Préservés EN_PRODUCTION_360 | 1 |
| Typologie TECHNIQUE | 49 (100%) |
| Typologie METIER | 0 (reclassement manuel attendu) |
| Traces de migration insérées | 41 |

## Whitelist explicite — vérification

| Code | statutVueSection | typologie | sourceProposition |
|---|---|---|---|
| PINS-CU-008 | EN_CONSULTATION | TECHNIQUE | NULL |
| PINS-CU-011 | EN_PRODUCTION_360 | TECHNIQUE | NULL |
| PINS-CU-012 | EN_CONSULTATION | TECHNIQUE | NULL |
| PINS-CU-019 | EN_CONSULTATION | TECHNIQUE | NULL |
| PINS-CU-026 | (absent de la DB locale, créé en prod uniquement) | — | — |

**Aucun cas whitelist n'a basculé en PROPOSE** — critère validé.

## Idempotence

- Les UPDATE sont conditionnés par `statutVueSection <> 'PROPOSE'` : ré-exécution sans effet sur les lignes déjà migrées
- Les INSERT de `use_case_status_history` sont conditionnés par un `NOT EXISTS` sur motif commençant par `Migration — basculement en catalogue%` : pas de doublons de traces
- Safety : si aucun ADMIN n'existe dans `users`, le INSERT de trace est skippé (évite violation NOT NULL sur `auteurUserId`), le UPDATE passe quand même

## Charge de reclassement manuel DU

**~4 candidats probables** pour reclassement en METIER au sein du stock (à confirmer lors de la revue DU) :

- Tout cas d'usage à titre contenant "parcours", "demande", "attribution", "inscription", "création d'entreprise" est candidat probable
- Sur les 51 propositions actuelles (41 migrées + 10 seed démo), 4 démos sont déjà en typologie METIER

## Pour rouvrir une proposition archivée par erreur

Possibilité de désarchiver via la transition `ARCHIVE → PROPOSE` (admin DU) — la matrice `TRANSITION_MATRIX` le permet explicitement.

## Commandes de vérification

```bash
docker exec pins-db psql -U dpiuser -d dpidb -c "
SELECT typologie, COUNT(*) FROM cas_usage_mvp GROUP BY typologie;
SELECT \"sourceProposition\", COUNT(*) FROM cas_usage_mvp GROUP BY \"sourceProposition\";
SELECT \"statutVueSection\", COUNT(*) FROM cas_usage_mvp GROUP BY \"statutVueSection\" ORDER BY 2 DESC;
SELECT COUNT(*) AS nb_traces FROM use_case_status_history
WHERE \"statusTo\" = 'PROPOSE' AND motif LIKE 'Migration — basculement en catalogue%';
"
```
