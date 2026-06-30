# P14-CONC — Accompagnement AMO des cas d'usage

**Date** : 2026-06-02
**Auteur** : Birama Diop (DSI MCTN/SENUM SA)
**Sprint** : P14

## Contexte

Accenture accompagne le MCTN sur la roadmap V0 d'interopérabilité (rôle PARTENAIRE_TECHNIQUE). Besoin de suivre la maturité des cas d'usage accompagnés avec jalons, score et commentaires.

## Modèle de données

3 nouvelles tables :
- `accompagnement_amo` : N-N Organisation ↔ CasUsageMVP avec type, statut, score maturité (1-5), dates
- `jalon_accompagnement` : 1-N enfant de l'accompagnement, jalons trimestriels avec type/statut
- `commentaire_amo` : 1-N enfant de l'accompagnement, 3 visibilités (DU_ET_AMO, DU_ONLY, AMO_ONLY)

5 nouveaux enums : TypeAccompagnement, StatutAccompagnement, TypeJalon, StatutJalon, VisibiliteCommentaire

## Routes API

ADMIN (`/api/admin/accompagnements`) :
- CRUD complet accompagnements + jalons
- 8 endpoints

AMO (`/api/partenaire-tech/accompagnements`) :
- Consultation (scope organisation)
- CRUD commentaires (scope organisation + user)
- 5 endpoints

## RBAC

- AMO lit ses propres accompagnements (filtre par `organisationId`)
- AMO ne peut pas voir les accompagnements d'une autre organisation (403)
- AMO ne peut pas créer de commentaire DU_ONLY (400)
- AMO ne peut modifier/supprimer que ses propres commentaires (403)
- AMO ne peut pas modifier le score de maturité (403)

## Tests critiques

| # | Test | Résultat |
|---|------|----------|
| 3 | AMO d'org X ne voit pas accompagnement org Y | 403 ✓ |
| 6 | AMO bloqué sur visibilité DU_ONLY | 400 ✓ |
| 14 | AMO ne voit pas commentaires DU_ONLY | Filtré backend ✓ |
| 20 | /admin/utilisateurs non régressé | OK ✓ |

## Évolutions futures (P15)

- Workflow de validation des accompagnements
- Notifications DU/AMO
- Exports (PDF, CSV)
- Dashboard AMO enrichi
