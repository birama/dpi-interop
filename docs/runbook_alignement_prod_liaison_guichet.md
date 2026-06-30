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
| Repo cloné côté VM | `/opt/dpi-interop` (à confirmer en étape 0) |
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
plink -pw <pwd> deploy@178.16.129.222 "cd /opt/dpi-interop && git log --oneline -3"
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

## Étape 2 — Vérifier les commits à déployer (read-only)

`deploy-prod.sh` fait lui-même un `git pull origin main` à l'étape 1 de son script. Cette étape 2 est uniquement de la vérification *avant* le déploiement, pour mesurer ce qu'on va appliquer.

```powershell
plink -pw <pwd> deploy@178.16.129.222 "cd /opt/dpi-interop && git fetch origin && git log HEAD..origin/main --oneline"
plink -pw <pwd> deploy@178.16.129.222 "cd /opt/dpi-interop && git status"
```

**Résultat attendu** :
- `git log HEAD..origin/main` liste les commits que `deploy-prod.sh` va appliquer. Doit contenir au minimum : `c8716c6`, `800846b`, `441c2d1`, `108cb03`, `b6ad088`, `dd504fe`, `a091f22`, `6567869`, `b7cf078` (runbook).
- `git status` indique `working tree clean`.

**Si échec** :
- `working tree` non clean → des modifs non commitées traînent sur la VM. NE PAS faire `git reset --hard` aveuglément. Examiner avec `git diff`, et soit `git stash` (réversible) soit me ping avant d'écraser.
- `error: pathspec 'origin/main' did not match` → réseau ou auth Git VM. Vérifier `git remote -v` et `git ls-remote origin`.

⚠️ Le pull réel se fera en étape 6 via `deploy-prod.sh`. Ne pas faire `git pull` à la main ici, sinon `deploy-prod.sh` annoncera "Already up to date" et tu perds le checkpoint.

🛑 **STOP** — me coller la liste des commits à déployer + le `git status`.

---

## Étape 3 — Migration `liaison_guichet_esenegal` en prod

> **Conflit de séquencement à arbitrer avant** : `deploy-prod.sh` (étape 6) joue automatiquement `npx prisma migrate deploy` à sa propre étape 7. Deux options :
>
> - **3a** (recommandé) : appliquer la migration **maintenant**, manuellement, AVANT le déploiement du code. Avantage : si la migration plante, le code en cours ne tourne pas encore sur un schéma incomplet. Le `migrate deploy` que rejoue `deploy-prod.sh` plus tard est idempotent → no-op propre.
>
> - **3b** : ne rien faire ici, laisser `deploy-prod.sh` jouer la migration en étape 6. Avantage : un seul outil testé. Inconvénient : si la migration plante, le nouveau `pins-api` est déjà démarré.
>
> Le runbook documente **3a**. Si tu préfères 3b, saute cette étape et passe directement à 4.

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
plink -pw <pwd> deploy@178.16.129.222 "docker cp /opt/dpi-interop/backend/prisma/migrations/20260630164952_liaison_guichet_esenegal/migration.sql pins-db:/tmp/liaison_guichet.sql"
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
plink -pw <pwd> deploy@178.16.129.222 "docker cp /opt/dpi-interop/backend/prisma/seed/import-guichet.ts pins-api:/app/prisma/seed/import-guichet.ts"
plink -pw <pwd> deploy@178.16.129.222 "docker cp /opt/dpi-interop/backend/prisma/seed/PINS_referentiel_guichet_esenegal.json pins-api:/app/prisma/seed/PINS_referentiel_guichet_esenegal.json"
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

**Note sur l'échappement** : on enveloppe la commande `plink` dans des **single-quotes PowerShell** (`'...'`) pour préserver les double-quotes du `psql -c "..."` sans `\`` ni autre échappement. Le `%` simple est conservé tel quel — pas de `%%`, qui matcherait littéralement `%%` au lieu d'un wildcard.

```powershell
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -c "SELECT COUNT(*) AS divergences_prod FROM cas_usage_mvp WHERE (code LIKE ''PINS-METIER-%'' AND typologie != ''METIER'') OR (code LIKE ''PINS-TECH-%'' AND typologie != ''TECHNIQUE'');"'
```

Les `''` à l'intérieur sont des single-quotes échappées au sens PowerShell — psql reçoit des single-quotes simples (`'PINS-METIER-%'`), Postgres voit un LIKE valide.

**Résultat attendu** : un entier N. Peut être 0, 409, ou différent. Note la valeur.

Aussi : répartition actuelle :

```powershell
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -c "SELECT typologie, COUNT(*) AS n FROM cas_usage_mvp GROUP BY 1 ORDER BY 1;"'
```

Et état du DEFAULT SQL :

```powershell
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -c "SELECT column_default FROM information_schema.columns WHERE table_name=''cas_usage_mvp'' AND column_name=''typologie'';"'
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

Exécuter en **une transaction unique**, garantie par `psql -1`. Single-quotes PowerShell + double-quotes psql + `''` pour les single-quotes SQL :

```powershell
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -1 -c "ALTER TABLE cas_usage_mvp ALTER COLUMN typologie DROP DEFAULT; UPDATE cas_usage_mvp SET typologie=''METIER'' WHERE code LIKE ''PINS-METIER-%'' AND typologie=''TECHNIQUE'';"'
```

**Résultat attendu** : `ALTER TABLE` puis `UPDATE <N>` où N == valeur mesurée en 5.1.

**Si N retourné ≠ N attendu** : ARRÊTER. La transaction étant atomique et `psql -1` actif, rien n'a été commité. Investiguer pourquoi le compte diverge avant de réessayer.

**Note importante** : on n'ajoute PAS de migration Prisma pour le DROP DEFAULT. Cohérent avec la décision locale — éviter de réveiller le drift Organisation/AMO/ProgrammePrioritaire. Le ALTER est appliqué en direct, et le `schema.prisma` reflète déjà cette absence de défaut côté Prisma.

🛑 **STOP** — me coller la sortie psql complète.

---

## Étape 6 — Déploiement code applicatif via `deploy-prod.sh`

C'est la procédure standard du repo : `deploy-prod.sh` à la racine fait `git pull` + `docker compose -f docker-compose.prod.yml build` (rebuild des images backend + frontend) + recreate `pins-api` / `pins-frontend` + joue `prisma migrate deploy` + health check `wget http://127.0.0.1:3000/health`. Il a `set -e`, donc s'arrête au premier échec.

⚠️ **`docker cp` de `.js` à la main** est explicitement décrit dans CLAUDE.md comme "procédure manuelle utilisée pendant les sessions" — c'est un workaround de hot-fix ponctuel, PAS la procédure standard. On l'évite ici (pas adapté au déploiement complet d'un nouveau module + nouvelles dépendances éventuelles).

### 6.1 Lancement

```powershell
plink -pw <pwd> deploy@178.16.129.222 "cd /opt/dpi-interop && ./deploy-prod.sh 2>&1 | tee /tmp/deploy_$(date +%Y%m%d_%H%M).log"
```

**Résultat attendu** (sortie de `deploy-prod.sh`) :
```
=== 1. Pull latest code ===
<git pull rapporte les commits listés en étape 2>

=== 2. Create .env ===
=== 3. Ensure PostgreSQL ===
pins-db running

=== 4. Network ===
=== 5. Build ===
<docker compose build : peut prendre 2-5 min, normal>
Build OK

=== 6. Backend ===
Waiting for backend...
Backend OK after <N>0s

=== 7. Migrations ===
<no migration to apply si étape 3a déjà jouée ; ou applique liaison_guichet_esenegal si étape 3b>

=== 8. Frontend (HTTPS) ===
=== DEPLOYMENT SUCCESSFUL ===
NAMES            STATUS    PORTS
pins-api         Up ...    3000/tcp
pins-db          Up ...    0.0.0.0:5432->5432/tcp
pins-frontend    Up ...    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 6.2 Cas d'échec documentés

- **`FAIL: git pull`** : modifs locales non commitées (étape 2 aurait dû le détecter). Examiner `git status` avant de relancer.

- **`FAIL: DB not ready`** : `pins-db` ne répond pas à `pg_isready`. Vérifier `docker logs pins-db --tail 30`. Sans DB, rien d'autre ne peut tourner.

- **Build OK mais `FAIL: Backend timeout`** (12 × 10 s = 2 min de tentatives `wget /health`) : `pins-api` plante au démarrage. `docker logs pins-api --tail 50` pour voir l'erreur — typiquement schéma Prisma client pas régénéré, ou variable d'env manquante. NE PAS continuer.

- **`Migration skipped`** (étape 7 du script) : `migrate deploy` a planté. Si étape 3a déjà jouée correctement, c'est normal (no-op). Sinon, jouer le Plan B de l'étape 3 manuellement avant de poursuivre.

- **`FAIL: Frontend`** ou **`FAIL: Not serving`** : nginx ne sert pas. Vérifier `docker logs pins-frontend --tail 30`. Souvent un problème de certificat letsencrypt ou de port déjà occupé.

🛑 **STOP** — me coller :
1. La fin du log (`tail -80 /tmp/deploy_*.log` côté VM)
2. `docker ps --format 'table {{.Names}}\t{{.Status}}'`
3. `docker logs pins-api --tail 30`

Si le script s'est arrêté avant `=== DEPLOYMENT SUCCESSFUL ===`, NE PAS aller à l'étape 7.

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

Procédure standard : **restaurer dans une base de nom différent, vérifier, basculer**. Le `dropdb` sur la base live reste documenté en dernier recours, avec confirmation explicite.

### Rollback DB — voie nominale (restauration via base parallèle)

Quel backup utiliser ? Selon où le problème est apparu :
- entre étape 1 et 5.1 (inclus) : backup 1 (`prod_avant_liaison_guichet_<TS>.sql`)
- entre 5.2 et 7 : backup 2 (`prod_avant_correction_typage_<TS2>.sql`) — préserve les 100 ServiceGuichet, n'annule que la correction typage

Substituer `<BACKUP_FILE>` ci-dessous par le bon chemin.

**R.1 — Créer une base de restauration vide** :
```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db createdb -U dpiuser dpidb_restore"
```

**R.2 — Restaurer le dump dans `dpidb_restore`** (la base live `dpidb` reste intacte) :
```powershell
plink -pw <pwd> deploy@178.16.129.222 "docker exec -i pins-db psql -U dpiuser -d dpidb_restore < <BACKUP_FILE>"
```

**R.3 — Vérifier la cohérence de la restauration AVANT bascule** :
```powershell
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb_restore -c "SELECT COUNT(*) AS cas_usage_mvp FROM cas_usage_mvp; SELECT COUNT(*) AS users FROM users; SELECT COUNT(*) AS institutions FROM institutions;"'
```

Vérifier que les comptes ressemblent à l'état prod attendu (cf. CLAUDE.md : ~554 CU, ~238 institutions, ~86 users). Si quelque chose cloche, NE PAS basculer — me ping.

🛑 **STOP** — me coller les comptes de R.3 avant la bascule.

**R.4 — Bascule par rename** (atomique côté Postgres, nécessite que la base à renommer ne soit pas connectée) :
```powershell
# Couper pins-api pour fermer les connexions à dpidb
plink -pw <pwd> deploy@178.16.129.222 "docker stop pins-api"

# Vérifier qu'aucune session ne reste sur dpidb (sinon ALTER DATABASE plante)
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d postgres -c "SELECT pid, application_name FROM pg_stat_activity WHERE datname=''dpidb'';"'

# Si des connexions résiduelles : les terminer
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=''dpidb'' AND pid <> pg_backend_pid();"'

# Renommer : la base potentiellement corrompue est PRÉSERVÉE sous dpidb_broken_<TS>
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d postgres -c "ALTER DATABASE dpidb RENAME TO dpidb_broken_$(date +%s);"'
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d postgres -c "ALTER DATABASE dpidb_restore RENAME TO dpidb;"'

# Redémarrer pins-api : il se reconnecte à dpidb (nouveau contenu)
plink -pw <pwd> deploy@178.16.129.222 "docker start pins-api"
plink -pw <pwd> deploy@178.16.129.222 "sleep 5 && docker logs --tail 20 pins-api"
```

**R.5 — Sanity check final post-bascule** :
```powershell
plink -pw <pwd> deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -c "SELECT COUNT(*) FROM cas_usage_mvp;"'
plink -pw <pwd> deploy@178.16.129.222 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health"
```

🛑 **STOP** — me coller R.5 et logs `pins-api` après bascule.

**R.6 — Nettoyage (différé, plusieurs jours plus tard)** :
La base `dpidb_broken_<TS>` reste en place tant que tu n'es pas sûr que la prod est stable post-rollback. Une fois validé (plusieurs jours, validation métier) :

```powershell
# ⚠️ DESTRUCTIF. NE PAS JOUER À CHAUD. Confirmation explicite obligatoire.
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db dropdb -U dpiuser dpidb_broken_<TS>"
```

### Rollback DB — dernier recours (drop direct, à éviter)

Si pour une raison X (espace disque, base `dpidb_restore` déjà occupée, etc.) la voie nominale ne peut pas être suivie, le drop direct reste documenté :

```powershell
# ⚠️ DESTRUCTIF IRRÉVERSIBLE. NE PAS JOUER SANS CONFIRMATION EXPLICITE.
plink -pw <pwd> deploy@178.16.129.222 "docker stop pins-api"
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db dropdb -U dpiuser dpidb"
plink -pw <pwd> deploy@178.16.129.222 "docker exec pins-db createdb -U dpiuser dpidb"
plink -pw <pwd> deploy@178.16.129.222 "docker exec -i pins-db psql -U dpiuser -d dpidb < <BACKUP_FILE>"
plink -pw <pwd> deploy@178.16.129.222 "docker start pins-api"
```

Cette voie supprime définitivement la base à problème. Aucune marge d'analyse post-mortem. Utiliser **seulement** si tu n'as pas le choix.

### Rollback code applicatif (étape 6)

Si `deploy-prod.sh` s'est exécuté correctement mais que le nouveau code introduit un bug bloquant :

```powershell
# Revenir au SHA prod constaté en étape 0
plink -pw <pwd> deploy@178.16.129.222 "cd /opt/dpi-interop && git reset --hard <SHA_PROD_ETAPE_0>"
plink -pw <pwd> deploy@178.16.129.222 "cd /opt/dpi-interop && ./deploy-prod.sh"
```

⚠️ `git reset --hard` est destructif pour les modifs locales VM. Vérifier `git status` avant. Confirmation explicite recommandée.

Cas particulier : si la migration `liaison_guichet_esenegal` est restée appliquée alors qu'on revient à du code qui ne la connaît pas, **ça n'est pas grave** — les tables `service_guichet` et `liaison_guichet` existent en plus, ne sont pas référencées par l'ancien code, et n'interfèrent pas. À nettoyer manuellement plus tard via le `rollback.sql` de la migration si tu veux la propreté.

---

## Recommandation : une session ou deux ?

**Recommandation : deux sessions distinctes.**

| | Sprint guichet (étapes 1-4 + 6 + 7 partiel) | Correction typage (étape 5 + 7 final) |
|---|---|---|
| Nature des écritures | additive (nouvelles tables, nouvelles données, nouveau code) | corrective (UPDATE sur 409 lignes existantes) |
| Surface de risque | basse — pas de mutation de données existantes | plus haute — modifie le typage de 409 cas d'usage actifs du catalogue |
| Validation possible avant la suivante ? | oui — exécuter le sprint, laisser tourner quelques heures, observer les KPIs catalogue, vérifier que les routes existantes répondent toujours | dépend du point précédent |
| Si rollback | annule juste le sprint guichet | annule juste la correction typage (backup 2 ≠ backup 1) |

Avantages des deux sessions :
- Le sprint guichet est validé en isolation. Si un bug latent y dort (régression UI, latence d'une nouvelle route, race condition), il ne contamine pas la correction typage.
- Le backup 2 (avant correction typage, fait à la session 2) capture la prod **avec** le sprint guichet déjà appliqué et validé. C'est exactement le bon état à restorer si la correction typage plante.
- La fatigue cognitive est réduite : chaque session a un objectif clair, un STOP final, et une décision binaire (OK / rollback).

Désavantages :
- 2 backups, 2 fenêtres de maintenance, ~30 min de plus en cumulé.
- Si tu as une fenêtre courte unique, tout-en-une est plus pragmatique.

**Si tu choisis tout-en-une fenêtre** : exécuter les étapes 1 → 7 d'affilée. Backup 2 (étape 5.2) reste obligatoire même si le sprint guichet vient juste d'être déployé : il sert pour le rollback partiel typage.

**Si tu choisis deux sessions** :
- Session 1 : étapes 1, 2, 3 (ou 3b), 4, 6, 7.1 + 7.2 + 7.3 (sans toucher au typage). Garder le backup 1 (`prod_avant_liaison_guichet_*.sql`) pour rollback de cette session.
- Session 2 (après quelques heures ou jour suivant) : étape 0 quick check, étape 5 (avec son propre backup 2), étape 7 re-run du contrôle typage. Backup 2 = `prod_avant_correction_typage_*.sql`.

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
