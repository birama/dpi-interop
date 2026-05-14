# Journal des déploiements PINS

## DEPLOY-03 — Promotion cas démo atelier (2026-05-14)

- 9 cas promus en PRIORISE + aFinancer=true (6 métier + 3 technique)
- Couverture domaines passée de 4 à 11 (sur 14 enum)
- Codes renommés selon convention P8 : PINS-PROP-MET-* → PINS-METIER-008 à 013, PINS-PROP-TECH-* → PINS-TECH-0055 à 0057
- `codeHistorique` préservé pour traçabilité
- Backups : `prod_avant_deploy03_20260514_1730.sql` / `prod_apres_deploy03_20260514_1731.sql`

## DEPLOY-02 + RENAME — Seed v4 EXHAUSTIF (2026-05-14)

- 408 cas métier (PINS-PROP-MET-*) + 53 cas techniques (PINS-PROP-TECH-*) injectés en PROPOSE
- 25 nouvelles institutions (placeholders responsable*) + 24 registres nationaux
- 132 relations métier↔technique
- 12 cas legacy PINS-CU-* adoptés renommés en PINS-TECH-0043 à 0054
- Backups : `prod_avant_seed_v4_*.sql` / `prod_apres_seed_v4_*.sql` / `prod_avant_rename_*.sql` / `prod_apres_rename_*.sql`

## DEPLOY-01 — Merges PTF Phase 1+2 + pré-atelier (2026-05-14)

- Branche `main` enrichie : `ptf-phase1` (RBAC role BAILLEUR + ptfId + CGU) + `ptf-phase2` (modèle PTF complet)
- Rotation password admin (ancien révoqué, nouveau communiqué via canal sécurisé)
- Mapping 67/76 cas vers enum Domaine (14 valeurs)
- 6 cas démo promus en PRIORISE + aFinancer (PINS-TECH-0004/0014/0015/0021/0022/0029) — contournement bug `prioriser-rapide` via UPDATE SQL direct
- Backups : `prod_avant_merges_ptf_*.sql` / `prod_post_merges_ptf_*.sql`

## Atelier stratégique — 19 mai 2026

- Lieu : Bâtiment Administratif
- Participants : Présidence, Primature, MCTN, PTF (BM, GIZ, JICA, Gates)
- État cible : 537 cas, 18 PRIORISE/11 domaines, module PTF annoncé pour fin juin
- Code freeze : lundi 18 mai 17h00
