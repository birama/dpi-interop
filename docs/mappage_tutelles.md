# Tableau de mappage — Institution.ministere → EntiteTutelle

**Valeurs autorisées pour la colonne décision :**
- `code d'une entité existante` (ex: `MIN-SANTE-HYGIENE-PUBLIQUE-2026-1130`)
- `ENTITE_A_CREER:<TYPE>` pour les entités non ministérielles actuelles manquantes
- `ENTITE_HIST_A_CREER` pour un ministère antérieur absent du référentiel (code `-HIST`, statut `CLOTUREE`, sans référence ni date)
- `NULL_A_QUALIFIER` — l'institution doit être qualifiée avant rattachement
- `NON_PERTINENT` — la valeur n'exprime pas une tutelle (ex: PTF, PAENS)
- **Exceptions** : liste d'UUID d'institutions traitées différemment de la décision principale

**Règles pour la colonne proposition :**
- Remplie UNIQUEMENT pour les correspondances mécaniques (accents, casse, ponctuation)
- Vide pour les sigles historiques (MCTDAT, MITTD, etc.) et les 25 "À compléter"
- Vide pour les noms complets qui ressemblent à des libellés canoniques (confrontation nécessaire)

---

## 3B — Confrontation des libellés complets

| Valeur existante | Libellé décret 2026-1130 le plus proche | Écart |
|---|---|---|
| Ministère de l'Éducation Nationale | Ministère de l'Education Nationale | Accent + `l'` |
| Ministère des Finances et du Budget | Ministère de l'Economie, des Finances et du Plan | Scission/refonte |
| Ministère de la Santé et de l'Action Sociale | Ministère de la Santé et de l'Hygiène Publique | Périmètre différent (Action Sociale → Famille) |

---

## ⚠ URGENT — À traiter en premier
**Décision actée** : les deux convergent vers MIN-ECONOMIE-FINANCES-PLAN-2026-1130 (26 ministères de plein exercice, délégations retirées du référentiel).
**Décision actée** : les deux convergent vers  (26 ministères de plein exercice, délégations retirées du référentiel).
| # | valeur_origine | nb | poids (C/S/R) | proposition | décision | exceptions | commentaire |
|---|---|---|---|---|---|---|---|
| 1 | Finances | 12 | 76/4/0 | | | ARCOP (régulation) | **Périmètre pilote (76 cas).** DGCPT, DGID, DGD, DTAI, etc. |
| 2 | Économie | 7 | 25/6/0 | | | | **Périmètre pilote (25 cas).** ANSD, APIX, DCEF, etc. |

## Tableau principal

| # | valeur_origine | nb | poids (C/S/R) | proposition | décision | exceptions | commentaire |
|---|---|---|---|---|---|---|---|
| 1 | Affaires Étrangères | 3 | — | | | | Libellé court. Décret 2026 : Intégration Africaine, Affaires étrangères et Sénégalais de l'Extérieur |
| 2 | Agriculture | 9 | 0/0/0 | | | | Libellé court. Décret 2026 : Agriculture, Souveraineté Alimentaire et Elevage |
| 3 | Autre | 16 | 0/0/0 | | | | Catégorie fourre-tout. Contient administrations sectorielles, agences, banques, autorités contractantes. 16 institutions à ventiler individuellement |
| 4 | Culture | 7 | 0/1/0 | | | | Libellé court. Décret 2026 : Culture, Artisanat et Tourisme |
| 5 | Emploi | 7 | 0/1/0 | | | | Libellé court. Décret 2026 : Emploi et Formation Professionnelle et Technique |
| 6 | Enseignement Superieur | 1 | 0/1/0 | `MIN-ENSEIGNEMENT-SUPERIEUR-RECHERCHE-INNOVATION-2026-1130` | | | Mécanique : accent |
| 7 | Enseignement Supérieur | 7 | 0/0/0 | `MIN-ENSEIGNEMENT-SUPERIEUR-RECHERCHE-INNOVATION-2026-1130` | | | Mécanique : accent |
| 8 | Environnement | 4 | 0/0/0 | | | | Libellé court. Décret 2026 : Environnement et Transition Ecologique |
| 9 | Famille | 5 | 3/1/0 | | | | Libellé court. Décret 2026 : Famille, Action sociale et Solidarités |
| 10 | Finances | 12 | 76/4/0 | | | | **Périmètre pilote (76 cas, 4 soumissions).** Libellé court. Décret 2026 : Economie, Finances et Plan (scission Budget séparé) |
| 11 | Fonction Publique | 8 | 6/2/0 | | | | Libellé court. Décret 2026 : Fonction Publique, Travail et Réforme du Service Public |
| 12 | Forces Armées | 3 | 0/0/0 | | | | Libellé court. Décret 2026 : Forces Armées |
| 13 | Hydraulique | 5 | 0/1/0 | | | | Libellé court. Décret 2026 : Hydraulique et Assainissement |
| 14 | Industrie | 10 | 0/3/0 | | | | Libellé court. Décret 2026 : Industrie et Commerce |
| 15 | Infrastructures | 3 | 0/0/0 | | | | Libellé court. Décret 2026 : Infrastructures |
| 16 | Institution régionale (UEMOA) | 1 | 1/0/0 | | | NULL_A_QUALIFIER | BCEAO. Le libellé exact de la tutelle (UEMOA vs UMOA) est à confirmer. Entité supranationale |
| 17 | Intérieur | 8 | 4/0/0 | | | | Libellé court. Décret 2026 : Intérieur et Sécurité publique |
| 18 | Jeunesse | 3 | 0/0/0 | | | | Libellé court. Décret 2026 : Jeunesse et Sports |
| 19 | Justice | 8 | 2/1/0 | | | | Libellé court. Décret 2026 : Justice, Garde des Sceaux |
| 20 | **MAER** | 1 | 0/0/0 | | | | **Historique.** MAER : sigle antérieur non documenté |
| 21 | **MCTDAT** | 1 | 0/0/0 | | | | **Historique.** MCTDAT : sigle antérieur non documenté |
| 22 | **MFPTCT** | 1 | 0/0/0 | | | | **Historique.** MFPTCT : sigle antérieur non documenté |
| 23 | **MITTD — Infrastructures, Transports Terrestres et Désenclavement** | 1 | 0/0/0 | | | | **Historique.** MITTD : sigle antérieur. Libellé partiel présent |
| 24 | **MUCTAT** | 1 | 0/0/0 | | | | **Historique.** MUCTAT : sigle antérieur non documenté |
| 25 | Microfinance | 6 | 0/2/0 | | | | Libellé court. Décret 2026 : Microfinance et Economie Sociale et Solidaire |
| 26 | Ministère de l'Eau et de l'Assainissement | 1 | 0/0/0 | | | | **Nom complet.** Confronter au décret : Hydraulique et Assainissement |
| 27 | **Ministère de l'Éducation Nationale** | 1 | 0/0/0 | | | | **Nom complet à confronter.** Décret 2026 : `Education Nationale` (sans accent circonflexe). Écart : `l'` + accent. Entité antérieure ou variante ? |
| 28 | **Ministère de la Santé et de l'Action Sociale** | 1 | 0/0/0 | | | | **Nom complet à confronter.** Décret 2026 : `Santé et Hygiène Publique`. Action Sociale → Famille. Périmètre différent = entité antérieure probable |
| 29 | **Ministère des Finances et du Budget** | 3 | 1/0/0 | | | | **Nom complet à confronter.** Décret 2026 : `Economie, Finances et Plan` + `chargé du Budget`. Scission → entité antérieure |
| 30 | Ministère des Infrastructures | 1 | 0/2/0 | | | | **Nom complet.** Confronter au décret : Infrastructures. Écart : `Ministère des` |
| 31 | Ministère du Travail | 1 | 0/0/0 | | | | **Nom complet.** Confronter au décret : Fonction Publique, Travail et Réforme |
| 32 | Numérique | 9 | 2/2/0 | | | CNRA, APS → Communication (post-MCTN) | **Scission MCTN à rejouer structure par structure.** CNRA et APS relèvent de la Communication, pas du Numérique. 9 institutions à ventiler entre MTN et Communication selon attributions. |
| 33 | PAENS — composante 3, développé par Eyone | 1 | 0/0/0 | | | NON_PERTINENT | Projet, pas une tutelle |
| 34 | Presidence | 1 | 0/1/0 | `PRESIDENCE-REPUBLIQUE` | | | Mécanique : accent |
| 35 | Primature | 7 | 0/0/0 | `PRIMATURE` | | | Mécanique : correspondance exacte |
| 36 | Présidence | 11 | 0/1/0 | `PRESIDENCE-REPUBLIQUE` | | | Mécanique : correspondance exacte |
| 37 | PTF | 1 | 0/1/0 | | | NON_PERTINENT | Catégorie partenaire, pas une tutelle |
| 38 | Pêches | 5 | 0/0/0 | | | | Libellé court. Décret 2026 : Pêches et Economie maritime |
| 39 | Sante | 2 | 0/0/0 | `MIN-SANTE-HYGIENE-PUBLIQUE-2026-1130` | | | Mécanique : accent |
| 40 | Santé | 8 | 1/1/0 | `MIN-SANTE-HYGIENE-PUBLIQUE-2026-1130` | | | Mécanique : correspondance exacte |
| 41 | Transports | 8 | 0/2/0 | | | | Libellé court. Décret 2026 : Transports terrestres et aériens |
| 42 | Urbanisme | 9 | 0/2/0 | | | | Libellé court. Décret 2026 : Urbanisme, Collectivités Territoriales et Aménagement des Territoires |
| 43 | À compléter (seed e-senegal) | 25 | 0/0/0 | | | | **25 institutions sans tutelle renseignée.** Rattachement à déterminer individuellement |
| 44 | Économie | 7 | 25/6/0 | | | | **Périmètre pilote (25 cas, 6 soumissions).** Libellé court. Décret 2026 : Economie, Finances et Plan + chargé Economie, Plan, Coopération |
| 45 | Éducation | 4 | 0/2/0 | | | | Libellé court. Décret 2026 : Education Nationale |
| 46 | Énergie | 10 | 0/1/0 | | | | Libellé court. Décret 2026 : Energie et Pétrole + Mines et Géologie (scission) |

---

## Priorités de décision

| Priorité | Valeurs | Raison |
|---|---|---|
| **URGENT** | Finances (12 inst., 76 cas), Économie (7 inst., 25 cas) | Périmètre pilote. Toute la donnée de référence est là |
| **HAUTE** | Fonction Publique (8), Santé (8), Intérieur (8), Numérique (9) | Volume d'institutions + relations |
| **HISTORIQUE** | MAER, MCTDAT, MITTD, MUCTAT, MFPTCT | Sigles antérieurs. Structure par structure |
| **À QUALIFIER** | Institution régionale (UEMOA) | Libellé à confirmer avant création éventuelle |
