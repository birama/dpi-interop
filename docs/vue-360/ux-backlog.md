# Backlog UX — Vue 360° et corrections générales

À traiter en phase "polish UX" après recette E2E, avant validation M. Diaby.

---

## Doctrine — Règles d'architecture d'information

Ces règles doivent guider toutes les futures additions de modules à l'application.

### R1 — Le dashboard est une vue de synthèse, pas d'action

Le dashboard (`/dashboard`) présente l'état de l'institution : maturité, flux, conventions, cas d'usage MVP, readiness X-Road. Les modules opérationnels (actions quotidiennes, flux de travail) ont leurs **pages dédiées**. On relie les deux par des **alertes contextuelles** dans le bandeau "Actions requises" du dashboard, pas par empilement de blocs.

**Application concrète :**
- Les 4 blocs Vue 360° (Sollicitations, Mes CU initiés, Radar, Qui me concernent) sont sur `/mes-cas-usage`, pas sur le dashboard
- Le bandeau "Actions requises" du dashboard affiche une passerelle cliquable quand des sollicitations sont en attente
- Les futurs modules (conformité, pilotage conventions...) suivront le même pattern

### R2 — Pas de jargon projet dans l'interface

L'interface utilisateur ne mentionne jamais :
- Versions de documents (v1.0, v1.1, ADDENDUM)
- Références documentaires (MCTN/DU/APP-DPI-INTEROP/...)
- Événements projet (Matinée DPI, décisions internes)
- Noms des auteurs/validateurs (Birama DIOP, M. DIABY)
- Jargon conceptuel (mécanisme anti-duplication, articulation AEG → PINS, socle fondateur)

Si une information de traçabilité est utile, elle va en meta-description ou dans un footer discret, jamais en bandeau principal.

### R3 — UUID jamais visibles

Les identifiants techniques (UUID, CUID) sont invisibles dans l'UI. Les sélecteurs affichent toujours `CODE — Nom lisible` en label principal, ministère/sous-détail en sublabel. La recherche fonctionne sur les noms, pas sur les IDs.

### R4 — Debounce sur les inputs qui déclenchent des requêtes

Un input de filtre/recherche qui fait partie d'une `queryKey` React Query doit être **debouncé** (400ms minimum). Sinon chaque frappe relance une requête, le composant se re-render avec `isLoading=true`, et le focus est perdu. Utiliser aussi `placeholderData` pour garder les données précédentes pendant le refetch.

---

## Corrigés

- [x] **SearchableSelect affichait les UUID comme label principal** — `searchable-select.tsx` et `multi-searchable-select.tsx` : `option.value` (UUID) remplacé par `option.label` (nom lisible). Harmonisation des instOptions sur 7 pages.
- [x] **QuestionnairePage, UtilisateursPage, ConventionsPage, DemandesPage, ImportPage, RegistresNationauxPage** : `label: ${code} — ${nom}`, sublabel = ministère.
- [x] **UtilisateursPage — curseur qui saute** : debounce 400ms sur la recherche + `placeholderData` pour éviter le spinner plein écran.
- [x] **Dashboard alourdi par 4 blocs Vue 360°** : extraction en page dédiée `/mes-cas-usage` + passerelle cliquable dans le bandeau Actions requises du dashboard (R1).
- [x] **Références documentaires sur `/registres/couverture`** : retrait du badge ADDENDUM v1.1, de la mention Matinée DPI, des formulations jargon (R2).
- [x] **Bandeau METADATA sans action** : le lien "vous porter partie prenante" sur la fiche 360° d'un cas d'usage en METADATA est devenu un vrai bouton `POST /use-cases/:id/stakeholders` avec auto-saisine.
- [x] **Distinction Mes demandes / Mes cas d'usage** : encart pédagogique discret en tête de `/institution/demandes` (fond teal-50, icône Info, lien cliquable vers `/mes-cas-usage`, dismissible avec persistance localStorage `demandes-info-dismissed`).
- [x] **[HOTFIX] Régression visibilité INITIATEUR après chantier P7** — 24/04/2026.
  L'initiateur d'un cas d'usage voyait la fiche en METADATA au lieu de DETAILED suite
  à la migration P7 (ajout `dateRetrait`, `evictionParDU`, etc.). Bandeau orange
  "Me porter partie prenante" s'affichait pour l'initiateur lui-même, incohérent.
  Cause probable : désalignement de `actif` sur certains stakeholders préexistants,
  ou cache frontend obsolète. Correctif défensif multi-couches :
  (1) `computeVisibility` reconnaît l'initiateur via `casUsage.institutionSourceCode`
  (comparaison de code institution) en plus du fallback stakeholder — indépendant de
  l'état `actif` ;
  (2) migration `20260424140000_backfill_stakeholder_actif` qui force `actif=true` sur
  tout INITIATEUR et backfille toute ligne `actif IS NULL` ;
  (3) `UseCaseHeader` masque le bandeau et le bouton si `alreadyRegistered` (stakeholder
  actif ou initiateur reconnu par code institution), défense en profondeur côté UI.

## À traiter

- [ ] **[HAUTE] Exposition du mécanisme d'amendement d'avis** — découverte recette S3 du 24/04/2026.
  Le backend expose `PATCH /api/feedback/:id/amend` et le modèle `UseCaseFeedback` a le champ
  `amendeDe`, mais l'UI `FeedbacksFeed.tsx` n'a aucun bouton pour déclencher l'amendement.
  Impact : un Point Focal ne peut pas corriger une erreur de saisie, une institution ne peut
  pas faire évoluer sa position après débat hiérarchique. Casse l'autonomie institutionnelle.
  Action : bouton "Amender mon avis" visible par l'auteur uniquement, si le CU n'est pas en
  statut QUALIFIE ou postérieur. Réutiliser la modal `FeedbackModal` en mode préremplissage.
  Afficher le nouvel avis indenté sous l'avis parent (pattern déjà livré en P4).
  Effort estimé : 2-3h.

- [ ] **[MOYENNE] Champs concernés des registres non affichés en fiche détail** — observé sur
  PINS-CU-026 : la colonne "Champs concernés" du bloc "Référentiels nationaux touchés"
  affiche `—` même quand les champs ont été saisis à la création.
  À investiguer : la modal de déclaration envoie-t-elle bien `champsConcernes` en string[] ?
  Le backend le stocke-t-il correctement en Json ? Le composant `RegistresTouchesTable` le
  rend-il correctement ?

- [ ] **[MOYENNE] Actions d'arbitrage DU effectives (P7)** — découverte recette S5.
  Les boutons "Convoquer cadrage" et "Décision d'arbitrage" de `/du/arbitrage` retournent
  actuellement un toast stub "Action en cours d'implémentation". À opérationnaliser :
  - Convocation formelle avec propagation de notifications aux parties concernées
  - Enregistrement de la décision d'arbitrage dans le journal inaltérable avec motivation
  - Éventuelle intégration avec un système de visio ou d'agenda (à cadrer)
  Effort : 1 à 2 jours selon la sophistication retenue.

- [ ] **[À QUALIFIER] Page `/documents` vide** — observé lors de la navigation.
  La page "Documents de référence" affiche son titre mais aucun contenu. À déterminer :
  stub jamais implémenté, ou composant prêt en attente de données en base ?
  Décision attendue : soit implémenter, soit masquer l'entrée de menu, soit supprimer.
  Hors périmètre Vue 360°.

- [ ] Badge "Non trouvée" sur certaines institutions dans les Soumissions — vérifier la logique de matching
- [ ] États vides non gérés sur certains blocs (ex: 0 conventions → message plus explicite)
- [ ] Couleurs chips statut à harmoniser entre dashboard existant et Vue 360°
- [ ] Accents manquants dans les textes Vue 360° (contrôlé via constants.ts)

Articulation "Mes demandes" vs "Mes cas d'usage" — décision 23/04/2026.
Constat. Le module "Mes demandes" (tickets DU génériques) existe dans l'app depuis sa phase initiale. Il permet aux institutions de soumettre des demandes ponctuelles à la Delivery Unit sans passer par le pipeline de qualification Vue 360°. Certaines de ces demandes relèvent conceptuellement d'un cas d'usage PINS (échange de données récurrent entre administrations).
Décision. Pas de conversion rétroactive des demandes existantes en cas d'usage. Les nouvelles demandes d'accès à des données inter-administrations devront être créées directement dans "Mes cas d'usage" (pipeline Vue 360°). Le stock historique de "Mes demandes" reste consultable mais n'alimente pas le catalogue PINS.
Justification. Une conversion rétroactive produirait des cas d'usage incomplets (sans base légale, sans stakeholders formellement désignés, sans rattachement aux référentiels). La recréation explicite par les institutions est le mécanisme qui donne sa valeur au catalogue — c'est précisément ce processus qui matérialise l'engagement institutionnel.
Traitement à prévoir.

Court terme : ajouter dans le module "Mes demandes" un encart explicatif indiquant clairement le bon usage de chaque module. Exemple : "Pour un échange de données récurrent entre administrations, créez plutôt un cas d'usage dans Mes cas d'usage."
Moyen terme : envisager la convergence des deux modules dans un flux unifié avec qualification amont par le système (ticket simple vs. cas d'usage formel).
Long terme : à trancher avec M. Diaby dans le cadre de la gouvernance générale du pilotage DU.

## P7 — Gouvernance du statut de partie prenante (désignation, auto-saisine, retrait)

**Périmètre regroupé** : trois fonctionnalités liées qui ne peuvent pas être 
traitées séparément car elles forment un système cohérent de gouvernance 
des accès DETAILED.

### Sous-chantier 1 — Confirmation motivée de l'auto-saisine

Actuellement, le bouton "Me porter partie prenante" crée le stakeholder 
en un clic, sans justification ni confirmation, et bascule immédiatement 
l'institution en visibilité DETAILED. Risque : contournement trivial 
de la transparence contrôlée.

**Évolution proposée** :
- Le bouton ouvre une modal de confirmation obligatoire
- Saisie d'un motif d'auto-saisine (min 50 caractères)
- Sélection d'une typologie de concernement (données détenues, processus 
  impacté, gouvernance transverse, autre avec précision)
- Signature institutionnelle auto-remplie depuis la session
- Notification envoyée à l'initiateur ("DGCPT s'est portée partie 
  prenante — motif : ...")

**Question ouverte à trancher en cadrage** : l'auto-saisie doit-elle 
donner accès DETAILED immédiatement, ou introduire un statut intermédiaire 
"auto-saisie en attente de validation" avec visibilité limitée tant que 
l'initiateur ou la DU n'a pas validé ? Cette question touche au niveau 
de contrôle attendu par les administrations détentrices de données 
sensibles (DGID, MJ, CDP).

### Sous-chantier 2 — Retrait à l'initiative de l'institution

Une institution auto-saisie doit pouvoir se désinscrire elle-même d'un 
cas d'usage (erreur de clic, réévaluation de pertinence, changement 
d'avis institutionnel).

**Évolution proposée** :
- Bouton "Me retirer de ce cas d'usage" visible uniquement pour les 
  stakeholders avec autoSaisine=true et qui n'ont pas encore émis 
  d'avis formel
- Modal de confirmation avec motif optionnel
- Le stakeholder passe en état "actif=false" (suppression logique, pas 
  physique)
- Transition tracée dans UseCaseStatusHistory avec auteur = l'institution
- L'institution repasse en visibilité METADATA
- Notification à l'initiateur ("DGCPT s'est retirée du cas d'usage — 
  motif : ...")

**Note** : les stakeholders désignés par l'initiateur (FOURNISSEUR, 
CONSOMMATEUR) ne bénéficient pas de ce retrait — ils doivent émettre 
un avis (validation, réserve, refus motivé). Seules les auto-saisines 
et les PARTIES_PRENANTES peuvent se retirer.

### Sous-chantier 3 — Éviction par la Delivery Unit

La DU ou un SENUM_ADMIN doit pouvoir retirer une partie prenante jugée 
illégitime, abusive, ou non conforme aux exigences de confidentialité 
du cas d'usage.

**Évolution proposée** :
- Bouton "Retirer cette partie prenante" accessible uniquement aux rôles 
  DU et SENUM_ADMIN dans le tableau des parties prenantes
- Motivation obligatoire (min 50 caractères) — acte d'autorité nécessitant 
  redevabilité
- Notification motivée envoyée à l'institution évincée (principe du 
  contradictoire)
- Transition tracée dans UseCaseStatusHistory avec auteur DU et motif
- L'institution évincée ne peut pas se réinscrire sur ce cas d'usage 
  sans validation DU explicite (flag "eviction" dans la table stakeholder 
  ou liste noire dédiée)
- Cette éviction est visible dans l'historique comme acte d'autorité, 
  consultable par l'initiateur et les autres parties prenantes

### Dépendances

- **Schéma Prisma** : ajouter champs `motifAutoSaisine`, `typeConcernement`, 
  `motifRetrait`, `eviction` et `evictionMotif` au modèle UseCaseStakeholder
- **API** : nouvelles routes PATCH /api/use-cases/:id/stakeholders/:sid/withdraw 
  (par soi) et DELETE /api/use-cases/:id/stakeholders/:sid (par DU)
- **UI** : trois modales distinctes (confirmation auto-saisine, retrait 
  spontané, éviction DU) avec leur logique d'affichage conditionnel
- **Notifications** : trois nouveaux types (AUTO_SAISINE_MOTIVEE, 
  STAKEHOLDER_WITHDRAWN, STAKEHOLDER_EVICTED)
- **Historique inaltérable** : préservation automatique via trigger existant

### Priorité

**Haute** pour la transparence contrôlée (sous-chantier 1) — c'est 
un enjeu de sécurité et de conformité RGPD.

**Moyenne** pour le retrait spontané et l'éviction DU — ces mécanismes 
corrigent des cas d'erreur mais ne sont pas immédiatement bloquants.

### Effort estimé

Backend : 4 à 6 heures
Frontend : 6 à 8 heures
Tests : 2 à 3 heures
**Total : 12 à 17 heures de développement**

### Justification institutionnelle

Ces trois mécanismes forment le **système complet de gouvernance des 
parties prenantes**. Sans eux, la transparence contrôlée promise par 
la conception v1.0 reste formelle mais pas effective : une institution 
mal intentionnée ou simplement curieuse peut accéder à tous les détails 
de n'importe quel cas d'usage en un clic, sans justification, et sans 
moyen de rollback. Leur implémentation en P7 est un prérequis pour 
que la plateforme soit présentable à la Commission de Protection des 
Données comme respectueuse du principe de minimisation.

---

## Priorisation synthétique (24 avril 2026, post-recette E2E)

| # | Chantier | Priorité | Effort | Catégorie |
|---|----------|----------|--------|-----------|
| 1 | Amendement d'avis (exposition UI) | Haute | 2-3h | Fonctionnalité livrée non exposée |
| 2.1 | Confirmation motivée de l'auto-saisine | Haute | 4-5h | Sécurité / RGPD |
| 2.2 | Retrait à l'initiative de l'institution | Moyenne | 3-4h | Ergonomie institutionnelle |
| 2.3 | Éviction par la DU | Moyenne | 4-5h | Gouvernance |
| 3 | Actions d'arbitrage DU effectives | Moyenne | 1-2j | Workflow P7 prévu |
| 4 | Champs concernés registres non affichés | Moyenne | 1h | Bug rendu |
| 5 | Articulation "Mes demandes" / "Mes cas d'usage" | À cadrer | Variable | Architecture d'information |
| 6 | Page `/documents` vide | À qualifier | Variable | Hors périmètre Vue 360° |

**Estimation totale dette P7 Vue 360°** : environ 15 à 25 heures de développement, hors chantiers « à cadrer » (entrées 5 et 6).

### Jalons recommandés

- **Avant démo M. Diaby** : #1 (amendement) + #4 (champs registres) → ~4h
- **Avant diffusion élargie (CDP, GIZ, Cabinet)** : #2.1 (confirmation auto-saisine) prérequis RGPD → +5h
- **Phase P7 complète** : #2.2 + #2.3 + #3 pour fermer la gouvernance → +2 à 3 jours
- **Post-validation institutionnelle** : #5 + #6 à trancher en cadrage dédié
