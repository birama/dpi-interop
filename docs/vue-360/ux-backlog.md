# Backlog UX — Vue 360° et corrections générales

À traiter en phase "polish UX" après recette E2E, avant validation M. Diaby.

## Corrigés

- [x] **SearchableSelect affichait les UUID comme label principal** — `searchable-select.tsx` et `multi-searchable-select.tsx` : `option.value` (UUID) remplacé par `option.label` (nom lisible) dans le trigger et le dropdown. Recherche ne cherche plus sur UUID.
- [x] **QuestionnairePage : institutionOptions label = code seul** — enrichi en `${code} — ${nom}` avec sublabel = ministère.
- [x] **UtilisateursPage : institutionOptions label = nom seul** — enrichi en `${code} — ${nom}` avec sublabel = ministère.

## À traiter

- [ ] Badge "Non trouvée" sur certaines institutions dans les Soumissions — vérifier la logique de matching
- [ ] États vides non gérés sur certains blocs du dashboard (ex: 0 conventions → message plus explicite)
- [ ] Couleurs chips statut à harmoniser entre dashboard existant et Vue 360°
- [ ] Accents manquants dans les textes Vue 360° (contrôlé via constants.ts)
