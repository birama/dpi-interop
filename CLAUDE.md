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
- User (email, role ADMIN/INSTITUTION, institutionId, ptfId — branche ptf-phase1)
- Institution (code, nom, ministereTutelle — 213 seedées en prod)
- Submission (questionnaire 8 étapes, status DRAFT/SUBMITTED/VALIDATED)
- Application, Registre, InfrastructureItem (liés à Submission)
- DonneeConsommer, DonneeFournir, FluxExistant (liés à Submission)
- NiveauInterop, ConformitePrincipe (liés à Submission)
- CasUsageMVP (code PINS-TECH/PINS-METIER, statutVueSection, statutImpl, axePrioritaire, codeHistorique)
- PhaseMVP (MVP-1.0, MVP-2.0, MVP-3.0)
- PTF, Programme, Financement (chaîne de financement, statuts IDENTIFIE→DEMANDE→ACCORDE→EN_COURS→CLOTURE)
- Convention (institutionA ↔ institutionB, statut, dates)
- XRoadReadiness (6 jalons par institution, modeConnexion)
- RegistreNational (10 registres de base, 5 domaines)
- BuildingBlock (18 BB, 4 couches DPI)
- Expertise (experts mobilisés rattachés à un Programme)
- DemandeInterop (demandes des institutions)
- AuditLog, UserSession (traçabilité)
- DocumentReference (documents téléchargeables)

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

## Données seedées (état prod 13/05/2026)
- 213 institutions (décret 2025-1431 + ACBEP créée 13/05)
- 18 building blocks DPI (4 couches)
- 10 registres nationaux (5 domaines)
- 76 cas d'usage MVP (codes PINS-TECH/PINS-METIER après N2)
  - 57 PROPOSE, 7 DECLARE, 8 EN_CONSULTATION, 3 PRIORISE, 1 EN_PRODUCTION_360
  - 59/76 (77,6 %) sont orphelins (aucun Financement actif)
- 46+ flux d'interopérabilité
- 5 PTF (JICA, GIZ, BM, ETAT-SN, GATES) — 17 financements
- 5 agences pilotes X-Road (DGPSN, SEN-CSU, DGD, DGID, APIX)
- 8+ conventions (ANEC-DAF, APIX-ANSD, APIX-DGD...)
- 86 users (3 ADMIN dont admin@senum.sn + demo@senum.sn, 83 INSTITUTION)

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
- `main` — état déployé en prod (PRE-01/02/03 complets, PRE-04 à 30 %)
- `ptf-phase1` — RBAC role BAILLEUR + ptfId + CGU. Non déployé. Migration additive prête.
- `ptf-phase2` — Modèle PTF (enum Domaine 14 valeurs, 3 tables manifestation_*, FK Financement.manifestationOrigineId). Non déployé. Migration additive prête.
- À merger post-atelier 19/05 dans l'ordre : ptf-phase1 → main, ptf-phase2 → main.

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
