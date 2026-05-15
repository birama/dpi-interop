# Journal des déploiements PINS

## PTF-MVP — Parcours BAILLEUR pour atelier 19/05/2026 (2026-05-15 vendredi soir)

Sprint complet livré : un compte BAILLEUR a désormais un parcours utilisateur cohérent et cloisonné pour la démo de l'atelier stratégique mardi 19/05.

### Backend
- 4 routes `/api/partenaire/*` ajoutées :
  - `GET /dashboard` — KPIs (cas éligibles, domaines couverts, nouveautés 7j) + 5 derniers cas + domaines d'intérêt
  - `GET /catalogue` — liste filtrée `aFinancer=true AND statut PRIORISE/EN_PROD AND domaine IN (domaines PTF)`, recherche, filtres
  - `GET /cas/:id` — Vue 360° partenaire, projection masquant champs sensibles (notes, observations, statusHistory, feedbacks, manifestations d'autres PTF)
  - `GET /profil` — informations PTF + domaines d'intérêt déclarés (lecture seule)
- Toutes vérifient `role=BAILLEUR` + `ptfId` non-null

### Frontend
- 5 pages créées sous `frontend/src/pages/partenaire/` :
  - `PartenaireDashboardPage` (refonte du stub)
  - `PartenaireCataloguePage` (cards par cas + filtres domaines)
  - `PartenaireCasDetailPage` (Vue 360° partenaire)
  - `PartenaireManifestationsPage` (placeholder juin 2026)
  - `PartenaireProfilPage` (compte + organisation + domaines)
- `DashboardLayout.tsx` : menu BAILLEUR dédié 4 items (pas de MENU_SECTIONS institution/admin), badge user role corrigé "Partenaire Technique et Financier"
- `App.tsx` : 5 routes `/partenaire/*` protégées `allowedRoles=['BAILLEUR']`, cloisonnement BAILLEUR ↔ autres rôles via `useLocation` dans `ProtectedRoute`

### Seed
- 4 domaines d'intérêt seedés pour PTF BM (compte `ptf-demo@senum.sn`) :
  IDENTITE_NUMERIQUE, PROTECTION_SOCIALE, FONCIER_CADASTRE, JUSTICE_ETAT_CIVIL
- Donne accès à 6 cas filtrés : PINS-METIER-008/012/013 + PINS-TECH-0001/0022/0057

### Effet RBAC complet
- BAILLEUR `/dashboard` → redirect `/partenaire/dashboard`
- BAILLEUR `/questionnaire/*` → redirect `/partenaire/dashboard`
- BAILLEUR `/admin/*` → 403 (déjà OK)
- INSTITUTION/ADMIN `/partenaire/*` → redirect `/dashboard`

### Tests prod validés
- API : 3 routes HTTP 200 avec payload conforme (6 cas, 4 domaines, KPIs)
- Filtrage backend strict : un BAILLEUR ne peut accéder qu'aux cas dans ses domaines d'intérêt déclarés
- Non-régression ADMIN/INSTITUTION confirmée par les tests précédents

### Backups
- Avant : `prod_avant_ptf_mvp_20260515_2157.sql` (1.2M)

## Hotfix DASH — /dashboard ErrorBoundary (2026-05-15 vendredi soir)

- Bug : `/dashboard` admin affichait l'ErrorBoundary React après les 25 nouvelles institutions seed v4
- Cause : `instStats.byMinistere` est un Array Prisma `groupBy` `[{ministere, _count}]`, mais `DashboardPage.tsx:90` faisait `Object.entries()` qui renvoie `[["0", obj]]` → recharts reçoit un objet où il attend un nombre → crash au render
- Fix : refactor `barData` tolérant aux 2 formats (Array Prisma OU object {ministere: count}). Filtre count > 0, protection `null/undefined`
- Aucune migration Prisma, aucune action SQL
- Commit : voir `git log --grep=hotfix-dashboard`

## DEPLOY-03 — Promotion cas démo atelier (2026-05-14)

- 9 cas promus en PRIORISE + aFinancer=true (6 métier + 3 technique)
- Couverture domaines passée de 4 à 11 (sur 14 enum)
- Codes renommés selon convention P8 : PINS-PROP-MET-* → PINS-METIER-008 à 013, PINS-PROP-TECH-* → PINS-TECH-0055 à 0057
- `codeHistorique` préservé pour traçabilité
- Backups : `prod_avant_deploy03_20260514_1730.sql` / `prod_apres_deploy03_20260514_1731.sql`

## DEPLOY-02 + RENAME — Seed v4 EXHAUSTIF (2026-05-14)

- 408 cas métier (PINS-PROP-MET-*) + 53 cas techniques (PINS-PROP-TECH-*) injectés en PROPOSE
- 25 nouvelles institutions (placeholders responsable*) + 24 registres nationaux
- 132 relations métier↔technique
- 12 cas legacy PINS-CU-* adoptés renommés en PINS-TECH-0043 à 0054
- Backups : `prod_avant_seed_v4_*.sql` / `prod_apres_seed_v4_*.sql` / `prod_avant_rename_*.sql` / `prod_apres_rename_*.sql`

## DEPLOY-01 — Merges PTF Phase 1+2 + pré-atelier (2026-05-14)

- Branche `main` enrichie : `ptf-phase1` (RBAC role BAILLEUR + ptfId + CGU) + `ptf-phase2` (modèle PTF complet)
- Rotation password admin (ancien révoqué, nouveau communiqué via canal sécurisé)
- Mapping 67/76 cas vers enum Domaine (14 valeurs)
- 6 cas démo promus en PRIORISE + aFinancer (PINS-TECH-0004/0014/0015/0021/0022/0029) — contournement bug `prioriser-rapide` via UPDATE SQL direct
- Backups : `prod_avant_merges_ptf_*.sql` / `prod_post_merges_ptf_*.sql`

## Roadmap post-atelier (mai-juin 2026)

- **P10 — Vue lecture/édition questionnaire** (1 semaine dev) :
  - P10.1 `<QuestionnaireReadOnlyView>` synthèse exécutive (cards par chapitre, pictogrammes, export PDF)
  - P10.2 Refactor route `/questionnaire/:uuid` : lecture par défaut, `?mode=edit` bascule
  - P10.3 Correction admin champ-par-champ (modal + motif obligatoire + audit `journal_questionnaire_corrections`)
  - P10.4 Notification mail + in-app contact référent institution
- **PTF-03 à PTF-06** — UI complète module PTF (catalogue partenaire, manifestation, propositions BAILLEUR, audit)
- **Bug `prioriser-rapide`** : fix génération code conditionnel selon préfixe source
- **Compléter placeholders** : 25 institutions seed v4 (responsable*) + 9 cas `domaine=NULL` + 24 registres `domaine="TRANSVERSAL"`

## Atelier stratégique — 19 mai 2026

- Lieu : Bâtiment Administratif
- Participants : Présidence, Primature, MCTN, PTF (BM, GIZ, JICA, Gates)
- État cible : 537 cas, 18 PRIORISE/11 domaines, module PTF annoncé pour fin juin
- Code freeze : lundi 18 mai 17h00
