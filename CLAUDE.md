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
- User (email, role ADMIN/INSTITUTION, institutionId)
- Institution (code, nom, ministereTutelle — 201 seedées)
- Submission (questionnaire 8 étapes, status DRAFT/SUBMITTED/VALIDATED)
- Application, Registre, InfrastructureItem (liés à Submission)
- DonneeConsommer, DonneeFournir, FluxExistant (liés à Submission)
- NiveauInterop, ConformitePrincipe (liés à Submission)
- CasUsageMVP (code PINS-CU-XXX, statutImpl, phaseMVPId, impact, axePrioritaire)
- PhaseMVP (MVP-1.0, MVP-2.0, MVP-3.0)
- PTF, Programme, Financement (chaîne de financement)
- Convention (institutionA ↔ institutionB, statut, dates)
- XRoadReadiness (6 jalons par institution, modeConnexion)
- RegistreNational (10 registres de base, 5 domaines)
- BuildingBlock (18 BB, 4 couches DPI)
- Expertise (experts mobilisés)
- DemandeInterop (demandes des institutions)
- AuditLog, UserSession (traçabilité)
- DocumentReference (documents téléchargeables)

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
- /login — Connexion

## Comptes
- Admin : admin@senum.sn / Admin@2026
- DGID : dsi@dgid.sn / Password@123
- DGD : informatique@douanes.sn / Password@123
- ANSD : dsi@ansd.sn / Password@123
- APIX : dsi@apix.sn / Password@123

## Données seedées
- 201 institutions (décret 2025-1431)
- 18 building blocks DPI (4 couches)
- 10 registres nationaux (5 domaines)
- 34+ cas d'usage MVP (codes PINS-CU-XXX)
- 46+ flux d'interopérabilité
- 5 PTF (JICA, GIZ, BM, État, Gates)
- 5 agences pilotes X-Road (DGPSN, SEN-CSU, DGD, DGID, APIX)
- 8+ conventions (ANEC-DAF, APIX-ANSD, APIX-DGD...)

## Conventions de nommage
- Ministère : MCTN (jamais MCTEN)
- Plateforme : PINS (jamais e-jokkoo ni e-jokko)
- Couleurs charte : Navy #0C1F3A, Teal #0A6B68, Gold #D4A820, Amber #C55A18
- Police : Tahoma (titres), Times New Roman (corps)
- Codes cas d'usage : PINS-CU-XXX (séquentiel, unique)
- ASTER et SIGIF coexistent à la DGCPT (ne pas remplacer l'un par l'autre)
- SENTAX remplace SIGTAS à la DGID (en conception)

## Déploiement
```bash
# Local
cd backend && npm run dev  # port 3000
cd frontend && npm run dev  # port 5173

# Production
git push  # GitHub Actions ou manuel
ssh deploy@178.16.129.222
cd /opt/dpi-interop && git pull && bash deploy-prod.sh
```

## Partenaires techniques
- JICA/Accenture : partenaire principal PINS/X-Road
- PexOne : site web monitoring (auteur DAT v0.5)
- Digiboost (Bamba) : JoinXroad — accélérateur no-code X-Road
- Eyone : équipe dev e-senegal.sn
