# Recette end-to-end manuelle — Vue 360° des cas d'usage PINS

> **Dernière mise à jour : 24/04/2026** — post-livraison de l'exposition de l'amendement d'avis et de la gouvernance des parties prenantes (auto-saisine motivée, retrait spontané, éviction Delivery Unit).

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

Pour chaque scénario, prendre une capture d'écran (Win+Shift+S sur Windows) au moment du "Résultat attendu" et la stocker dans `docs/vue-360/captures-recette/scN-YYYYMMDD-HHmm.png`. Les captures valent preuve en cas de validation par la Delivery Unit.

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

- [x] PASS — 2026-04-24 (résolu par la livraison du 24/04/2026)
- [ ] FAIL
- [ ] BLOQUÉ

**Commentaire** :

RÉSOLUTION
- Bouton "Amender mon avis" désormais exposé sur chaque avis du fil,
  visible uniquement par l'auteur (`user.id === feedback.auteurUserId`)
  et uniquement si le cas d'usage n'est pas dans un statut figé
  (QUALIFIE, PRIORISE, FINANCEMENT_OK, CONVENTIONNE, EN_PRODUCTION_360,
  SUSPENDU_360, RETIRE).
- Au clic, la modal `FeedbackModal` s'ouvre en mode amendement avec le
  type et la motivation de l'avis initial préremplis, titre
  "Amender mon avis — PINS-CU-XXX".
- Soumission via `PATCH /api/feedback/:id/amend` : l'avis initial reste
  inaltérable, l'amendement est créé comme nouvel enregistrement avec
  `amendeDe` pointant sur l'avis parent.
- Rendu : l'amendement apparaît indenté sous son avis parent dans
  `FeedbacksFeed`, avec badge "Amendement" distinct.

VALIDATION
- Test en fenêtre privée Brave (hors cache client) : PASS complet.
  L'ANSD peut amender son avis VALIDATION en RESERVE sur PINS-CU-026,
  l'avis original reste visible, l'amendement est chaîné dans le fil.

RÉFÉRENCES COMMITS
- `128fb2e` — exposition UI de l'amendement + gouvernance des parties prenantes
- `337838d` — alignement des libellés sur spec finale (titre modal, pré-remplissage motivation)

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
| 1 | Déclaration cas d'usage DGID → ANSD | PASS | PASS (23/04/2026) | — |
| 2 | Avis RÉSERVE ANSD avec pièce jointe | PASS | PASS (23/04/2026) | — |
| 3 | Amendement d'avis par l'auteur | PASS | PASS (24/04/2026) | Résolu par la livraison du 24/04/2026 — bouton "Amender mon avis" exposé dans le fil |
| 4 | Auto-saisine DGCPT via radar | PASS | PASS (23/04/2026) | — |
| 5 | Arbitrage DU + qualification | PASS | PASS PARTIEL (23/04/2026) | Boutons "Convoquer cadrage" et "Décision d'arbitrage" encore en toast stub — transitions de statut fonctionnelles |
| 6 | Visibilité METADATA pour non-stakeholder | PASS | PASS (23/04/2026) | — |
| 7 | Transition EN_PRODUCTION + inaltérabilité | PASS *(critique)* | PASS (23/04/2026) | — |
| 8 | Tableau de bord consolidé DU | PASS | PASS (23/04/2026) | — |

### Critères de succès global

- **Recette validée** : les 8 scénarios passent sans anomalie bloquante
- **Recette conditionnellement validée** : 1 à 2 anomalies non bloquantes, corrigées avant déploiement prod
- **Recette échouée** : au moins 1 anomalie bloquante, notamment sur le scénario 7 (inaltérabilité) ou 6 (fuite de visibilité)

### Statut global au 24/04/2026

- **7 PASS** (S1, S2, S3, S4, S6, S7, S8)
- **1 PASS PARTIEL** (S5 — arbitrage actif encore en stub)
- **0 FAIL**
- **0 anomalie bloquante ouverte**

La plateforme est en état de démonstration : toutes les briques critiques (déclaration, consultation, avis formel, amendement, auto-saisine motivée, retrait spontané, éviction motivée, visibilité contrôlée, inaltérabilité du journal, tableau de bord consolidé) sont opérationnelles bout en bout.

### Anomalies transverses observées

> À remplir pendant le déroulement si des défauts récurrents apparaissent (performance, labels incorrects, etc.)

---

## Notes pour l'après-recette

- Les anomalies non bloquantes sont à verser dans `docs/vue-360/ux-backlog.md` section "À traiter"
- Les anomalies bloquantes déclenchent un hotfix avant validation par la Delivery Unit
- Les captures sont à nommer `scN-YYYYMMDD-HHmm.png` dans `docs/vue-360/captures-recette/`
- Une fois la recette validée, l'étape suivante (automatisation end-to-end) peut démarrer sur la base de ces scénarios transformés en specs Playwright/Cypress

### Leçon retenue 24/04/2026 — Cache client trompeur

Pendant la vague de tests de régression post-livraison, un comportement en apparence bloquant (visibilité INITIATEUR retournée en METADATA au lieu de FULL sur PINS-CU-026 avec le compte `dsi@dgid.sn`) s'est révélé être **un artefact de cache navigateur** : la session Brave ordinaire conservait le bundle frontend pré-livraison, alors que la session en fenêtre privée exécutait le nouveau code et affichait correctement la vue FULL.

**Recommandation pour toutes les prochaines recettes de régression visuelle** :

1. Systématiquement valider en fenêtre privée **avant de conclure** à un FAIL
2. Si FAIL en navigation normale mais PASS en privée → ne pas rollback : invalider le cache (Ctrl+F5 ou purge du Service Worker) suffit
3. Si FAIL dans les deux modes → diagnostic backend/data confirmé

Une régression a néanmoins été consolidée par un hotfix défensif multi-couches (reconnaissance initiateur via `institutionSourceCode` + backfill SQL + masquage UI conditionnel), qui couvre toute désynchronisation future, voir section suivante.

---

## Recette post-livraison — 24/04/2026

Quatre tests d'acceptation complémentaires conduits après la livraison pour valider la gouvernance des parties prenantes et la préservation de la visibilité INITIATEUR.

### Test A — Visibilité FULL préservée pour l'INITIATEUR

#### Pré-requis

- Compte `dsi@dgid.sn` (INITIATEUR de PINS-CU-026)
- PINS-CU-026 existe en base avec DGID (INITIATEUR), ANSD (FOURNISSEUR actif), DGCPT (retirée/évincée)

#### Étapes

1. Se connecter avec `dsi@dgid.sn` (de préférence en fenêtre privée pour écarter le cache)
2. Ouvrir la fiche détail de PINS-CU-026
3. Observer le rendu complet

#### Résultat attendu

- En-tête : code, titre, résumé, base légale, badge "Mon rôle : Initiateur"
- **Aucun bandeau** "Informations détaillées réservées aux parties prenantes formellement désignées"
- **Aucun bouton** "Me porter partie prenante" (l'initiateur est déjà partie prenante par définition)
- Tableau Parties prenantes visible avec DGID + ANSD (section principale) et DGCPT (section "Retraits et évictions")
- Fil d'avis formels visible avec l'avis VALIDATION d'ANSD
- Historique des transitions visible
- Bloc Référentiels nationaux touchés visible
- `_visibility` dans la réponse API `/api/use-cases/:id` = `FULL`

#### Points de vigilance

- Si bandeau affiché malgré le rôle INITIATEUR : cache navigateur (purger), sinon bug backend `computeVisibility`
- Si bouton "Me porter partie prenante" visible : régression défense en profondeur `UseCaseHeader`

#### RÉSULTAT

- [x] PASS — 2026-04-24

---

### Test B — FOURNISSEUR désigné voit DETAILED

#### Pré-requis

- Compte `dsi@ansd.sn` (FOURNISSEUR actif de PINS-CU-026)

#### Étapes

1. Se connecter avec `dsi@ansd.sn`
2. Ouvrir la fiche détail de PINS-CU-026

#### Résultat attendu

- Mêmes blocs visibles qu'en Test A (stakeholders, fil d'avis, historique, référentiels)
- `_visibility` = `DETAILED` (pas FULL — les audit logs restent réservés à l'initiateur et à l'admin)
- Bouton "Amender mon avis" visible sur l'avis VALIDATION de l'ANSD (car ANSD en est l'auteur)
- Aucun bandeau METADATA, aucune invitation à l'auto-saisine

#### RÉSULTAT

- [x] PASS — 2026-04-24

---

### Test C — Non stakeholder voit METADATA avec modal d'auto-saisine motivée

#### Pré-requis

- Compte `dsi@dgpsn.sn` (institution non stakeholder de PINS-CU-026)

#### Étapes

1. Se connecter avec `dsi@dgpsn.sn`
2. Ouvrir la fiche détail de PINS-CU-026
3. Cliquer sur "Me porter partie prenante" dans le bandeau METADATA
4. Dans la modal `AutoSaisineModal` :
   - Sélectionner une typologie (ex. "Gouvernance transverse")
   - Saisir une motivation de moins de 50 caractères → vérifier que le bouton reste grisé
   - Compléter la motivation à 50+ caractères → bouton "Confirmer l'auto-saisine motivée" devient actif
5. Confirmer la soumission

#### Résultat attendu

- Bandeau METADATA visible à l'arrivée sur la fiche, avec bouton d'auto-saisine
- Modal `AutoSaisineModal` s'ouvre avec 4 options de typologie, textarea motif avec compteur temps réel, signature institutionnelle auto-remplie en lecture seule
- Bouton confirmer grisé tant que motif < 50 caractères OU typologie non sélectionnée
- Après soumission : stakeholder DGPSN créé avec `autoSaisine=true`, `motifAutoSaisine` et `typeConcernement` persistés en base
- Notification CONSULTATION_OUVERTE envoyée à l'initiateur avec message du type `[DGPSN] s'est portée partie prenante — motif : [50 premiers caractères]...`
- Rechargement de la fiche : DGPSN apparaît dans le tableau avec badge "Auto-saisie" et motif visible au hover ou dans la zone expansible "Voir les motifs d'auto-saisine"
- Visibilité bascule en DETAILED

#### RÉSULTAT

- [x] PASS — 2026-04-24

---

### Test D — Éviction DU avec anti-réinscription

#### Pré-requis

- Compte admin `admin@senum.sn`
- Une institution auto-saisie ou désignée non critique sur un cas d'usage test (par exemple DGPSN après Test C)

#### Étapes

1. Se connecter avec le compte admin
2. Ouvrir la fiche détail du cas d'usage contenant DGPSN
3. Sur la ligne DGPSN du tableau Parties prenantes, cliquer sur le bouton discret "Évincer" (rôle DU / SENUM_ADMIN requis)
4. Dans la modal `EvictStakeholderModal` :
   - Saisir un motif de moins de 50 caractères → bouton grisé
   - Compléter à 50+ caractères → bouton actif
5. Confirmer l'éviction
6. Se déconnecter, se reconnecter avec `dsi@dgpsn.sn`
7. Retourner sur la fiche du cas d'usage
8. Tenter de cliquer sur "Me porter partie prenante" depuis le radar sectoriel ou le bandeau

#### Résultat attendu

- DGPSN passe en `actif=false`, `evictionParDU=true`, `evictionMotif` persisté
- Ligne DGPSN migre vers la section "Retraits et évictions" avec mention "Évincée par la Delivery Unit" et motif tronqué
- Notification STAKEHOLDER_EVICTED reçue par DGPSN avec le motif complet
- Trace dans `UseCaseStatusHistory` avec auteur admin et motif "Éviction DU — ..."
- Côté DGPSN connectée : bandeau rouge sur la fiche METADATA avec message exact "Votre institution a été retirée de ce cas d'usage par la Delivery Unit." et lien mailto `dpi-interop@senum.sn`
- Aucun bouton "Me porter partie prenante" visible
- Tentative de réinscription via `POST /api/use-cases/:id/stakeholders` retourne **409 Conflict** avec le message "Votre institution a été retirée de ce cas d'usage par la Delivery Unit. Réinscription possible uniquement sur validation DU explicite."

#### Points de vigilance

- Si la réinscription passe en 201 au lieu de 409 : régression critique du principe contradictoire
- Si la notification d'éviction n'est pas envoyée : manquement au principe contradictoire (information de l'institution concernée)

#### RÉSULTAT

- [x] PASS — 2026-04-24

---

### Synthèse des 4 tests post-livraison

| Test | Scénario | Statut |
|------|----------|--------|
| A | Visibilité FULL préservée pour INITIATEUR | ✅ PASS |
| B | FOURNISSEUR désigné voit DETAILED | ✅ PASS |
| C | Non stakeholder → METADATA + modal auto-saisine motivée | ✅ PASS |
| D | Éviction DU + anti-réinscription 409 | ✅ PASS |

Références commits Git : `128fb2e`, `337838d`, `3e18d19`, `317a9d6`.

---

## Recette post-livraison — 25/04/2026 — Catalogue des propositions + typologie

Dix scénarios complémentaires couvrant la livraison P8+P9 (commits `490371d → 6115fca`).

### Test P8-1 — Migration du stock vers PROPOSE

**Pré-requis** : base avec stock MVP 0 existant, migrations appliquées.

**Étapes** :
```sql
SELECT typologie, COUNT(*) FROM cas_usage_mvp GROUP BY typologie;
SELECT "sourceProposition", COUNT(*) FROM cas_usage_mvp GROUP BY "sourceProposition";
SELECT "statutVueSection", COUNT(*) FROM cas_usage_mvp GROUP BY "statutVueSection";
SELECT code, "statutVueSection" FROM cas_usage_mvp
WHERE code IN ('PINS-CU-008','PINS-CU-011','PINS-CU-012','PINS-CU-019','PINS-CU-026');
```

**Attendu** : typologie unique TECHNIQUE, dormants en PROPOSE + ETUDE_SENUM, whitelist strictement non-PROPOSE, N traces inaltérables dans `use_case_status_history`.

**Statut local** : ✅ PASS (49 CU, 41 PROPOSE, whitelist 4/5 présents, 026 absent en local).

---

### Test P8-2 — Création d'une proposition par la DU

**Pré-requis** : compte `admin@senum.sn`.

**Étapes** : `/catalogue-propositions` → (pas de bouton créer dans l'UI V1, créer via API ou seed démo). Alternative : vérifier la présence des 10 propositions PINS-PROP-DEMO-NN via le seed `npx tsx prisma/seed-catalogue-p8p9.ts`.

**Attendu** : 10 propositions visibles, badges typologie/maturité/source corrects, pressenties affichées.

**Statut** : ✅ PASS (seed exécuté, 51 propositions au total, 4 METIER + 47 TECHNIQUE).

---

### Test P8-3 — Adoption directe par institution pressentie

**Pré-requis** : `dsi@apix.sn` (APIX pressentie sur PINS-PROP-DEMO-01).

**Étapes** :
1. `/catalogue-propositions` → ouvre PINS-PROP-DEMO-01
2. Bouton teal "Adopter" (APIX pressentie comme INITIATEUR_PRESSENTI)
3. Modal `AdoptionModal` : warning institutionnel navy visible, APIX en vert "deviendra INITIATEUR", autres pressenties décochables
4. Coche "Je confirme l'engagement institutionnel", clique `Adopter`

**Attendu** :
- Statut `PROPOSE → DECLARE → EN_CONSULTATION`
- Rename `PINS-PROP-DEMO-01 → PINS-CU-NNN` (ancienCode conservé)
- APIX devient INITIATEUR actif, pressenties retenues deviennent FOURNISSEUR/CONSOMMATEUR actifs
- Consultations SLA 15j ouvertes, notifications CONSULTATION_OUVERTE envoyées
- Trace inaltérable dans status history : motif "Adoption — APIX adopte la proposition…"
- Redirection vers `/admin/cas-usage/:id`

---

### Test P8-4 — Adoption motivée par institution non pressentie

**Pré-requis** : `dsi@dgpsn.sn` (DGPSN non pressentie sur PINS-PROP-DEMO-02).

**Étapes** :
1. `/catalogue-propositions/:id` ouvert sur PINS-PROP-DEMO-02
2. Bouton navy "Signaler notre intérêt"
3. Modal : warning ambre "Non pressentie, validation DU requise"
4. Textarea motif min 50 car (bouton grisé tant qu'insuffisant)
5. Coche engagement, clique "Transmettre la demande"

**Attendu** :
- Réponse 202 PENDING_VALIDATION
- Création AdoptionRequest status EN_ATTENTE
- Notification ARBITRAGE aux admins DU
- Proposition reste en statut PROPOSE

Puis login `admin@senum.sn` :
6. `GET /api/catalogue/adoption-requests` → la demande apparaît
7. `POST /api/catalogue/adoption-requests/:id/valider` → déclenche l'adoption effective (même workflow atomique que Test P8-3)

**Attendu après validation** : DGPSN initiatrice, renumérotation effective.

---

### Test P8-5 — Détection de doublons à la création

**Pré-requis** : `dsi@dgid.sn`.

**Étapes** :
1. `/mes-cas-usage` → "Déclarer un nouveau cas d'usage"
2. Étape 1 : choisir "Service technique"
3. Étape 2 : saisir titre "Consultation RCCM pour vérification entreprises"
4. Attendre le debounce 400ms

**Attendu** :
- Encart ambre avec PINS-PROP-DEMO-05 "Consultation RCCM" en suggestion adoptable
- Badge "Proposition adoptable" visible
- Lien "Voir les propositions" + bouton "Créer quand même un nouveau CU"
- Bouton "Continuer" grisé tant que doublons non acquittés

5. Clique "Créer quand même un nouveau CU" → étape 3 débloquée

**Statut** : couvert par le flux API `/catalogue/suggestions` (ILIKE fuzzy sur mots-clés).

---

### Test P8-6 — Archivage d'une proposition

**Pré-requis** : `admin@senum.sn`.

**Étapes (API uniquement en V1)** :
```http
POST /api/catalogue/propositions/:id/archive
Body: { "motif": "Proposition redondante avec PINS-PROP-DEMO-XX, fusion non pertinente (60+ caracteres)" }
```

**Attendu** :
- Statut `PROPOSE → ARCHIVE`
- Transition tracée avec motif dans status history
- Notifications ARBITRAGE aux pressenties
- Proposition invisible du catalogue par défaut (statut filtré)

Désarchivage possible via `PATCH` typologie ou manuel DB si besoin.

---

### Test P9-1 — Création d'un parcours métier

**Pré-requis** : `dsi@apix.sn`.

**Étapes** :
1. `/mes-cas-usage` → "Déclarer un nouveau cas d'usage"
2. Étape 1 : choisir "Parcours métier" (navy)
3. Étape 2 : titre + résumé (aucune suggestion proche → continuer direct)
4. Étape 3 : badge navy "Parcours métier" en tête, formulaire adapté
5. Remplir titre, résumé, base légale, stakeholders pressentis (DGID FOURNISSEUR, ANSD FOURNISSEUR)
6. **Multi-select "Services techniques mobilisés"** : sélectionner 2-3 techniques du pipeline (ex. PINS-PROP-DEMO-05 Consultation RCCM, mais seuls les CU déjà adoptés en pipeline apparaîtront)
7. Soumettre

**Attendu** :
- Création du CU avec `typologie=METIER`
- Création automatique des `RelationCasUsage` (une par technique sélectionnée)
- Vérification côté backend que chaque technique a bien `typologie=TECHNIQUE` (sinon skip)
- Consultations SLA 15j ouvertes pour les stakeholders

---

### Test P9-2 — Bloc "Services techniques mobilisés" sur fiche métier

**Pré-requis** : un CU métier existant avec relations (cf. Test P9-1).

**Étapes** :
1. `/admin/cas-usage/:id` du CU métier
2. Badge navy "Parcours métier" en tête
3. Bloc "Services techniques mobilisés" visible

**Attendu** :
- Liste ordonnée : code technique, titre, institution détentrice, obligatoire/conditionnel, statut disponibilité
- Indicateur global "X sur Y services techniques sont disponibles en production"
- Bouton "Ajouter" visible (initiatrice + DU)
- Clic sur un service technique → navigation vers sa fiche

---

### Test P9-3 — Bloc "Parcours métier servis" sur fiche technique

**Pré-requis** : un CU technique mobilisé par au moins 2 parcours métier.

**Étapes** :
1. `/admin/cas-usage/:id` du CU technique
2. Badge teal "Service technique" en tête
3. Bloc "Parcours métier servis"

**Attendu** :
- Badge criticité à droite : SPECIFIQUE (1), MUTUALISE (2-4), CRITIQUE (5-9), HYPER-CRITIQUE (10+)
- Liste des parcours cliquables avec code + titre + institution porteuse + statut

---

### Test P9-4 — Reclassement typologique par la DU

**Pré-requis** : `admin@senum.sn`.

**Étapes** :
1. Ouvrir un CU en TECHNIQUE, ex. `PINS-CU-008`
2. Lien discret "Reclasser" dans l'en-tête (visible admin seulement)
3. Modal `ReclasserTypologieModal` : transition visuelle TECHNIQUE → METIER, warning ambre
4. Textarea motif min 50 car (bouton grisé si insuffisant)
5. Saisir motif 55+ car, confirmer

**Attendu** :
- `PATCH /api/use-cases/:id/typologie` réussi
- `reclassementsTypologie` JSON append-only mis à jour avec l'entrée
- Badge typologie passe à "Parcours métier" (navy)
- Notification ARBITRAGE envoyée à l'institution initiatrice
- Trace visible au rechargement

---

### Synthèse des tests P8+P9

| Test | Scénario | Statut |
|------|----------|--------|
| P8-1 | Migration du stock → PROPOSE | ✅ PASS (local) |
| P8-2 | Création propositions via seed | ✅ PASS (10 propositions) |
| P8-3 | Adoption directe (pressentie) | 🔄 À tester UI |
| P8-4 | Adoption motivée (non pressentie + validation DU) | 🔄 À tester UI |
| P8-5 | Détection doublons (formulaire) | ✅ PASS (API) |
| P8-6 | Archivage proposition | 🔄 À tester API |
| P9-1 | Création parcours métier avec relations | 🔄 À tester UI |
| P9-2 | Bloc services techniques mobilisés | 🔄 À tester UI |
| P9-3 | Bloc parcours métier servis + criticité | 🔄 À tester UI |
| P9-4 | Reclassement typologique DU | 🔄 À tester UI |

Références commits Git : `490371d`, `0a86117`, `4ace260`, `da528f9`, `d0e0497`, `e3732e8`, `0aa3912`, `6115fca`, `f3572c5`.

---

## Recette navigation — 25/04/2026 — Refonte en 5 rubriques

### Test N1 — Point Focal voit 4 rubriques + Tableau de bord

**Pré-requis** : `dsi@dgid.sn` (role INSTITUTION).

**Étapes** :
1. Login
2. Observer la sidebar

**Attendu** :
- Tableau de bord en tête (hors rubriques)
- 3 rubriques collapsibles : Mon espace (3 items), Catalogue (5 items), Écosystème (5 items)
- **Aucune** rubrique Pilotage ni Administration
- Rubrique "Catalogue" ouverte automatiquement si on arrive par `/catalogue/propositions`
- Total visible : 1 lien tableau de bord + 3 rubriques (fermées par défaut sauf celle active)

---

### Test N2 — DU voit Pilotage en plus

**Pré-requis** : `admin@senum.sn` (role ADMIN).

**Étapes** : login → observer sidebar.

**Attendu** :
- 4 rubriques : Mon espace, Catalogue, Écosystème, Pilotage
- Rubrique Pilotage contient 12 items dont "Arbitrage DU" et "File d'adoptions"
- Administration visible (1 item : Utilisateurs)
- Compteurs contextuels chargés en arrière-plan (React Query 60s staleTime)

---

### Test N3 — SENUM_ADMIN voit tout

**Pré-requis** : compte avec role ADMIN (= role SENUM_ADMIN dans ce schéma).

**Étapes** : login → observer sidebar.

**Attendu** :
- 5 rubriques : Mon espace, Catalogue, Écosystème, Pilotage, Administration
- Total : 27 items répartis (cf. `docs/vue-360/navigation-refonte.md`)

---

### Test N4 — Navigation vers nouvelles entrées

**Étapes** :
1. Login admin
2. Clique "Catalogue > Propositions" → attendre `/catalogue/propositions` (status 200, liste des propositions)
3. Clique "Catalogue > Parcours métier" → `/catalogue/parcours-metier` (status 200, filtre typologie=METIER)
4. Clique "Catalogue > Services techniques" → `/catalogue/services-techniques` (status 200, filtre typologie=TECHNIQUE)
5. Clique "Pilotage > File d'adoptions" → `/du/adoptions` (status 200, tabs En attente/Historique)

**Attendu** : aucune 404, tous les écrans se chargent.

---

### Test N5 — Préservation des routes existantes

**Étapes** :
1. Login admin
2. Tape directement `/du/arbitrage` dans la barre URL

**Attendu** :
- La page se charge (pas de redirection cassée)
- La rubrique **Pilotage** s'ouvre automatiquement dans la sidebar
- L'item **Arbitrage DU** est surligné teal
- L'ancienne URL `/catalogue-propositions` redirige vers `/catalogue/propositions` (HTTP 200 après redirect)
- `/catalogue-propositions/:id` redirige vers `/catalogue/propositions/:id` en conservant le `:id`

---

### Test N6 — Compteurs contextuels

**Pré-requis** : `dsi@dgid.sn` avec au moins 3 CU actifs.

**Étapes** :
1. Login DGID
2. Observer "Mon espace > Mes cas d'usage"

**Attendu** : badge teal à droite avec le chiffre (ex. `3`).

Pour admin :
1. Login `admin@senum.sn`
2. S'il y a au moins une `AdoptionRequest` en `EN_ATTENTE`, badge rouge sur "File d'adoptions"
3. S'il y a des désaccords en cours, badge ambre sur "Arbitrage DU"

Si les valeurs sont 0, **aucun badge n'est affiché** (pas de `0` qui pollue visuellement).

---

### Synthèse Navigation

| Test | Scénario | Statut |
|------|----------|--------|
| N1 | Point Focal — 4 rubriques + Tableau de bord | ✅ PASS |
| N2 | DU — ajout Pilotage | ✅ PASS |
| N3 | SENUM_ADMIN — toutes rubriques visibles | ✅ PASS |
| N4 | Nouvelles routes catalogue + adoptions DU | ✅ PASS |
| N5 | Préservation routes + redirect ancien URL | ✅ PASS |
| N6 | Compteurs contextuels (caché si zéro) | ✅ PASS |

Références commits Git : (voir commit navigation-refonte ci-dessous)
