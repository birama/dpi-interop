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

## À traiter

- [ ] Badge "Non trouvée" sur certaines institutions dans les Soumissions — vérifier la logique de matching
- [ ] États vides non gérés sur certains blocs (ex: 0 conventions → message plus explicite)
- [ ] Couleurs chips statut à harmoniser entre dashboard existant et Vue 360°
- [ ] Accents manquants dans les textes Vue 360° (contrôlé via constants.ts)
