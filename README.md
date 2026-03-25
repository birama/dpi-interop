# Questionnaire Interopérabilité - SENUM

Application web pour la collecte des besoins d'interopérabilité des administrations sénégalaises.

## Architecture

```
questionnaire-interop/
├── backend/               # API Fastify + TypeScript
│   ├── src/
│   │   ├── config/       # Configuration (env)
│   │   ├── plugins/      # Plugins Fastify
│   │   ├── modules/      # Auth, Institutions, Submissions, Reports
│   │   ├── app.ts        # Application Fastify
│   │   └── server.ts     # Point d'entrée
│   └── prisma/           # Schema DB + Seed
│
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/   # UI Components (shadcn/ui style)
│   │   ├── pages/        # Pages principales
│   │   ├── store/        # Zustand store
│   │   └── services/     # API services
│   └── public/
│
└── docker-compose.yml    # Dev environment
```

## Stack Technique

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: JWT + bcrypt
- **Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript 5.x
- **UI**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand + TanStack Query
- **Routing**: React Router v6

## Démarrage Rapide

### Prérequis
- Node.js 20+
- PostgreSQL 15+ (ou Docker)
- npm ou yarn

### Avec Docker (recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Arrêter
docker-compose down
```

### Sans Docker

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres

# Base de données
npm run db:generate
npm run db:migrate
npm run db:seed

# Démarrer
npm run dev
```

**2. Frontend**
```bash
cd frontend
npm install

# Démarrer
npm run dev
```

## URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Application React |
| Backend API | http://localhost:3000 | API Fastify |
| Swagger | http://localhost:3000/documentation | Documentation API |
| pgAdmin | http://localhost:5050 | Gestion DB (profile: tools) |

## Comptes de Test

### Administrateur
- **Email**: admin@senum.sn
- **Password**: Admin@2026

### Institutions
| Institution | Email | Password |
|------------|-------|----------|
| DGID | dsi@dgid.sn | Password@123 |
| DGD | informatique@douanes.sn | Password@123 |
| ANSD | dsi@ansd.sn | Password@123 |
| DGCPT | informatique@dgcpt.sn | Password@123 |
| ANEC | si@anec.sn | Password@123 |

## Scripts Backend

```bash
npm run dev           # Hot reload development
npm run build         # Build production
npm run start         # Start production
npm run lint          # ESLint check
npm run test          # Run tests
npm run db:migrate    # Create migration
npm run db:seed       # Seed database
npm run db:studio     # Prisma Studio UI
```

## Scripts Frontend

```bash
npm run dev           # Development server
npm run build         # Build production
npm run preview       # Preview build
npm run lint          # ESLint check
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/change-password` - Changer mot de passe

### Institutions
- `GET /api/institutions` - Liste (paginée)
- `GET /api/institutions/:id` - Détails
- `POST /api/institutions` - Créer (admin)
- `PATCH /api/institutions/:id` - Modifier (admin)
- `DELETE /api/institutions/:id` - Supprimer (admin)
- `GET /api/institutions/stats` - Statistiques (admin)

### Submissions
- `GET /api/submissions` - Liste (paginée)
- `GET /api/submissions/:id` - Détails
- `POST /api/submissions` - Créer
- `PATCH /api/submissions/:id` - Modifier (brouillon)
- `PATCH /api/submissions/:id/status` - Changer statut
- `DELETE /api/submissions/:id` - Supprimer (brouillon)
- `GET /api/submissions/stats` - Statistiques (admin)

### Reports
- `GET /api/reports` - Historique
- `POST /api/reports/generate` - Générer rapport

## Structure Base de Données

| Table | Description |
|-------|-------------|
| users | Authentification |
| institutions | Administrations |
| submissions | Soumissions questionnaire |
| applications | Applications déclarées |
| registres | Bases de référence |
| donnees_consommer | Besoins en données |
| donnees_fournir | Données à partager |
| flux_existants | Flux actuels |
| cas_usage | Cas d'usage prioritaires |
| reports | Rapports générés |
| audit_logs | Logs d'audit |

## Sécurité

- JWT pour l'authentification
- Bcrypt pour le hash des mots de passe
- Helmet pour les headers HTTP
- CORS configuré
- Rate limiting (100 req/min)
- Validation Zod sur toutes les entrées
- Prisma protège contre les SQL injections

## Déploiement

### Production
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Les fichiers sont dans:
# - backend/dist
# - frontend/dist
```

## Contact

- **Projet**: Questionnaire Interopérabilité
- **Équipe**: SENUM - MCTN
- **Email**: dpi.interrop@numerique.gouv.sn
