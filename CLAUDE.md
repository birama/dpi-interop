# PINS — Plateforme de pilotage de l'interopérabilité nationale du Sénégal

## Contexte
Application de pilotage DPI développée pour le MCTN / SENUM SA (Delivery Unit).
Opérateur : Birama Diop — Point Focal National Interopérabilité / DPI Architect.
Production : https://dpi-interop.senum.sn (VM 178.16.129.222)
Repo : github.com/birama/dpi-interop

## Stack technique
- Backend : Fastify 4 + TypeScript + Prisma ORM (backend/)
- Frontend : React 18 + Vite + TailwindCSS + shadcn/ui (frontend/)
- Base de données : PostgreSQL 15
- Auth : JWT 24h + refresh token 7j
- Déploiement : Docker (pins-db, pins-api, pins-frontend) + deploy-prod.sh

## Structure
```
questionnaire-interop/
├── backend/
│   ├── prisma/schema.prisma      ← SCHÉMA DE DONNÉES (30 modèles, 15 enums)
│   ├── prisma/seed.ts            ← Seed principal
│   ├── prisma/seed_*.ts          ← Seeds spécifiques (11 fichiers)
│   ├── src/modules/index.ts      ← TOUTES LES ROUTES API (point d'entrée unique)
│   ├── src/modules/auth/         ← Authentification
│   ├── src/modules/submissions/  ← Questionnaire 8 étapes
│   ├── src/modules/reports/      ← Exports Word + stats
│   ├── src/modules/import/       ← Import questionnaires Word
│   ├── src/middleware/audit.middleware.ts ← Audit automatique
│   └── src/app.ts                ← App Fastify
├── frontend/
│   ├── src/App.tsx               ← ROUTES (27 routes)
│   ├── src/components/layout/DashboardLayout.tsx ← MENU SIDEBAR (21 entrées)
│   ├── src/pages/                ← 26 pages
│   └── src/services/api.ts       ← Client API Axios
├── docker-compose.prod.yml
├── deploy-prod.sh
└── CLAUDE.md                     ← CE FICHIER
```

## Modèles Prisma principaux
- User (email, role ADMIN/INSTITUTION/BAILLEUR, institutionId, ptfId, cguAccepteesAt)
- Institution (code, nom, ministereTutelle — 213 seedées en prod)
- Submission (questionnaire 8 étapes, status DRAFT/SUBMITTED/VALIDATED)
- Application, Registre, InfrastructureItem (liés à Submission)
- DonneeConsommer, DonneeFournir, FluxExistant (liés à Submission)
- NiveauInterop, ConformitePrincipe (liés à Submission)
- CasUsageMVP (code PINS-TECH/PINS-METIER, statutVueSection, statutImpl, axePrioritaire, codeHistorique, domaine enum, aFinancer bool)
- PhaseMVP (MVP-1.0, MVP-2.0, MVP-3.0)
- PTF, Programme, Financement (chaîne de financement, statuts IDENTIFIE→DEMANDE→ACCORDE→EN_COURS→CLOTURE ; Financement.manifestationOrigineId → ManifestationInteret)
- BailleurDomaineInteret, ManifestationInteret, JournalAuditPtf (module PTF Phase 2)
- Convention (institutionA ↔ institutionB, statut, dates)
- XRoadReadiness (6 jalons par institution, modeConnexion)
- RegistreNational (10 registres de base, 5 domaines)
- BuildingBlock (18 BB, 4 couches DPI)
- Expertise (experts mobilisés rattachés à un Programme)
- DemandeInterop (demandes des institutions)
- AuditLog, UserSession (traçabilité)
- DocumentReference (documents téléchargeables)
- Enums clés : Role (ADMIN/INSTITUTION/BAILLEUR), Domaine (14 valeurs), ManifestationType, ManifestationStatus, AuditAction, SourceProposition (...+BAILLEUR)

## Dualité des statuts CasUsageMVP
Deux enums parallèles, sémantiques distinctes :
- `statutVueSection` (UseCaseStatus) — gouvernance DU : PROPOSE → DECLARE → EN_CONSULTATION → VALIDATION_CONJOINTE → QUALIFIE → PRIORISE → FINANCEMENT_OK → CONVENTIONNE → EN_PRODUCTION_360
- `statutImpl` (StatutImplementation) — implémentation technique : IDENTIFIE → PRIORISE → EN_PREPARATION → EN_DEVELOPPEMENT → EN_TEST → EN_PRODUCTION
- ⚠️ `PRIORISE` existe dans les deux. Ne pas confondre.

## Pages frontend (26)
### Admin
- /admin/cockpit — Cockpit DPI (KPI stratégiques)
- /admin/dashboard — Tableau de bord
- /admin/qualification — Pipeline qualification cas d'usage
- /admin/roadmap — Roadmap MVP (Kanban drag & drop)
- /admin/financements — PTF + Programmes + Orphelins + Experts (3 onglets)
- /admin/graphe — Graphe flux D3.js interactif
- /admin/matrice — Matrice flux institutions
- /admin/xroad-pipeline — Pipeline déploiement X-Road (6 jalons)
- /admin/conventions — CRUD conventions d'échange
- /admin/registres-nationaux — 10 registres de base
- /admin/catalogue — Catalogue DPI (18 building blocks)
- /admin/institutions — 201 institutions
- /admin/utilisateurs — CRUD + bulk-create atelier
- /admin/import — Import questionnaires Word (mammoth + cheerio)
- /admin/audit — Audit & Sessions (3 onglets)
- /admin/demandes — Gestion demandes interop
- /admin/documents — Documents téléchargeables (CRUD)
- /admin/radar — Radar maturité
- /admin/soumissions — Validation soumissions

### Institution
- /dashboard — Dashboard enrichi (flux, conventions, cas d'usage, readiness)
- /questionnaire — Questionnaire 8 étapes
- /soumissions — Mes soumissions
- /catalogue — Catalogue DPI
- /institution/demandes — Mes demandes d'interopérabilité
- /documents — Documents de référence

### Public
- / — Landing page institutionnelle (AboutPage, depuis 13/05/2026)
- /login — Connexion
- /about — Landing alias (retrocompatible)

## Comptes
- Admin : admin@senum.sn — credentials dans le gestionnaire sécurisé Birama
- Demo : demo@senum.sn — credentials dans le gestionnaire sécurisé Birama (compte usage atelier, expiration 31/07/2026)
- Institutions (DGID, DGD, ANSD, APIX, etc.) : credentials transmis individuellement par canal sécurisé (mustChangePassword=true à la création)

## Données seedées (état prod 14/05/2026 — post DEPLOY-02)
- 238 institutions (213 N2 + 25 nouvelles via seed v4 e-senegal, avec placeholders responsable* à compléter)
- 18 building blocks DPI (4 couches)
- 34 registres nationaux (10 canoniques + 24 e-senegal en `domaine=TRANSVERSAL` par défaut)
- **537 cas d'usage MVP** (76 historiques + 408 métier + 53 techniques injectés DEPLOY-02)
  - 503 PROPOSE, 7 DECLARE, 8 EN_CONSULTATION, **18 PRIORISE**, 1 EN_PRODUCTION_360
  - **18 cas avec `aFinancer=true`** (panel démo atelier 19/05) — 11 domaines couverts :
    - METIER : PINS-METIER-001/008/009/010/011/012/013 (Création entreprise, B3, CMU, CAMPUSEN, ANPEJ, titre foncier, SénégalConnect)
    - TECH : PINS-TECH-0001/0002/0004/0014/0015/0021/0022/0029/0055/0056/0057
  - Répartition par domaine (528/537 renseignés) : FINANCES_PUBLIQUES=113, SERVICES_CITOYENS=102, JUSTICE_ETAT_CIVIL=67, IDENTITE_NUMERIQUE=53, PROTECTION_SOCIALE=47, CLIMAT_AFFAIRES=39, TRANSVERSAL=36, FONCIER_CADASTRE=30, EDUCATION=20, SANTE_NUMERIQUE=10, EMPLOI_FORMATION=6, CYBERSECURITE=5 (GOUVERNANCE_DONNEES et AGRICULTURE_NUMERIQUE absents du seed v4)
  - Répartition par source : PROPOSITION_INSTITUTIONNELLE=464, ETUDE_SENUM=49, autres=24
- 137 relations métier↔technique (5 historiques + 132 mapping seed v4)
- 46+ flux d'interopérabilité
- 5 PTF (JICA, GIZ, BM, ETAT-SN, GATES) — 17 financements
- 5 agences pilotes X-Road (DGPSN, SEN-CSU, DGD, DGID, APIX)
- 8+ conventions (ANEC-DAF, APIX-ANSD, APIX-DGD...)
- 86 users (3 ADMIN dont admin@senum.sn + demo@senum.sn, 83 INSTITUTION, 0 BAILLEUR)
- Backups encadrant DEPLOY-02 : `prod_avant_seed_v4_20260514_1643.sql` (880K) / `prod_apres_seed_v4_20260514_1650.sql` (1.1M)
- 12 cas legacy `PINS-CU-001/007/008/019/026/027/002/009/011/012/014/015` renommés en `PINS-TECH-0043` à `0054` (14/05 17:20). Backups : `prod_avant_rename_20260514_1718.sql` / `prod_apres_rename_20260514_1720.sql`. Plus aucun `PINS-CU-*` adopté en DB.

## Conventions de nommage
- Ministère : MCTN (jamais MCTEN)
- Plateforme : PINS (jamais e-jokkoo ni e-jokko)
- Couleurs charte : Navy #0C1F3A, Teal #0A6B68, Gold #D4A820, Amber #C55A18
- Police : Tahoma (titres), Times New Roman (corps)
- Codes cas d'usage (depuis N2 — 28/04/2026) :
  - `PINS-TECH-XXXX` : services techniques d'échange (capacité 9 999)
  - `PINS-METIER-XXX` : parcours métier multi-administrations (capacité 999)
  - Champ `codeHistorique` (texte) sur `CasUsageMVP` conserve les anciens codes
  - Lexique titres `PINS-TECH-XXXX` : Consultation, Vérification, Notification,
    Transmission, Réconciliation, Alimentation
  - Anciens préfixes (MVP1-CU, MVP2-CU, HIST, XRN-CU, UC-GIZ-FIN, PINS-CU,
    PINS-PROP-DEMO) abandonnés en local le 28/04/2026 — déploiement prod différé.
    Référence : `docs/vue-360/n2-migration-nomenclature.md` et note N1
    (`MCTN/DU/APP-DPI-INTEROP/CONC-2026-06`).
- ASTER et SIGIF coexistent à la DGCPT (ne pas remplacer l'un par l'autre)
- SENTAX remplace SIGTAS à la DGID (en conception)
- MSHP (Ministère de la Santé et de l'Hygiène Publique) — ex-MSAS depuis 13/05/2026
- Pas de mots de passe en clair dans le repo, docs, ou commits Git
  - Les credentials se transmettent via canal sécurisé (Signal, SMS, oral)
  - mustChangePassword=true à la création de tout compte

## Déploiement
```bash
# Local
cd backend && npm run dev  # port 3000
cd frontend && npm run dev  # port 5173

# Production (procédure manuelle utilisée pendant les sessions)
# Backup obligatoire avant toute migration :
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_avant_X_$(date +%Y%m%d_%H%M).sql"
# Frontend (rebuild + docker cp dans pins-frontend) :
cd frontend && npm run build
pscp -pw <pwd> -r dist/* deploy@178.16.129.222:/tmp/pins-dist/
plink -pw <pwd> deploy@178.16.129.222 "docker cp /tmp/pins-dist/. pins-frontend:/usr/share/nginx/html/"
# Backend (rebuild + docker cp + restart) :
cd backend && npm run build
pscp -pw <pwd> dist/modules/<changed>.js deploy@178.16.129.222:/tmp/
plink -pw <pwd> deploy@178.16.129.222 "docker cp /tmp/<changed>.js pins-api:/app/dist/modules/<changed>.js && docker restart pins-api"
```

## État du repo (branches)
- `main` — état déployé en prod (commit `ea50b6f` du 14/05/2026 — DEPLOY-01 inclus PTF Phase 1+2 mergées)
- `feature/vue-360` — branche historique conservée, hors scope atelier 19/05
- Branches `ptf-phase1` et `ptf-phase2` supprimées local + remote après merge (DEPLOY-01).

## Dette technique connue
- **Bug `POST /catalogue/propositions/:id/prioriser-rapide`** : la route écrase le code source (`PINS-TECH-XXXX` / `PINS-METIER-XXX`) par un format legacy `PINS-CU-XXX` au lieu de le préserver. Constaté le 14/05 sur 6 cas démo. Contournement : `UPDATE cas_usage_mvp SET code='<originel>' WHERE id='<uuid>'` après promotion (UUIDs stables). Fix à planifier post-atelier : ajouter `if (oldCode startsWith 'PINS-TECH-' || 'PINS-METIER-') keep oldCode`.
- **Module PTF UI partiel** : RBAC + tables OK en prod, mais `/partenaire` et `/admin/utilisateurs/bailleur/creer` sont des stubs. PTF-03 à PTF-06 (catalogue partenaire, manifestation, propositions BAILLEUR, audit) à faire S2-S6 (juin 2026).
- **9 cas démo `domaine=NULL`** : `axePrioritaire` était vide à la source. À compléter via UI admin.
- **25 institutions seed v4 avec placeholders** : ministere/responsableNom/responsableFonction = "À compléter", responsableEmail = `seed-<code-slug>@placeholder.pins.sn`, responsableTel = "+221000000000". À compléter via UI admin.
- **24 registres nationaux seed v4 en `domaine="TRANSVERSAL"`** par défaut (champ String, pas l'enum Domaine). À reclassifier manuellement.
- **2 domaines absents du portefeuille** (côté CasUsageMVP.domaine) : GOUVERNANCE_DONNEES, AGRICULTURE_NUMERIQUE. À enrichir lors des prochains ateliers métier.

## Atelier stratégique 19 mai 2026
- Réf : MCTN/DU/PLAN-PINS-STAB-2026-01
- Présidence + Primature + MCTN + PTF (BM, GIZ, JICA, Gates)
- Code freeze prod : lundi 18 mai 17h00
- Module PTF annoncé livraison fin juin 2026 (PTF-03 à PTF-06 à exécuter S2-S6)

## Articulation Manifestation ↔ Financement (note technique 13/05)
- Référence : `docs/Articulation_Manifestation_Financement.md`
- Manifestation partenaire PUBLIE de type FINANCEMENT → option conversion en Financement IDENTIFIE
- FK `Financement.manifestationOrigineId` (nullable, sens B) — branche ptf-phase2
- Filtre cible portefeuille partenaire : `statutVueSection=PRIORISE` + `statutImpl in (IDENTIFIE, PRIORISE, EN_PREPARATION)` + `aFinancer=true` + `domaine in domainesPtf`

## Partenaires techniques
- JICA/Accenture : partenaire principal PINS/X-Road
- PexOne : site web monitoring (auteur DAT v0.5)
- Digiboost (Bamba) : JoinXroad — accélérateur no-code X-Road
- Eyone : équipe dev e-senegal.sn
