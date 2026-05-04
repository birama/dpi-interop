# Refonte de la navigation — 5 rubriques par rôle

> Livraison du 25/04/2026 — commit `Lot 5`

## Objectif

Le menu historique comptait ~27 entrées en 8 rubriques hétérogènes. L'intégration du catalogue des propositions (P8) et des vues typologiques (P9) aurait poussé à ~30 entrées — intenable.

La refonte réduit à **5 rubriques** + un lien "Tableau de bord" en tête, avec **filtrage strict par rôle**. Un Point Focal d'institution voit désormais **4 rubriques** (Mon espace, Catalogue, Écosystème + le tableau de bord) au lieu de 27 entrées disparates.

## Principe directeur

> **Aucune route URL n'a été modifiée** (sauf renommage `/catalogue-propositions` → `/catalogue/propositions` avec redirect conservé). La refonte est **purement hiérarchique**, sur le composant de navigation uniquement. Tous les deep links existants (notifications, captures de démo, emails) continuent à fonctionner.

## Structure par rôle

### INSTITUTION (Point Focal)

```
Tableau de bord

Mon espace
  ├─ Mes cas d'usage          [compteur teal: nb cas actifs]
  ├─ Mes demandes
  └─ Questionnaire

Catalogue
  ├─ Propositions
  ├─ Cas d'usage actifs
  ├─ Parcours métier
  ├─ Services techniques
  └─ Couverture référentiels

Écosystème
  ├─ Institutions
  ├─ Registres nationaux
  ├─ Conventions
  ├─ Documents de référence
  └─ Catalogue DPI
```

Total : **14 items** (vs 27 avant).

### ADMIN (DU + SENUM_ADMIN)

En plus des 3 rubriques ci-dessus, accès à :

```
Pilotage
  ├─ Cockpit DPI
  ├─ Roadmap MVP
  ├─ Arbitrage DU                [compteur ambre: désaccords]
  ├─ File d'adoptions            [compteur rouge: demandes en attente]
  ├─ Pipeline X-Road
  ├─ Graphe des flux
  ├─ Matrice des flux
  ├─ Financements
  ├─ Radar de maturité
  ├─ Audit & Sessions
  ├─ Rapports
  └─ Import Word

Administration
  └─ Utilisateurs
```

Total admin : **27 items** répartis en 5 rubriques.

## Fichiers

### `frontend/src/config/menuConfig.ts`

Configuration centralisée. Chaque section déclare ses rôles autorisés, chaque item peut avoir des rôles plus fins. Les compteurs contextuels sont référencés par clé (`mesCasUsage`, `adoptionRequestsEnAttente`, `desaccords`).

```ts
export interface MenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: Array<'INSTITUTION' | 'ADMIN'>;
  items: MenuItem[];
}

export interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  counter?: 'mesCasUsage' | 'adoptionRequestsEnAttente' | 'desaccords';
  roles?: Array<'INSTITUTION' | 'ADMIN'>;
}
```

Helpers exportés :
- `visibleSections(role)` : filtre sections + items pour un rôle
- `findSectionForPath(path)` : trouve la rubrique contenant une URL active (pour auto-open)

### `frontend/src/components/layout/DashboardLayout.tsx`

Sidebar refondue :

- **Rubriques collapsibles** avec icône de chevron, la rubrique contenant la route active s'ouvre automatiquement (et reste ouverte si l'utilisateur navigue)
- **Compteurs contextuels** affichés à droite des items concernés, chargés via React Query (`staleTime: 60s`) :
  - Mon espace > Mes cas d'usage : teal, via `/me/use-cases/involved`
  - Pilotage > Arbitrage DU : ambre, via `/du/arbitrage.desaccords.length`
  - Pilotage > File d'adoptions : rouge, via `/catalogue/adoption-requests?status=EN_ATTENTE`
- **Mode collapse** (sidebar réduite) : entêtes de rubriques masquées, juste icônes alignées, séparateurs entre rubriques
- **Filtrage par rôle** en amont du rendu : pas de logique conditionnelle disséminée dans le JSX

## Changements par rapport à l'ancien menu

| Ancienne entrée | Nouvelle localisation |
|---|---|
| Cockpit DPI | Pilotage |
| Tableau de bord | En tête (hors rubriques) |
| Qualification | **Supprimé** (doublon avec "Cas d'usage actifs") |
| Roadmap MVP | Pilotage |
| Pipeline X-Road | Pilotage |
| Graphe flux / Matrice flux | Pilotage (renommés en pluriel) |
| Conventions | Écosystème |
| Registres | Écosystème → "Registres nationaux" |
| Couverture référentiels | Catalogue |
| Catalogue DPI | Écosystème |
| Documents | Écosystème → "Documents de référence" |
| Institutions | Écosystème |
| Utilisateurs | Administration |
| Financements | Pilotage |
| File d'arbitrage | Pilotage → "Arbitrage DU" |
| Import Word / Rapports / Audit / Radar | Pilotage |
| Demandes (admin) | Écosystème → absent (accessible via Institutions) |
| Mes cas d'usage / Mes demandes / Questionnaire | Mon espace |
| Soumissions | **Supprimé du menu** (redondant avec questionnaire, route toujours accessible) |

### Nouvelles entrées apparues

| Entrée | Localisation | Route |
|---|---|---|
| Propositions | Catalogue | `/catalogue/propositions` |
| Cas d'usage actifs | Catalogue | `/admin/cas-usage` (route existante) |
| Parcours métier | Catalogue | `/catalogue/parcours-metier` |
| Services techniques | Catalogue | `/catalogue/services-techniques` |
| File d'adoptions | Pilotage | `/du/adoptions` |

## Routes ajoutées / renommées

| Avant | Après |
|---|---|
| `/catalogue-propositions` | `/catalogue/propositions` (redirect 301 préservé) |
| `/catalogue-propositions/:id` | `/catalogue/propositions/:id` (redirect wrapper préservant `:id`) |
| — | `/catalogue/parcours-metier` |
| — | `/catalogue/services-techniques` |
| — | `/du/adoptions` |

Le composant `CataloguePropositionsRedirect` dans `App.tsx` redirige l'ancienne URL `/catalogue-propositions/:id` vers `/catalogue/propositions/:id` en conservant le paramètre.

## Compteurs contextuels — performance

Chaque compteur déclenche une requête à l'ouverture de la sidebar. React Query dédoublonne les appels avec les autres consommateurs de la même clé (ex : `du-arbitrage` déjà chargé par `DuArbitragePage` est réutilisé). `staleTime: 60s` évite le refetch permanent. Aucun polling agressif.

Si une dépendance échoue (ex : `/du/arbitrage` en erreur pour un non-admin), le compteur n'apparaît simplement pas — pas de crash, pas d'effet visuel.

## Règles UX respectées

- **R1** — Dashboard reste une synthèse, aucun bloc opérationnel ajouté
- **R2** — Libellés utilisateur ("Parcours métier", "Services techniques", "File d'adoptions", "Catalogue des propositions") — aucune mention interne ("P8", "P9", "stock")
- **R3** — Aucun UUID exposé dans les URLs de menu
- **R4** — Recherche catalogue debouncée (400ms déjà en place)
- **R5** — Toute action typologique motivée (reclassement DU, archivage, refus adoption) tracée
- **R6** — Filtrage strict par rôle : un Point Focal ne voit jamais Pilotage ni Administration

## Migration utilisateur

Aucune action utilisateur requise. Les raccourcis clavier (si présents), les liens bookmarkés et les deep links en notifications fonctionnent tous sans changement. Les utilisateurs habitués à l'ancien menu retrouveront leurs items :

- **"Où est Qualification ?"** → fusionné avec "Catalogue > Cas d'usage actifs" (les CU qualifiés sont filtrables par statut `QUALIFIE`)
- **"Où est l'arbitrage DU ?"** → Pilotage > Arbitrage DU (renommage du "File d'arbitrage")
- **"Où sont les soumissions ?"** → réintégrées suite au chantier 5 (voir ci-dessous) :
  - INSTITUTION : Mon espace > Mes soumissions
  - ADMIN : Pilotage > Soumissions

## Testabilité

Voir `docs/vue-360/recette-e2e-manuelle.md` section "Recette navigation" (scénarios N1 à N6) pour les critères d'acceptation détaillés.

## Chantier 5 — Audit & préservation des questionnaires (2026-04-27)

### Contexte
La refonte initiale avait retiré l'item "Soumissions" du menu en faisant l'hypothèse que la page était redondante avec le questionnaire. L'audit a montré que c'est faux : la page assure deux usages distincts encore nécessaires.

### Inventaire produit
| Route | Composant | Statut menu (avant) | Décision |
|-------|-----------|---------------------|----------|
| `/questionnaire` | `QuestionnairePage` | Présent (Mon espace, INSTITUTION) | Conservé tel quel |
| `/questionnaire/:id` | `QuestionnairePage` | Accès via lien | Conservé |
| `/submissions` | `SubmissionsPage` | **Absent du menu** | Ajouté dans Mon espace (INSTITUTION) **et** Pilotage (ADMIN) |
| `/admin/soumissions` | _aucun_ | Référence morte dans CLAUDE.md | À supprimer du CLAUDE.md à la prochaine passe documentaire |

### Décisions et justifications
1. **`/submissions` est utile aux deux rôles** (cas hybride au sens du §5.2) :
   - Pour un Point Focal : historique de ses propres soumissions (DRAFT, SUBMITTED, VALIDATED), bouton de relance, export Word.
   - Pour un DU : vue exhaustive de toutes les institutions soumissionnaires (filtrable par statut, par institution).
   Le backend filtre déjà via `findAll(role, institutionId)`. Un seul composant `SubmissionsPage` couvre les deux usages avec un titre différencié (`isAdmin ? 'Toutes les soumissions des institutions' : 'Vos questionnaires'`).
2. **Label différencié** :
   - INSTITUTION → "Mes soumissions" (ton possessif, cadre Point Focal)
   - ADMIN → "Soumissions" (ton institutionnel, vue DU)
3. **Aucune redirection nécessaire** : la route `/submissions` n'a jamais été retirée du routeur, juste de la sidebar.

### Failles de sécurité corrigées (cross-institution)
L'audit a révélé que le backend n'effectuait le contrôle d'accès cross-institution que sur `findOne`. Quatre handlers étaient exploitables par un user INSTITUTION connaissant un `submissionId` d'une autre institution :

| Endpoint | Risque avant | Correction |
|----------|--------------|------------|
| `POST /submissions` | Création de brouillon pour une autre institution | Refus 403 si `body.institutionId !== user.institutionId` (sauf ADMIN) |
| `PATCH /submissions/:id` | Édition du brouillon d'une autre institution | Refus 403 si `submission.institutionId !== user.institutionId` (sauf ADMIN) |
| `PATCH /submissions/:id/status` | Soumission/validation pour le compte d'autrui | Refus 403 hors institution + refus 403 si statut ≠ `SUBMITTED` (la revue/validation reste ADMIN-only) |
| `DELETE /submissions/:id` | Suppression du brouillon d'une autre institution | Refus 403 hors institution |
| Routes inline `:id/infrastructure`, `:id/niveaux-interop`, `:id/conformite-principes`, `:id/dictionnaire`, `:id/preparation-decret` | Écriture sur les sous-objets d'une autre institution | `preHandler: ensureSubmissionAccess` ajouté à chaque route |

Helper `ensureSubmissionAccess` ajouté dans `submissions.routes.ts` : vérifie l'appartenance avant tout traitement métier.

### UX : navigation depuis le dashboard institution
1. Card KPI "Questionnaire" rendue cliquable (navigation vers `/questionnaire/:id` si la soumission existe, sinon `/questionnaire` qui crée le brouillon).
2. Items "Actions requises" ayant un `link` deviennent des `<button>` couvrant toute la largeur de la ligne, avec un chevron indicateur (au lieu d'un seul bouton "→" en bout de ligne).

### Tests d'acceptation Q1 → Q5
| Test | Description | Statut |
|------|-------------|--------|
| Q1 | Login `dsi@dgid.sn` → /questionnaire charge le brouillon DGID avec son statut | Backend OK (filtrage `findOne` par `institutionId`), création auto si absent |
| Q2 | `dsi@dgid.sn` tente d'accéder à un brouillon ANSD via URL ou via API → 403 | Validé après ajout des contrôles dans `update/updateStatus/delete` et dans `ensureSubmissionAccess` pour les routes inline |
| Q3 | Login `admin@senum.sn` → Pilotage > Soumissions affiche toutes les institutions, vue/Word disponibles | Item de menu réintégré, page existante intacte |
| Q4 | Dashboard DGID → clic sur KPI "Questionnaire" → ouvre /questionnaire | Card transformée en `cursor-pointer` + `onClick={navigate}` |
| Q5 | Dashboard DGID → clic sur alerte "Questionnaire non soumis" → ouvre /questionnaire | L'item entier est désormais un `<button>` cliquable, plus uniquement la flèche |
