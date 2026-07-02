# Brief PexOne — Site institutionnel Interopérabilité Nationale (PINS)

**Réf : MTN/DU/PINS/BRIEF-PEXONE-2026-07**
**Version : 1.0 — 2 juillet 2026**
**De : Birama Diop, Point Focal National d'Interopérabilité**
**À : PexOne (DAT v0.5, site web monitoring)**

---

## 1. Contexte

La Plateforme d'Interopérabilité Nationale du Sénégal (PINS) est l'infrastructure de back-office qui rend les services publics numériques réellement dématérialisables de bout en bout. Elle opère en production (dpi-interop.sec.gouv.sn) avec :

- **620 cas d'usage d'interopérabilité** documentés (catalogue)
- **246 institutions** profilées avec leurs rôles fournisseur/consommateur
- **35 registres nationaux** cartographiés
- **100 démarches du Guichet unique** rapprochées du catalogue (72 liées, 28 en attente)
- **75 liaisons guichet-PINS** validées humainement

L'outil de pilotage DPI-INTEROP (React/Fastify/PostgreSQL) est utilisé par la Delivery Unit, les pilotes sectoriels et les PTF. Le site institutionnel doit en être la **vitrine publique** : rendre visible l'état de l'interopérabilité nationale sans exposer l'outil de gestion.

## 2. Objectifs du site

1. **Transparence** : montrer l'état réel du catalogue, les cas en production, les manquants assumés
2. **Pilotage** : donner aux DSI sectoriels et aux PTF une vue claire de ce qui existe et de ce qui manque
3. **Plaidoyer** : outiller la Delivery Unit pour les discussions interministérielles et bailleurs (GIZ, BM, JICA)
4. **Conformité** : ancrer le cadre national dans des pages publiques stables, citables

## 3. Architecture technique

### 3.1 Ce qui existe déjà (à consommer, pas à reconstruire)

| Ressource | Type | URL |
|---|---|---|
| API PINS | REST (Fastify) | `dpi-interop.sec.gouv.sn/api/*` |
| KPIs guichet | JSON statique | `exports/kpis_finaux_2026-07-02.json` (dans le repo) |
| Cartographie finances | JSON | `exports/cartographie_finances_2026-07.json` (168 cas) |
| Fiches ENRICH | Markdown/JSON | 6 cas documentés dans le repo |
| Charte graphique PINS | Couleurs, polices | Navy #0C1F3A, Teal #0A6B68, Gold #D4A820, Amber #C55A18 — Tahoma titres, Times New Roman corps |

### 3.2 API disponibles (endpoints publics ou avec lecture seule)

| Endpoint | Auth | Retourne |
|---|---|---|
| `GET /api/catalogue/correspondance-esenegal` | authenticate | `{ kpis: {...}, items: [...] }` — grille jointe CU ↔ services guichet |
| `GET /api/catalogue/institutions` | authenticate | `{ total, items: [{ code, nom, nbFournisseur, nbConsommateur, enProduction, qualifie, priorise }] }` |
| `GET /api/catalogue/institutions/:id` | authenticate | Détail institution (cas fournis/consommés, registres opérés, XRoad) |
| `GET /api/catalogue/services-guichet?avecLiaisons=true` | authenticate | 100 démarches avec liaisons PINS |

**Note** : l'auth est `Authorization: Bearer <JWT>`. Un compte lecture seule `site-public@interop.sn` sera créé pour PexOne avec un token longue durée (JWT_EXPIRES_IN=90j). Les données sont en lecture seule, aucune route d'écriture n'est exposée au site public.

### 3.3 Ce qui sera statique (JSON pré-généré, pas d'appel API)

- KPIs d'accueil (rafraîchis mensuellement)
- Fiches ENRICH-2026-07
- Pages "Cadre national" (contenu rédactionnel)
- FAQ

### 3.4 Ce qui sera dynamique (appels API live)

- Catalogue par domaine/institution/registre
- Grille guichet ↔ PINS
- Pages institution (profils)

## 4. Pages à construire

### PAGE 1 — Accueil

**URL** : `/`
**Type** : statique + widgets KPIs

**Contenu** :
- Bandeau : "Plateforme d'Interopérabilité Nationale du Sénégal — le back-office d'échange qui rend les services publics numériques possibles"
- 4 KPI cards (chiffres live depuis `kpis_finaux_2026-07-02.json`) :
  - 620 cas d'usage
  - 246 institutions
  - 72/100 démarches guichet liées
  - 1 cas en production (PINS-TECH-0051 Réconciliation douane-trésor)
- Bloc "Qu'est-ce que PINS" (3 phrases fournies)
- Dernière note : rapprochement guichet (juillet 2026)

### PAGE 2 — Guichet unique ↔ Interopérabilité

**URL** : `/guichet`
**Type** : dynamique (API `correspondance-esenegal`)

**Contenu** :
- KPIs en tête : 72 démarches liées, 28 manquants, 60 citoyennes, 15 entreprises, 1 en ligne
- Tableau filtrable : démarche guichet, cas PINS lié, domaine, public, statut e-sénégal
- Section "Ce qui manque" : les 28 démarches sans liaison, groupées par secteur, avec le commentaire de la note Diaby
- Lien vers `dpi-interop.sec.gouv.sn/catalogue/services-guichet` pour la revue détaillée

### PAGE 3 — Catalogue national

**URL** : `/catalogue`
**Sous-pages** : `/catalogue/domaines`, `/catalogue/institutions`, `/catalogue/registres`

**Contenu** :
- **Par domaine** : navigation par les 14 domaines, pour chacun : compteur de cas, répartition par statut, top 5 cas pilotes
- **Par institution** : données live de `/api/catalogue/institutions`, filtre par nom/sigle, fiche détail avec cas fournis/consommés, registres opérés, statut XRoad
- **Par registre** : données statiques depuis les 35 registres nationaux en base

### PAGE 4 — Cadre national

**URL** : `/cadre`
**Type** : statique (contenu rédactionnel fourni)

4 sous-pages : Technique, Organisationnelle, Sémantique, Juridique. Contenu à fournir par la DU (Birama). Structure déjà définie dans le document de rôle.

### PAGE 5 — Documentation

**URL** : `/docs`
**Type** : statique

- Fiches ENRICH-2026-07 (6 pages)
- Guides méthodologiques
- Références internationales (Estonie, Finlande, once-only)
- FAQ

### PAGE 6 — Projets & financement

**URL** : `/projets`
**Type** : statique + partiellement dynamique

- New Deal Technologique : 12 programmes prioritaires, 49 projets (données statiques depuis la base)
- PTF actifs : GIZ (cartographie finances), JICA/Accenture, BM, Gates
- Pipeline de financement : cas `aFinancer=true`

### PAGE 7 — Actualités

**URL** : `/actualites`
**Type** : statique (ajout manuel)

Notes de synthèse, comptes rendus d'ateliers, indicateurs de progression.

## 5. Design

### 5.1 Charte PINS

| Élément | Valeur |
|---|---|
| **Navy** (fond, titres) | `#0C1F3A` |
| **Teal** (accents, liens, icônes) | `#0A6B68` |
| **Gold** (KPIs, highlights) | `#D4A820` |
| **Amber** (alertes, "à confirmer") | `#C55A18` |
| **Vert succès** | `#166534` |
| **Titres** | Tahoma, bold |
| **Corps** | Times New Roman, 16px |

### 5.2 Composants récurrents

- **KPI card** : icône + chiffre + label (modèle : page Correspondance de DPI-INTEROP)
- **Badge statut** : EN PRODUCTION (vert), QUALIFIÉ (bleu), PRIORISÉ (ambre), PROPOSÉ (gris)
- **Tableau filtrable** : recherche texte, filtres dropdown, tri par colonnes
- **Fiche détail** : panneau latéral ou accordéon (modèle : drawer Services guichet de DPI-INTEROP)

### 5.3 Responsive

Mobile-first. Le public cible inclut les DSI sur tablette en réunion et les PTF sur desktop.

## 6. Phasage

### Phase 1 — Lancement (2 semaines)

| Livrable | Pages |
|---|---|
| Accueil + KPIs | `/` |
| Guichet ↔ PINS | `/guichet` |
| Institutions | `/catalogue/institutions` |

**Sortie** : un site minimal mais crédible, avec les 3 pages qui racontent l'histoire (le quoi, le qui, le lien guichet). Tout le contenu vient des API existantes ou des JSON pré-générés.

### Phase 2 — Catalogue (2 semaines)

| Livrable | Pages |
|---|---|
| Domaines | `/catalogue/domaines` |
| Registres | `/catalogue/registres` |
| Projets & financement | `/projets` |

### Phase 3 — Contenu (2 semaines)

| Livrable | Pages |
|---|---|
| Cadre national (4 pages) | `/cadre/*` |
| Documentation | `/docs` |
| Actualités | `/actualites` |

## 7. Contraintes techniques

1. **Hébergement** : sous-domaine `interop.sec.gouv.sn`, certificat wildcard existant, nginx existant. Le site est servi par le même nginx que DPI-INTEROP ou par un vhost dédié.
2. **Auth API** : token JWT lecture seule, rotation 90j. Le site public ne doit JAMAIS exposer le token dans le frontend (les appels API passent par un proxy côté serveur ou par des routes publiques dédiées).
3. **Performance** : les pages dynamiques (institutions) chargent ~250 entrées. Pagination ou recherche côté serveur.
4. **SEO** : chaque page a un `<title>` descriptif, une `<meta description>`, et des URLs stables.
5. **Accessibilité** : contraste minimum WCAG AA, `alt` sur les icônes, navigation au clavier.
6. **Pas de dépendance à DPI-INTEROP** : si l'API est down, le site affiche un message dégradé ("Données momentanément indisponibles") plutôt qu'une erreur.

## 8. Livrables attendus de PexOne

1. **Maquettes** (Figma ou PNG) des 3 pages Phase 1 avant développement
2. **Code source** (HTML/CSS/JS, framework au choix de PexOne — statique ou léger type Astro/Hugo accepté)
3. **Déploiement** sur `interop.sec.gouv.sn` (accès serveur fourni)
4. **Documentation** : comment mettre à jour les KPIs statiques, comment ajouter une actualité

## 9. Références

- Site actuel DPI-INTEROP : `dpi-interop.sec.gouv.sn`
- Page Correspondance : `dpi-interop.sec.gouv.sn/catalogue/correspondance-esenegal`
- Page Institutions : `dpi-interop.sec.gouv.sn/catalogue/institutions`
- KPIs JSON : `exports/kpis_finaux_2026-07-02.json`
- Cartographie finances : `exports/cartographie_finances_2026-07.json`
- Note de synthèse : `MTN/DU/PINS/NOTE-2026-07` (section "Ce qui manque" pour /guichet)

---

*Document transmis à PexOne le 2 juillet 2026. Point hebdomadaire Birama — PexOne le mercredi. Contact : Birama Diop, Point Focal National Interopérabilité.*
