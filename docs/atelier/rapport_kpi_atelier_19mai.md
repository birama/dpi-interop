# Rapport KPI — Atelier stratégique 19 mai 2026

Référence : MCTN/DU/RAPPORT-PINS-ATELIER-2026-05-19 · Données extraites le 15/05/2026 15h56

## Vue exécutive

**PINS (Plateforme Nationale d'Interopérabilité du Sénégal)** est opérationnelle. La plateforme centralise les questionnaires d'interopérabilité de 238 institutions, héberge un portefeuille de 537 cas d'usage métier et techniques, et structure la gouvernance via 11 domaines stratégiques alignés sur le DPI.

À cette date, **18 cas sont priorisés pour financement** (`aFinancer=true`), répartis sur **11 des 14 domaines** de la nomenclature nationale. La plateforme est prête à accueillir les manifestations d'intérêt des PTF dès la livraison du module dédié fin juin 2026.

## Compteurs globaux

| Métrique | Valeur |
|---|---|
| **Cas d'usage total** | **537** |
| Cas d'usage métier (`PINS-METIER-*` + `PINS-PROP-MET-*`) | 415+ |
| Cas d'usage techniques (`PINS-TECH-*` + `PINS-PROP-TECH-*`) | 110+ |
| **Institutions référencées** | **238** |
| **Registres nationaux** | **34** |
| **Relations métier ↔ technique** | **137** |
| Utilisateurs actifs | 87 |

## Pipeline de qualification (statutVueSection)

| Statut | Cas | Description |
|---|---|---|
| `PROPOSE` | 503 | Catalogue des propositions (candidat à adoption) |
| `DECLARE` | 7 | Institution s'engage formellement |
| `EN_CONSULTATION` | 8 | Consultation inter-institutions en cours |
| **`PRIORISE`** | **18** | Cas adoptés et priorisés pour financement |
| `EN_PRODUCTION_360` | 1 | Cas opérationnel en production |
| **Total** | **537** | |

## Couverture par domaine

| Domaine | Cas | % portefeuille |
|---|---|---|
| FINANCES_PUBLIQUES | 113 | 21,0% |
| SERVICES_CITOYENS | 102 | 19,0% |
| JUSTICE_ETAT_CIVIL | 67 | 12,5% |
| IDENTITE_NUMERIQUE | 53 | 9,9% |
| PROTECTION_SOCIALE | 47 | 8,8% |
| CLIMAT_AFFAIRES | 39 | 7,3% |
| TRANSVERSAL | 36 | 6,7% |
| FONCIER_CADASTRE | 30 | 5,6% |
| EDUCATION | 20 | 3,7% |
| SANTE_NUMERIQUE | 10 | 1,9% |
| EMPLOI_FORMATION | 6 | 1,1% |
| CYBERSECURITE | 5 | 0,9% |
| (non renseigné) | 9 | 1,7% |
| **Total** | **537** | |

**Domaines absents** : `GOUVERNANCE_DONNEES`, `AGRICULTURE_NUMERIQUE` — à enrichir lors des prochains ateliers métier.

## Panel démo prioritaire — 18 cas PRIORISE + aFinancer

11 domaines couverts (cf. annexe CSV `annexe_priorises_atelier_19mai.csv` pour détail complet).

| Domaine | Nb | Codes |
|---|---|---|
| FINANCES_PUBLIQUES | 5 | PINS-TECH-0002, 0004, 0014, 0015, 0056 |
| CLIMAT_AFFAIRES | 2 | PINS-METIER-001, PINS-TECH-0021 |
| PROTECTION_SOCIALE | 2 | PINS-TECH-0001, 0022 |
| IDENTITE_NUMERIQUE | 2 | PINS-METIER-013, PINS-TECH-0057 |
| SANTE_NUMERIQUE | 1 | PINS-METIER-009 (CMU) |
| EDUCATION | 1 | PINS-METIER-010 (CAMPUSEN) |
| JUSTICE_ETAT_CIVIL | 1 | PINS-METIER-008 (Casier B3) |
| FONCIER_CADASTRE | 1 | PINS-METIER-012 (Titre foncier) |
| EMPLOI_FORMATION | 1 | PINS-METIER-011 (ANPEJ) |
| SERVICES_CITOYENS | 1 | PINS-TECH-0029 (Fichier électoral) |
| TRANSVERSAL | 1 | PINS-TECH-0055 (Acte naissance) |

## Écosystème PTF et financement

| Métrique | Valeur |
|---|---|
| Partenaires Techniques et Financiers référencés | 5 (BM, GIZ, JICA, GATES, ETAT-SN) |
| Financements identifiés / en cours | 17 |
| Conventions signées | 3 |

**Module PTF Phase 1+2 déployé** (RBAC role `BAILLEUR`, schéma data complet) :
- Enum `Domaine` (14 valeurs) + colonne `cas_usage_mvp.domaine`
- Colonne `cas_usage_mvp.aFinancer` (filtre portefeuille éligible)
- Tables `bailleur_domaine_interet`, `manifestation_interet`, `journal_audit_ptf`
- FK `Financement.manifestationOrigineId` (articulation Manif → Fin)

**UI PTF complète** : livraison fin juin 2026 (PTF-03 à PTF-06).

## Plateforme — état technique

| Item | État |
|---|---|
| Production | https://dpi-interop.senum.sn |
| Stack | Fastify 4 + Prisma 5.22 + PostgreSQL 15 / React 18 + Vite + Tailwind + shadcn/ui |
| Authentification | JWT (access 2h + refresh 7j) + bcrypt |
| RBAC | 3 rôles : ADMIN, INSTITUTION, BAILLEUR |
| Vue lecture questionnaire | **Livrée 15/05/2026 (P10-MVP)** — synthèse exécutive sur `/questionnaire/:id` |
| Documents techniques | 18 building blocks DPI / 4 couches |

## Roadmap post-atelier (mai-juin 2026)

| Chantier | Effort | Livraison cible |
|---|---|---|
| **P10 — Vue lecture complète** (correction admin champ-par-champ + audit + notif) | 1 semaine | fin mai |
| **PTF-03 à PTF-06** — UI module PTF (catalogue partenaire, manifestation, propositions, audit) | 2-3 semaines | fin juin |
| **Fix bug `prioriser-rapide`** (préservation code lors adoption) | 0,5 j | sprint mai |
| **Cleanup placeholders** (25 institutions, 9 cas domaine NULL, 24 registres TRANSVERSAL) | 1-2 j | sprint mai |
| **Enrichissement domaines** GOUVERNANCE_DONNEES, AGRICULTURE_NUMERIQUE | ateliers métier | juin |

## Méthodologie

Le portefeuille de 537 cas résulte de la consolidation :
- **65 cas v2** issus du cadrage initial (notes P8/P9 + connaissance des démarches administratives sénégalaises)
- **343 cas e-senegal** issus du scraping officiel de e-senegal.sn (401 démarches scrapées, dédoublonnées, catégorisées)
- **53 cas techniques** de référence (services socles : authentification, signature, paiement, notification)
- **76 cas historiques** issus des phases antérieures (MVP1, MVP2, X-Road, propositions DEMO)

Tous injectés via processus idempotent (UPSERT par code) avec validation humaine en deux phases (dry-run + commit).

## Backups encadrants

- `prod_avant_seed_v4_20260514_1643.sql` — état pré-injection seed v4
- `prod_apres_seed_v4_20260514_1650.sql` — état post-injection
- `prod_avant_rename_20260514_1718.sql` — pré-rename PINS-CU-* legacy
- `prod_apres_rename_20260514_1720.sql` — post-rename
- `prod_avant_deploy03_20260514_1730.sql` — pré-promotion 9 cas démo
- `prod_apres_deploy03_20260514_1731.sql` — état actuel (panel démo final)
- `prod_avant_p10mvp_20260515_1515.sql` — pré-déploiement vue lecture

## Annexes

- `annexe_priorises_atelier_19mai.csv` — détail des 18 cas PRIORISE (code, titre, domaine, institution cheffe, base légale)
- CHANGELOG.md — historique des déploiements DEPLOY-01 → DEPLOY-03 + P10-MVP
- `docs/conception/P10-MVP-VueLecture.md` — design vue lecture questionnaire
- `docs/Articulation_Manifestation_Financement.md` — note technique liaison Manif → Financement
