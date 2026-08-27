# PINS — Plateforme de pilotage de l'interopérabilité nationale du Sénégal

## Contexte
Application de pilotage DPI développée pour le MTN / SENUM SA (Delivery Unit).
Opérateur : Birama Diop — Point Focal National Interopérabilité / DPI Architect.
Repo : github.com/birama/dpi-interop

## Stack technique
- Backend : Fastify 4 + TypeScript + Prisma ORM (backend/)
- Frontend : React 18 + Vite + TailwindCSS + shadcn/ui (frontend/)
- Base de données : PostgreSQL 15
- Auth : JWT 24h + refresh token 7j ; login rate-limité 5 tentatives / 15 min
- Déploiement : Docker (pins-db, pins-api, pins-frontend) + deploy-prod.sh (modes `full` et `migrate`)

## Environnement production (état 27/08/2026)
- Domaine : **dpi-interop.sec.gouv.sn** — résout 10.42.70.19 en DNS interne gouv uniquement
  (absent du DNS public ; dpi-interop.senum.sn ne résout plus)
- 10.42.70.19 est un relais (VIP/reverse proxy) devant la VM applicative 10.122.0.8 —
  l'équipement intermédiaire n'est pas encore documenté, à identifier
- VM applicative = `srv-pins-dpi` (10.122.0.8) : porte à la fois les conteneurs
  et le rebond SSH. Accès : `ssh senumsauser@10.122.0.8 -p 3333` (clé, pas de password)
- Base : conteneur `pins-db`, user **pins**, base **questionnaire_interop**
  (dpiuser/dpidb = valeurs de template, ne plus utiliser)
- WAF en frontal : bloque les navigateurs headless (Attack ID 20000051) — tests
  automatisés depuis le poste via curl ou vrai navigateur uniquement
- Fail2ban sur le rebond : ban après ~4 échecs de clés

## Structure
```
questionnaire-interop/
├── backend/
│   ├── prisma/schema.prisma      ← SCHÉMA DE DONNÉES (~45 modèles, ~30 enums)
│   ├── prisma/migrations/        ← LF obligatoire (.gitattributes) — checksums Prisma
│   ├── src/modules/index.ts      ← TOUTES LES ROUTES API (point d'entrée unique)
│   ├── src/modules/pilotage/     ← Module Pilotage (portefeuille suivi + blocages)
│   ├── src/modules/auth/         ← Authentification
│   ├── src/modules/submissions/  ← Questionnaire 8 étapes
│   ├── src/modules/vue360/       ← Cas d'usage 360°, catalogue propositions, New Deal
│   ├── src/modules/partenaire/   ← Espace bailleur (PTF) + manifestations
│   ├── src/modules/partenaire-technique/ ← Espace AMO/prestataires
│   ├── src/modules/accompagnement/       ← Accompagnements AMO (jalons, commentaires)
│   ├── src/modules/recensement/  ← Recensement GouvNum (formulaire public + admin)
│   └── src/modules/reports|import|institutions|... 
├── frontend/
│   ├── src/App.tsx               ← ROUTES (~69 routes)
│   ├── src/config/menuConfig.ts  ← MENU SIDEBAR (rubriques/items/roles, compteurs)
│   ├── src/pages/                ← Pages (40 + sous-dossiers partenaire/, partenaire-tech/)
│   ├── src/components/layout/    ← DashboardLayout, AuthLayout (redirections par rôle)
│   └── src/services/api.ts       ← Client API Axios (intercepteurs 401/refresh)
├── deploy-prod.sh                ← SEULE méthode de déploiement (full | migrate)
└── CLAUDE.md                     ← CE FICHIER
```

## Fonctionnalités existantes — espaces frontend (routes App.tsx)

### Public (sans connexion)
- `/` et `/about` — Landing institutionnelle PINS
- `/login` — Connexion
- `/recensement` — Recensement GouvNum : formulaire public multi-projets (circulaire
  ministérielle n° 03081 du 05/08/2026, sessionRef multi-projets, QR code d'accès)
- `/partenaire/cgu` — Acceptation CGU bailleur

### Commun connecté (tous rôles selon RBAC)
- `/dashboard` — Tableau de bord (contenu selon rôle)
- `/change-password` — Changement de mot de passe forcé
- `/institutions`, `/institutions/:id`, `/catalogue/institutions` — Annuaire des institutions
- `/documents` et `/admin/documents` — Documents de référence (CRUD + upload)
- `/submissions`, `/questionnaire`, `/questionnaire/:id` — Questionnaire d'interopérabilité
  8 étapes (INSTITUTION) + liste des soumissions + validation (ADMIN)
- `/mes-cas-usage` — Cas d'usage où mon institution est impliquée (stakeholders)
- `/institution/demandes` — Mes demandes d'interopérabilité ; `/admin/demandes` côté DU
- `/catalogue` — Catalogue DPI (building blocks, 4 couches)
- `/admin/registres-nationaux` — Registres nationaux de base ; `/registres/couverture` —
  couverture référentiels par cas d'usage

### DU / Admin (SENUM) — rubrique Pilotage du menu
- `/pilotage` — **Portefeuille suivi** (module Pilotage, accueil post-login ADMIN) :
  cartes par cas pilote, statuts côte à côte, jours dans le statut, qualification en
  édition directe, blocages (création en modale), alertes échéance/>30 j
- `/admin/cockpit` — Cockpit DPI (KPI stratégiques)
- `/admin/roadmap` — Roadmap MVP (Kanban drag & drop)
- `/admin/qualification` — Pipeline qualification cas d'usage
- `/admin/graphe` — Graphe des flux (D3.js interactif) ; `/matrice` — Matrice flux
- `/maturite` — Radar de maturité des institutions
- `/admin/xroad-pipeline` — Pipeline déploiement X-Road (6 jalons par institution)
- `/admin/conventions` — Conventions d'échange (CRUD)
- `/admin/financements` — PTF + Programmes + Orphelins + Experts (onglets)
- `/admin/ptf`, `/admin/ptf/:id`, `/admin/ptf-domaines`, `/admin/ptf-dashboard` —
  Annuaire PTF, domaines d'intérêt, tableau de bord PTF
- `/admin/manifestations` — Manifestations d'intérêt PTF (lecture v1)
- `/admin/organisations` — Organisations AMO/prestataires (CABINET_CONSEIL, INTEGRATEUR,
  EDITEUR, EXPERT_INDEPENDANT)
- `/admin/utilisateurs` + `/admin/utilisateurs/bailleur/creer` — CRUD utilisateurs
  (rôles, reset password, bulk-create atelier)
- `/admin/import` — Import questionnaires Word (mammoth + cheerio)
- `/admin/audit` — Audit & Sessions (logs, sessions actives, stats, export CSV)
- `/reports` — Rapports (génération Word/PDF/CSV/XLSX, téléchargement)
- `/admin/cas-usage/:id` — Vue 360° d'un cas d'usage (fiche détaillée, conventions,
  X-Road readiness, audit timeline)
- `/catalogue/propositions`, `/catalogue/propositions/:id` — Catalogue des propositions
  (P8) : adoption, ajustements stakeholders, priorisation rapide, fusion, archivage
- `/catalogue/parcours-metier` — Cas d'usage METIER ; `/catalogue/services-techniques` —
  cas TECHNIQUE (vues typologiques)
- `/catalogue/correspondance-esenegal`, `/catalogue/services-guichet`, `/catalogue/guichet` —
  Guichet e-sénégal ↔ PINS (services guichet, liaisons backbone/front)
- `/du/adoptions` — File des demandes d'adoption ; `/du/arbitrage` — Arbitrage DU
  (désaccords, avis formels)
- `/admin/recensement`, `/gouvnum/declarer`, `/admin/gouvnum/qr-code` — GouvNum :
  projets recensés (back-office), déclaration en ligne, QR code du formulaire

### Espace Bailleur / PTF (cloisonné sur /partenaire/*)
- `/partenaire` et `/partenaire/dashboard` — Tableau de bord PTF
- `/partenaire/catalogue` — Portefeuille partenaire (cas PRIORISE + aFinancer,
  filtre par domaines d'intérêt)
- `/partenaire/cas/:id` — Vue 360° partenaire d'un cas
- `/partenaire/manifestations` — Mes manifestations d'intérêt (brouillon → soumission,
  une seule active par cas×PTF)
- `/partenaire/profil` — Profil PTF + domaines d'intérêt

### Espace Partenaire technique / AMO (cloisonné sur /partenaire-tech/*)
- `/partenaire-tech/dashboard`, `/partenaire-tech/catalogue`, `/partenaire-tech/cas/:id` —
  dashboard, catalogue, vue d'un cas accompagné
- `/partenaire-tech/mes-cas`, `/partenaire-tech/mes-cas/:accompagnementId` — Mes
  accompagnements (jalons, commentaires, visibilité)
- `/partenaire-tech/profil` — Profil organisation

## Modules backend — routes API (préfixes sous /api, modules/index.ts)
- `/auth` — login (rate-limit 5/15 min), refresh, register, me, change-password
- `/users` (+ `/admin/users/bailleur`) — CRUD utilisateurs, bulk-create, reset-password
- `/institutions` — CRUD + stats ; `/submissions` — questionnaire + sous-entités
  (applications, registres, données, flux, cas d'usage, niveaux interop, conformité,
  dictionnaire, préparation décret)
- `/institution` — dashboard institution ; `/demandes` — demandes d'interop
- `/reports`, `/import`, `/documents` (upload multipart), `/search` (recherche globale)
- `/conventions`, `/xroad-readiness`, `/graphe` (agrégat + PATCH flux), `/matrice`
- `/ptf`, `/programmes`, `/phases-mvp`, `/financements`, `/expertises`, `/cas-usage-mvp`
- `/building-blocks`, `/registres-nationaux`, `/registres` (couverture)
- `/qualification` — pipeline (fusion registre + flux questionnaires, scores)
- `/audit` — logs paginés, sessions actives, stats, export CSV, logout forcé
- `/notifications` — invitations, relances (SMTP), invite-all
- `/use-cases` (lecture/écriture/me/détail/notes), `/consultations`, `/feedback`,
  `/du/arbitrage` — Vue 360° : stakeholders, consultations, feedbacks, arbitrage,
  contrat de données (versions), avis formels
- `/catalogue` — propositions (adoption, prioriser-rapide, qualifier, fusion), adoption
  requests, liaisons guichet, suggestions, institutions
- `/new-deal` — programmes prioritaires, projets nationaux, liaisons cas↔projets
- `/partenaire` — espace bailleur (portefeuille, manifestations, profil) ;
  `/admin/manifestations` (lecture) ; `/admin/ptf` (annuaire)
- `/partenaire-tech` + `/admin/organisations` + `/admin/accompagnements` +
  `/partenaire-tech/accompagnements` — AMO : organisations, accompagnements, jalons,
  commentaires
- `/public` (recensement public) + `/admin/recensement` (back-office GouvNum, RBAC ADMIN)
- `/pilotage` — module Pilotage (voir section dédiée)

## Modèles Prisma principaux
- User (email, role ADMIN/INSTITUTION/BAILLEUR/PARTENAIRE_TECHNIQUE/PENDING, institutionId,
  ptfId, organisationId, mustChangePassword, cguAccepteesAt)
- Institution (code, nom, ministere, entiteTutelle, responsables — 213+ seedées)
- Submission (questionnaire 8 étapes, status DRAFT/SUBMITTED/VALIDATED) + sous-tables
  (Application, Registre, InfrastructureItem, DonneeConsommer/Fournir, FluxExistant,
  CasUsage, NiveauInterop, ConformitePrincipe, DictionnaireDonnee, PreparationDecret)
- CasUsageMVP (code PINS-TECH/PINS-METIER, **double statut** : statutVueSection
  UseCaseStatus gouvernance DU / statutImpl StatutImplementation technique ;
  typologie METIER/TECHNIQUE, sourceProposition, domaine (enum 14 valeurs), aFinancer,
  phaseMVP, conventionLiee, faisabilite ; champs Module Pilotage : pilote,
  identifiantPivot, serviceXroad, dateStatutImpl ; relations : stakeholders360,
  registresAssocies, relationsMetier/Technique, casUsageProjets, liaisonsGuichet,
  contratDonneesVersions, avisFormels, engagementsIntegration, blocages)
- Blocage (casUsageId, nature NatureBlocage, libelle, entiteAttendue,
  personneAttendue NOT NULL, dateOuverture, échéance, dateResolution, commentaire —
  un seul ouvert par cas, index unique partiel en DB)
- SystemeSource (7 systèmes MVP 2.0 : GAINDE-INTEGRAL, GUICHET-UNIQUE-APIX, NDAMLI,
  NINEA-WEB, ORBUS, SIGNAS, SIGTAS) + RegistreSysteme (liens registres)
- EngagementIntegration (cas × institution × système, FK systemeSourceId NOT NULL —
  prérequis : les 7 SystemeSource DOIVENT exister avant toute saisie) + History
- PTF, BailleurDomaineInteret, ManifestationInteret, JournalAuditPtf, Programme,
  Financement (manifestationOrigineId), Expertise
- Lot, Sollicitation, LotCasUsage, LotLivrable, LotJalon (EXISTENT sur main
  local/origin mais NON validés pour la prod)
- Organisation (AMO/prestataires) + AccompagnementAMO + JalonAccompagnement +
  CommentaireAMO
- UseCaseStakeholder (role INITIATEUR/FOURNISSEUR/CONSOMMATEUR/PARTIE_PRENANTE),
  UseCaseConsultation, UseCaseFeedback, AvisFormel, UseCaseStatusHistory,
  InstitutionPressentie, AdoptionRequest, RelationCasUsage, ContratDonneesVersion,
  FaisabiliteCas
- ServiceGuichet, LiaisonGuichet (frontière backbone e-sénégal / front)
- ProgrammePrioritaire (12 PRP), ProjetNational (48), CasUsageProjet (N-N, New Deal)
- RegistreNational (10 canoniques + e-sénégal), BuildingBlock (18, 4 couches DPI),
  XRoadReadiness (6 jalons/institution), Convention, DemandeInterop
- ProjetRecense (recensement GouvNum, multi-projets par sessionRef), EntiteTutelle,
  SuccessionTutelle (référentiel tutelles)
- AuditLog, UserSession (traçabilité, sessions), Notification, DocumentReference, Report

## Module Pilotage (déployé le 27/08/2026)
- Écran `/pilotage` : accueil post-login ADMIN. Cartes (une par cas pilote), pas de
  tableau : code + intitulé, statuts Implémentation/Gouvernance côte à côte avec
  jours dans le statut, administrations (composées depuis stakeholders si les codes
  source/cible sont vides), qualification (pivot, base légale, service X-Road) en
  édition directe, bloc blocage (création en modale, jamais en cellule)
- Alertes : bordure gauche rouge = échéance dépassée ; ambre = statut inchangé > 30 j.
  Cartes en alerte en haut. Tirets honnêtes : pas de valeurs par défaut.
- API : GET /api/pilotage (lecture ADMIN+BAILLEUR), PATCH /pilotage/cas-usage/:id,
  POST/PATCH/resoudre /pilotage/blocage. Garde-fous serveur : 422 statut avancé
  (EN_DEVELOPPEMENT/EN_TEST/EN_PRODUCTION) sans identifiantPivot ; 400 blocage sans
  personneAttendue ; 409 blocage déjà ouvert/résolu.
- dateStatutImpl n'est JAMAIS backfillée : NULL = jamais changé depuis le déploiement
  du suivi (tiret à l'écran) ; mise à jour uniquement sur changement réel de statutImpl.
- Portefeuille amorcé : PINS-METIER-001/550/611 (pilote=true, statuts PRIORISE/PRIORISE
  — la prod fait foi, ne pas aligner sur le local qui dit EN_DEVELOPPEMENT).

## Dualité des statuts CasUsageMVP
Deux enums parallèles, sémantiques distinctes :
- `statutVueSection` (UseCaseStatus) — gouvernance DU : PROPOSE → DECLARE → EN_CONSULTATION → VALIDATION_CONJOINTE → QUALIFIE → PRIORISE → FINANCEMENT_OK → CONVENTIONNE → EN_PRODUCTION_360
- `statutImpl` (StatutImplementation) — implémentation technique : IDENTIFIE → PRIORISE → EN_PREPARATION → EN_DEVELOPPEMENT → EN_TEST → EN_PRODUCTION (SUSPENDU dans les deux)
- ⚠️ `PRIORISE` existe dans les deux. Ne pas confondre.

## Comptes
- Admin : admin@senum.sn — credentials dans le gestionnaire sécurisé Birama
- Institutions (DGID, DGD, ANSD, APIX, etc.) : credentials transmis individuellement
  par canal sécurisé (mustChangePassword=true à la création)

## Conventions de nommage
- Ministère : **MTN** (Ministère des Télécommunications et du Numérique) — jamais
  MCTN ni MCTEN (renommage f51369d ; des docs anciennes disent encore MCTN)
- Plateforme : PINS (jamais e-jokkoo)
- Couleurs charte : Navy #0C1F3A, Teal #0A6B68, Gold #D4A820, Amber #C55A18
- Codes cas d'usage : `PINS-TECH-XXXX` (services techniques) / `PINS-METIER-XXX`
  (parcours métier) ; `codeHistorique` conserve les anciens codes. Un code déjà en
  PINS-TECH-/PINS-METIER- n'est JAMAIS réassigné (fix prioriser-rapide, en prod).
- Pas de mots de passe en clair dans le repo, docs, ou commits Git
- ASTER et SIGIF coexistent à la DGCPT ; SENTAX remplace SIGTAS à la DGID (en conception)

## Déploiement
```bash
# SEULE méthode autorisée (sur le serveur, depuis /opt/dpi-interop/questionnaire-interop) :
./deploy-prod.sh migrate   # backup + prisma migrate deploy + restart API (pas de pull, pas de build)
./deploy-prod.sh full      # backup + pull branche COURANTE + build docker + migrate + up + health

# Interdits en prod : migrate dev, migrate reset, db push, SQL ad hoc dans
# _prisma_migrations, docker exec manuel pour migrer. Backup obligatoire avant tout.

# Local
cd backend && npm run dev    # port 3000
cd frontend && npm run dev   # port 5173
# Base de test jetable recommandée : restaurer un dump prod dans une base dédiée
# et pointer DATABASE_URL dessus — c'est le seul test qui vaut pour la prod.
```

## État du repo (branches) — 27/08/2026
- **Prod = branche `feat/module-pilotage`** (fd86282), basée sur
  `fix/recensement-checkboxes` (3274e48), elle-même sur `c5a813f`.
  Le commit courant du repo serveur `/opt/dpi-interop/questionnaire-interop` fait foi.
- En cours (27/08 soir) : refonte de l'écran /pilotage en cartes + administrations
  depuis stakeholders — codée et validée en local, à committer puis déployer.
- `origin/main` = b40b332 : contient Lot/Sollicitation + seeds NON validés pour la prod.
  NE PAS déployer main en l'état. main local est encore plus loin (ecc48dc etc.).
- `fix/recensement-checkboxes` : fix cases à cocher + cache nginx, déployée 14/08.
- Le serveur n'a PAS de credentials de push GitHub ; le poste perd parfois l'accès
  à github.com — transfert de branche possible par `git bundle`.

## Historique récent (condensé)
- 14/05/2026 : DEPLOY-01/02 — PTF Phase 1+2 en prod, 620 cas seedés, panel atelier 19/05.
- 02/06/2026 : mapping cas→projets New Deal (règles A/B/C/D, 32 liaisons).
- 05-14/08/2026 : recensement GouvNum (circulaire 03081), fix cases à cocher (11e8153)
  + cache nginx (3274e48) déployés.
- 27/08/2026 : module Pilotage — prérequis (7 SystemeSource seedés, migration
  EngagementIntegration appliquée, doublons _prisma_migrations nettoyés et vérifiés),
  migration pilotage, API, écran cartes, amorçage 3 cas. Backups encadrants dans
  /home/senumsauser/backups/.

## Dette technique connue
- **Publication maîtrisée (chantier prioritaire)** : l'app n'est accessible que via
  DNS interne + réseau gouv ; à ouvrir aux institutions multi-réseaux, sinon l'outil
  ne sert que la DU. Relais 10.42.70.19 (VIP/proxy) à documenter.
- Migration p7_stakeholder_fields : fichier rendu idempotent en local (shadow DB),
  mais la prod garde la version ORIGINALE (checksum) — ne pas mélanger les deux.
- 4 migrations appliquées en base LOCALE sans dossier dans le repo (merge_duplicates_mvp2,
  add_adhesion_institution, seed_systemes_mvp2, qualify_mvp2_cases — branche
  feat/referentiel-tutelles) : divergence locale assumée, ne pas recréer les dossiers.
- Rotation de clé SSH du poste : pendante (passphrase exposée le 27/08, ancienne clé
  à révoquer sur authorized_keys du serveur).
- Serveur : reboot demandé (mise à jour sécurité + zombie), à planifier.
- 2 domaines absents du portefeuille (CasUsageMVP.domaine) : GOUVERNANCE_DONNEES,
  AGRICULTURE_NUMERIQUE.
- Institutions seed v4 avec placeholders responsable* : à compléter via UI admin.
- Les 3 cas pilotes n'ont pas de qualification (pivot, base légale, service X-Road
  vides) ni de champs source/cible : les administrations s'affichent depuis les
  stakeholders (001 et 550 OK, 611 sans aucun stakeholder — à qualifier).
