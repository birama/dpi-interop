# PROCÉDURE D'INJECTION SEED PINS v4

**Référence** : MCTN/DU/PROC-SEED-PINS-2026
**Date** : 15 mai 2026

---

## 📦 Volumétrie cible après injection

```
ÉTAT ACTUEL PROD                    →   APRÈS INJECTION SEED v4
─────────────────────────────────       ──────────────────────────────────
76 cas (dont 3 PRIORISE)                 ~484 cas total
                                         ├─ 76 existants prod (intacts)
                                         ├─ 65 cas v2 cadrage (PROPOSE)
                                         ├─ 53 cas techniques v2 (PROPOSE)
                                         └─ 343 cas e-senegal (PROPOSE)
                                         
                                         + 51 institutions vérifiées
                                         + 24 registres nationaux
                                         + 132 relations métier↔tech
```

## 🚨 PRÉ-REQUIS OBLIGATOIRES

```
✅ ptf-phase2 mergé et déployé en prod (enum Domaine 14 valeurs présent)
✅ Schema Prisma à jour avec colonnes : domaine, aFinancer
✅ Backup prod à jour (LANCER UN BACKUP MAINTENANT)
✅ Node.js, Prisma installés sur le serveur prod
```

## 📋 ÉTAPES — Vendredi 15 mai 2026

### Étape 1 — Backup prod (3 min)

```bash
TS=$(date +%Y%m%d_%H%M)
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_avant_seed_v4_${TS}.sql
ls -lh /home/deploy/backups/prod_avant_seed_v4_${TS}.sql
"
```

⚠️ Conserver le chemin du backup. Cible du rollback si problème.

### Étape 2 — Transfert fichiers sur le serveur (5 min)

```bash
# Depuis ton poste local
scp -P 22 PINS_Seed_v4_EXHAUSTIF.xlsx deploy@178.16.129.222:/opt/dpi-interop/scripts/
scp inject-seed-v4.cjs deploy@178.16.129.222:/opt/dpi-interop/scripts/

# Ou si tu travailles déjà dans le repo, push GitHub puis pull serveur
```

### Étape 3 — Installation dépendance Excel (1 min)

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-api npm install xlsx --no-save
"
```

### Étape 4 — DRY-RUN obligatoire (5 min)

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-api node /opt/dpi-interop/scripts/inject-seed-v4.cjs \
  --file /opt/dpi-interop/scripts/PINS_Seed_v4_EXHAUSTIF.xlsx \
  --dry-run
"
```

**Vérifications attendues dans le rapport** :
```json
{
  "institutions": { "existantes": ~30+, "creees": ~20- },
  "cas_metier":  { "existants": 0, "crees": ~408, "erreurs": [] },
  "cas_technique": { "existants": 0, "crees": ~53, "erreurs": [] },
  "relations":   { "creees": ~132, "ignorees": 0 }
}
```

🚨 **STOP** si erreurs > 5 ou si "ignorees" anormalement haut. Investiguer avant commit.

### Étape 5 — Validation par Birama (10 min)

Avant le COMMIT, ouvre le rapport dry-run et confirme :

```
[ ] Nombre d'institutions à créer cohérent (vérifier que les institutions 
    déjà en prod sont bien reconnues — sinon doublons)
[ ] Aucune erreur sur les cas métier
[ ] Domaines enum tous valides (pas de valeur "TRANSVERSAL" trop élevée)
[ ] Mapping bien construit
```

### Étape 6 — COMMIT (3 min)

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-api node /opt/dpi-interop/scripts/inject-seed-v4.cjs \
  --file /opt/dpi-interop/scripts/PINS_Seed_v4_EXHAUSTIF.xlsx \
  --commit 2>&1 | tee /tmp/seed_v4_log.txt
"
```

### Étape 7 — Vérifications post-injection (5 min)

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -c "
-- Total cas
SELECT \"statutVueSection\", COUNT(*) FROM cas_usage_mvp 
GROUP BY \"statutVueSection\" ORDER BY COUNT(*) DESC;

-- Cas par domaine
SELECT domaine, COUNT(*) FROM cas_usage_mvp 
WHERE domaine IS NOT NULL GROUP BY domaine ORDER BY COUNT(*) DESC;

-- Cas par source
SELECT \"sourceProposition\", COUNT(*) FROM cas_usage_mvp 
GROUP BY \"sourceProposition\" ORDER BY COUNT(*) DESC;

-- Institutions
SELECT COUNT(*) AS nb_institutions FROM institutions;
"'
```

**Cibles attendues** :
- ~484 cas total
- ~408 PROPOSE
- ~76 statuts hérités (DECLARE, PRIORISE, etc.)
- Tous les 14 domaines enum représentés

### Étape 8 — Backup post-injection (sécurité)

```bash
TS=$(date +%Y%m%d_%H%M)
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_apres_seed_v4_${TS}.sql
"
```

## 🔙 ROLLBACK D'URGENCE

Si quelque chose tourne mal après le commit :

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec -i pins-db psql -U dpiuser -d dpidb < /home/deploy/backups/prod_avant_seed_v4_XXXX.sql
"
```

Le rollback restaure l'état pré-injection (76 cas) en quelques minutes.

## 📊 MISE À JOUR NARRATIF ATELIER

Après injection réussie, mettre à jour le chiffre-clé dans :
- Synthèse 2 pages PTF
- PowerPoint atelier
- Mail DIABY (si pas encore envoyé)

**Nouveau chiffre-clé** :
> « Le portefeuille national PINS couvre désormais **484 cas d'usage**, dont 408 candidats à structuration provenant du guichet unique e-senegal.sn (78% du périmètre national digitalisable). »

## ⚠️ POINTS D'ATTENTION

1. **Statut PROPOSE par défaut** : tous les nouveaux cas arrivent en PROPOSE. La DU les traitera via les 4 actions admin (qualifier / demander complément / rejeter / prioriser).

2. **Maturité ESQUISSE** pour les 343 nouveaux e-senegal : c'est volontaire. La DU enrichira progressivement.

3. **Relations métier↔technique** : 132 relations injectées (celles de v2). Pour les 343 nouveaux cas e-senegal, les relations seront ajoutées progressivement.

4. **Domaine TRANSVERSAL** sur ~17 cas non catégorisés automatiquement : la DU affinera lors de la qualification.

5. **Le script est IDEMPOTENT** : si tu le re-lances, il ne crée pas de doublon (UPSERT par code).

## ⏱️ Durée totale estimée

```
Backup                3 min
Transfert             5 min
Install npm           1 min
Dry-run               5 min
Validation Birama    10 min
Commit                3 min
Vérifications         5 min
Backup post-inj       3 min
                    ─────
Total                35 min
```

🎯 **Plan d'attaque pour cet après-midi.**
