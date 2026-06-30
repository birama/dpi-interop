# ANNEXE — CAS IMMÉDIAT DÉMARRABLE : SOCIUM ↔ SENTAX

## Pilote d'interopérabilité intra-DGID pour amorcer la mise en œuvre de PINS

---

**Référence** : MCTN/DU/ANNEXE-SOCIUM-SENTAX-2026-01
**Version** : 1.0
**Date** : 21 mai 2026
**Auteur** : Birama DIOP, Point Focal National d'Interopérabilité
**Cadre** : Annexe à la cartographie GIZ Finances v0.2

---

## 1. POURQUOI CE CAS

Lors des échanges des 19 et 20 mai 2026 avec les équipes GIZ, un cas immédiat démarrable a été identifié au sein du périmètre fiscal : **l'interopérabilité entre SOCIUM (outil de gestion RH de la DGID, déjà déployé) et SENTAX (futur système d'information fiscal de la DGID, en conception)**.

Ce cas présente trois caractéristiques qui en font une opportunité particulière :

- **Démarrable immédiatement** : les deux administrations productrice et consommatrice relèvent de la même direction (DGID), ce qui élimine les blocages de gouvernance inter-administration habituels.
- **Vitrine d'interopérabilité early** : SENTAX étant en phase de conception, l'intégration native via PINS dès la conception est possible (plutôt que de l'ajouter après coup, comme c'est souvent le cas).
- **Quick win démontrable** : la valeur ajoutée est visible et mesurable dans un délai court, ce qui en fait un bon premier livrable concret pour les partenaires (GIZ, MFB, équipes DGID).

## 2. PÉRIMÈTRE FONCTIONNEL

### 2.1 Acteurs et flux

```
   SOCIUM                              SENTAX
   (Producteur)         PINS / X-Road  (Consommateur)
   ┌────────────┐       ┌──────────┐   ┌────────────┐
   │ Référentiel│──────►│ Service  │──►│ Module     │
   │ agents     │       │ technique│   │ habilitation│
   │ DGID       │       │ X-Road   │   │ et audit   │
   └────────────┘       └──────────┘   └────────────┘
```

### 2.2 Données échangées

Le service expose à SENTAX le référentiel des agents de la DGID, avec les attributs suivants :

| Attribut | Type | Usage |
|---|---|---|
| Matricule agent | String | Identifiant pivot (équivalent NIN agent) |
| Nom et prénoms | String | Affichage interface SENTAX |
| Statut administratif | Enum | ACTIF / SUSPENDU / DETACHE / RETRAITE |
| Affectation | String | Code du service / centre d'imposition |
| Grade / fonction | String | Niveau hiérarchique |
| Date d'entrée en fonction | Date | Pour audit trail |
| Date de fin de fonction | Date | Si applicable |

### 2.3 Modalités d'échange

- **Type d'échange** : Synchrone sur requête (lookup unitaire par matricule) + asynchrone (différentiel quotidien des évolutions)
- **Volumétrie** : ~2 500 agents DGID (faible volume, gestion facile)
- **Fréquence** : quotidienne pour le delta, à la demande pour le lookup

## 3. VALEUR AJOUTÉE

### 3.1 Pour la DGID (utilisateur direct)

- Élimination de la double saisie entre SOCIUM (paie/RH) et SENTAX (habilitations)
- Cohérence garantie du référentiel agents entre les deux SI
- Auditabilité fine de qui a fait quoi dans SENTAX, avec mise à jour automatique si un agent change d'affectation ou quitte la direction

### 3.2 Pour PINS (vitrine institutionnelle)

- Démonstration concrète d'un échange interopérable en production sur un cas limité et contrôlé
- Argumentaire pour étendre la pratique à d'autres administrations sectorielles
- Premier service SENTAX exposé via X-Road, facilitant l'intégration des futurs services SENTAX dans la cartographie GIZ Finances (UC-1, UC-3, UC-4 du document principal)

### 3.3 Pour la GIZ (partenaire bailleur)

- Cas pilote contrôlé permettant d'observer rapidement les premiers résultats de l'investissement interopérabilité
- Validation du modèle technique X-Road avant le déploiement sur les cas plus complexes (Doing Business, Cycle BAE)
- Référence reproductible pour les autres administrations sectorielles

## 4. INSCRIPTION DANS L'ÉCOSYSTÈME

### 4.1 Articulation avec la cartographie GIZ Finances v0.2

Ce cas n'est pas listé dans les 8 UC métier principaux (UC-1 à UC-8) car il porte sur une interopérabilité intra-administration (DGID) et non inter-administrations. Il fonctionne comme un **pré-requis facilitateur** qui prépare le terrain pour l'intégration des futurs services SENTAX dans la cartographie principale.

Notamment, les services techniques PINS-TECH-2002 (Impots.GetDeclarationsFiscales), PINS-TECH-2003 (Impots.GetContribuablesCGE), PINS-TECH-2008a/b/c (Impots.GetAttestationImposition et conformité) seront tous exposés depuis SENTAX. L'amorçage par le cas SOCIUM↔SENTAX permet à l'équipe SENTAX de monter en compétence X-Road sur un cas simple avant d'attaquer les services majeurs.

### 4.2 Articulation avec le PRES

Ce pilote contribue indirectement à la mobilisation des ressources domestiques prévue par le Plan de Redressement Économique et Social, en consolidant les fondations techniques nécessaires aux futurs services fiscaux d'interopérabilité (UC-1, UC-3, UC-6 du document principal).

## 5. CHIFFRAGE ET CALENDRIER

### 5.1 Effort estimé

| Poste | Effort | Coût indicatif |
|---|---|---|
| Spécifications fonctionnelles | 2 JH | 1 050 € |
| Développement service SOCIUM (exposition) | 5 JH | 2 625 € |
| Adaptation SENTAX (consommation) | 3 JH | 1 575 € (couvert par la conception SENTAX) |
| Configuration X-Road (Security Server SOCIUM) | inclus dans l'infrastructure générale | — |
| Recette et mise en production | 2 JH | 1 050 € |
| **Total effort GIZ-éligible** | **9 JH** | **~4 725 €** |

À ce coût peuvent s'ajouter selon les choix institutionnels :
- la mise à disposition d'un Security Server X-Road pour la DGID si non déjà partagé avec les autres services DGID (sinon mutualisation)
- une provision pour les ajustements liés à la conception SENTAX en cours

### 5.2 Calendrier indicatif

| Étape | Délai (semaines) |
|---|---|
| Spécifications partagées SOCIUM-SENTAX | T+2 |
| Développement service SOCIUM | T+5 |
| Recette technique | T+6 |
| Mise en production pilote | T+8 |

Soit une mise en service possible **dans les 2 mois** suivant la décision de lancement.

### 5.3 Articulation budgétaire avec la demande GIZ principale

Le coût de ce pilote (~4 725 €) peut être :
- **Soit inclus dans le budget de la cartographie principale** (ligne dédiée dans l'enveloppe Phase 1)
- **Soit financé sur une ligne distincte** comme cas pilote anticipateur

À arbitrer en revue.

## 6. PRÉ-REQUIS ET DÉPENDANCES

### 6.1 Pré-requis institutionnels

- Validation par la Direction Générale de la DGID
- Accord SOCIUM (équipe propriétaire) pour l'exposition d'un service
- Inclusion dans la conception SENTAX (à ce stade en cours)

### 6.2 Pré-requis techniques

- Security Server X-Road déployé pour la DGID (ou mutualisé avec un Security Server existant)
- Conventions techniques basiques (schéma des données, code retour, gestion d'erreurs)
- Référentiel pivot agents harmonisé (matricule comme clé)

### 6.3 Dépendances

- Avancement de la conception SENTAX (le timing dépend du calendrier SENTAX)
- Capacité de mobilisation des équipes DGID (SOCIUM + projet SENTAX)

## 7. PROPOSITION

Inclure ce pilote dans le périmètre de la coopération GIZ comme **premier cas démarrable**, indépendamment de l'avancement des 8 UC métier principaux. Sa simplicité institutionnelle (intra-DGID) permet de poser des résultats concrets dans un délai court, ce qui crée de la valeur pour tous les acteurs :

- La DGID obtient une amélioration opérationnelle directe
- La GIZ peut documenter rapidement les premiers résultats
- PINS dispose d'une vitrine concrète pour étendre la pratique
- L'équipe SENTAX monte en compétence X-Road sur un cas simple

---

*Document produit par Birama DIOP, Point Focal National d'Interopérabilité, MCTN / SENUM SA, le 21 mai 2026. Sans valeur d'engagement avant validation institutionnelle.*
