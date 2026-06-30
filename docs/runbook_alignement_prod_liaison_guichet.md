# Runbook — Alignement prod : liaison guichet e-sénégal + correction typage

**Cible** : porter en prod tout ce qui vit en local après le sprint Liaison Guichet + la correction de la dette de typage.

**Réf** : MCTN/DU/PROMPTS-PINS-LIAISON-GUICHET-2026

**Exécutant** : Birama Diop (DSI), depuis poste local Windows + accès SSH à la VM `178.16.129.222`.

---

## ⚠️ Règles non négociables

- **JAMAIS** `prisma migrate dev` en prod. Seulement `migrate deploy`.
- **JAMAIS** `prisma migrate reset` en prod. Sous AUCUN prétexte.
- **JAMAIS** d'écriture en prod sans backup horodaté préalable.
- À chaque 🛑 **STOP** : copier la sortie console et la coller dans la session Claude pour validation avant de continuer.
- Si une commande échoue avec un message non documenté ici : ARRÊTER, ne pas improviser, demander.

---

## Pré-requis (à vérifier une seule fois)

| Élément | Valeur attendue |
|---|---|
| SSH | `deploy@178.16.129.222`, mot de passe canal sécurisé Birama |
| Outils Windows | `plink` + `pscp` (PuTTY) dans le PATH |
| Repo cloné côté VM | `/home/deploy/dpi-interop` (à confirmer en étape 0) |
| Dossier backups VM | `/home/deploy/backups` |
| Container API | `pins-api` (Fastify + Prisma) |
| Container DB | `pins-db` (PostgreSQL 15) |
| DB | nom `dpidb`, user `dpiuser`, mot de passe géré côté container |
| Repo GitHub | `github.com/birama/dpi-interop`, branche `main` |

**Commits clés à porter** (de la branche `main` locale) :
- `c8716c6` schéma ServiceGuichet + LiaisonGuichet + migration
- `800846b` import idempotent référentiel (100 ServiceGuichet)
- `441c2d1` patch normalize statutEsenegal
- `108cb03` script correspondances candidates
- `b6ad088` routes Fastify liaisons-guichet
- `dd504fe` split KPI exposition e-sénégal
- `a091f22` page Correspondance + route + sidebar
- `6567869` section LiaisonsGuichetBlock fiche cas

---

## Étape 0 — État courant prod (read-only)

Vérifications avant tout, aucune écriture.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep pins-"
```

**Résultat attendu** : `pins-api`, `pins-db`, `pins-frontend` tous `Up`.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "cd /home/deploy/dpi-interop && git log --oneline -3"
```

**Résultat attendu** : le dernier commit côté prod est antérieur à `c8716c6`. Note le SHA prod actuel — utile pour rollback.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-api npx prisma migrate status 2>&1 | tail -20"
```

**Résultat attendu** : N migrations applied, **1 migration pending** (`20260630164952_liaison_guichet_esenegal`).

🛑 **STOP** — me coller les 3 sorties avant d'aller plus loin.

---

## Étape 1 — Backup prod (bloquant)

```powershell
$TS = Get-Date -Format "yyyyMMdd_HHmmss"
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_avant_liaison_guichet_$TS.sql"
plink -pw <pwd> deploy@178.16.129.222 "ls -la /home/deploy/backups/prod_avant_liaison_guichet_$TS.sql && head -3 /home/deploy/backups/prod_avant_liaison_guichet_$TS.sql"
```

**Résultat attendu** :
- Fichier `prod_avant_liaison_guichet_YYYYMMDD_HHMMSS.sql` > 800 ko (taille prod habituelle ≈ 1.1 Mo)
- 1ʳᵉ ligne = `-- PostgreSQL database dump`

**Si échec** :
- `pg_dump: error: connection ... failed` → le container `pins-db` n'est pas joignable. Vérifier `docker ps`, redémarrer si besoin (`docker restart pins-db`), réessayer. NE PAS continuer sans backup réussi.
- Fichier 0 octet → la redirection a planté côté shell. Réessayer en passant par `docker exec ... > /tmp/xxx.sql` puis `scp` local pour vérifier le contenu.

🛑 **STOP** — me coller le `ls -la` du fichier et les 3 premières lignes. **Étape bloquante : rien ne continue sans dump confirmé.**

---

## Étape 2 — Pull du code à jour côté VM

```powershell
plink -pw <pwd> deploy@178.16.129.222 "cd /home/deploy/dpi-interop && git fetch origin && git log origin/main --oneline -5"
plink -pw <pwd> deploy@178.16.129.222 "cd /home/deploy/dpi-interop && git pull origin main"
plink -pw <pwd> deploy@178.16.129.222 "cd /home/deploy/dpi-interop && git log --oneline -3"
```

**Résultat attendu** : `git pull` rapporte les ~10 commits depuis le SHA prod constaté en étape 0. `git log -3` montre `6567869` (ou plus récent) en HEAD.

**Si échec** :
- `Your local changes ... would be overwritten by merge` → des modifs non commitées traînent sur la VM. NE PAS faire `git reset --hard` aveuglément. Examiner avec `git status`, et soit `git stash` (réversible) soit demander avant d'écraser.
- `error: pathspec 'origin/main' did not match` → réseau ou auth Git VM. Vérifier `git remote -v` et `git ls-remote origin`.

🛑 **STOP** — me coller le `git log -3` après pull.

---

## Étape 3 — Migration `liaison_guichet_esenegal` en prod

### Plan A — voie nominale `migrate deploy`

`migrate deploy` n'analyse pas le drift du schéma : il joue uniquement les fichiers `migration.sql` des migrations marquées non appliquées dans `_prisma_migrations`. Ma migration crée 2 nouvelles tables + 1 nouvel enum, sans toucher aux tables touchées par le drift préexistant (Organisation, AccompagnementAMO, ProgrammePrioritaire, etc.). Le plan A doit donc passer.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-api npx prisma migrate deploy 2>&1 | tail -30"
```

**Résultat attendu** :
```
Applying migration `20260630164952_liaison_guichet_esenegal`
The following migration(s) have been applied:
migrations/
  └─ 20260630164952_liaison_guichet_esenegal/
    └─ migration.sql
All migrations have been successfully applied.
```

**Vérification post-application** :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c '\dt service_guichet liaison_guichet'"
```

Doit lister les deux tables avec owner = `dpiuser`.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-api npx prisma migrate status 2>&1 | tail -10"
```

Doit dire `Database schema is up to date` ou équivalent — plus de migration pending sur ma liaison.

### Plan B — voie de secours `psql + migrate resolve --applied`

À déclencher **uniquement** si le Plan A renvoie une des erreurs suivantes :
- `Drift detected: ... can't be reconciled` (ne devrait pas arriver avec deploy mais on couvre)
- `The migration could not be applied because of a database error`
- Toute mention d'un `migrate reset` proposé par Prisma → **NE JAMAIS L'ACCEPTER**

Étapes Plan B :

**B.1** Copier la migration SQL dans le container DB :
```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker cp /home/deploy/dpi-interop/backend/prisma/migrations/20260630164952_liaison_guichet_esenegal/migration.sql pins-db:/tmp/liaison_guichet.sql"
```

**B.2** Jouer le SQL directement dans une transaction (le fichier ne contient que du DDL — sûr à jouer atomique) :
```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -1 -f /tmp/liaison_guichet.sql"
```

Le flag `-1` (single transaction) garantit que si une instruction plante, rien n'est laissé en place.

**Résultat attendu** : `CREATE TYPE`, `CREATE TABLE` ×2, `CREATE UNIQUE INDEX` ×2, `CREATE INDEX` ×2, `ALTER TABLE` ×2 (FK). Pas d'erreur.

**B.3** Marquer la migration comme appliquée dans le suivi Prisma :
```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-api npx prisma migrate resolve --applied 20260630164952_liaison_guichet_esenegal"
```

**Résultat attendu** : `Migration 20260630164952_liaison_guichet_esenegal marked as applied.`

**Vérification B.4** identique à la vérification Plan A.

**Si Plan B échoue aussi** : ARRÊTER, restaurer le backup étape 1, me ping avant tout autre geste.

🛑 **STOP** — me coller le `migrate status` final + `\dt service_guichet liaison_guichet`.

---

## Étape 4 — Import des 100 ServiceGuichet (seed idempotent)

Le script seed est dans le repo cloné côté VM (étape 2) mais doit être exécuté **depuis le container `pins-api`** pour avoir accès au client Prisma. Comme le container n'a probablement pas le repo monté, on copie le fichier + son JSON source.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker cp /home/deploy/dpi-interop/backend/prisma/seed/import-guichet.ts pins-api:/app/prisma/seed/import-guichet.ts"
plink -pw <pwd> deploy@178.16.129.222 "docker cp /home/deploy/dpi-interop/backend/prisma/seed/PINS_referentiel_guichet_esenegal.json pins-api:/app/prisma/seed/PINS_referentiel_guichet_esenegal.json"
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-api ls -la /app/prisma/seed/"
```

**Résultat attendu** : les 2 fichiers présents dans `/app/prisma/seed/` côté container.

Exécution :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec -w /app pins-api npx tsx prisma/seed/import-guichet.ts 2>&1 | tail -30"
```

**Résultat attendu (premier passage en prod)** :
```
Source : /app/prisma/seed/PINS_referentiel_guichet_esenegal.json
100 démarches à traiter

=== AVANT IMPORT ===
CasUsageMVP par typologie : {"METIER":<N_metier>,"TECHNIQUE":<N_tech>}
ServiceGuichet total      : 0
PINS-GUICHET-NNN — max existant : 0

=== RÉCAP IMPORT ===
Créés   : 100
MAJ     : 0
Ignorés : 0
Erreurs : 0

=== APRÈS IMPORT ===
CasUsageMVP par typologie : {"METIER":<N_metier>,"TECHNIQUE":<N_tech>}   <- IDENTIQUE à AVANT
ServiceGuichet total      : 100
✅ Non-régression OK — typologies CasUsageMVP inchangées.
```

⚠️ Les compteurs METIER/TECHNIQUE prod **différeront** des 13/541 locaux — c'est attendu. Ce qui compte : AVANT == APRÈS.

**Si exit code ≠ 0 ou "❌ RÉGRESSION"** : ARRÊTER. Le script a déjà fait des `prisma.serviceGuichet.create` qu'il faudrait défaire. Possible mais doit être discuté avant. Me ping.

**Si `npx tsx` introuvable dans le container** : Plan B-import → exécuter via `node` après compilation TS locale. À éviter ; me ping plutôt.

🛑 **STOP** — me coller le récap import complet (AVANT + RÉCAP + APRÈS + ligne ✅).

---

## Étape 5 — Correction dette typage en prod

### 5.1 Re-diagnostic prod (lecture seule, pas d'écriture)

**Ne pas présumer le 409 local.** La prod a sa propre volumétrie et son propre historique de seeds. Mesurer d'abord.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c \`"SELECT COUNT(*) AS divergences_prod FROM cas_usage_mvp WHERE (code LIKE 'PINS-METIER-%%' AND typologie != 'METIER') OR (code LIKE 'PINS-TECH-%%' AND typologie != 'TECHNIQUE');\`""
```

**Résultat attendu** : un entier N. Peut être 0, 409, ou différent. Note la valeur.

Aussi : répartition actuelle :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c \`"SELECT typologie, COUNT(*) AS n FROM cas_usage_mvp GROUP BY 1 ORDER BY 1;\`""
```

Et état du DEFAULT SQL :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c \`"SELECT column_default FROM information_schema.columns WHERE table_name='cas_usage_mvp' AND column_name='typologie';\`""
```

🛑 **STOP** — me coller les 3 sorties. Selon le N :
- **N = 0** : la prod est déjà saine sur le typage. Passer directement à 5.2 (DROP DEFAULT seul, pas d'UPDATE). Sauter 5.3.
- **N > 0** : continuer 5.2 + 5.3.

### 5.2 Backup 2 (avant écriture sur typage)

```powershell
$TS2 = Get-Date -Format "yyyyMMdd_HHmmss"
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_avant_correction_typage_$TS2.sql"
plink -pw <pwd> deploy@178.16.129.222 "ls -la /home/deploy/backups/prod_avant_correction_typage_$TS2.sql"
```

**Bloquant**. Sans backup 2 confirmé, on ne touche pas au typage.

### 5.3 Transaction atomique : DROP DEFAULT + UPDATE

À exécuter UNIQUEMENT si N > 0 (5.1). Si N = 0, sauter cette section et faire seulement le DROP DEFAULT isolé (commande `ALTER TABLE` seule sans le `UPDATE`).

Exécuter en **une transaction unique**, garantie par `psql -1` :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -1 -c \`"ALTER TABLE cas_usage_mvp ALTER COLUMN typologie DROP DEFAULT; UPDATE cas_usage_mvp SET typologie='METIER' WHERE code LIKE 'PINS-METIER-%%' AND typologie='TECHNIQUE';\`""
```

**Résultat attendu** : `ALTER TABLE` puis `UPDATE <N>` où N == valeur mesurée en 5.1.

**Si N retourné ≠ N attendu** : ARRÊTER. La transaction étant atomique et `psql -1` actif, rien n'a été commité. Investiguer pourquoi le compte diverge avant de réessayer.

**Note importante** : on n'ajoute PAS de migration Prisma pour le DROP DEFAULT. Cohérent avec la décision locale — éviter de réveiller le drift Organisation/AMO/ProgrammePrioritaire. Le ALTER est appliqué en direct, et le `schema.prisma` reflète déjà cette absence de défaut côté Prisma.

🛑 **STOP** — me coller la sortie psql complète.

---

## Étape 6 — Déploiement du code applicatif

Les migrations + données sont en place, mais les nouvelles **routes** (étape 4 du sprint) et l'**UI** (étape 5) ne sont pas encore dans les containers. Procédure CLAUDE.md.

### 6.1 Backend — routes liaisons-guichet

Build local :
```powershell
cd backend
npm run build
```

⚠️ Le build peut signaler la dette préexistante sur `src/modules/index.ts:452` (route `/propose`). Cette erreur préexiste, elle n'est pas introduite par ma branche. `tsc` la signale mais émet quand même les `.js` si non strict.

Si `tsc --noEmit` est dans le `build` script et bloque : me ping, on contournera ponctuellement.

Copie + restart :
```powershell
pscp -pw <pwd> backend/dist/modules/vue360/liaisonsGuichet.routes.js deploy@178.16.129.222:/tmp/
pscp -pw <pwd> backend/dist/modules/vue360/catalogue.routes.js deploy@178.16.129.222:/tmp/
pscp -pw <pwd> backend/dist/modules/index.js deploy@178.16.129.222:/tmp/

plink -pw <pwd> deploy@178.16.129.222 "docker cp /tmp/liaisonsGuichet.routes.js pins-api:/app/dist/modules/vue360/liaisonsGuichet.routes.js"
plink -pw <pwd> deploy@178.16.129.222 "docker cp /tmp/index.js pins-api:/app/dist/modules/index.js"

plink -pw <pwd> deploy@178.16.129.222 "docker restart pins-api"
plink -pw <pwd> deploy@178.16.129.222 "sleep 5 && docker logs --tail 30 pins-api"
```

**Résultat attendu** : log `All routes registered`, aucune erreur Fastify.

**Si erreur au démarrage** : ARRÊTER. Restorer le `.js` précédent depuis le backup local du `dist/` ou re-tirer depuis git. Me ping.

### 6.2 Frontend — page Correspondance + section fiche

Build local :
```powershell
cd frontend
npm run build
```

Copie :
```powershell
pscp -pw <pwd> -r frontend/dist/* deploy@178.16.129.222:/tmp/pins-dist/
plink -pw <pwd> deploy@178.16.129.222 "docker cp /tmp/pins-dist/. pins-frontend:/usr/share/nginx/html/"
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-frontend nginx -s reload"
```

🛑 **STOP** — me coller les logs `docker logs pins-api` après restart.

---

## Étape 7 — Contrôles finaux end-to-end

À exécuter dans l'ordre. Si l'un échoue : ARRÊTER, restaurer si nécessaire.

### 7.1 Schéma + données

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c \`"SELECT COUNT(*) AS service_guichet_count FROM service_guichet;\`""
```
Attendu : `100`.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c \`"SELECT typologie, COUNT(*) FROM cas_usage_mvp GROUP BY 1 ORDER BY 1;\`""
```
Attendu : la dette typage doit être à 0.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db psql -U dpiuser -d dpidb -c \`"SELECT column_default FROM information_schema.columns WHERE table_name='cas_usage_mvp' AND column_name='typologie';\`""
```
Attendu : `NULL`.

### 7.2 Routes API (avec token ADMIN — récupérer via /api/auth/login depuis le frontend)

```powershell
# GET /api/catalogue/services-guichet
plink -pw <pwd> deploy@178.16.129.222 "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer <TOKEN_ADMIN>' http://localhost:3000/api/catalogue/services-guichet"
```
Attendu : `200`.

```powershell
# GET /api/catalogue/correspondance-esenegal
plink -pw <pwd> deploy@178.16.129.222 "curl -s -H 'Authorization: Bearer <TOKEN_ADMIN>' http://localhost:3000/api/catalogue/correspondance-esenegal | head -c 500"
```
Attendu : JSON `{"kpis":{...},"items":[...]}` avec `casUsageTotal` > 500.

### 7.3 UI

Naviguer depuis ton navigateur :
- https://dpi-interop.senum.sn/catalogue/correspondance-esenegal — page Correspondance visible, KPIs remplis, table peuplée (sans liaisons au début c'est normal)
- Ouvrir une fiche cas (ex. https://dpi-interop.senum.sn/use-cases/<uuid>) — section "Service guichet correspondant" présente avec compteur 0 et bouton "Lier un service" (si ADMIN)

🛑 **STOP final** — me coller tous les outputs + 2 screenshots des pages.

---

## Rollback

### Rollback partiel (avant 5.3)
Si problème entre étape 1 et étape 5.2, restaurer le backup 1 :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec -i pins-db psql -U dpiuser -d dpidb < /home/deploy/backups/prod_avant_liaison_guichet_<TS>.sql"
```

Attention : `psql < file` ne nettoie pas la base avant. Pour un restore propre :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db dropdb -U dpiuser dpidb && docker exec pins-db createdb -U dpiuser dpidb"
plink -pw <pwd> deploy@178.16.129.222 "docker exec -i pins-db psql -U dpiuser -d dpidb < /home/deploy/backups/prod_avant_liaison_guichet_<TS>.sql"
```

⚠️ Destructif. Confirmation explicite obligatoire avant de jouer.

### Rollback de la correction typage seule (après 5.3, si bug)
Restaurer depuis le backup 2 :

```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db dropdb -U dpiuser dpidb && docker exec pins-db createdb -U dpiuser dpidb"
plink -pw <pwd> deploy@178.16.129.222 "docker exec -i pins-db psql -U dpiuser -d dpidb < /home/deploy/backups/prod_avant_correction_typage_<TS2>.sql"
```

Le backup 2 contient déjà les 100 ServiceGuichet importés en étape 4 — on perd uniquement la correction typage.

### Rollback du code applicatif (étape 6)
Restorer les `.js` précédents depuis `git show <SHA_prod_etape0>:backend/dist/...` (si dist/ versionné) ou rebuilder depuis le SHA prod initial puis redéployer.

---

## Récap des points d'arrêt obligatoires

| # | Quoi te montrer |
|---|---|
| 🛑 0 | docker ps + git log prod + migrate status prod |
| 🛑 1 | ls -la du dump + 3 premières lignes |
| 🛑 2 | git log -3 après pull |
| 🛑 3 | migrate status final + \dt service_guichet liaison_guichet |
| 🛑 4 | Récap import seed (AVANT + RÉCAP + APRÈS + ligne ✅) |
| 🛑 5.1 | 3 sorties : compte divergences + répartition typo + column_default |
| 🛑 5.3 | Sortie psql ALTER + UPDATE |
| 🛑 6 | docker logs pins-api après restart |
| 🛑 7 | Tous les contrôles 7.1-7.3 + 2 screenshots |
