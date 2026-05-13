# NOTE TECHNIQUE

## Articulation Manifestation d'Intérêt → Financement dans PINS

---

**Référence** : MCTN/DU/NT-PINS-PTF-2026-01
**Auteur** : Birama DIOP, Point Focal National d'Interopérabilité, MCTN / SENUM SA
**Date** : 13 mai 2026
**Classification** : Note technique interne
**Documents liés** : MCTN/DU/NCS-PINS-PTF-2026-01 v0.3 (Note de cadrage stratégique)

---

## 1. Objet

Cette note précise l'articulation entre la nouvelle entité `ManifestationInteret` introduite par le module Partenaires Techniques et Financiers (PTF) de PINS et l'entité `Financement` préexistante en production. Elle constitue un complément technique à la note de cadrage stratégique v0.3 et engage les prompts de développement PTF-02, PTF-04 et PTF-05.

Le module PTF, tel que cadré, introduit un workflow amont de manifestation d'intérêt côté partenaire (`DRAFT → EN_VALIDATION → PUBLIE`). En parallèle, PINS dispose déjà d'un workflow aval de cycle de vie de financement géré par la Delivery Unit (`Identifié → Demandé → En négociation → Accordé → En cours → Clôturé / Refusé`). Ces deux workflows sont **complémentaires et non concurrents** : le premier instruit l'engagement provisoire d'un partenaire, le second porte le suivi opérationnel de l'engagement effectif.

## 2. Modèle de données

La relation entre les deux entités est portée par une clé étrangère **côté `Financement`**, nullable, qui pointe vers la manifestation d'origine éventuelle :

```prisma
model Financement {
  // ... champs existants
  manifestationOrigineId String?
  manifestationOrigine   ManifestationInteret? @relation(...)
}

model ManifestationInteret {
  // ... champs existants
  financementsGeneres   Financement[]  // relation inverse
}
```

Ce sens est retenu pour trois raisons : (i) un Financement peut exister sans manifestation préalable (workflow direct DU pour les engagements pré-existants, déjà présents en production) ; (ii) une manifestation de type `INTERET` ne génère par nature jamais de financement ; (iii) la chronologie place la manifestation avant le financement.

## 3. Transition Manifestation → Financement

> **TODO Prompt PTF-04** — À l'exécution de la route `PATCH /api/admin/manifestations/:id/validate`, lorsque la manifestation est de type `FINANCEMENT`, proposer à l'administrateur en option la création simultanée d'un `Financement` en statut `Identifié`, lié à la manifestation via `manifestationOrigineId`. Le formulaire de validation pré-remplit le Financement à partir des champs de la manifestation : `montantEstime`, `devise`, `instrumentFinancier`, `ptfId`, `casUsageId`. La création reste optionnelle ; la simple publication sans conversion est acceptée pour les manifestations exploratoires ou nécessitant un délai d'arbitrage.

## 4. Filtre du portefeuille partenaire

La note v0.3 mentionne le filtre « cas en `PRIORISE` et `aFinancer` ». Ce filtre est insuffisant car la valeur `PRIORISE` existe dans deux énumérations distinctes : `statutVueSection` (gouvernance Delivery Unit) et `statutImpl` (réalité d'implémentation technique). Le filtre cible précis pour le portefeuille partenaire est :

```typescript
where: {
  statutVueSection: 'PRIORISE',                              // arbitrage DU acquis
  statutImpl: { in: ['IDENTIFIE', 'PRIORISE', 'EN_PREPARATION'] },  // pas encore réalisé
  aFinancer: true,                                            // besoin de financement signalé
  domaine: { in: domainesInteretPartenaire },                // alignement thématique
}
```

> **TODO Prompts PTF-04 et PTF-05** — Substituer ce filtre cible au filtre simplifié dans toutes les requêtes du portefeuille partenaire et de la Vue 360° partenaire.

## 5. Enrichissement Vue 360° partenaire — Expertise

L'entité `Expertise` existante rattache des experts à un `Programme`, lui-même rattaché à un `Ptf`. Cette structure permet d'enrichir la Vue 360° partenaire d'une section « Vos experts actuellement mobilisés sur ce cas » :

```typescript
where: {
  programme: { ptfId: currentUser.ptfId },
  actif: true,
  // jointure avec le cas d'usage via les financements du programme
}
```

> **TODO Prompt PTF-05** — Ajouter cette section conditionnelle dans la Vue 360° partenaire (`/partenaire/cas/:id`). Affichage masqué si aucun expert n'est mobilisé pour ce partenaire sur ce cas.

## 6. Chiffre-clé associé

Sur les 76 cas d'usage actuellement enregistrés en production, **59 sont orphelins** (sans financement actif ou avec uniquement des financements refusés), soit **77,6 % du portefeuille national**. Cette population constitue la base directe de candidats à recevoir des manifestations d'intérêt partenaire dès l'ouverture du module PTF.

## 7. Engagement sur les versions

Cette note technique n'altère pas le contenu stratégique de la note de cadrage v0.3 transmise à la Direction de la Delivery Unit. Elle précise des points d'implémentation et constitue la référence opérationnelle pour les développements à conduire entre le 20 mai et le 30 juin 2026.

Toute évolution ultérieure de l'articulation Manifestation – Financement fera l'objet d'une révision de cette note avant modification du code en production.

---

*Note technique produite par Birama DIOP, le 13 mai 2026, en complément de la note de cadrage MCTN/DU/NCS-PINS-PTF-2026-01 v0.3.*
