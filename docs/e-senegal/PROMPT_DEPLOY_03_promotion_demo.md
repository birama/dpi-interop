# PROMPT DEPLOY-03 — PROMOTION CAS DÉMO ATELIER

## Promotion 9 cas en PRIORISE pour diversifier la couverture domaines

---

## CONTEXTE

DEPLOY-01 + DEPLOY-02 terminés. État prod actuel :
- 537 cas total dont 9 PRIORISE répartis sur 4 domaines (FINANCES, CLIMAT, PROTECTION, CITOYENS)
- Pour l'atelier du 19 mai, on veut représenter **plus de domaines** dans la démo

Objectif : promouvoir **9 cas supplémentaires** (6 métier + 3 technique) pour atteindre :
- 18 cas PRIORISE
- 10 domaines représentés (sur 14)
- aFinancer=true sur tous

## CONNEXION

```
SSH        : ssh deploy@178.16.129.222 (P@ssw0rd) via plink -pw
Container  : pins-db / dpiuser / dpidb
```

## MISSION

### PHASE A — VÉRIFICATION PRÉ (5 min)

Vérifier l'état actuel et la disponibilité des codes cibles :

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb -c "
-- État actuel PRIORISE
SELECT code, titre, domaine, \"aFinancer\" 
FROM cas_usage_mvp 
WHERE \"statutVueSection\" = '"'"'PRIORISE'"'"' 
ORDER BY domaine, code;

-- Vérifier disponibilité des 9 codes cibles
SELECT code, titre, domaine, \"statutVueSection\", \"adopteParInstitutionId\" IS NOT NULL AS a_inst
FROM cas_usage_mvp 
WHERE code IN (
  '"'"'PINS-PROP-MET-044'"'"','"'"'PINS-PROP-MET-065'"'"','"'"'PINS-PROP-MET-042'"'"',
  '"'"'PINS-PROP-MET-046'"'"','"'"'PINS-PROP-MET-050'"'"','"'"'PINS-PROP-MET-061'"'"',
  '"'"'PINS-PROP-TECH-130'"'"','"'"'PINS-PROP-TECH-040'"'"','"'"'PINS-PROP-TECH-110'"'"'
)
ORDER BY code;"'
```

⚠️ **STOP si** :
- Un code n'existe pas (codes ajustés par Cowork pendant le scraping ?)
- Un cas n'a pas `adopteParInstitutionId` (besoin d'institution cheffe pour PRIORISE)

→ Si écart : me rapporter et je propose des codes alternatifs.

### PHASE B — BACKUP (2 min)

```bash
TS=$(date +%Y%m%d_%H%M)
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_avant_deploy03_${TS}.sql
ls -lh /home/deploy/backups/prod_avant_deploy03_${TS}.sql
"
```

### PHASE C — PROMOTION (5 min)

⚠️ **Stratégie** : on contourne le bug `prioriser-rapide` en faisant un UPDATE SQL direct qui :
1. Transitionne le statut à PRIORISE
2. Active aFinancer = true
3. Renomme le code provisoire PINS-PROP-* → définitif PINS-METIER-* / PINS-TECH-*

```bash
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 'docker exec pins-db psql -U dpiuser -d dpidb' <<'SQL'
BEGIN;

-- ==========================================================
-- 6 cas MÉTIER → PRIORISE + aFinancer + renommage
-- ==========================================================

-- Calcul du prochain numéro PINS-METIER-NNN
WITH next_metier AS (
  SELECT COALESCE(MAX(CAST(substring(code from 'PINS-METIER-(\d+)') AS INTEGER)), 0) AS m
  FROM cas_usage_mvp WHERE code LIKE 'PINS-METIER-%'
),
cas_a_promouvoir AS (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) AS rn
  FROM cas_usage_mvp 
  WHERE code IN (
    'PINS-PROP-MET-042','PINS-PROP-MET-044','PINS-PROP-MET-046',
    'PINS-PROP-MET-050','PINS-PROP-MET-061','PINS-PROP-MET-065'
  )
)
UPDATE cas_usage_mvp c
SET 
  code = 'PINS-METIER-' || lpad(((SELECT m FROM next_metier) + p.rn)::text, 3, '0'),
  "statutVueSection" = 'PRIORISE',
  "aFinancer" = true,
  "updatedAt" = NOW()
FROM cas_a_promouvoir p
WHERE c.id = p.id;

-- ==========================================================
-- 3 cas TECHNIQUE → PRIORISE + aFinancer + renommage
-- ==========================================================

WITH next_tech AS (
  SELECT COALESCE(MAX(CAST(substring(code from 'PINS-TECH-(\d+)') AS INTEGER)), 0) AS m
  FROM cas_usage_mvp WHERE code LIKE 'PINS-TECH-%'
),
cas_a_promouvoir AS (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) AS rn
  FROM cas_usage_mvp 
  WHERE code IN (
    'PINS-PROP-TECH-040','PINS-PROP-TECH-110','PINS-PROP-TECH-130'
  )
)
UPDATE cas_usage_mvp c
SET 
  code = 'PINS-TECH-' || lpad(((SELECT m FROM next_tech) + p.rn)::text, 4, '0'),
  "statutVueSection" = 'PRIORISE',
  "aFinancer" = true,
  "updatedAt" = NOW()
FROM cas_a_promouvoir p
WHERE c.id = p.id;

-- ==========================================================
-- VÉRIFICATIONS
-- ==========================================================

-- Compteur final PRIORISE
SELECT 'PRIORISE_TOTAL' AS m, COUNT(*) AS v FROM cas_usage_mvp 
WHERE "statutVueSection" = 'PRIORISE';

-- Liste détaillée PRIORISE + aFinancer
SELECT code, titre, domaine, "aFinancer", "statutVueSection"
FROM cas_usage_mvp 
WHERE "statutVueSection" = 'PRIORISE'
ORDER BY domaine, code;

-- Nombre de domaines couverts
SELECT COUNT(DISTINCT domaine) AS nb_domaines_priorises
FROM cas_usage_mvp 
WHERE "statutVueSection" = 'PRIORISE' AND domaine IS NOT NULL;

COMMIT;
SQL
```

### PHASE D — VALIDATION (5 min)

#### Étape D.1 — Compteurs cibles

```
Cible    │  Valeur attendue
─────────┼──────────────────
PRIORISE │  18 (9 anciens + 9 nouveaux)
aFinancer│  18 (tous PRIORISE)
Domaines │  10 distincts couverts
```

#### Étape D.2 — Validation visuelle UI

1. Login admin
2. Naviguer vers `/catalogue/cas-usage?statut=PRIORISE`
3. Vérifier que les 18 cas s'affichent
4. Ouvrir 2-3 nouveaux cas en Vue 360° pour s'assurer du rendu
5. Vérifier la diversité des domaines

#### Étape D.3 — Backup post

```bash
TS=$(date +%Y%m%d_%H%M)
echo y | "C:/Program Files/PuTTY/plink" -pw P@ssw0rd deploy@178.16.129.222 "
docker exec pins-db pg_dump -U dpiuser -d dpidb > /home/deploy/backups/prod_apres_deploy03_${TS}.sql
ls -lh /home/deploy/backups/prod_apres_deploy03_${TS}.sql
"
```

### PHASE E — GIT (3 min)

```bash
cd "F:/Moi/MCTEN/Interco/DPI-INTEROP/questionnaire-interop/"
# Pas de code modifié — juste une note de version dans le journal
echo "## DEPLOY-03 — Promotion cas démo atelier ($(date +%Y-%m-%d))" >> CHANGELOG.md
echo "- 9 cas promus en PRIORISE + aFinancer (6 métier + 3 technique)" >> CHANGELOG.md
echo "- Couverture domaines passée de 4 à 10" >> CHANGELOG.md
echo "- Backup pre: prod_avant_deploy03_*.sql / post: prod_apres_deploy03_*.sql" >> CHANGELOG.md
git add CHANGELOG.md
git commit -m "feat(deploy-03): promotion 9 cas demo en PRIORISE - 10 domaines couverts"
git push origin main
```

## LIVRABLE

Rapport synthétique :

1. **Vérification pré** : 9 codes cibles trouvés OUI / NON, liste écarts
2. **Backup pré** : chemin + taille
3. **Promotion exécutée** : 
   - Cas métier : 6 (PINS-PROP-MET-042/044/046/050/061/065 → PINS-METIER-XXX)
   - Cas tech : 3 (PINS-PROP-TECH-040/110/130 → PINS-TECH-XXXX)
4. **Compteurs finaux** :
   - PRIORISE : XX (cible 18)
   - aFinancer : XX (cible 18)
   - Domaines couverts : XX (cible 10)
5. **Validation UI** : OK / KO sur 2-3 cas testés
6. **Backup post** : chemin
7. **Git** : commit hash
8. **Anomalies** : liste

## CONTRAINTES STRICTES

✅ **AUTORISÉ**
- UPDATE statut + code + aFinancer sur les 9 cas listés exactement
- Tout dans une seule transaction
- Renommage codes selon convention P8

❌ **INTERDIT**
- AUCUN UPDATE sur d'autres cas
- AUCUN changement de domaine
- AUCUNE modification du schéma
- AUCUN passage à EN_PRODUCTION_360 ou autre statut

## DURÉE ESTIMÉE

**20 minutes total**

## EN CAS DE PROBLÈME

### Un code cible n'existe pas (numérotation différente après scraping)

→ STOP, me rapporter les codes existants pour le domaine concerné
→ Je propose un code alternatif

### Un cas n'a pas d'institution cheffe (adopteParInstitutionId NULL)

→ STOP, je propose une institution à rattacher d'abord, puis on relance

### Un cas est déjà en PRIORISE

→ Skip silencieux (l'idempotence du SQL le gère)

### Transaction qui échoue

→ ROLLBACK automatique
→ Restaurer depuis backup pre si état corrompu

## SUITE

Après DEPLOY-03 :
- Tableau de bord enrichi : 18 cas PRIORISE / 10 domaines
- Narratif atelier : "78% du périmètre national représenté, 91% orphelins, 18 cas prioritaires diversifiés"
- Préparation supports atelier (PowerPoint, note 2 pages PTF)
- Code freeze maintenu pour lundi 18 mai 17h
