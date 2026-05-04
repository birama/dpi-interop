# N2 — Migration de la nomenclature des cas d'usage

**Référence** : `MCTN/DU/APP-DPI-INTEROP/CONC-2026-06`
(note de cadrage N1, 28 avril 2026, validée Point Focal).
**Statut** : LIVRÉ EN LOCAL le 28 avril 2026 — déploiement prod en
attente de validation visuelle par le Point Focal.

## 1. Contexte

Avant migration, la table `cas_usage_mvp` contenait 59 cas d'usage
répartis sur 7 préfixes incohérents (MVP1-CU, MVP2-CU, HIST, XRN-CU,
UC-GIZ-FIN, PINS-CU, PINS-PROP-DEMO). 10 doublons fonctionnels avaient
été identifiés. La rationalisation est intervenue avant tout
déploiement pilote pour éviter la perpétuation de l'hétérogénéité.

## 2. Nomenclature cible

### 2.1 Format des codes

| Format               | Sémantique                                         | Capacité |
|----------------------|----------------------------------------------------|----------|
| `PINS-TECH-XXXX`     | Service technique d'échange entre administrations  | 9 999    |
| `PINS-METIER-XXX`    | Parcours métier multi-administrations              | 999      |

### 2.2 Lexique des verbes d'échange (titres `PINS-TECH-XXXX`)

| Verbe          | Sémantique                                                          |
|----------------|---------------------------------------------------------------------|
| Consultation   | Lecture d'une donnée détenue par un Tiers, sans modification        |
| Vérification   | Validation d'un statut ou d'une condition auprès d'un Tiers         |
| Notification   | Information envoyée à un Tiers à l'issue d'un événement             |
| Transmission   | Envoi structuré d'un ensemble de données vers un Tiers              |
| Réconciliation | Échange croisé bidirectionnel pour cohérence                        |
| Alimentation   | Mise à jour récurrente d'un référentiel à partir d'un Tiers         |

### 2.3 Champ `codeHistorique`

Ajouté au modèle `CasUsageMVP` par migration Prisma
`20260428170000_n2_code_historique`. Type `String? @db.Text`. Contient
le ou les anciens codes (séparés par virgule en cas de fusion). Permet
la redirection des références externes pendant la phase transitoire.

## 3. Tableau exhaustif des 49 codes finaux

### 3.1 PINS-TECH (42 services techniques)

| Code              | codeHistorique                                  |
|-------------------|-------------------------------------------------|
| PINS-TECH-0001    | MVP1-CU-01                                      |
| PINS-TECH-0002    | MVP1-CU-02, PINS-CU-011, UC-GIZ-FIN-01          |
| PINS-TECH-0003    | XRN-CU-20                                       |
| PINS-TECH-0004    | MVP2-CU-04, UC-GIZ-FIN-05                       |
| PINS-TECH-0005    | MVP2-CU-05                                      |
| PINS-TECH-0006    | MVP2-CU-01, XRN-CU-10, HIST-02                  |
| PINS-TECH-0007    | UC-GIZ-FIN-03                                   |
| PINS-TECH-0008    | UC-GIZ-FIN-02                                   |
| PINS-TECH-0009    | PINS-CU-008                                     |
| PINS-TECH-0010    | HIST-01                                         |
| PINS-TECH-0011    | HIST-04                                         |
| PINS-TECH-0012    | HIST-05, XRN-CU-14                              |
| PINS-TECH-0013    | HIST-06                                         |
| PINS-TECH-0014    | HIST-07                                         |
| PINS-TECH-0015    | HIST-08                                         |
| PINS-TECH-0016    | HIST-09                                         |
| PINS-TECH-0017    | HIST-10                                         |
| PINS-TECH-0018    | HIST-11, XRN-CU-05                              |
| PINS-TECH-0019    | HIST-12                                         |
| PINS-TECH-0020    | HIST-03, XRN-CU-16                              |
| PINS-TECH-0021    | XRN-CU-08                                       |
| PINS-TECH-0022    | XRN-CU-13                                       |
| PINS-TECH-0023    | XRN-CU-06                                       |
| PINS-TECH-0024    | XRN-CU-07                                       |
| PINS-TECH-0025    | XRN-CU-09                                       |
| PINS-TECH-0026    | XRN-CU-15                                       |
| PINS-TECH-0027    | XRN-CU-17                                       |
| PINS-TECH-0028    | XRN-CU-18                                       |
| PINS-TECH-0029    | XRN-CU-19                                       |
| PINS-TECH-0030    | MVP2-CU-02, XRN-CU-11                           |
| PINS-TECH-0031    | MVP2-CU-03, XRN-CU-12                           |
| PINS-TECH-0032    | MVP2-CU-06                                      |
| PINS-TECH-0033    | MVP2-CU-07                                      |
| PINS-TECH-0034    | UC-GIZ-FIN-04                                   |
| PINS-TECH-0035    | UC-GIZ-FIN-06                                   |
| PINS-TECH-0036    | UC-GIZ-FIN-07                                   |
| PINS-TECH-0037    | UC-GIZ-FIN-08                                   |
| PINS-TECH-0038    | PINS-CU-012                                     |
| PINS-TECH-0039    | PINS-CU-019                                     |
| PINS-TECH-0040    | PINS-PROP-DEMO-05                               |
| PINS-TECH-0041    | PINS-PROP-DEMO-09                               |
| PINS-TECH-0042    | PINS-PROP-DEMO-10                               |

### 3.2 PINS-METIER (7 parcours métier)

| Code              | codeHistorique         | statutVueSection |
|-------------------|------------------------|------------------|
| PINS-METIER-001   | PINS-PROP-DEMO-01      | DECLARE          |
| PINS-METIER-002   | PINS-PROP-DEMO-02      | PROPOSE          |
| PINS-METIER-003   | PINS-PROP-DEMO-03      | PROPOSE          |
| PINS-METIER-004   | PINS-PROP-DEMO-04      | PROPOSE          |
| PINS-METIER-005   | PINS-PROP-DEMO-06      | PROPOSE          |
| PINS-METIER-006   | PINS-PROP-DEMO-07      | PROPOSE          |
| PINS-METIER-007   | PINS-PROP-DEMO-08      | PROPOSE          |

`PINS-METIER-001` (Création d'entreprise APIX) est en `DECLARE` car
c'est un cas en service réel (sortie du catalogue P8). Les 6 autres
parcours métier restent dans le catalogue P8 en `PROPOSE`.

## 4. Procédure de déploiement prod

À exécuter UNIQUEMENT après validation visuelle du Point Focal sur
l'environnement local et confirmation explicite.

### 4.1 Préparation

```bash
# Sur la machine locale, transférer les artefacts vers la prod
scp backups/n2_lot4_renommages.sql deploy@178.16.129.222:/tmp/
scp backups/n2_lot5_fusions.sql deploy@178.16.129.222:/tmp/
scp backups/n2_lot6_propdemo.sql deploy@178.16.129.222:/tmp/
scp backups/n2_lot7_verifs.sql deploy@178.16.129.222:/tmp/
```

### 4.2 Sauvegarde prod obligatoire

```bash
ssh deploy@178.16.129.222
TS=$(date +%Y%m%d_%H%M)
docker exec pins-db pg_dump -U pins -d questionnaire_interop > /opt/dpi-interop/backups/pre_n2_prod_${TS}.sql
ls -lh /opt/dpi-interop/backups/pre_n2_prod_*.sql
```

Le dump doit faire au moins 100 Ko. Vérifier la fraîcheur de la date.

### 4.3 Application de la migration Prisma

```bash
cd /opt/dpi-interop/questionnaire-interop/backend
git pull
npx prisma migrate deploy
# Doit appliquer 20260428170000_n2_code_historique
```

### 4.4 Diagnostic préalable côté prod

L'état réel de la prod peut différer du local (autres cas créés par
des institutions, absence des PROP-DEMO, etc.). Avant d'exécuter les
SQL de migration, dérouler le diagnostic du Lot 3 (compter par
préfixe) et adapter la matrice si nécessaire avant exécution.

### 4.5 Application séquentielle des SQL

```bash
docker cp /tmp/n2_lot4_renommages.sql pins-db:/tmp/
docker cp /tmp/n2_lot5_fusions.sql pins-db:/tmp/
docker cp /tmp/n2_lot6_propdemo.sql pins-db:/tmp/
docker cp /tmp/n2_lot7_verifs.sql pins-db:/tmp/

docker exec pins-db psql -U pins -d questionnaire_interop -f /tmp/n2_lot4_renommages.sql
docker exec pins-db psql -U pins -d questionnaire_interop -f /tmp/n2_lot5_fusions.sql
docker exec pins-db psql -U pins -d questionnaire_interop -f /tmp/n2_lot6_propdemo.sql
docker exec pins-db psql -U pins -d questionnaire_interop -f /tmp/n2_lot7_verifs.sql
```

Chaque lot est encadré par `BEGIN/COMMIT`. En cas d'erreur dans un lot,
ROLLBACK automatique. Lire l'output du Lot 7 : tous les checks doivent
afficher 0 anomalie.

### 4.6 Validation visuelle prod

Ouvrir l'interface admin :
- `/admin/qualification` : la liste des cas affiche les nouveaux codes
- `/admin/roadmap` : les cartes Kanban portent les codes PINS-TECH-XXXX
- `/admin/cockpit` : KPI à jour (49 cas)

## 5. Plan de rollback

Si validation prod échoue ou si comportement aberrant détecté :

```bash
# 1. Couper l'app pendant le rollback
docker stop pins-api pins-frontend

# 2. Restaurer le dump pre-migration
TS=<timestamp_du_dump>
docker exec -i pins-db psql -U pins -d questionnaire_interop < /opt/dpi-interop/backups/pre_n2_prod_${TS}.sql

# 3. Revertir la migration Prisma (la colonne codeHistorique est inoffensive,
#    on peut la laisser ; sinon ALTER TABLE cas_usage_mvp DROP COLUMN "codeHistorique";)

# 4. Relancer l'app
docker start pins-api pins-frontend
```

Le rollback est complet : 59 cas restaurés avec leurs anciens codes,
toutes les liaisons (stakeholders, registres, financements, status
history) reconstituées par le dump.

## 6. Communication aux partenaires

Une note de communication doit accompagner le déploiement prod, à
destination de :
- **JICA / Accenture** : impacts sur les codes MVP1-CU et MVP2-CU
- **GIZ** : impacts sur les codes UC-GIZ-FIN
- **Administrations engagées** : nouveau code de leurs cas d'usage

Cette communication est rédigée par la Delivery Unit en parallèle de
la phase technique. La table de correspondance ancienne → nouvelle
nomenclature est dans la section 3 ci-dessus.

## 7. Suite — Prompt N3

Après validation prod, le prompt N3 (à venir) ajoutera deux parcours
métier prioritaires et leurs cinq services techniques associés pour
les démonstrations pilotes, en suivant la nomenclature de la
section 2.
