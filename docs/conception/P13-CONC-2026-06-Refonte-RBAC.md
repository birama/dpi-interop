# Note de conception — Refonte RBAC PARTENAIRE_TECHNIQUE

**Réf.** : P13-CONC-2026-06  
**Auteur** : Birama Diop, PFNI MCTN/SENUM SA  
**Date** : 20 mai 2026  
**Statut** : Livré

---

## 1. Constat des deux trous structurels

### Trou 1 — Pas de rôle pour les AMO/prestataires techniques

Accenture accompagne le MCTN comme Assistance à Maîtrise d'Ouvrage (AMO) sur l'interopérabilité. Ce n'est pas un bailleur de fonds. Il consulte, conseille, accompagne. Il ne dépose pas de manifestation de financement.

Avant cette refonte, le compte `accenture-jica@senum.sn` utilisait le rôle `BAILLEUR` par défaut — conceptuellement faux et source de confusion (apparaissait dans l'annuaire PTF mêlé aux vrais bailleurs).

### Trou 2 — ptfId nullable sur les comptes BAILLEUR

Le rattachement à une entité PTF était techniquement nullable. Conséquence : les comptes avec `ptfId = NULL` ne voyaient aucune donnée (toutes les requêtes BAILLEUR filtrent par `ptfId`). Deux comptes avaient ce défaut (`accenture-jica`, `ptf-demo-gates`), corrigé manuellement en SQL le 20/05/2026.

Le présent correctif ajoute une validation applicative : `ptfId` obligatoire pour `role=BAILLEUR`, `organisationId` obligatoire pour `role=PARTENAIRE_TECHNIQUE`.

---

## 2. Modèle data cible

### Role enum (Prisma)

```prisma
enum Role {
  ADMIN
  INSTITUTION
  BAILLEUR
  PARTENAIRE_TECHNIQUE  // NOUVEAU — AMO, prestataires d'accompagnement
}
```

### Table Organisation (nouvelle)

```prisma
model Organisation {
  id                    String             @id       // code (ex: ACCENTURE)
  nom                   String
  type                  OrganisationType
  secteurAccompagnement String?            @db.Text
  dateRattachement      DateTime?
  dateFinPrevue         DateTime?
  statut                OrganisationStatus @default(ACTIF)
  users                 User[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Enums associés :
- `OrganisationType` : CABINET_CONSEIL, INTEGRATEUR, EDITEUR, EXPERT_INDEPENDANT
- `OrganisationStatus` : ACTIF, INACTIF, ARCHIVE

### User — nouveau champ

```prisma
organisationId String?       // FK → Organisation, requis pour PARTENAIRE_TECHNIQUE
organisation   Organisation? @relation(...)
```

### Contraintes applicatives (backend)

| Rôle | Champ obligatoire | Erreur si absent |
|------|-------------------|------------------|
| BAILLEUR | `ptfId` | 400 "ptfId est requis pour le rôle BAILLEUR" |
| PARTENAIRE_TECHNIQUE | `organisationId` | 400 "organisationId est requis pour le rôle PARTENAIRE_TECHNIQUE" |
| INSTITUTION | `institutionId` | Déjà appliqué |
| ADMIN | — | Aucun |

---

## 3. Périmètre détaillé du rôle PARTENAIRE_TECHNIQUE

### Droits attribués

- Lecture du catalogue national (tous statuts, tous domaines)
- Lecture Vue 360 admin (sans notes, observations, statusHistory, manifestations PTF)
- Lecture de la cartographie institutionnelle (institutions, registres, services techniques)
- Profil de l'organisation

### Droits refusés (403 ou redirect)

| URL | Motif |
|-----|-------|
| `/admin/utilisateurs` | Gestion utilisateurs réservée ADMIN |
| `/admin/manifestations` | Manifestations réservées ADMIN et BAILLEUR |
| `/admin/ptf` | Annuaire PTF réservé ADMIN |
| `/admin/ptf-domaines` | Domaines PTF réservés ADMIN |
| `/admin/ptf-dashboard` | Dashboard PTF réservé ADMIN |
| `/partenaire/*` | Espace BAILLEUR |
| `/questionnaire` | Questionnaire réservé INSTITUTION |
| `/du/*` | Arbitrage DU réservé ADMIN |

### Isolement technique

- ProtectedRoute (App.tsx) : PARTENAIRE_TECHNIQUE isolé sur `/partenaire-tech/*`
- Middleware Fastify : `authenticatePartenaireTechnique` vérifie JWT + role + organisationId
- Sidebar dédiée : rubriques "Mon espace", "Catalogue", "Écosystème"

---

## 4. Stratégie de validation : applicative vs DB

### Choix retenu : validation applicative (pas NOT NULL en base)

**Justification** : `ptfId` et `organisationId` ne sont pertinents que pour certains rôles. Mettre `NOT NULL` en base casserait les lignes ADMIN/INSTITUTION existantes (légitimement NULL). La validation Zod côté backend offre la même garantie d'intégrité sans risque de migration destructive.

### Implémentation

- `POST /api/users` : vérifie `ptfId` présent si `role=BAILLEUR`, `organisationId` présent si `role=PARTENAIRE_TECHNIQUE`
- `PATCH /api/users/:id` : idem, avec support de la mise à NULL si changement de rôle
- Middleware `authenticateBailleur` : vérifie `ptfId` non-null dans le JWT
- Middleware `authenticatePartenaireTechnique` : vérifie `organisationId` non-null dans le JWT

---

## 5. Migration accenture-jica détaillée

### État avant

| Champ | Valeur |
|-------|--------|
| email | accenture-jica@senum.sn |
| role | BAILLEUR |
| ptfId | JICA (corrigé manuellement le 20/05) |
| organisationId | NULL |

### État après

| Champ | Valeur |
|-------|--------|
| email | accenture-jica@senum.sn (inchangé) |
| role | PARTENAIRE_TECHNIQUE |
| ptfId | NULL |
| organisationId | ACCENTURE |
| cguAccepteesAt | NULL (pas de CGU pour AMO) |

### Organisation créée

| Champ | Valeur |
|-------|--------|
| id | ACCENTURE |
| nom | Accenture - AMO Interopérabilité MCTN |
| type | CABINET_CONSEIL |
| secteurAccompagnement | Assistance technique X-Road/PINS, développement et intégration |
| statut | ACTIF |

### Audit

Entrée `USER_ROLE_MIGRATION` dans `audit_logs` avec détail JSON : motif, ancien/nouveau rôle.

---

## 6. Tests RBAC effectués

| # | Test | Résultat |
|---|------|----------|
| 1 | Login accenture-jica → atterrit sur /partenaire-tech/dashboard | À vérifier en navigateur |
| 2 | Sidebar AMO : Mon espace / Catalogue / Écosystème | À vérifier |
| 3 | Catalogue AMO : tous les cas visibles, pas de filtre aFinancer | À vérifier |
| 4 | Fiche cas : stakeholders, registres visibles ; notes/observations masquées | À vérifier |
| 5 | /admin/utilisateurs → 403 ou redirect | À vérifier |
| 6 | /partenaire/catalogue → redirect | À vérifier |
| 7 | accenture-jica n'apparaît PAS dans /admin/ptf | ✓ DB : role != BAILLEUR |
| 8 | Admin création user → 5 rôles → sélection AMO → champ Organisation | À vérifier |
| 9 | Création BAILLEUR sans ptfId → erreur 400 | À vérifier |
| 10 | Création PARTENAIRE_TECHNIQUE sans organisationId → erreur 400 | À vérifier |
| 11 | Non-régression BAILLEUR (5 comptes OK) | ✓ DB : 5 BAILLEUR |
| 12 | Build TS 0 erreur | ✓ |
| 13 | CONSULTATION ≠ PARTENAIRE_TECHNIQUE (pas de confusion) | ✓ Rôles distincts |
| 14 | Annuaire PTF n'inclut pas les AMO | ✓ Filtre role=BAILLEUR |

---

## 7. Fichiers impactés

| Fichier | Action |
|---------|--------|
| `backend/prisma/schema.prisma` | +PARTENAIRE_TECHNIQUE, +Organisation, +organisationId |
| `backend/src/plugins/jwt.ts` | +authenticatePartenaireTechnique, +organisationId JWT |
| `backend/src/modules/auth/auth.service.ts` | +organisationId dans payload login |
| `backend/src/modules/partenaire-technique/routes.ts` | CRÉATION (8 routes) |
| `backend/src/modules/index.ts` | +validation ptfId/organisationId, +register routes |
| `frontend/src/types/index.ts` | +PARTENAIRE_TECHNIQUE, +organisationId |
| `frontend/src/store/auth.ts` | +PARTENAIRE_TECHNIQUE, +organisationId |
| `frontend/src/App.tsx` | +isolation PARTENAIRE_TECHNIQUE, +7 routes |
| `frontend/src/config/menuConfig.ts` | +PARTENAIRE_TECHNIQUE sections, +Annuaire AMO |
| `frontend/src/components/layout/DashboardLayout.tsx` | +visibleSections(), +footer AMO |
| `frontend/src/pages/UtilisateursPage.tsx` | +5e rôle, +Organisation selector |
| `frontend/src/pages/partenaire-tech/*` (4 fichiers) | CRÉATION |
| `frontend/src/pages/OrganisationsPage.tsx` | CRÉATION |

---

**Signé** : Birama Diop, Point Focal National Interopérabilité, MCTN/SENUM SA
