# P10-MVP — Vue lecture questionnaire

Référence : MCTN/DU/CONC-P10-MVP-2026-01 · 2026-05-15

## Objectif

Présenter par défaut une **vue synthèse exécutive** sur `/questionnaire/:id`, et ne basculer en mode édition qu'à la demande explicite avec contrôle RBAC. Cible immédiate : atelier stratégique du 19/05/2026 (lecture rapide pour DU, MCTN, PTF, démo institutionnelle).

## Architecture

```
Route /questionnaire/:id
─────────────────────────────────────────────────────────
URL                       Comportement
/questionnaire/:id        Mode LECTURE (défaut, tous rôles)
/questionnaire/:id?mode=edit  Mode ÉDITION (RBAC requis)
```

Bascule par query param. La page courante `QuestionnairePage.tsx` (orchestrateur stepper 8 étapes) reste inchangée — elle est juste rendue conditionnellement.

## Matrice RBAC

| Rôle | Défaut | Bouton "Éditer" | Comportement bascule |
|---|---|---|---|
| INSTITUTION (propriétaire `institutionId === user.institutionId`) | LECTURE | ✅ "Éditer" | Bascule directe (statut DRAFT) ou vue locked (statut SUBMITTED+) |
| INSTITUTION (autre) | LECTURE | ❌ | API renvoie 403 si `?mode=edit` forcé |
| ADMIN | LECTURE | ✅ "Éditer (admin)" + warning | Bascule complète |
| BAILLEUR | LECTURE | ❌ | Pas d'accès `?mode=edit` |

L'API backend (`GET /api/submissions/:id`) gère déjà ce RBAC inline via `ensureSubmissionAccess`. Pas de changement nécessaire côté backend pour le MVP.

## Composants

```
frontend/src/modules/questionnaire/
├── QuestionnairePage.tsx           (modifié — branche lecture/édition)
├── QuestionnaireReadOnlyView.tsx   (NOUVEAU)
└── readonly/                       (NOUVEAU)
    ├── SectionCard.tsx             (card wrapper d'un chapitre)
    ├── ReadField.tsx               (rendu d'un champ : scalar / longtext / boolean / array)
    └── KpiBar.tsx                  (4 KPI cards : complétion, SI, registres, flux)
```

## Layout cible

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│   <Code institution> — <Nom>                             │
│   Statut: DRAFT/SUBMITTED/...                            │
│   Mise à jour : 15/05/2026 17:32                         │
│   [Bouton "Éditer"] (conditionnel)                       │
├─────────────────────────────────────────────────────────┤
│ KPI GRID (4 cards)                                       │
│  📊 Complétion 85%   🖥️ SI: 7    📚 Registres: 3        │
│  🔗 Flux: 5          ✅ Réponses positives: 32           │
├─────────────────────────────────────────────────────────┤
│ SECTION CARDS (8 chapitres dépliables, ouverts par défaut)│
│  [▼] Step 1 — Gouvernance données                        │
│      Data Owner : Birama Diop                            │
│      Email : birama@senum.sn                             │
│      ...                                                  │
│  [▼] Step 2 — Systèmes (applications + registres + infra)│
│      7 applications, 3 registres, 12 items infra         │
│      (tableau condensé)                                  │
│  ...                                                     │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                   │
│   [Retour]  [Éditer →] (conditionnel)                    │
└─────────────────────────────────────────────────────────┘
```

## Affichage des types de réponses

| Type | Rendu |
|---|---|
| Champ texte court non vide | `<p className="font-medium">…</p>` |
| Champ texte court vide | `<span className="text-gray-400 italic">Non renseigné</span>` |
| Champ texte long | `<p className="whitespace-pre-line">…</p>` collapsible si >300 char |
| Booléen vrai (`reponse=OUI`) | ✅ texte teal |
| Booléen faux (`reponse=NON`) | ❌ texte amber |
| Booléen N/A (`reponse=null`) | ⚪ gris italique |
| Score maturité (0-5) | barre + chiffre, couleur amber→teal selon valeur |
| Tableau (applications, registres, etc.) | mini-table condensée 4-5 colonnes |
| Tableau vide | placeholder "Aucun élément déclaré" |

## Charte

- Navy `#0C1F3A` — titres section
- Teal `#0A6B68` — accents positifs, OUI, bouton primaire
- Gold `#D4A820` — badges importants
- Amber `#C55A18` — NON, alertes
- Cards : `shadow-sm rounded-lg border` (shadcn/ui)

## Hors scope MVP (P10 post-atelier)

- Endpoint dédié `/synthese` avec KPIs précalculés backend (optimisation, pas critique)
- Mécanisme correction admin champ-par-champ avec modal + motif + audit
- Export PDF synthèse exécutive
- Notification mail institution sur correction
- Comparateur de versions

## Plan d'implémentation

| Étape | Effort | Fichiers |
|---|---|---|
| A. Doc conception | 30min | ce fichier |
| B. (Pas d'endpoint) | 0 | — |
| C. Composant lecture | 2-3h | `QuestionnaireReadOnlyView.tsx` + helpers |
| D. Refactor route | 15min | `QuestionnairePage.tsx` |
| E. RBAC bouton | 15min | dans composant lecture |
| F. Build local | 15min | npm run build × 2 |
| G. Deploy prod | 30min | pscp + docker cp + smoke |

Total : ~4h pour le MVP fonctionnel.
