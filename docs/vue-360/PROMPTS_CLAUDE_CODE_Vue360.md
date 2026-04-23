# Prompts Claude Code — Implémentation Vue 360° des cas d'usage PINS

**Projet :** `questionnaire-interop` (DPI-INTEROP)
**Racine locale :** `F:\Moi\MCTN\Interco\DPI-INTEROP\questionnaire-interop`
**Stack :** Fastify 4 + TypeScript + Prisma + React 18 + TailwindCSS + shadcn/ui
**Base :** PostgreSQL (Docker) — app server `192.168.40.128`
**Référence documentaire :**
- `docs/vue-360/Vue_360_UseCases_Conception_Fonctionnelle_v1_0.docx` (conception v1.0)
- `docs/vue-360/Addendum_Vue360_Registres_v1_1.docx` (addendum v1.1)
- `docs/vue-360/schema.prisma.new` (modèles Vue 360°)
- `docs/vue-360/schema_registre_extension.prisma` (modèle CasUsageRegistre)
- `docs/vue-360/migration.sql` (migration principale)
- `docs/vue-360/migration_registre.sql` (migration addendum)
- `docs/vue-360/mockup_dashboard_v1_1.html` (maquette visuelle de référence)

---

## Étape préalable (à faire une seule fois, sans Claude Code)

Copier les 6 fichiers de référence livrés dans le dossier `docs/vue-360/` du projet, puis lancer Claude Code à la racine :

```bash
cd F:\Moi\MCTN\Interco\DPI-INTEROP\questionnaire-interop
mkdir -p docs/vue-360
# copier les 6 fichiers livrés dans docs/vue-360/
claude
```

---

## PROMPT 0 — Onboarding du repo

**Objectif :** permettre à Claude Code de cartographier le codebase existant avant toute modification.

**Critères d'acceptation :** Claude Code rend un résumé qui liste le schéma Prisma actuel (modèles, relations), la structure des routes Fastify, les composants React clés du dashboard, et la convention de nommage utilisée.

```
Tu es chargé d'implémenter la Vue 360° des cas d'usage PINS sur l'application DPI-INTEROP.

Avant toute modification, procède à une reconnaissance complète du repo :

1. Lis docs/vue-360/Vue_360_UseCases_Conception_Fonctionnelle_v1_0.docx et
   docs/vue-360/Addendum_Vue360_Registres_v1_1.docx pour comprendre la cible.
   Si les .docx ne sont pas lisibles en direct, utilise `pandoc` ou extract-text
   pour les convertir en markdown et lis le markdown.

2. Inventorie l'existant :
   - prisma/schema.prisma : liste tous les modèles actuels, en signalant
     particulièrement CasUsageMVP, FluxInstitution, Institution, User,
     RegistreNational. Note les noms exacts de leurs colonnes clés.
   - src/routes (ou équivalent) : liste les routes Fastify, regroupées
     par domaine fonctionnel.
   - src/plugins ou src/middlewares : identifie le middleware d'authentification
     et le schéma de session utilisateur (champs user.roles, user.institutionId).
   - web/src/pages/Dashboard (ou équivalent) : identifie le composant du
     dashboard sectoriel actuel — celui qui affiche les blocs
     "Données que je consomme" et "Données que je fournis".

3. Ne touche à AUCUN fichier lors de cette étape.

4. Produis un rapport en markdown avec :
   - Arborescence simplifiée du repo (2 niveaux)
   - Liste des modèles Prisma avec leurs champs clés (pas tous, seulement
     ceux cités en point 2)
   - Liste des fichiers que tu comptes modifier ou créer à chaque phase
     P1 → P5 de la roadmap du document de conception (section 6)
   - Convention de nommage observée (PascalCase, camelCase, snake_case)
     pour : modèles Prisma, tables SQL, routes API, composants React
   - Questions bloquantes éventuelles

Attends mon feu vert avant d'enchaîner.
```

---

## PROMPT 1 — Phase P1 : Migration du schéma Prisma

**Objectif :** ajouter les 6 nouveaux modèles (5 de la Vue 360° + `CasUsageRegistre` de l'addendum) et exécuter la migration.

**Pré-requis :** Prompt 0 validé, base PostgreSQL accessible.

**Critères d'acceptation :** `npx prisma migrate dev` se termine sans erreur ; `npx prisma studio` montre les nouvelles tables ; aucune table existante n'a perdu de colonne ou de contrainte.

```
Phase P1 — Migration du schéma Prisma pour la Vue 360°.

Étape 1 : intégrer les nouveaux modèles dans prisma/schema.prisma

Lis les deux fichiers d'extension :
- docs/vue-360/schema.prisma.new           (modèles Vue 360°)
- docs/vue-360/schema_registre_extension.prisma (modèle CasUsageRegistre)

Ajoute à prisma/schema.prisma :
- Les 5 énumérations de la Vue 360° (UseCaseRole, UseCaseStatus, FeedbackType,
  ConsultationStatus, VisibilityLevel)
- L'énumération RegistreUsageMode
- Les 5 modèles Vue 360° (UseCaseStakeholder, UseCaseConsultation,
  UseCaseFeedback, UseCaseStatusHistory, Notification)
- Le modèle CasUsageRegistre

Ajoute les relations inverses aux modèles existants SANS modifier leurs autres
champs :
- CasUsageMVP : stakeholders, statusHistory, registresAssocies,
  statutVueSection (UseCaseStatus, default DECLARE)
- Institution : stakeholders, notifications
- User : stakeholdersAjoutes, consultationsOuvertes, feedbacksAuteur,
  statusHistoryAuteur, notifications, registresUsageAjoutes
- RegistreNational : casUsagesAssocies

IMPORTANT :
- Ne modifie aucun autre champ des modèles existants.
- Respecte la convention de nommage observée au prompt 0.
- Si un champ ou un nom de table diffère de ce que prévoit l'extension,
  adapte l'extension au schéma réel et signale-le-moi clairement.

Étape 2 : générer et appliquer la migration

Exécute :
  npx prisma migrate dev --name vue_360_use_cases_and_registres --create-only

Ouvre la migration générée. Si les CREATE TABLE produits par Prisma diffèrent
sensiblement des migrations de référence (docs/vue-360/migration.sql et
migration_registre.sql) — par exemple absence du trigger d'inaltérabilité
sur use_case_status_history, ou absence de la vue v_couverture_registre —
complète la migration manuellement en ajoutant un fichier SQL additionnel
dans le même dossier de migration :
  prisma/migrations/[timestamp]_vue_360_.../extra.sql

Puis applique la migration :
  npx prisma migrate dev

Étape 3 : vérifications

- npx prisma generate (client régénéré)
- npx prisma studio ouvre et montre les nouvelles tables
- Les tables existantes n'ont pas perdu de contrainte
- Aucun warning Prisma bloquant

Étape 4 : produire un rapport

Résume :
- Les modifications apportées à prisma/schema.prisma (diff conceptuel)
- La migration générée (nom du dossier)
- Les éventuelles adaptations faites et pourquoi
- Les tests qui restent à faire (seed, données test)

N'implémente aucune route API à ce stade.
```

---

## PROMPT 2 — Phase P1.5 : Seed de données de test

**Objectif :** disposer d'un jeu de données représentatif pour développer et tester l'UI sans attendre la migration fonctionnelle des données réelles.

**Critères d'acceptation :** un script `prisma/seed-vue360.ts` crée 4 cas d'usage avec stakeholders, consultations, feedbacks et rattachement à des référentiels ; `npx prisma db seed` s'exécute sans erreur et est idempotent.

```
Phase P1.5 — Seed de données de test Vue 360°.

Crée prisma/seed-vue360.ts (TypeScript, exécutable via tsx ou ts-node)
qui peuple la base avec un jeu de données représentatif.

Pré-requis : quelques Institutions et un User admin existent déjà. Si ce
n'est pas le cas, crée-les en amont (idempotence via upsert sur un
identifier stable).

Crée 4 cas d'usage représentant les situations clés du mockup
docs/vue-360/mockup_dashboard_v1_1.html :

1. PINS-CU-008 "Réconciliation fiscale DGID ↔ DGCPT"
   - Initiateur : DGCPT
   - Stakeholders : DGCPT (INITIATEUR), DGID (FOURNISSEUR),
     MFB (CONSOMMATEUR), CDP (PARTIE_PRENANTE)
   - Statut : EN_CONSULTATION
   - Consultations : 1 pour DGID (EN_ATTENTE, échéance J+3),
     1 pour MFB (REPONDU), 1 pour CDP (REPONDU)
   - Feedbacks : 1 VALIDATION de MFB, 1 RESERVE de CDP
     (avec motivation > 50 caractères, datée à J-5)
   - Registres associés : NINEA (CONSOMME), RegistreFiscalDGID (ALIMENTE)

2. PINS-CU-011 "Exposition Douanes.GetDeclarations"
   - Initiateur : DGID (aussi CONSOMMATEUR)
   - Stakeholders : DGID, DGD (FOURNISSEUR), DGCPT (PARTIE_PRENANTE)
   - Statut : EN_PRODUCTION
   - Registres : NINEA (CONSOMME)

3. PINS-CU-012 "Qualification fiscale bénéficiaires RNU"
   - Initiateur : DGPSN
   - Stakeholders : DGPSN, DGID (FOURNISSEUR), ANSD (FOURNISSEUR),
     CDP (PARTIE_PRENANTE)
   - Statut : EN_CONSULTATION
   - Registres : NINEA (CONSOMME), RNU (CONSOMME)

4. PINS-CU-019 "Plateforme anti-fraude inter-administrations"
   - Initiateur : Primature (créer l'institution si absente)
   - Stakeholders : DGID, DGD, MJ (FOURNISSEUR)
   - Statut : EN_CONSULTATION
   - Feedback : 1 REFUS_MOTIVE du MJ (motivation > 50 char,
     sujet casier judiciaire)
   - Registres : Casier judiciaire (CONSOMME)

Pour chaque cas d'usage, crée aussi :
- Au moins 2 entrées UseCaseStatusHistory traçant DECLARE → EN_CONSULTATION
  (et → EN_PRODUCTION pour PINS-CU-011)
- Notification dans la table Notification pour la DGID sur PINS-CU-008
  (type CONSULTATION_OUVERTE, non lue)

Contraintes :
- 100% idempotent : utilise upsert sur des identifiants stables
  (le champ identifiantPINS si présent, sinon un slug à créer dans
  le schéma — à me proposer avant)
- Compatible avec `npx prisma db seed` (déclare le seed dans package.json)
- Tous les champs obligatoires sont remplis, y compris les snapshots
  (auteurNom, auteurInstitution) dans feedbacks et status history

Exécute le seed et vérifie dans Prisma Studio que les 4 cas d'usage
apparaissent avec les bons stakeholders, consultations et feedbacks.
```

---

## PROMPT 3 — Phase P2.1 : API backend — middleware de visibilité et endpoints catalogue

**Objectif :** implémenter le middleware de visibilité (transparence contrôlée) et les endpoints de lecture du catalogue.

**Critères d'acceptation :** un utilisateur DGID (stakeholder de PINS-CU-008) voit les détails ; un utilisateur ANSD (non stakeholder) ne voit que les métadonnées ; un utilisateur DU voit tout ; les tests unitaires passent.

```
Phase P2.1 — Middleware de visibilité et endpoints catalogue Vue 360°.

Lis section 4.3 du document v1.0 (règles de visibilité) et section 5.2
(règles d'autorisation).

1. Crée src/services/useCaseVisibility.ts

Fonction computeVisibility(user, casUsageWithStakeholders) qui retourne
{ level: 'NONE' | 'METADATA' | 'DETAILED' | 'FULL', fields: string[] }.

Règles :
- user.roles contient 'DU' ou 'SENUM_ADMIN'            -> FULL
- user.institutionId présent dans stakeholders actifs  -> DETAILED
- user.institutionId défini et institution connectée
  à PINS (institution.pinsConnecte = true)             -> METADATA
- sinon                                                -> NONE

PUBLIC_METADATA_FIELDS = ['id', 'identifiantPINS', 'titre',
  'resumeMetier', 'baseLegale', 'institutionInitiatriceId',
  'stakeholders.institutionId', 'stakeholders.role', 'statutVueSection',
  'dateCreation', 'dateTransitionCourante']

DETAILED = PUBLIC_METADATA_FIELDS + ['specifications', 'champsEchanges',
  'volumetrie', 'frequence', 'feedbacks', 'consultations',
  'piecesJointes', 'registresAssocies']

FULL = toutes les colonnes + journaux d'audit

2. Crée src/services/useCaseProjection.ts

Fonction projectUseCase(casUsage, visibility) qui retourne un objet
contenant UNIQUEMENT les champs autorisés. Aucune fuite de champ
sensible ne doit être possible.

3. Ajoute les routes Fastify dans src/routes/useCases.ts

- GET /api/use-cases/catalog
  Paginé (limit, cursor), filtres (status[], search). Pour chaque cas
  d'usage, applique la projection selon la visibilité de l'utilisateur
  courant. Un utilisateur METADATA voit uniquement les métadonnées.

- GET /api/use-cases/:id
  Calcule la visibilité. Si NONE, retourne 404 (pas 403, pour ne pas
  révéler l'existence). Sinon, projette et retourne.

4. Tests

Crée tests/useCaseVisibility.test.ts couvrant :
- 4 cas : DU voit FULL, stakeholder voit DETAILED,
  admin PINS non stakeholder voit METADATA, utilisateur non connecté
  voit NONE
- La projection filtre effectivement les champs sensibles
- Un cas d'usage en statut SUSPENDU reste visible pour les stakeholders
  et la DU, et en METADATA pour les autres

Utilise le framework de tests déjà présent dans le repo (à détecter).
Si aucun, utilise vitest.

Exécute les tests et confirme qu'ils passent.
N'implémente PAS encore les endpoints d'écriture (création, transitions,
feedbacks). Ce sera le prompt suivant.
```

---

## PROMPT 4 — Phase P2.2 : API backend — endpoints sectoriels (vue personnelle)

**Objectif :** implémenter les endpoints qui alimentent les 4 blocs du dashboard sectoriel enrichi.

**Critères d'acceptation :** les 4 endpoints retournent des payloads cohérents avec les données de seed ; les tests couvrent les règles de filtrage par rôle.

```
Phase P2.2 — Endpoints sectoriels Vue 360°.

Implémente dans src/routes/useCasesMe.ts les 4 endpoints qui alimentent
les blocs du dashboard sectoriel (section 3.1 du document v1.0) :

1. GET /api/me/use-cases/incoming
   Cas d'usage où mon institution est stakeholder (FOURNISSEUR, CONSOMMATEUR
   ou PARTIE_PRENANTE, pas INITIATEUR) et dont la consultation est
   EN_ATTENTE. Tri par dateEcheance croissante.
   Retourne : [{ casUsage, stakeholder, consultation }]

2. GET /api/me/use-cases/outgoing
   Cas d'usage où mon institution est INITIATEUR. Pour chacun, agrège
   l'état des consultations : nb stakeholders par statut de réponse
   (EN_ATTENTE, REPONDU-VALIDATION, REPONDU-RESERVE, REPONDU-REFUS...).
   Retourne : [{ casUsage, consultationsStats }]

3. GET /api/me/use-cases/involved
   Vue 360° exhaustive : tous les cas d'usage où mon institution apparaît
   comme stakeholder actif, tous rôles et tous statuts confondus.
   Supporte les filtres : role[], status[], partnerInstitutionId, search.
   Paginé.

4. GET /api/me/use-cases/radar
   Cas d'usage où mon institution N'EST PAS stakeholder, mais qui matchent
   mon périmètre. Un cas d'usage matche si :
   (a) il est associé à un RegistreNational sur lequel mon institution
       a déjà au moins un CasUsageRegistre (même registre), OU
   (b) il cite mon institution dans son résumé métier (LIKE simple).
   Pour chaque match, retourne la raison du match ("registre: NINEA",
   "mention textuelle", etc.).

Règles communes :
- user.institutionId est obligatoire (sinon 401)
- Utilise le middleware d'authentification existant
- Respecte les règles de visibilité : chaque cas d'usage retourné
  est projeté selon computeVisibility
- Ajoute une route supplémentaire pour les actions de stakeholding :
  POST /api/use-cases/:id/stakeholders
    body: { institutionId, role, motifAutoSaisine? }
    - autoSaisine = true si institutionId = user.institutionId
      ET user.institutionId n'est pas déjà stakeholder
    - Nécessite POINT_FOCAL ou DIRECTEUR_SI ou DU
    - Réponse : stakeholder créé

Tests :
- tests/useCasesMe.test.ts couvre au moins :
  - endpoint incoming avec DGID : retourne PINS-CU-008 (stakeholder
    FOURNISSEUR) et PINS-CU-012
  - endpoint outgoing avec DGCPT : retourne PINS-CU-008
  - endpoint involved avec DGID : retourne les 3 cas impliqués
  - endpoint radar : un use case sur NINEA déclenche le match pour DGID
  - auto-saisine : ANSD se porte partie prenante sur PINS-CU-014 ;
    vérifier autoSaisine = true
- npm test doit passer vert.

N'implémente PAS encore les endpoints de consultation / feedback /
transition. Prompt suivant.
```

---

## PROMPT 5 — Phase P2.3 : API backend — consultations, feedbacks, transitions, arbitrage DU

**Objectif :** compléter l'API avec les endpoints d'écriture qui font vivre le workflow.

**Critères d'acceptation :** tous les endpoints du tableau §5.1 du document v1.0 sont implémentés ; les règles d'autorisation sont testées ; l'inaltérabilité de `UseCaseStatusHistory` est vérifiée.

```
Phase P2.3 — Endpoints consultations, feedbacks, transitions.

1. POST /api/use-cases
   Création d'un cas d'usage. Body : { titre, resumeMetier, baseLegale,
   registresAssocies[], stakeholders[] }
   - Rôle requis : POINT_FOCAL ou DU
   - À la création, insère automatiquement :
     * UseCaseStakeholder INITIATEUR pour user.institutionId
     * UseCaseStakeholder pour chaque stakeholders[] fourni
     * UseCaseStatusHistory (null → DECLARE) avec snapshots auteur
     * Si registresAssocies[] non vide : CasUsageRegistre pour chacun,
       avec mode (CONSOMME par défaut)

2. POST /api/use-cases/:id/transition
   Body : { statusTo, motif?, pieceJustif? }
   - Vérifier que la transition est légale depuis le statut actuel
     (matrice de transitions : DECLARE -> EN_CONSULTATION -> VALIDATION_CONJOINTE
      -> QUALIFIE -> PRIORISE -> FINANCEMENT_OK -> CONVENTIONNE -> EN_PRODUCTION,
      avec SUSPENDU/RETIRE accessibles depuis la plupart des statuts par DU)
   - Seul DU peut déclencher QUALIFIE, PRIORISE, FINANCEMENT_OK et les
     transitions vers SUSPENDU / RETIRE.
   - L'initiateur peut déclencher DECLARE -> EN_CONSULTATION et
     EN_CONSULTATION -> VALIDATION_CONJOINTE (consultation close).
   - Insère UseCaseStatusHistory avec snapshots auteurNom, auteurInstitution.
   - Met à jour casUsage.statutVueSection.

3. POST /api/consultations/:id/feedback
   Body : { type, motivation, piecesJointes? }
   - Vérifie que user.institutionId = stakeholder.institutionId
   - Contraintes de longueur : motivation >= 50 car pour RESERVE,
     REFUS_MOTIVE, QUESTION (cf. CHECK en base)
   - Snapshots : auteurNom, auteurFonction, auteurInstitutionNom
     depuis la session
   - Met à jour consultation.status = REPONDU
   - Crée Notification pour l'initiateur du cas d'usage

4. PATCH /api/feedback/:id/amend
   Body : { type?, motivation, piecesJointes? }
   - Crée un NOUVEL enregistrement UseCaseFeedback avec amendeDe = id
   - Ne modifie PAS l'enregistrement d'origine

5. POST /api/consultations/:id/relance
   - Incrémente relances, met à jour derniereRelance
   - Rôle requis : INITIATEUR du cas d'usage OU DU
   - Crée Notification pour le stakeholder concerné

6. GET /api/du/arbitrage
   - Rôle requis : DU
   - Retourne { ouverts: n, enRetard: [...], desaccords: [...], kpi: {...} }
   - desaccords = cas d'usage en EN_CONSULTATION ou VALIDATION_CONJOINTE
     avec au moins un feedback de type RESERVE ou REFUS_MOTIVE

7. Trigger PostgreSQL d'inaltérabilité
   Vérifie que le trigger prevent_status_history_modification est
   effectivement installé. Écris un test d'intégration qui tente un
   UPDATE et attend une exception (via prisma.$executeRawUnsafe).

Tests :
- Chaque endpoint d'écriture a au moins 1 test happy path + 1 test
  d'autorisation refusée + 1 test de règle métier (transition illégale,
  motivation trop courte, etc.)
- Test d'inaltérabilité du StatusHistory
- npm test passe vert
```

---

## PROMPT 6 — Phase P2.4 : API — couverture par référentiel (addendum v1.1)

**Objectif :** implémenter les endpoints qui alimentent la vue "Couverture référentiels" et le détecteur de doublons.

**Critères d'acceptation :** les endpoints exploitent la vue SQL `v_couverture_registre` ; le détecteur de doublons fonctionne sur les champs JSON.

```
Phase P2.4 — API Couverture par référentiel (addendum v1.1).

Lis la section 3 du document Addendum_Vue360_Registres_v1_1.docx.

1. GET /api/registres/couverture
   Retourne la liste des RegistreNational avec, pour chacun :
   - metadonnées (code, libelle, detenteurInstitutionId, statutExposition)
   - compteurs par mode : consomme, alimente, cree
   - liste des institutions consommatrices (distinct)
   - doublonsPotentiels : nombre de paires (casUsage, casUsage) touchant
     le même referentiel avec recouvrement de champs > 50%

   Utilise la vue SQL v_couverture_registre créée par migration_registre.sql
   (via prisma.$queryRaw) pour les compteurs. Complète avec Prisma pour
   les institutions consommatrices.

2. GET /api/registres/:id/cas-usages
   Liste les CasUsageMVP associés à ce registre, groupés par mode
   (CONSOMME / ALIMENTE / CREE). Inclut les champs concernés de chaque
   liaison. Projection appliquée selon visibilité utilisateur.

3. POST /api/use-cases/:id/registres
   Body : { registreId, mode, champsConcernes[], volumetrieEst?, criticite? }
   - Rôle : INITIATEUR du cas d'usage OU DU
   - Unicité (casUsageId, registreId, mode) respectée (409 sinon)

4. GET /api/use-cases/:id/similaires
   Endpoint du détecteur de doublons : pour un cas d'usage donné (ou pour
   un brouillon via paramètres query registreId, mode, champsConcernes[]),
   retourne les cas d'usage similaires existants.
   Similaire = touche le même registreId, même mode, recouvrement de
   champs >= 50%.
   Calcul du recouvrement : |A ∩ B| / |A ∪ B| sur les tableaux
   champsConcernes (JSON).

Tests :
- tests/registres.test.ts couvre :
  - couverture : compteurs corrects sur le seed
  - similaires : PINS-CU-008 et PINS-CU-014 détectés comme similaires
    si champs communs
  - ajout d'un registre avec violation d'unicité -> 409
```

---

## PROMPT 7 — Phase P3 : Frontend — dashboard sectoriel enrichi (4 blocs)

**Objectif :** ajouter les 4 blocs de la Vue 360° au dashboard existant, sans régression sur les blocs actuels.

**Pré-requis :** API P2.2 fonctionnelle.

**Critères d'acceptation :** les 4 blocs s'affichent avec les données du seed ; le dashboard existant (cartes de synthèse, actions requises, consommé/fourni) reste intact ; visuellement conforme à `mockup_dashboard_v1_1.html`.

```
Phase P3 — Dashboard sectoriel enrichi.

Ouvre docs/vue-360/mockup_dashboard_v1_1.html dans ton contexte comme
référence visuelle — c'est la cible à reproduire.

1. N'ALTÈRE PAS les composants existants du dashboard :
   - Cartes de synthèse (4 cartes du haut)
   - Bandeau "Actions requises"
   - "Données que je consomme (6)"
   - "Données que je fournis (4)"
   - "Mes conventions d'échange (0)"

2. Ajoute 4 nouveaux composants React, chacun dans son propre fichier
   dans web/src/components/Dashboard/Vue360/ :

   - SollicitationsBlock.tsx
     Hook : useQuery vers /api/me/use-cases/incoming
     Rendu : carte avec bord gauche amber, titre "Sollicitations en
     attente de mon avis", liste des cas d'usage avec échéances SLA,
     bouton "Donner mon avis" qui navigue vers /use-cases/:id (avec
     ouverture auto de la modal d'avis — query param ?action=give-feedback)

   - MesCasUsageInitiesBlock.tsx
     Hook : useQuery vers /api/me/use-cases/outgoing
     Rendu : carte avec bord gauche navy, barre de statut de
     consultation par stakeholder (pastilles couleur par type d'avis)

   - QuiMeConcernentBlock.tsx
     Hook : useQuery vers /api/me/use-cases/involved
     Rendu : tableau pleine largeur, bord gauche gold, filtres par
     rôle (Tous / Initiateur / Fournisseur / Consommateur / Partie prenante)
     implémentés côté client via un useState

   - RadarSectorielBlock.tsx
     Hook : useQuery vers /api/me/use-cases/radar
     Rendu : carte avec bord gauche teal, liste avec badge de raison
     du match, bouton "Me porter partie prenante" qui fait
     POST /api/use-cases/:id/stakeholders avec mon institutionId

3. Compose-les dans web/src/pages/Dashboard.tsx :

   Après les blocs existants, ajoute un séparateur visuel
   (bordure dashed teal) avec titre "Vue 360° — Cycle de vie des cas
   d'usage", puis insère :
     Row 1 : SollicitationsBlock (pleine largeur)
     Row 2 : MesCasUsageInitiesBlock + RadarSectorielBlock (grid-cols-2)
     Row 3 : QuiMeConcernentBlock (pleine largeur)

4. Respecte la charte :
   - Utilise les tokens de couleur existants. Si les noms navy / teal /
     gold / amber ne sont pas définis dans tailwind.config, ajoute-les :
     navy: "#0C1F3A", teal: "#0A6B68", gold: "#D4A820", amber: "#C55A18"
   - Police : Poppins (déjà chargée)
   - Chips / badges : reproduis les styles du mockup (chip, role-badge,
     chip-mvp1, etc.)

5. Accessibilité :
   - Tous les boutons ont un aria-label
   - Les tableaux ont des en-têtes <th scope="col">

6. Vérification :
   - npm run dev démarre sans erreur
   - Le dashboard affiche les blocs existants INCHANGÉS + les 4 nouveaux
   - Connecté en tant qu'utilisateur DGID du seed, tu vois :
     * Sollicitations : au moins 1 entrée (PINS-CU-008)
     * Mes cas initiés : les cas d'usage où DGID est INITIATEUR
     * Qui me concernent : 3+ entrées
     * Radar : au moins 1 entrée basée sur NINEA

Ne crée PAS encore la page détail ni la modal d'avis. Prompt suivant.
```

---

## PROMPT 8 — Phase P4 : Frontend — page détail use case + modal "Donner mon avis"

**Objectif :** implémenter la page détail avec visibilité conditionnelle et la modal d'avis formel.

**Pré-requis :** API P2.3 fonctionnelle.

**Critères d'acceptation :** un stakeholder voit le détail complet ; un utilisateur non stakeholder ne voit que les métadonnées ; la soumission d'un avis fonctionne bout en bout.

```
Phase P4 — Page détail d'un cas d'usage + modal d'avis.

Réfère-toi à docs/vue-360/mockup_dashboard_v1_1.html, onglet "Page détail UC".

1. Route : /use-cases/:id dans web/src/pages/UseCaseDetail.tsx

Fetch via GET /api/use-cases/:id.

Affiche selon la visibilité retournée par l'API :
- Toujours : en-tête (id, titre, statut, résumé, initiateur, dates, base légale)
- DETAILED et FULL : parties prenantes, fil d'avis formels, timeline
  transitions, registres touchés, spécifications techniques (accordion)
- FULL uniquement : boutons d'action DU (qualifier, suspendre, retirer)

Si la visibilité est METADATA, affiche un bandeau discret :
"Informations détaillées réservées aux parties prenantes formellement désignées."
Mais NE CACHE PAS le bouton "Me porter partie prenante" si le user
appartient à une institution connectée PINS.

2. Composants à créer dans web/src/components/UseCase/ :

- UseCaseHeader.tsx         (en-tête + chips + boutons action contextuels)
- StakeholdersTable.tsx     (tableau parties prenantes + statut avis)
- FeedbacksFeed.tsx         (fil d'avis formels horodaté)
- TransitionsTimeline.tsx   (timeline verticale des UseCaseStatusHistory)
- RegistresTouchesTable.tsx (bloc "Référentiels nationaux touchés"
                             — addendum v1.1, avec lien vers la vue
                             couverture)
- TechnicalSpecsAccordion.tsx (specs techniques, collapsé par défaut)

3. Modal d'avis : web/src/components/UseCase/FeedbackModal.tsx

Props : { consultationId, casUsageTitre, casUsageRef, onSubmitted }

Contenu :
- 5 radios exclusifs : VALIDATION / RESERVE / REFUS_MOTIVE /
  QUESTION / CONTRE_PROPOSITION (reproduis la grille 5 colonnes du mockup)
- Textarea motivation, avec :
  * validation min. 50 caractères si type != VALIDATION && type != CONTRE_PROPOSITION
  * compteur de caractères visible
- Upload pièces jointes (max 3 fichiers, 10 Mo)
- Bloc signature institutionnelle (lecture seule, rempli depuis session)
- Boutons Annuler / Soumettre l'avis formel

Submit : POST /api/consultations/:id/feedback, invalidate les queries
/api/me/use-cases/incoming et l'endpoint détail. Affiche un toast de
confirmation.

4. Ouverture automatique de la modal depuis le dashboard :
Si l'URL contient ?action=give-feedback, ouvre automatiquement la modal
au chargement de la page détail. Ça permet au bouton "Donner mon avis"
du dashboard de router directement.

5. Vérification end-to-end :
Connecté en tant qu'utilisateur DGID :
- Ouvre la page détail de PINS-CU-008 (la visibilité = DETAILED)
- Vérifie le rendu complet (stakeholders, feedbacks MFB et CDP, timeline,
  registres)
- Clique "Donner mon avis", sélectionne RESERVE, tape une motivation
  de 60 caractères, soumets
- Vérifie qu'un nouveau feedback apparaît dans le fil avec ton nom
- Vérifie que le statut de la consultation est passé à REPONDU

Connecté en tant qu'utilisateur ANSD (non stakeholder de PINS-CU-008) :
- Ouvre la page détail : seules les métadonnées s'affichent
- Le bouton "Me porter partie prenante" est visible
```

---

## PROMPT 9 — Phase P5 : Frontend — vue arbitrage DU + vue couverture référentiels

**Objectif :** implémenter les deux vues restantes (arbitrage DU + couverture référentiels).

**Critères d'acceptation :** routes accessibles selon rôle ; données alimentées depuis les API P2.3 et P2.4 ; conformes visuellement au mockup.

```
Phase P5 — Vues arbitrage DU et couverture par référentiel.

1. Route : /du/arbitrage dans web/src/pages/DuArbitrage.tsx
   Accessible uniquement aux utilisateurs avec rôle DU ou SENUM_ADMIN
   (via guard de routage existant).

   Fetch GET /api/du/arbitrage.

   Rendu (réf. mockup onglet "Vue DU arbitrage") :
   - Bandeau d'identification vue DU
   - 5 cartes KPI : Déclarés, En consultation, Désaccords, Qualifiés,
     En production
   - File d'arbitrage : chaque désaccord avec position des parties,
     boutons "Convoquer cadrage" (stub modal) et "Décision d'arbitrage"
     (stub modal → POST vers /api/use-cases/:id/transition avec motif)

2. Route : /registres/couverture dans web/src/pages/RegistresCouverture.tsx
   Accessible à tous les utilisateurs connectés (visibilité ajustée côté API).

   Fetch GET /api/registres/couverture.

   Rendu (réf. mockup onglet "Couverture référentiels") :
   - Bandeau dégradé navy→teal avec mention "Addendum v1.1"
   - Bandeau triptyque Doing Business (NINEA / RCCM / Casier judiciaire)
   - Grid de cartes-référentiel (3 colonnes sur desktop, 1 sur mobile)
     Chaque carte : code/libellé, détenteur, badge statut d'exposition,
     3 compteurs (CONSOMME / ALIMENTE / CREE), liste des consommateurs,
     bande d'alerte en bas si doublons potentiels ou bloqueur
   - Cliquer une carte ouvre /registres/:id (stub : afficher un drawer
     latéral avec la liste des cas d'usage associés, via
     /api/registres/:id/cas-usages)
   - Section "Doublons potentiels détectés" : paires de cas d'usage
     avec recouvrement, boutons "Proposer fusion" / "Documenter distinction"
     (les actions peuvent être stub pour cette phase — à brancher en P7)

3. Ajoute les entrées de menu dans la sidebar :
   - Sous la section "Vue 360°" : "Couverture référentiels"
     (accessible à tous)
   - Sous une nouvelle section "Arbitrage DU" (affichée uniquement aux
     rôles DU/SENUM_ADMIN) : "File d'arbitrage"

4. Tests manuels :
   - Connecté DU : les deux routes sont accessibles, les données s'affichent
   - Connecté DGID : /du/arbitrage redirige vers 403,
     /registres/couverture accessible avec les compteurs
   - Un clic sur NINEA affiche les cas d'usage correspondants
```

---

## PROMPT 10 — Phase P6 : Notifications in-app

**Objectif :** activer les notifications UI qui alertent les utilisateurs sur les événements pertinents.

**Critères d'acceptation :** chaque action (ouverture consultation, réception avis, relance, transition) génère une notification ; la cloche dans le header affiche le compteur de non-lues ; un dropdown liste les notifications.

```
Phase P6 — Notifications in-app.

1. Backend : s'assurer que chaque point d'écriture crée la notification
   appropriée (vérification, pas re-création si déjà fait en P2.3) :
   - Ouverture de consultation : Notification pour le POINT_FOCAL
     de l'institution stakeholder (type CONSULTATION_OUVERTE)
   - Soumission d'un feedback : Notification pour l'initiateur du cas
     d'usage (type AVIS_RECU)
   - Relance : Notification pour le stakeholder relancé (type RELANCE)
   - Transition d'état : Notification pour tous les stakeholders actifs
     (type TRANSITION)
   - Arbitrage DU : Notification pour les parties en désaccord
     (type ARBITRAGE)

2. Endpoint GET /api/me/notifications
   Paginé. Paramètre ?unreadOnly=true. Tri par dateCreation desc.

3. Endpoint PATCH /api/notifications/:id/read
   Marque lu = true, dateLu = now().

4. Endpoint PATCH /api/me/notifications/read-all
   Marque toutes les notifications non lues comme lues.

5. Frontend :
   - Composant web/src/components/Header/NotificationsBell.tsx
     Cloche + badge avec nombre de non-lues (issu d'un polling toutes
     les 30 secondes, ou d'un useEffect sur focus de fenêtre)
   - Dropdown liste : titre, message, lien contextuel (lienUrl),
     timestamp relatif ("il y a 2h")
   - Cliquer une notification : appelle l'endpoint read puis navigue
     vers lienUrl
   - Bouton "Tout marquer comme lu"

6. Tests manuels :
   - Soumets un feedback côté DGID sur PINS-CU-008
   - Connecte-toi en tant qu'utilisateur DGCPT (initiateur)
   - Vérifie qu'une notification AVIS_RECU apparaît avec badge +1
   - Clique la notification, tu navigues vers la page détail,
     le compteur décrémente
```

---

## PROMPT 11 — Phase P7 : Recette end-to-end avec scénarios fonctionnels

**Objectif :** jouer les 8 scénarios de recette définis en section 6.3 du document v1.0 et produire un rapport de recette.

**Critères d'acceptation :** les 8 scénarios passent, le rapport est disponible dans `docs/vue-360/recette-v1.md`.

```
Phase P7 — Recette end-to-end.

Écris les 8 scénarios de la section 6.3 du document v1.0 sous forme de
tests end-to-end dans tests/e2e/vue360-scenarios.spec.ts (framework :
Playwright si présent, sinon Cypress, sinon supertest pour les scénarios
backend-only).

Scénarios :
1. Un agent DGID déclare un nouveau cas d'usage avec ANSD fournisseur.
2. L'ANSD reçoit la sollicitation, consulte la fiche, donne un avis
   RESERVE avec pièce jointe.
3. La DGID reçoit la notification de l'avis, crée un feedback
   CONTRE_PROPOSITION amendant la spécification.
4. La DGCPT, non initialement sollicitée, détecte le cas d'usage dans
   son radar (match sur un registre commun) et se porte partie prenante.
5. La DU arbitre la réserve ANSD en demandant un cadrage, puis qualifie
   le cas d'usage (transition VALIDATION_CONJOINTE → QUALIFIE).
6. Un utilisateur d'une institution non stakeholder tente d'accéder aux
   spécifications détaillées : seule la projection METADATA lui est servie.
7. La DU transite le cas d'usage vers EN_PRODUCTION. Un journal inaltérable
   est présent. Une tentative d'UPDATE direct sur use_case_status_history
   échoue.
8. La vue /registres/couverture liste les cas d'usage par référentiel,
   avec compteurs cohérents.

Chaque scénario doit :
- Créer l'état initial nécessaire (via API ou via seed dédié)
- Exécuter la séquence d'actions
- Vérifier l'état final avec des assertions
- Être isolé : nettoyer après exécution ou utiliser des identifiants
  aléatoires

Rapport : produis docs/vue-360/recette-v1.md avec pour chaque scénario :
- Résumé
- Étapes exécutées
- Captures d'écran (si UI)
- Résultat : PASS / FAIL / BLOQUÉ
- Anomalies détectées et niveau de sévérité

Liste les anomalies bloquantes en tête du rapport.
```

---

## Ordre d'exécution recommandé

| Phase | Prompt(s) | Effort indicatif | Dépendance |
|-------|-----------|------------------|------------|
| P1 migration schéma | 1, 2 | 1 jour | Prompt 0 validé |
| P2 API backend | 3, 4, 5, 6 | 4–5 jours | P1 OK |
| P3 dashboard enrichi | 7 | 2 jours | P2.2 OK |
| P4 page détail + modal | 8 | 2 jours | P2.3 OK |
| P5 arbitrage DU + couverture | 9 | 1 jour | P2.3, P2.4 OK |
| P6 notifications | 10 | 1 jour | P2.3 OK |
| P7 recette | 11 | 2 jours | Tout OK |

Total indicatif : **13 à 14 jours ouvrés** de travail concret — en ligne avec la roadmap du document de conception (29 jours incluant conception, validation et buffer).

## Checklist avant de commencer

- [ ] Les 6 fichiers de référence sont dans `docs/vue-360/`
- [ ] La base PostgreSQL est accessible et sauvegardée
- [ ] Une branche Git dédiée est créée : `git checkout -b feature/vue-360`
- [ ] L'app démarre en local : `npm run dev`
- [ ] Prisma est à jour : `npx prisma generate`
