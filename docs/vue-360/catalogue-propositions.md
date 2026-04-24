# Catalogue des propositions — guide utilisateur

> Référence : livraison P8 du 25/04/2026 — commits `490371d → 0aa3912`

## Pourquoi un catalogue ?

Le catalogue des propositions regroupe les cas d'usage **identifiés par la Delivery Unit** (via atelier de cadrage, étude SENUM, recommandation d'une autorité, cadrage stratégique ou proposition institutionnelle) **mais pas encore adoptés par une administration**.

Un cas d'usage en catalogue :

- est **public pour toute institution PINS connectée** (visibilité METADATA)
- ne consomme pas de SLA, pas de consultation automatique, pas d'échéance
- devient un cas d'usage actif du pipeline **dès qu'une institution l'adopte**

## Accéder au catalogue

**Sidebar → Mon espace → Catalogue des propositions** (`/catalogue-propositions`).

Page paginée (12 cartes par page) avec :

- **Recherche** sur titre, code, résumé (debounce 400ms)
- **Tabs typologie** : Toutes / Parcours métier / Services techniques
- **Filtre maturité** : Esquisse, Pré-cadrée, Prête à adopter
- **Cartes** avec badges typologie (navy métier / teal technique), maturité (gris/ambre/vert), source, pressenties, registres

## Bouton "Adopter" vs "Voir détails"

- **Adopter** (teal, visible si votre institution figure dans les pressenties) : ouvre la modale d'adoption directe
- **Voir détails** (gris, toute institution non pressentie) : ouvre la fiche détail, avec un bouton "Signaler notre intérêt" qui déclenche l'adoption motivée nécessitant validation DU

## Structure d'une proposition

| Champ | Description | Visibilité |
|---|---|---|
| `code` | `PINS-PROP-NNN` (rename en `PINS-CU-NNN` à l'adoption) | Tous |
| `titre`, `resumeMetier`, `baseLegale` | Description métier | Tous |
| `typologie` | METIER ou TECHNIQUE | Tous |
| `sourceProposition` | ATELIER_CADRAGE, ETUDE_SENUM, RECOMMANDATION, CADRAGE_STRATEGIQUE, PROPOSITION_INSTITUTIONNELLE | Tous |
| `sourceDetail` | Précisions sur l'origine | **DU + institutions pressenties uniquement** |
| `niveauMaturite` | ESQUISSE, PRE_CADREE, PRETE_A_ADOPTER | Tous |
| `institutionsPressenties` | Institutions identifiées par la DU comme potentielles parties prenantes, avec rôle pressenti | Tous |
| `registresAssocies` | Référentiels nationaux touchés | Tous |

## Endpoints API

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/catalogue/propositions` | Toute institution |
| GET | `/api/catalogue/propositions/:id` | Toute institution |
| POST | `/api/catalogue/propositions` | DU / SENUM_ADMIN |
| PATCH | `/api/catalogue/propositions/:id` | DU / SENUM_ADMIN |
| POST | `/api/catalogue/propositions/:id/archive` | DU (motif ≥ 50 car) |
| POST | `/api/catalogue/propositions/:id/fusionner` | DU (motif ≥ 50 car, cibleId) |
| POST | `/api/catalogue/propositions/:id/adopter` | Toute institution (workflow diffère selon pressentie) |
| GET | `/api/catalogue/adoption-requests` | DU |
| POST | `/api/catalogue/adoption-requests/:id/valider` | DU |
| POST | `/api/catalogue/adoption-requests/:id/refuser` | DU (motif ≥ 50 car) |
| POST | `/api/catalogue/suggestions` | Toute institution |

## Règle de numérotation

- Création en catalogue : `PINS-PROP-NNN` (séquentiel dédié)
- Adoption effective : renumérotation en `PINS-CU-NNN` (séquentiel pipeline actif), conservation de l'ancien code dans `ancienCode` pour traçabilité

## États possibles (enum UseCaseStatus)

- **PROPOSE** : en catalogue, adoptable
- **DECLARE → EN_CONSULTATION → … → EN_PRODUCTION_360** : pipeline actif après adoption
- **ARCHIVE** : rejeté par la DU (motif ≥ 50 car, désarchivable via transition ARCHIVE → PROPOSE)
- **FUSIONNE** : fusionné avec un autre cas d'usage (pointeur `fusionneVersId` vers la cible)

Voir aussi : [`adoption-proposition.md`](adoption-proposition.md), [`typologie-cas-usage.md`](typologie-cas-usage.md).
