# Journal des déploiements PINS

## PTF-RBAC-V2-FIX — Correction régression listes vides post-sprint AMO (2026-05-20 mardi 16h)

2 bugs introduits par PTF-RBAC-V2, corrigés dans l'heure :

**Bug #1 — /admin/utilisateurs vide**
- Cause : `prisma generate` exécuté localement mais pas dans le container Docker `pins-api`. Le client Prisma dans le container ne connaissait pas `PARTENAIRE_TECHNIQUE` → toutes les requêtes `WHERE role = 'PARTENAIRE_TECHNIQUE'` et même `findMany()` sans filtre explicite échouaient avec "Invalid value for argument `role`. Expected Role."
- Fix : `docker exec pins-api npx prisma generate` + restart

**Bug #2 — Sélecteur Organisation vide dans la modale "Nouvel utilisateur"**
- Cause : le backend `/api/admin/organisations` retourne `{ data: [...], total: N }`, le frontend accédait `orgData?.data` (qui donne le wrapper objet) au lieu de `orgData?.data?.data` (le tableau). `.filter()` sur un objet → silencieux, aucune option.
- Fix : `orgData?.data` → `orgData?.data?.data` dans `UtilisateursPage.tsx:105`

**Leçon apprise** : après toute migration Prisma, exécuter `prisma generate` dans TOUS les environnements (local + container prod). La commande locale ne suffit pas.

---

## PTF-RBAC-V2 — Rôle PARTENAIRE_TECHNIQUE + table Organisation + ptfId obligatoire BAILLEUR (2026-05-20 mardi)

Refonte RBAC post-atelier 19/05 : introduction du rôle `PARTENAIRE_TECHNIQUE` (AMO/prestataires type Accenture), création de la table `Organisation`, validation applicative `ptfId` obligatoire pour BAILLEUR.

### Backend
- Schema Prisma : enum `Role` + PARTENAIRE_TECHNIQUE, enums `OrganisationType`/`OrganisationStatus`, modèle `Organisation`, `User.organisationId`
- Middleware : `authenticatePartenaireTechnique` (JWT + role + organisationId) dans `plugins/jwt.ts`
- Routes `/partenaire-tech/*` : dashboard, catalogue (tous cas, pas de filtre aFinancer), cas détail (lecture seule, sans notes/observations), profil
- Routes `/admin/organisations` : CRUD Organisations (ADMIN only)
- Validation `POST/PATCH /api/users` : ptfId requis pour BAILLEUR, organisationId requis pour PARTENAIRE_TECHNIQUE (erreur 400 explicite)

### Frontend
- ProtectedRoute : isolation PARTENAIRE_TECHNIQUE sur `/partenaire-tech/*` (comme BAILLEUR sur `/partenaire/*`)
- Sidebar : PARTENAIRE_TECHNIQUE voit rubriques Mon espace / Catalogue / Écosystème. BAILLEUR inchangé (menu dédié)
- Admin : "Annuaire AMO" (6e item sous Partenaires PTF) → `/admin/organisations`
- Pages AMO : Tableau de bord, Catalogue national, Fiche cas détail, Profil organisation
- UtilisateursPage : dropdown 5 rôles (Admin/DU/Institution/PTF/AMO), Organisation selector conditionnel

### Migration accenture-jica
- Organisation `ACCENTURE` créée (CABINET_CONSEIL, actif)
- Compte basculé : `BAILLEUR`/JICA → `PARTENAIRE_TECHNIQUE`/ACCENTURE, ptfId=NULL, CGU=NULL
- Audit log `USER_ROLE_MIGRATION` tracé

### Tests
- Backup pré-migration : 1.3M
- Build backend 0 erreur, build frontend 0 erreur
- Déploiement prod OK
- 5 BAILLEUR restants (BM, GIZ, GATES, JICA, ETAT-SN)
- Routes 200 : `/partenaire-tech/dashboard`, `/admin/organisations`, `/admin/ptf`, `/partenaire/dashboard`

### Documentation
- `docs/conception/P13-CONC-2026-06-Refonte-RBAC.md` livrée

---

## PTF-NAV-FIX — Désimbrication URLs Domaines/Dashboard PTF (2026-05-16 samedi)

Hot-fix UX consécutif à PTF-NAV : les routes `/admin/ptf/domaines` et `/admin/ptf/dashboard` étant nichées sous `/admin/ptf`, la logique de surlignage de la sidebar (`startsWith(item.href + '/')`) faisait apparaître **deux items actifs simultanément** (Annuaire PTF + l'item visité) — incohérence visuelle bloquante en démo.

### Changements
- **App.tsx** : `/admin/ptf/domaines` → `/admin/ptf-domaines`, `/admin/ptf/dashboard` → `/admin/ptf-dashboard`
- **menuConfig.ts** : `href` des 2 items mis à jour
- **AdminPtfDomainesPage.tsx** : suppression du `<Link>` cassé en en-tête de matrice (interpolation vide `domaine=${''}`) → remplacement par `<span>` plain text. Import `Link` retiré.

### Tests prod validés
- ✅ `/admin/ptf-domaines` HTTP 200
- ✅ `/admin/ptf-dashboard` HTTP 200
- ✅ `/admin/ptf` (Annuaire) HTTP 200
- Validation visuelle sidebar (1 seul item surligné) : à confirmer en navigateur par Birama avant lundi 18/05

---

## PTF-NAV — Rubrique parente "Partenaires PTF" + 2 placeholders (2026-05-16 samedi 00h05)

Refonte sidebar admin : regrouper toutes les entrées du module PTF dans une rubrique parente dédiée distincte d'« Administration » (recentré sur l'hygiène globale).

### Sidebar admin (cible mardi 19/05)
- **Suppression** : entrée « Financements » de la rubrique Pilotage ; entrées « Partenaires PTF » et « Manifestations PTF » de la rubrique Administration
- **Création** : nouvelle rubrique parente **« Partenaires PTF »** (icône Briefcase teal) entre Pilotage et Administration, avec 5 items du plus structurant au plus prospectif :
  1. Annuaire PTF → `/admin/ptf` (icône Building2)
  2. Manifestations → `/admin/manifestations` (icône Inbox + badge compteur EN_VALIDATION)
  3. Financements → `/admin/financements` (icône Wallet, déplacé depuis Pilotage)
  4. Domaines d'intérêt → `/admin/ptf/domaines` (icône Tags, **NOUVEAU**)
  5. Tableau de bord PTF → `/admin/ptf/dashboard` (icône BarChart3, **NOUVEAU placeholder**)
- Administration ne contient plus que **Utilisateurs**

### 2 nouvelles pages frontend
- **`AdminPtfDomainesPage`** (`/admin/ptf/domaines`) : matrice 14 domaines × 6 PTF actifs, ✓ teal si déclaré, footer compteur par PTF, footer global « X PTF actifs sur Y domaines couverts ». Lecture seule. Réutilise `GET /api/admin/ptf?actif=true`.
- **`AdminPtfDashboardPage`** (`/admin/ptf/dashboard`) : bandeau ambré « Vue consolidée Phase 6 cible juin 2026 », 3 KPI socle (PTF actifs, manifestations totales, cas couverts par ≥ 1 manif), graphique barres recharts « Manifestations par PTF » avec palette charte (teal/navy/gold/amber/blue/green/purple/red).

### Routing (App.tsx)
- 2 nouvelles routes `/admin/ptf/domaines` et `/admin/ptf/dashboard` ajoutées **avant** `/admin/ptf/:id` (react-router rank static > param mais ordre lisible préservé)
- Toutes en `ProtectedRoute adminOnly`

### Tests prod validés (smoke)
- ✅ `GET /api/admin/ptf?actif=true` retourne **6 PTF uniques** (BM, DEMO, ETAT-SN, GATES, JICA, GIZ)
- ✅ Pages frontend `/admin/ptf`, `/admin/ptf/domaines`, `/admin/ptf/dashboard`, `/admin/manifestations`, `/admin/financements` toutes en HTTP 200
- ✅ Backend inchangé (route `/admin/ptf?actif=true` filtre ok depuis le sprint précédent)

### Tests UI à valider en navigateur (mardi 19/05)
- Sidebar admin affiche bien la nouvelle rubrique entre Pilotage et Administration
- Plus de doublon « Partenaires PTF » / « Manifestations PTF » sous Administration
- Badge `4` sur Manifestations
- Page Domaines d'intérêt : 14 lignes × 6 colonnes, ✓ alignés
- Page Tableau de bord : graphique barres avec 4 bars (DEMO/GIZ/JICA/GATES = 1 manif chacun)
- BAILLEUR ne voit AUCUNE entrée PTF dans la sidebar (RBAC `roles: ['ADMIN']`)

### Reste hors scope
- Breadcrumb « Accueil > Partenaires PTF > Financements » sur `/admin/financements` — pas de breadcrumb existant dans la page, pas modifié pour préserver code freeze. À traiter post-atelier si demandé.

## PTF-ADMIN-V2 — Vues admin enrichies + Fiche PTF + onglet Vue 360 (2026-05-15 vendredi 23h26)

Sprint complémentaire : la v1 admin manifestations livrée 22h42 était minimale (1 filtre, pas de pagination, pas de fiche PTF). V2 couvre l'intégralité du parcours démo de mardi 19/05.

### Backend
- `GET /api/admin/manifestations` enrichi : query `statut, ptfId, casUsageId, domaine, dateDebut, dateFin, page, pageSize`, pagination, tri `createdAt DESC`, retour `{ data, total, page, pageSize, totalPages, kpis: { DRAFT, EN_VALIDATION, PUBLIE, REJETE, RETIRE }, byStatut }`
- `GET /api/admin/manifestations/:id` enrichi avec **historique** depuis `journal_audit_ptf` (action + userEmail + createdAt)
- 3 nouvelles routes `/api/admin/ptf` :
  - `GET /` — liste comptes BAILLEUR enrichis (stats manifestations, dernière connexion, domaines, KPI globaux), filtres `domaine, actif`, tri par activité récente DESC
  - `GET /:id` — fiche détaillée d'un BAILLEUR (profil + stats KPI + connexions 30j + cas éligibles par domaine)
  - `GET /:id/manifestations` — manifestations du PTF (data + KPI par statut)
- Field « actif » dérivé du proxy `lastLoginAt` (pas de champ dédié dans le model `User`)

### Frontend
- **Refonte `AdminManifestationsPage`** : 5 KPI cards (couleur charte par statut, EN_VALIDATION en amber-50 mis en valeur), filtres `Statut, PTF émetteur, Domaine, Période` (date début/fin), pagination 20, tri DESC, table 8 colonnes (date, PTF émetteur cliquable, cas cliquable, domaine, type, montant, statut, détail)
- **Modal détail enrichi** : bandeau type+montant+instrument, cards Partenaire (point focal nom/email/tél, lien fiche) + Cas (lien Vue 360 admin), commentaire avec fenêtre temporelle, historique en timeline (`CREATION_MANIFESTATION`, `MODIFICATION_MANIFESTATION`, `SOUMISSION_MANIFESTATION`...), bandeau bas « Workflow Phase 5 cible juin 2026 »
- **Nouvelle page `AdminPtfListPage`** (`/admin/ptf`) : 4 KPI cards (PTF actifs, PTF avec manif, total manif, cas couverts), filtres domaine+statut compte, table avec avatar 3 lettres, badges domaines (max 4 + compteur), comptage manifestations en cours/total
- **Nouvelle page `AdminPtfDetailPage`** (`/admin/ptf/:id`) : banner navy clair + accent teal avec mini-KPI à droite (Manifestations / EN_VALIDATION mis en évidence amber / Cas couverts), 4 onglets — Profil (read-only avec mention « modification via demande à la DU »), Domaines d'intérêt (avec compteur de cas éligibles par domaine), Manifestations (5 mini-KPI + table + lien file globale), Activité (placeholder Phase 5 + connexions 30j visibles)
- **Onglet « Manifestations PTF » sur Vue 360 admin** d'un cas (`ManifestationsPtfBlock` injecté dans `UseCaseDetailPage` après `RegistresTouchesTable`, ADMIN only) : table compacte avec lien vers fiche PTF + lien vers la file globale filtrée par cas
- **Liens croisés** opérationnels :
  - File globale → clic PTF → fiche PTF / clic cas → Vue 360 admin
  - Fiche PTF onglet Manifestations → clic cas → Vue 360 admin
  - Vue 360 admin onglet Manifestations PTF → clic PTF → fiche PTF
- **Sidebar** : déplacement « Manifestations PTF » de Pilotage vers **Administration** + badge compteur EN_VALIDATION (orange) + nouvelle entrée « Partenaires PTF » (icône Briefcase)
- Suppression du redirect `/admin/ptf → /admin/financements` (devenu obsolète)

### Données seed démo
- 3 manifestations EN_VALIDATION supplémentaires injectées via `scripts/seed-manifestations-demo.sql` (idempotent) :
  - **GIZ** sur PINS-METIER-001 (Création entreprise APIX) — DON 1.5 M EUR — Fenêtre S2 2026
  - **JICA** sur PINS-METIER-010 (CAMPUSEN) — PRET_CONCESSIONNEL 800k USD — Fenêtre Q1 2027
  - **GATES** sur PINS-METIER-009 (CMU) — MIXTE 3.2 M USD — Fenêtre S1 2027
- Audit `journal_audit_ptf` alimenté pour chaque (CREATION + SOUMISSION)
- File totale : 4 manifestations EN_VALIDATION (DEMO INTERET + GIZ/JICA/GATES FINANCEMENT)

### Tests prod validés (smoke API)
- ✅ File globale `/admin/manifestations?statut=EN_VALIDATION` → 4 items, KPI corrects
- ✅ Filtre `?domaine=SANTE_NUMERIQUE` côté `/admin/ptf` → 5 BAILLEUR (Gates ×2, Etat-SN ×2, DEMO)
- ✅ Fiche `ptf-demo-gates` → 1 manif EN_VAL, 1 connexion 30j, 3 domaines avec compteurs éligibilité (1+2+2 cas)
- ✅ Liste `/admin/ptf` → 11 BAILLEUR, 7 actifs, 7 avec manifestations, 3 cas couverts
- ✅ Détail manif enrichi → fenêtre temporelle parsée, historique 2 entrées (CREATION + SOUMISSION)
- ✅ Pagination → page=1 size=2, totalPages=2
- ✅ RBAC : `ptf-demo-bm@senum.sn` → 403 sur `/admin/ptf` et `/admin/manifestations`

### Tests UI à faire en navigateur (mardi)
- 6 PTF visibles dans `/admin/ptf` avec tri par activité récente
- Clic œil sur un PTF → fiche détaillée 4 onglets
- Onglet Domaines : 3 domaines GATES + compteurs éligibilité
- Vue 360 admin de PINS-METIER-001 → bloc « Manifestations PTF (2) » avec GIZ + DEMO listés
- Sidebar → Administration → entrées « Partenaires PTF » + « Manifestations PTF » avec badge `4`
- Liens croisés : file globale → clic PTF → fiche → clic cas → Vue 360 → clic PTF → retour fiche

### Backups
- Avant : `prod_avant_admin_ptf_20260515_2324.sql` (1.2M)

### Reste hors scope (Phase 5 — juin 2026)
- Workflow d'arbitrage (validation, rejet, demande de complément côté admin) — actions enum `AuditAction` déjà prêtes
- Onglet « Activité » de la fiche PTF (timeline détaillée connexions/consultations/manif) — placeholder en place
- Conversion manifestation PUBLIE → Financement IDENTIFIE
- Champ `actif` natif sur `User` (aujourd'hui dérivé de `lastLoginAt`)

## PTF-MANIFEST — Dépôt réel de manifestations d'intérêt (2026-05-15 vendredi 22h42)

Remplacement du dialogue placeholder `mailto:du@mctn.gouv.sn` (adresse inexistante, risque de bounce devant les PTF) par une vraie persistance en base.

### Backend
- 5 routes BAILLEUR sous `/api/partenaire/manifestations` (POST, PUT, POST `/:id/submit`, GET, GET `/:id`, DELETE) avec unicité fonctionnelle en code (une seule manifestation active par couple `casUsageId × ptfId`)
- 2 routes ADMIN sous `/api/admin/manifestations` (GET liste + compteurs par statut, GET détail) — lecture seule v1, validation/rejet post-atelier
- Périmètre vérifié à chaque opération : cas `aFinancer=true`, `statutVueSection IN (PRIORISE, EN_PRODUCTION_360)`, domaine ∈ domaines d'intérêt du PTF
- Validation backend : type `INTERET|FINANCEMENT`, commentaire 200-2000 char, montant `> 0` + devise `XOF|EUR|USD` + instrument requis pour type `FINANCEMENT`
- Audit complet dans `journal_audit_ptf` (CREATION_MANIFESTATION, MODIFICATION_MANIFESTATION, SOUMISSION_MANIFESTATION, RETRAIT_MANIFESTATION)
- "Fenêtre temporelle" préfixée dans `commentaire` (`Fenêtre temporelle: X\n\n<commentaire>`) pour éviter une migration prod à 4 jours du code freeze

### Frontend
- `src/modules/partenaire/ManifestationForm.tsx` : Zod + React Hook Form, choix type Intérêt/Financement, bloc Financement conditionnel, fenêtre temporelle, identité PTF read-only depuis `/partenaire/profil`, boutons Enregistrer brouillon + Soumettre DU
- `PartenaireCasDetailPage.tsx` : bouton « Manifester un intérêt » ouvre le formulaire ; bandeau teal si manifestation active déjà déposée avec bouton « Voir ma manifestation » ; historique des manifestations REJETE/RETIRE conservé
- `PartenaireManifestationsPage.tsx` : vraie liste avec compteurs par statut, actions Modifier/Soumettre/Supprimer sur DRAFT, dialogues de confirmation, vue détail (commentaire, fenêtre temporelle, motif refus)
- `AdminManifestationsPage.tsx` : page admin lecture seule sous `/admin/manifestations`, filtres par statut (défaut EN_VALIDATION), modal détail enrichi (PTF, cas, déposeur)
- Entrée sidebar « Manifestations PTF » dans la section Pilotage (icône Coins)

### Tests prod validés
- ✅ Login `ptf-demo-bm` → catalogue retourne 6 cas conformes aux 4 domaines BM
- ✅ POST commentaire < 200 char → 400 explicite
- ✅ POST DRAFT puis re-POST même cas → 409 avec `existingId`
- ✅ PUT modifie le DRAFT
- ✅ POST `/submit` passe DRAFT → EN_VALIDATION
- ✅ Re-submit EN_VALIDATION → 409
- ✅ DELETE EN_VALIDATION → 409 (verrouillé côté PTF après soumission)
- ✅ `journal_audit_ptf` reçoit les 3 entrées CREATION + MODIFICATION + SOUMISSION
- ✅ Donnée de smoke test supprimée avant l'atelier (base propre)

### Backups
- Avant : `prod_avant_manifestations_20260515_2235.sql` (1.2M)
- Après : `prod_apres_manifestations_20260515_2242.sql` (1.2M)

### Reste hors scope v1 (post-atelier)
- Validation / rejet côté admin (actions `VALIDATION_MANIFESTATION` / `REJET_MANIFESTATION` déjà présentes dans enum `AuditAction`)
- Retrait d'une manifestation EN_VALIDATION ou PUBLIE par le PTF (statut `RETIRE`)
- Conversion `Manifestation PUBLIE` → `Financement IDENTIFIE` (FK `manifestationOrigineId` déjà en schéma)

## PTF-SEED — 6 comptes démo atelier nominatifs (2026-05-15 vendredi 22h05)

Complément au PTF-MVP : seeding de 6 comptes BAILLEUR avec leurs domaines d'intérêt propres, pour démontrer la spécialisation sectorielle lors de l'atelier 19/05.

### PTF & domaines seedés (script SQL idempotent)

| PTF | Code | Nb domaines | Domaines |
|---|---|---|---|
| Banque Mondiale | BM | 4 | IDENTITE_NUMERIQUE, FONCIER_CADASTRE, JUSTICE_ETAT_CIVIL, PROTECTION_SOCIALE |
| GIZ Sénégal | GIZ | 3 | CLIMAT_AFFAIRES, EMPLOI_FORMATION, FINANCES_PUBLIQUES |
| JICA Sénégal | JICA | 3 | IDENTITE_NUMERIQUE, EDUCATION, TRANSVERSAL |
| Fondation Gates | GATES | 3 | SANTE_NUMERIQUE, IDENTITE_NUMERIQUE, PROTECTION_SOCIALE |
| État du Sénégal | ETAT-SN | 14 | tous les domaines enum |
| PTF Démonstration | DEMO (nouveau) | 11 | les 11 domaines couverts par le portefeuille |

### 6 comptes créés (password initial : `Atelier19Mai!`)

| Compte | PTF | mustChangePassword | cguAccepteesAt |
|---|---|---|---|
| ptf-demo-bm@senum.sn | BM | false (skip pour démo) | maintenant |
| ptf-demo-giz@senum.sn | GIZ | false | maintenant |
| ptf-demo-jica@senum.sn | JICA | false | maintenant |
| ptf-demo-gates@senum.sn | GATES | false | maintenant |
| ptf-demo-etat@senum.sn | ETAT-SN | false | maintenant |
| ptf-demo@senum.sn (existant, repositionné) | DEMO | false | maintenant |

### Validation périmètres (smoke prod)

| Compte | Domaines | Cas vus | Cible Birama |
|---|---|---|---|
| ptf-demo-bm | 4 | **6** | ~6 ✅ |
| ptf-demo-giz | 3 | **8** | ~8 ✅ |
| ptf-demo-jica | 3 | **4** | ~4 ✅ |
| ptf-demo-gates | 3 | **5** | ~5 ✅ |
| ptf-demo-etat | 14 | **18** | 18 ✅ |
| ptf-demo (générique) | 11 | **18** | 18 ✅ |

### Backups encadrants
- `prod_avant_ptf_seed_6comptes_20260515_2203.sql` (1.2M)
- `prod_apres_ptf_seed_6comptes_20260515_2205.sql` (1.2M)

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
