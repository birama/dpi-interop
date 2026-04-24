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
