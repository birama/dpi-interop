# Typologie des cas d'usage — distinction METIER / TECHNIQUE

> Référence : livraison P9 du 25/04/2026

## Pourquoi deux typologies ?

L'expérience a montré que deux niveaux d'abstraction sont nécessaires pour piloter l'interopérabilité nationale :

- **Un parcours MÉTIER** rend un service à un bénéficiaire final (citoyen, entreprise). Il coordonne plusieurs administrations et mobilise plusieurs services techniques. *Exemples : création d'entreprise en ligne, attribution d'une bourse universitaire, demande de passeport.*

- **Un service TECHNIQUE** est un échange de données bilatéral entre deux systèmes, porté par le détenteur de la donnée. Il est réutilisable par plusieurs parcours métier. *Exemples : consultation RCCM, vérification NINEA, affiliation CSS.*

La relation est **N-N** : un parcours métier peut mobiliser plusieurs services techniques ; un service technique peut servir plusieurs parcours métier.

## Impact sur le pilotage

Cette distinction permet de mesurer la **mutualisation réelle** du patrimoine d'interopérabilité : un service technique consommé par 5 parcours métier est 5× plus rentable qu'un service bilatéral isolé. Le dashboard DU `/du/arbitrage` affiche ce taux de mutualisation (bloc *Mutualisation des services techniques*).

La **criticité** d'un service technique est automatiquement calculée à partir du nombre de consommateurs métier :

| Nombre de parcours servis | Criticité | Badge |
|---|---|---|
| 1 | Usage spécifique | Gris |
| 2 à 4 | Service mutualisé | Teal |
| 5 à 9 | Service critique | Ambre |
| 10+ | Hyper-critique | Rouge |

## Champs Prisma

```prisma
model CasUsageMVP {
  typologie               TypologieCasUsage   @default(TECHNIQUE)
  reclassementsTypologie  Json?               // Historique append-only
  conventionLieeId        String?             // Service technique -> convention
  relationsMetier         RelationCasUsage[]  @relation("RelationMetier")
  relationsTechnique      RelationCasUsage[]  @relation("RelationTechnique")
}

enum TypologieCasUsage {
  METIER
  TECHNIQUE
}

model RelationCasUsage {
  casUsageMetierId    String   // contrainte : typologie=METIER (cote applicatif)
  casUsageTechniqueId String   // contrainte : typologie=TECHNIQUE (cote applicatif)
  ordre               Int?     // position dans le parcours si sequence
  obligatoire         Boolean  @default(true)
  commentaire         String?
  createdBy           String   // FK user
}
```

## Choix à la création

Le formulaire `Déclarer un nouveau cas d'usage` (3 étapes) commence par demander la typologie :

1. **Étape 1** : choix typologique (2 cartes cliquables avec helper pédagogique)
2. **Étape 2** : détection de doublons (appel `/catalogue/suggestions` avec typologie pour filtrer)
3. **Étape 3** : formulaire adapté :
   - **METIER** : champs communs + `casUsagesTechniquesMobilises` (multi-select des techniques du pipeline)
   - **TECHNIQUE** : champs communs + `conventionLieeId` (select optionnel vers une convention existante)

## Reclassement par la DU

La DU peut reclasser un cas d'usage via le bouton discret "Reclasser" dans l'en-tête de la fiche (visible admin seulement).

- Appel `PATCH /api/use-cases/:id/typologie` avec motif obligatoire ≥ 50 caractères
- Append-only dans `reclassementsTypologie` JSON :
  ```json
  [
    { "from": "TECHNIQUE", "to": "METIER", "motif": "...", "auteurUserId": "...", "date": "2026-04-25T..." }
  ]
  ```
- Notification envoyée à l'institution initiatrice

## Migration du stock

Tous les cas d'usage historiques ont été migrés par défaut en **TYPOLOGIE = TECHNIQUE** (migration `20260425110000_p8p9_migration_stock`). La Delivery Unit doit procéder à la requalification manuelle au fil de l'eau pour identifier les parcours métier.

> Voir [`migration-stock-p8p9.md`](migration-stock-p8p9.md) pour le rapport de migration.
