# PINS — Gestion des sessions et des mots de passe

Référence : MCTN/DU/SECU-PINS-SESSIONS-2026-05-15 · Version 1.0

## Contexte

Avant le 15/05/2026, la gestion des sessions et la révocation des credentials souffraient de 3 défauts identifiés lors de l'usage en prod :

1. **Sessions s'accumulant** sur `/admin/audit` (jusqu'à 20+ entrées pour un même utilisateur).
2. **Pas d'expiration effective** : seuil affiché 30 minutes, mais aucun mécanisme côté backend ne fermait les sessions inactives.
3. **Rotation de mot de passe sans impact sur les sessions actives** : changer le mot de passe d'un compte (manuel SQL ou via endpoint) laissait l'ancien JWT utilisable jusqu'à expiration naturelle (2h).

Le sprint du 15/05 a corrigé ces 3 défauts. Cette note documente l'état cible.

## Architecture cible

```
┌──────────────────────────────────────────────────────────────┐
│ LOGIN                                                          │
│  ├─ bcrypt.compare(password, user.password) → OK              │
│  ├─ JWT signé (access 2h, refresh 7d)                         │
│  ├─ updateMany : ferme toutes les autres sessions actives     │
│  │   du user (NOT { tokenHash })                              │
│  └─ upsert UserSession : tokenHash unique, isActive=true,     │
│      lastActivityAt=now, expiresAt=now+2h                     │
├──────────────────────────────────────────────────────────────┤
│ ACTION AUTHENTIFIÉE                                            │
│  ├─ Middleware authenticate                                    │
│  │   ├─ request.jwtVerify()                                   │
│  │   └─ assertSessionActive : SHA256(token) → lookup          │
│  │       userSession.findUnique → isActive === true            │
│  │       Si !isActive → 401 SessionExpired                    │
│  └─ Hook onResponse : userSession.updateMany                  │
│      lastActivityAt = NOW() (seulement si isActive=true)      │
├──────────────────────────────────────────────────────────────┤
│ CLEANUP AUTOMATIQUE (job 60s)                                  │
│  └─ updateMany WHERE isActive=true                            │
│      AND lastActivityAt < NOW() - INTERVAL '10 minutes'       │
│      SET isActive=false, logoutAt=NOW()                        │
├──────────────────────────────────────────────────────────────┤
│ /auth/refresh                                                  │
│  ├─ Vérifie refresh JWT (7d)                                  │
│  ├─ Génère nouveau access JWT                                 │
│  ├─ Ferme les autres sessions actives                         │
│  └─ upsert UserSession (cohérent avec login)                  │
├──────────────────────────────────────────────────────────────┤
│ CHANGEMENT MOT DE PASSE                                        │
│  ├─ Self-service (/auth/change-password)                      │
│  │   ├─ Vérifie ancien password                               │
│  │   ├─ Update user.password (bcrypt)                         │
│  │   └─ updateMany : ferme toutes les sessions actives        │
│  │       SAUF celle de la requête (tokenHash courant)         │
│  └─ Reset admin (POST /users/:id/reset-password)              │
│      ├─ Update user.password + mustChangePassword=true        │
│      └─ updateMany : ferme TOUTES les sessions du user        │
└──────────────────────────────────────────────────────────────┘
```

## Modèle de données

```prisma
model UserSession {
  id             String    @id @default(uuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash      String    @unique           // SHA256(JWT access)
  ipAddress      String?
  userAgent      String?
  loginAt        DateTime  @default(now())
  lastActivityAt DateTime  @default(now())   // mis à jour onResponse
  expiresAt      DateTime                    // login+2h, pour info — non utilisé pour révocation
  isActive       Boolean   @default(true)    // false = session révoquée
  logoutAt       DateTime?                   // timestamp de fermeture

  @@index([userId])
  @@index([isActive])
  @@map("user_sessions")
}
```

L'invariant fondamental : **une session active correspond à un JWT toujours acceptable**. La cohérence est maintenue par les 3 mécanismes ci-dessus (cleanup, révocation explicite sur changement password, déconnexion forcée admin).

## Paramètres

| Paramètre | Valeur | Lieu | Justification |
|---|---|---|---|
| Durée access JWT | 2h | `auth.service.ts` `expiresIn: '2h'` | Compromis classique sécurité / UX |
| Durée refresh JWT | 7d | `auth.service.ts` `expiresIn: '7d'` | Standard SPA |
| Inactivité tolérée | 10 min | `index.ts` `INACTIVITY_TIMEOUT_MS` | Exigence MCTN — démo en réunion |
| Fréquence cleanup auto | 60s | `setInterval` dans `registerRoutes` | Latence acceptable, charge DB nulle |
| Affichage admin/audit | 10 min | `/audit/sessions/active`, `/audit/stats` | Cohérent avec le seuil d'inactivité |

Pour modifier le seuil d'inactivité, changer **3 valeurs en cohérence** : `INACTIVITY_TIMEOUT_MS` dans `index.ts` + 2 occurrences `tenMinAgo` (audit/sessions/active et audit/stats).

## Matrice des comportements

| Action utilisateur | Effet immédiat | Effet 60s plus tard |
|---|---|---|
| Login | 1 session active, anciennes fermées | — |
| Action API quelconque | `lastActivityAt = NOW()` | — |
| Inactif 10 min | rien | Cleanup ferme la session → 401 SessionExpired à la prochaine action |
| `/auth/change-password` | Sessions autres devices fermées, celle en cours préservée | — |
| Logout (frontend) | Session marquée inactive immédiatement | — |
| Admin reset password sur user X | Toutes sessions de X fermées | X reçoit 401 à sa prochaine action → toast "Session expirée" |
| Admin force logout via `/admin/audit` | Session ciblée fermée | User reçoit 401 → toast |
| Rotation password admin via SQL direct | **Aucun effet automatique** (cas particulier — voir procédures) | — |

## Procédures opérationnelles

### Rotation manuelle d'un mot de passe via SQL

Quand on change un mot de passe directement en DB (sans passer par l'endpoint), il faut purger les sessions à la main :

```sql
-- 1. Mettre à jour le hash bcrypt
UPDATE users SET password='$2b$10$...' WHERE email='admin@senum.sn';

-- 2. Révoquer toutes les sessions actives du user
UPDATE user_sessions
SET "isActive"=false, "logoutAt"=NOW()
WHERE "userId"=(SELECT id FROM users WHERE email='admin@senum.sn')
  AND "isActive"=true;
```

Sans l'étape 2, l'ancien JWT continue à fonctionner pendant au plus 10 minutes (jusqu'au prochain cleanup auto qui le tuera par inactivité). Étape 2 = révocation immédiate.

### Reset password par un admin (UI ou API)

L'endpoint `POST /api/users/:id/reset-password` fait automatiquement les deux opérations (update password + révocation sessions). Aucune action SQL nécessaire.

### Changement self-service par un utilisateur

L'utilisateur passe par le menu user header → "🔑 Changer mon mot de passe" → page `/change-password`. L'endpoint préserve la session en cours et ferme toutes les autres (téléphone, autre navigateur, etc.).

### Forcer la déconnexion d'un user actif

Depuis `/admin/audit` → onglet "Utilisateurs en ligne" → bouton "Déconnecter" sur la ligne du user. Effet immédiat.

### Diagnostic d'une session "fantôme"

Si un user remonte qu'il ne peut plus naviguer alors qu'il pense être connecté :

```sql
SELECT s."isActive", s."lastActivityAt", s."logoutAt", s."loginAt"
FROM user_sessions s
JOIN users u ON u.id=s."userId"
WHERE u.email='<email>'
ORDER BY s."loginAt" DESC LIMIT 5;
```

Cas typique : `isActive=false` + `logoutAt` récent → cleanup auto a fermé la session inactive. Le user doit se relogger (le frontend devrait avoir géré le 401 et redirigé vers `/login` avec toast "Session expirée").

## UX côté frontend

| Évènement | Comportement frontend |
|---|---|
| 401 sur appel API → refresh OK | Silencieux. Nouvelle UserSession active créée, navigation continue. |
| 401 sur appel API → refresh KO (refresh token expiré 7j) | `sessionStorage.setItem('auth-expired-reason', 'expired')`, logout local, redirect `/login` |
| 401 SessionExpired sur appel API → refresh OK | Silencieux (refresh crée la session manquante). |
| 401 SessionExpired → refresh KO | Toast destructif "Session expirée après 10 minutes d'inactivité. Veuillez vous reconnecter." sur `/login` |
| Page `/login` ouverte avec flag | Lit `sessionStorage.getItem('auth-expired-reason')`, affiche le toast, nettoie le flag |
| Bouton "Changer mon mot de passe" dans dropdown user | Disponible pour tous les rôles, navigue vers `/change-password` |

## Endpoints concernés

| Endpoint | Méthode | RBAC | Effet sessions |
|---|---|---|---|
| `/api/auth/login` | POST | public | dedup + nouvelle session active |
| `/api/auth/refresh` | POST | public | dedup + nouvelle session active |
| `/api/auth/change-password` | POST | authenticate | ferme les autres sessions, préserve la courante |
| `/api/auth/me` | GET | authenticate | met à jour `lastActivityAt` |
| `/api/users/:id/reset-password` | POST | authenticateAdmin | ferme **toutes** les sessions du user cible |
| `/api/users/:id` | DELETE | authenticateAdmin | cascade Prisma `onDelete: Cascade` → supprime les sessions |
| `/api/audit/sessions/active` | GET | authenticateAdmin | lecture seule, seuil 10 min |
| `/api/audit/sessions/:id` | DELETE | authenticateAdmin | force logout admin |
| `/api/audit/stats` | GET | authenticateAdmin | compteur sessions actives (10 min) |

## Limites connues

1. **Cas SQL direct non-couvert** : modifier `user.password` via psql sans toucher à `user_sessions` laisse un trou de cohérence de 10 minutes max (jusqu'au cleanup auto par inactivité). Procédure ci-dessus pour fermer le trou.
2. **Refresh JWT non protégé par la session active** : le `/auth/refresh` ne vérifie pas l'état d'une session existante avant de signer un nouveau JWT — il s'en remet à la validité du refresh token (7 jours). Conséquence : un user "expiré" qui rebondit sur refresh recrée une session sans friction. Comportement intentionnel (UX), mais signifie que la révocation par inactivité n'est pas absolue tant que le refresh token reste valide. Pour fermer ce cas, un attaquant en possession du refresh token bénéficierait de 7 jours d'accès.
3. **Pas de protection contre vol de tokenHash** : si un attaquant possède le tokenHash en base ET le JWT correspondant, il peut signer ses propres requêtes. La protection repose entièrement sur la confidentialité du JWT côté client (sessionStorage).
4. **JWT secret rotation** : pas de mécanisme de rotation du `JWT_SECRET` côté serveur. Une rotation manuelle invalide tous les JWT existants (qui ne pourront plus être vérifiés) — opération à coordonner avec un message de maintenance.
5. **Multi-onglet** : à chaque nouvel onglet/login, les sessions actives précédentes du même user sont fermées. Conséquence : un user qui ouvre une 2e fenêtre déconnecte automatiquement la 1ère après que la 2ᵉ ait fait un login. Comportement intentionnel (1 session = 1 device par user) mais peut surprendre.

## Historique d'implémentation

| Date | Commit | Apport |
|---|---|---|
| 14/05 16:07 | `b14e77a` chain | Rotation password admin via SQL direct (manuel) |
| 15/05 16:00 | `5027f15` | Seuil 30→10 min · cleanup auto 60s · `assertSessionActive` middleware · dedup au login |
| 15/05 16:30 | `54ab7ae` | `/auth/refresh` crée UserSession + `upsert` (anti-collision tokenHash) + toast frontend SessionExpired |
| 15/05 16:45 | `d36b4e0` | Révocation sessions sur changement password (self-service préserve la courante, reset admin révoque tout) |
| 15/05 17:00 | `504c185` | Bouton "Changer mon mot de passe" dans le dropdown user header |

## Audit trail

Toutes les opérations sensibles sont tracées dans la table `audit_logs` :

- `LOGIN_SUCCESS` / `LOGIN_FAILED` / `BRUTE_FORCE_SUSPECTED`
- `UPDATE` sur ressource `user` avec `resourceLabel='reset-password'` (cas admin reset)
- `DELETE` sur ressource `session` (force logout admin via UI)

Le journal d'activité reste consultable sur `/admin/audit` onglet "Journal d'activité", filtres par action / ressource / dates / institution.

## Recommandations post-atelier

- Ajouter un job nightly qui purge `user_sessions WHERE isActive=false AND logoutAt < NOW() - INTERVAL '30 days'` pour borner la taille de la table.
- Implémenter un mécanisme de "blacklist" du `JWT_SECRET` permettant une rotation périodique sans déconnexion massive (rotation graceful).
- Ajouter une page admin de liste des sessions historiques d'un user donné (audit forensique).
- Sur l'endpoint `/auth/refresh`, vérifier que la dernière session du user n'a pas été fermée pour raison de sécurité (ex: reset admin) pour éviter la résurrection automatique. Compromis sécurité/UX à arbitrer.
