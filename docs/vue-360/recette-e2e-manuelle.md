# Recette end-to-end manuelle — Vue 360° des cas d'usage PINS

Conduite de la recette fonctionnelle des 8 scénarios définis en section 6.3 du document de conception v1.0 (référence MCTN/DU/APP-DPI-INTEROP/CONC-2026-02).

---

## Prérequis généraux

### Environnement

- Backend API sur **http://localhost:3000**
- Frontend sur **http://localhost:5173**
- Base PostgreSQL peuplée via `npm run db:seed` puis `npm run db:seed:vue360` (+ `seed_registres_nationaux`, `seed_ptf`, `seed_flux_mvp` si besoin)
- Branche Git : `feature/vue-360` à jour

### Comptes de test

| Persona | Email | Mot de passe | Rôle | Institution |
|---------|-------|-------------|------|-------------|
| Admin DU / SENUM | `admin@senum.sn` | `Admin@2026` | ADMIN | — |
| Agent DGID | `dsi@dgid.sn` | `P@ssw0rd` (ou `Password@123` après reset) | INSTITUTION | DGID |
| Agent ANSD | `dsi@ansd.sn` | `Password@123` | INSTITUTION | ANSD |
| Agent DGCPT | `informatique@dgcpt.sn` | `Password@123` | INSTITUTION | DGCPT |
| Agent DGD (hors scenarios) | `informatique@douanes.sn` | `Password@123` | INSTITUTION | DGD |

> Si un login échoue avec `Password@123`, tester `P@ssw0rd` (compte avec mot de passe personnalisé) — sinon réinitialiser depuis le compte admin via `/admin/utilisateurs`.

### Cas d'usage du seed Vue 360° (références stables)

| Code | Titre | Statut initial | Stakeholders actifs |
|------|-------|---------------|---------------------|
| **PINS-CU-008** | Réconciliation fiscale DGID ↔ DGCPT | `EN_CONSULTATION` | DGCPT (INITIATEUR), DGID (FOURNISSEUR), MFB (CONSOMMATEUR), CDP (PARTIE_PRENANTE) |
| **PINS-CU-011** | Exposition Douanes.GetDeclarations | `EN_PRODUCTION_360` | DGID (INITIATEUR), DGD (FOURNISSEUR), DGCPT (PARTIE_PRENANTE) |
| **PINS-CU-012** | Qualification fiscale bénéficiaires RNU | `EN_CONSULTATION` | DGPSN (INITIATEUR), DGID (FOURNISSEUR), ANSD (FOURNISSEUR), CDP (PARTIE_PRENANTE) |
| **PINS-CU-019** | Plateforme anti-fraude inter-administrations | `EN_CONSULTATION` | DGID (FOURNISSEUR), DGD (FOURNISSEUR), MJ (FOURNISSEUR) |

### Méthode de capture

Pour chaque scénario, prendre une capture d'écran (Win+Shift+S sur Windows) au moment du "Résultat attendu" et la stocker dans `docs/vue-360/captures-recette/scN-YYYYMMDD-HHmm.png`. Les captures valent preuve en cas de validation par M. DIABY.

---

## Scénario 1 — Déclaration d'un nouveau cas d'usage par la DGID avec ANSD fournisseur

### Pré-requis

- Connecté en tant que DGID (`dsi@dgid.sn`)
- Aucun cas d'usage de test présent avec le titre "Verification NINEA pour controles fiscaux"

### Étapes

1. Se connecter avec le compte DGID
2. Ouvrir `/mes-cas-usage` via la sidebar ("Mon espace" → "Mes cas d'usage")
3. Cliquer sur "Déclarer un nouveau cas d'usage" (bouton dans le bloc "Mes cas d'usage initiés")
4. Renseigner le formulaire :
   - Titre : *"Verification NINEA pour controles fiscaux"*
   - Résumé métier : *"La DGID sollicite l'ANSD pour vérifier en temps réel le statut d'immatriculation NINEA lors des contrôles fiscaux."*
   - Base légale : *"Code Général des Impôts, article 23"*
   - Institution cible : **ANSD** (sélecteur — vérifier qu'aucun UUID ne s'affiche)
   - Stakeholders à ajouter : ANSD en rôle FOURNISSEUR
5. Valider la création
6. Vérifier la redirection vers la fiche du nouveau cas d'usage

### Résultat attendu

- Cas d'usage créé avec un code `PINS-CU-0XX` séquentiel
- Statut initial `DECLARE`
- L'utilisateur DGID apparaît comme INITIATEUR dans le tableau Parties prenantes
- ANSD apparaît comme FOURNISSEUR
- Timeline : entrée "Déclaré" avec auteur DGID et date actuelle
- Sur `/du/arbitrage` (avec compte admin), le KPI "Déclarés" a son sous-titre "dont X issus du pipeline Vue 360°" incrémenté de 1

### Points de vigilance

- Si le sélecteur ANSD affiche un UUID : régression règle R3
- Si le cas d'usage est créé mais le INITIATEUR n'est pas automatiquement ajouté : bug backend POST /use-cases
- Si aucune entrée `UseCaseStatusHistory` n'est créée : le pipeline actif ne sera pas comptabilisé

### Capture à prendre

Fiche 360° du nouveau cas d'usage juste après création, en plein écran, avec le tableau Parties prenantes et la Timeline visibles.

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Scénario 2 — L'ANSD donne un avis avec réserve et joint un document

### Pré-requis

- Le cas d'usage du scénario 1 existe (titre "Verification NINEA pour controles fiscaux")
- Depuis le compte admin, ouvrir une consultation pour l'ANSD sur ce cas d'usage (action DU : clic "Convoquer cadrage" OU transition DECLARE → EN_CONSULTATION). **Alternative simple** : utiliser directement PINS-CU-012 où ANSD est déjà FOURNISSEUR avec consultation EN_ATTENTE depuis le seed.

### Étapes

1. Se déconnecter, se reconnecter avec le compte ANSD (`dsi@ansd.sn`)
2. Vérifier que la cloche de notifications affiche un badge (au moins 1 notification CONSULTATION_OUVERTE)
3. Cliquer sur la notification → redirection vers `/mes-cas-usage`
4. Dans le bloc "Sollicitations en attente", localiser PINS-CU-012 (ou le cas d'usage du scénario 1)
5. Cliquer sur "Donner mon avis" → la modal s'ouvre automatiquement (query param `?action=give-feedback&consultationId=...`)
6. Sélectionner le type **RÉSERVE**
7. Saisir une motivation de minimum 60 caractères :
   > *"L'ANSD valide le principe mais exige que l'appel soit tracé nommément pour chaque contrôle fiscal, avec journalisation conforme à la loi 2008-12. Le volume estimé (1M+ req/mois) impose aussi un dimensionnement spécifique de l'API."*
8. (Optionnel) Simuler une pièce jointe en notant dans la motivation "PJ : note-reserve-ANSD.pdf" si upload fichier indisponible
9. Cliquer sur "Soumettre l'avis formel"
10. Vérifier la fermeture de la modal et le refresh de la page détail

### Résultat attendu

- Le feedback RÉSERVE apparaît dans le fil d'avis avec :
  - Avatar ANSD
  - Type "RÉSERVE" (badge rouge pâle)
  - Motivation complète
  - Horodatage à la seconde près
  - Signature "dsi@ansd.sn · ANSD · Fournisseur"
- Dans le tableau Parties prenantes, ligne ANSD : statut passe de "En attente" à "Réserve"
- Consultation status : `REPONDU` en base
- Sur `/du/arbitrage` (avec compte admin), le nouveau cas d'usage apparaît dans la file des désaccords

### Points de vigilance

- Si la motivation < 50 caractères est acceptée : bug validation CHECK SQL ou bouton submit
- Si le fil d'avis n'affiche pas le nouvel avis après submit : invalidation React Query manquante
- Si l'horodatage est incorrect (décalé de plusieurs heures) : fuseau horaire serveur/DB

### Capture à prendre

Fil d'avis formels après soumission, avec l'avis ANSD en tête (ou 2e si MFB/CDP avaient déjà répondu sur PINS-CU-012).

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Scénario 3 — La DGID reçoit la notification et répond par une contre-proposition

### Pré-requis

- Scénario 2 exécuté (ANSD a donné un avis RÉSERVE)
- Déconnexion ANSD puis reconnexion avec le compte DGID

### Étapes

1. Se connecter avec le compte DGID
2. La cloche doit afficher un badge (notification AVIS_RECU)
3. Cliquer sur la notification → redirection vers `/admin/cas-usage/:id`
4. Lire l'avis RÉSERVE de l'ANSD dans le fil
5. DGID est INITIATEUR, donc doit pouvoir "amender" son propre cas d'usage ou rajouter un feedback de type CONTRE_PROPOSITION via un stakeholder DGID. **Alternative** : si la DGID n'a pas de consultation ouverte sur ce CU, créer un stakeholder DGID rôle CONSOMMATEUR via POST /use-cases/:id/stakeholders avec auto-saisine, puis donner un avis.
6. Soumettre un avis CONTRE_PROPOSITION avec motivation :
   > *"La DGID prend acte de la réserve ANSD. Nous proposons : (1) journalisation NINEA côté DGID avec identifiant agent + horodatage, (2) rate-limit progressif 100 req/s puis 500 req/s après 3 mois, (3) revue semestrielle conjointe des logs avec l'ANSD. Spécification amendée en conséquence."*

### Résultat attendu

- Nouvel avis CONTRE_PROPOSITION de la DGID dans le fil
- Affichage chronologique : avis RÉSERVE ANSD en premier, CONTRE_PROPOSITION DGID ensuite
- Si DGID avait un avis précédent (VALIDATION par ex.), la contre-proposition apparaît comme amendement indenté sous l'avis parent

### Points de vigilance

- Si la DGID (INITIATEUR) n'a aucun moyen de répondre formellement → bug UX : l'initiateur doit pouvoir amender/répondre
- Si l'amendement ne s'affiche pas indenté sous son parent : rendu FeedbacksFeed à vérifier

### Capture à prendre

Fil d'avis avec les 2 interventions successives : RÉSERVE ANSD + CONTRE_PROPOSITION DGID.

### RÉSULTAT

- [ ] PASS
- [x] FAIL — 2026-04-24
- [ ] BLOQUÉ

**Commentaire** :

CONSTAT
- L'avis VALIDATION soumis par ANSD sur PINS-CU-026 ne peut plus être
  modifié ou amendé depuis l'UI.
- Aucun bouton "Amender", "Modifier", "Ajouter un complément" n'est
  présent sur la fiche détail à côté du fil d'avis.
- Le backend dispose pourtant d'un endpoint `PATCH /api/feedback/:id/amend`
  et le modèle de données prévoit le champ `amendeDe` dans `UseCaseFeedback`
  pour chaîner les amendements.
- Gap : l'UI `FeedbacksFeed.tsx` n'expose pas cette fonctionnalité.

IMPACT INSTITUTIONNEL
- Un Point Focal ne peut pas corriger une erreur de saisie.
- Une institution ne peut pas faire évoluer sa position après débat
  hiérarchique ou nouvelle information (ex. CDP demande un contrôle
  supplémentaire).
- L'autonomie institutionnelle prévue par la Vue 360° est incomplète.

CAPTURE : `captures-recette/s03-absence-bouton-amender.png`

RECOMMANDATION
- Ajouter un bouton "Amender mon avis" sur chaque avis du fil, visible
  uniquement par l'auteur (`user.id === feedback.auteurUserId`) et
  uniquement si le cas d'usage n'est pas en statut QUALIFIE ou postérieur.
- Au clic, rouvrir la même modal `FeedbackModal` préremplie avec le type
  et la motivation précédente, et soumettre via `PATCH /api/feedback/:id/amend`.
- Afficher le nouvel avis comme enfant indenté de l'avis initial
  (pattern déjà livré en P4).

Effort estimé : 2-3h. Priorité HAUTE post-recette. Reporté en backlog UX.

---

## Scénario 4 — Auto-saisine DGCPT via le radar sectoriel

### Pré-requis

- PINS-CU-019 (Plateforme anti-fraude) n'a pas DGCPT comme stakeholder (le seed ne l'inclut pas)
- DGCPT est consommateur historique des registres touchés par CU-019 (fiscal, douanier) — le radar doit le matcher

### Étapes

1. Se connecter avec le compte DGCPT (`informatique@dgcpt.sn`)
2. Ouvrir `/mes-cas-usage` via la sidebar
3. Dans le bloc "Radar sectoriel", vérifier qu'au moins un cas d'usage apparaît avec une "raison du match" — idéalement PINS-CU-019 ou équivalent
4. Cliquer sur "Me porter partie prenante" sur une ligne
5. Vérifier le toast de confirmation
6. Le cas d'usage doit disparaître du Radar et apparaître dans "Cas d'usage qui me concernent" avec rôle PARTIE_PRENANTE et flag `autoSaisine=true`

### Résultat attendu

- Stakeholder DGCPT / PARTIE_PRENANTE créé avec `autoSaisine: true`
- Notification créée pour les users DGCPT
- La prochaine consultation ouverte par l'initiateur ou la DU inclura DGCPT

### Points de vigilance

- Si le Radar n'affiche aucun cas d'usage pour DGCPT : problème de matching backend (/me/use-cases/radar)
- Si le bouton "Me porter partie prenante" renvoie 409 : le stakeholder existait déjà avec ce rôle
- Si le flag autoSaisine=false en base : bug backend (détection via `institutionId === user.institutionId`)

### Capture à prendre

Bloc Radar sectoriel de DGCPT avec au moins 1 match visible, puis vue "Qui me concernent" après auto-saisine avec nouveau CU marqué PARTIE_PRENANTE.

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Scénario 5 — La DU arbitre la réserve ANSD et qualifie le cas d'usage

### Pré-requis

- Au moins un cas d'usage en `EN_CONSULTATION` avec un avis RÉSERVE en cours (le scénario 2 ou le seed PINS-CU-008)
- Connecté en tant qu'admin SENUM (`admin@senum.sn`)

### Étapes

1. Se connecter avec le compte admin
2. Ouvrir `/du/arbitrage`
3. Vérifier les 5 KPI en haut : Déclarés / En consultation / Désaccords / Qualifiés / En production
4. Dans la file des désaccords, cliquer sur "Convoquer cadrage" sur le cas d'usage avec réserve ANSD (toast stub attendu pour cette phase)
5. Cliquer sur "Décision d'arbitrage" (toast stub)
6. Ouvrir la fiche 360° du cas d'usage
7. Via l'action admin "Changer le statut" (bouton visible uniquement en mode FULL), faire transiter `EN_CONSULTATION` → `VALIDATION_CONJOINTE` puis `VALIDATION_CONJOINTE` → `QUALIFIE`
8. Vérifier la timeline : 2 nouvelles entrées inaltérables avec auteur "admin@senum.sn" et institution "SENUM SA"
9. Retourner sur `/du/arbitrage` : le KPI Qualifiés doit être incrémenté

### Résultat attendu

- Transitions enregistrées dans `UseCaseStatusHistory`
- Notifications TRANSITION envoyées à tous les stakeholders actifs (vérifiable avec compte DGID ou ANSD : cloche +1)
- Timeline affichée en ordre antéchronologique
- Cas d'usage retiré de la file des désaccords (plus en `EN_CONSULTATION`)

### Points de vigilance

- Si un stakeholder non-DU peut effectuer la transition vers QUALIFIE : bug autorisation backend
- Si la timeline permet une modification : régression inaltérabilité (trigger PG)
- Si aucune notification TRANSITION n'arrive aux stakeholders : bug dans POST /use-cases/:id/transition

### Capture à prendre

Timeline de la fiche 360° avec les 2 transitions horodatées + KPI `/du/arbitrage` avant/après.

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Scénario 6 — Visibilité METADATA pour une institution non stakeholder

### Pré-requis

- PINS-CU-008 existe (stakeholders : DGCPT, DGID, MFB, CDP)
- Connecté avec un compte NON stakeholder de CU-008 — **ANSD convient** (ANSD n'est pas stakeholder de CU-008, uniquement de CU-012)

### Étapes

1. Se connecter avec le compte ANSD
2. Accéder directement à l'URL `/admin/cas-usage/{id_de_PINS-CU-008}` (copier l'ID depuis la base ou depuis une session admin)
3. **OU** depuis `/mes-cas-usage`, utiliser la barre de recherche globale (Ctrl+K) et taper "PINS-CU-008"
4. Observer la page

### Résultat attendu

- En-tête visible : code, titre, résumé métier, base légale, initiateur DGCPT
- Bandeau jaune "Informations détaillées réservées aux parties prenantes formellement désignées."
- **Absents** : fil d'avis formels, timeline détaillée, specs techniques, registres touchés détaillés, spécifications, observations
- Tableau stakeholders affiche les institutions + rôles uniquement, **sans** statut d'avis ni auteurs
- Bouton "Donner mon avis" : **masqué** (ANSD n'a pas de consultation ouverte sur CU-008)
- Bouton "Me porter partie prenante" : visible (ANSD peut s'auto-saisir)

### Points de vigilance

- Si les feedbacks MFB et CDP sont visibles : **fuite de donnée sensible** — bug projection backend
- Si la motivation de RESERVE CDP est lisible : violation RGPD potentielle
- Si l'URL retourne 404 : trop restrictif, METADATA doit retourner 200
- Si le `_visibility` en console Network ≠ "METADATA" : mauvais calcul middleware

### Capture à prendre

Page complète de PINS-CU-008 vue par ANSD, avec le bandeau "Informations détaillées réservées..." visible.

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Scénario 7 — Transition vers EN_PRODUCTION et inaltérabilité du journal

### Pré-requis

- Un cas d'usage en `CONVENTIONNE` (statutVueSection) — si aucun, créer la chaîne depuis QUALIFIE via le compte admin : QUALIFIE → PRIORISE → FINANCEMENT_OK → CONVENTIONNE
- Connecté en tant qu'admin

### Étapes

1. Se connecter avec le compte admin
2. Ouvrir le cas d'usage en CONVENTIONNE
3. Transiter vers `EN_PRODUCTION_360`
4. Vérifier la timeline : nouvelle entrée avec date, auteur admin, motif éventuel
5. Tenter une modification directe en SQL via `psql` :
   ```sql
   UPDATE use_case_status_history SET motif = 'hack' WHERE id = (SELECT id FROM use_case_status_history ORDER BY "dateTransition" DESC LIMIT 1);
   ```
   Commande à exécuter :
   ```
   docker exec questionnaire-interop-db-1 psql -U pins -d questionnaire_interop -c "UPDATE use_case_status_history SET motif = 'hack' WHERE id = (SELECT id FROM use_case_status_history ORDER BY \"dateTransition\" DESC LIMIT 1);"
   ```
6. Tenter une suppression :
   ```
   docker exec questionnaire-interop-db-1 psql -U pins -d questionnaire_interop -c "DELETE FROM use_case_status_history WHERE id = (SELECT id FROM use_case_status_history ORDER BY \"dateTransition\" DESC LIMIT 1);"
   ```

### Résultat attendu

- Transition visible dans l'UI timeline
- Les 2 commandes SQL renvoient une erreur :
  ```
  ERROR: use_case_status_history est inalterable : UPDATE/DELETE interdit
  ```
- La ligne reste intacte (relire avec SELECT après les tentatives d'update/delete)
- `/du/arbitrage` → KPI "En production" +1

### Points de vigilance

- Si l'UPDATE SQL passe : **régression critique** — le trigger `prevent_status_history_modification` a été désactivé ou dropped
- Si la timeline montre un motif modifié après tentative : inacceptable
- Ce scénario est le plus important du point de vue conformité/redevabilité

### Capture à prendre

- Screenshot timeline avant/après tentative d'update
- Screenshot du terminal avec l'erreur PostgreSQL explicite

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Scénario 8 — Tableau de bord consolidé DU avec indicateurs de pilotage

### Pré-requis

- Base seedée avec au moins une douzaine de cas d'usage répartis sur différents statuts
- Scénarios 1 à 7 idéalement exécutés (pour enrichir la base)
- Connecté en tant qu'admin

### Étapes

1. Se connecter avec le compte admin
2. Ouvrir `/du/arbitrage`
3. Vérifier les 5 KPI :
   - **Déclarés** : total + sous-titre "dont X issus du pipeline Vue 360°"
   - **En consultation** : nombre avec sous-titre "X échéances dépassées" si applicable
   - **Désaccords** : à arbitrer
   - **Qualifiés**
   - **En production**
4. Vérifier la file des désaccords : chaque ligne avec code, titre, position des parties (résumé du feedback RESERVE/REFUS), échéance
5. Vérifier la section "Consultations en retard" si applicable (cas d'usage avec `dateEcheance` passée et status EN_ATTENTE)
6. Ouvrir `/registres/couverture`
7. Vérifier la grille : NINEA (Doing Business), RCCM, RNU, SIGTAS... avec compteurs CONSOMME/ALIMENTE/CREE
8. Cliquer sur NINEA : drawer latéral s'ouvre avec la liste des cas d'usage groupés par mode

### Résultat attendu

- Chiffres cohérents avec la base (vérification par SQL direct possible)
- File des désaccords non vide si au moins un feedback RESERVE/REFUS_MOTIVE existe
- Couverture NINEA : au moins 3 cas d'usage en CONSOMME (CU-008, CU-011, CU-012 du seed)
- Compteurs doublons potentiels affichés si > 0
- Pas de jargon projet dans les bandeaux (cf. règle R2 du backlog UX)

### Points de vigilance

- Si les KPI sont désynchronisés entre `/du/arbitrage` et un compte SQL direct : bug agrégation backend
- Si les compteurs registres diffèrent du résultat de `SELECT mode, COUNT(*) FROM cas_usage_registre GROUP BY mode` : bug endpoint `/registres/couverture`
- Si les boutons "Convoquer cadrage" / "Décision d'arbitrage" exécutent autre chose qu'un toast stub : implémentation prématurée

### Capture à prendre

- Vue complète `/du/arbitrage` en plein écran
- Vue complète `/registres/couverture` + drawer latéral ouvert sur NINEA

### RÉSULTAT

- [ ] PASS
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

---

## Tableau récapitulatif — Statut attendu après recette

| # | Scénario | Statut cible | Statut réel | Anomalies |
|---|----------|-------------|-------------|-----------|
| 1 | Déclaration cas d'usage DGID → ANSD | PASS | | |
| 2 | Avis RÉSERVE ANSD avec pièce jointe | PASS | | |
| 3 | Contre-proposition DGID sur l'avis ANSD | PASS | FAIL | Bouton amender non expose UI (backend OK) — reporte backlog |
| 4 | Auto-saisine DGCPT via radar | PASS | | |
| 5 | Arbitrage DU + qualification | PASS | | |
| 6 | Visibilité METADATA pour non-stakeholder | PASS | | |
| 7 | Transition EN_PRODUCTION + inaltérabilité | PASS *(critique)* | | |
| 8 | Tableau de bord consolidé DU | PASS | | |

### Critères de succès global

- **Recette validée** : les 8 scénarios passent sans anomalie bloquante
- **Recette conditionnellement validée** : 1 à 2 anomalies non bloquantes, corrigées avant déploiement prod
- **Recette échouée** : au moins 1 anomalie bloquante, notamment sur le scénario 7 (inaltérabilité) ou 6 (fuite de visibilité)

### Anomalies transverses observées

> À remplir pendant le déroulement si des défauts récurrents apparaissent (performance, labels incorrects, etc.)

---

## Notes pour l'après-recette

- Les anomalies non bloquantes sont à verser dans `docs/vue-360/ux-backlog.md` section "À traiter"
- Les anomalies bloquantes déclenchent un hotfix avant validation M. DIABY
- Les captures sont à nommer `scN-YYYYMMDD-HHmm.png` dans `docs/vue-360/captures-recette/`
- Une fois la recette validée, la phase P7 (automatisation end-to-end) peut démarrer sur la base de ces 8 scénarios transformés en specs Playwright/Cypress
