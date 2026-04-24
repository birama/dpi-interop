# Workflow d'adoption d'une proposition

> Référence : livraison P8 du 25/04/2026

## Deux chemins selon l'institution

### Chemin A — Institution **pressentie** : adoption directe atomique

L'institution figure dans `institutionsPressenties` de la proposition.

1. Clic sur `Adopter` → modale `AdoptionModal`
2. Sélection des pressenties à inclure (décochables, sauf l'institution de l'utilisateur elle-même qui devient INITIATEUR)
3. Cochage obligatoire "Je confirme l'engagement institutionnel"
4. Soumission → appel `POST /api/catalogue/propositions/:id/adopter` (atomique) :
   - Statut `PROPOSE → DECLARE`
   - Renumérotation `PINS-PROP-NNN → PINS-CU-NNN` (ancien conservé dans `ancienCode`)
   - Création `UseCaseStakeholder INITIATEUR` pour l'institution adoptante
   - Création des stakeholders FOURNISSEUR/CONSOMMATEUR depuis les pressenties retenues
   - Ouverture des consultations SLA 15 jours pour chaque FOURNISSEUR/CONSOMMATEUR
   - Notifications `CONSULTATION_OUVERTE` aux stakeholders
   - Transition `DECLARE → EN_CONSULTATION` si au moins un FOURNISSEUR/CONSOMMATEUR
   - Trace inaltérable `PROPOSE → DECLARE` avec motif d'adoption
   - Notification `TRANSITION` aux admins DU
5. Redirection vers la fiche CU créée

### Chemin B — Institution **non pressentie** : adoption motivée

1. Clic sur `Signaler notre intérêt` → modale
2. Warning ambré : "Votre institution n'est pas pressentie, validation DU requise"
3. **Motif d'adoption obligatoire ≥ 50 caractères**
4. Cochage engagement
5. Soumission → création d'un `AdoptionRequest` en statut `EN_ATTENTE`, notification aux admins DU
6. **La proposition reste en statut `PROPOSE`** jusqu'à validation explicite DU
7. Admin ouvre `/api/catalogue/adoption-requests`, valide ou refuse (motif obligatoire ≥ 50 car)
8. Validation → exécute le même workflow atomique que le chemin A
9. Refus → notification à l'institution demandeuse avec motif

## Principe contradictoire

- Refus explicite de l'adoption : motivé, notifié à l'institution demandeuse
- Éviction après adoption (chantier P7) : motivée 50+ car, anti-réinscription sauf validation DU

## Codes HTTP

| Code | Cas |
|---|---|
| 201 | Adoption directe réussie (pressentie) |
| 202 | Demande d'adoption enregistrée, en attente validation DU |
| 400 | Confirmation engagement manquante, motif insuffisant |
| 403 | institutionInitiatriceId ne correspond pas à l'utilisateur connecté |
| 409 | Demande d'adoption déjà en cours pour cette institution / proposition plus active |

## État `AdoptionRequest`

```prisma
model AdoptionRequest {
  casUsageId               String
  institutionDemandeuseId  String
  userDemandeurId          String
  motif                    String                // min 50 car applicatif
  status                   AdoptionRequestStatus @default(EN_ATTENTE)
  ajustements              Json?                 // pressenties incluses, etc.
  dateDemande              DateTime              @default(now())
  dateTraitement           DateTime?
  userValideurId           String?
  motifTraitement          String?               // motif refus si refusee
}

enum AdoptionRequestStatus {
  EN_ATTENTE
  VALIDEE
  REFUSEE
}
```

## Rôles pressentis vs rôles effectifs

Mapping automatique à l'adoption :

| RolePressenti | UseCaseRole créé |
|---|---|
| INITIATEUR_PRESSENTI | INITIATEUR (pour l'institution adoptante) |
| FOURNISSEUR_PRESSENTI | FOURNISSEUR |
| CONSOMMATEUR_PRESSENTI | CONSOMMATEUR |
| PARTIE_PRENANTE_PRESSENTIE | PARTIE_PRENANTE |
