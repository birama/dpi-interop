# NOTE DE CADRAGE STRATÉGIQUE

## Module Partenaires Techniques et Financiers (PTF) sur la plateforme PINS

---

**Référence** : MCTN/DU/NCS-PINS-PTF-2026-01
**Version** : 0.3 (corrections finales pour validation)
**Auteur** : Birama DIOP, Point Focal National d'Interopérabilité, MCTN / SENUM SA
**Destinataires** : M. Mohamed DIABY, Directeur de la Delivery Unit du MCTN
**Copies** : M. Moctar (DU), équipes techniques SENUM SA, équipes techniques MCTN
**Classification** : Diffusion restreinte — usage interne MCTN / SENUM SA
**Date de rédaction** : 13 mai 2026
**Date de validation attendue** : 16 mai 2026

**Note sur la version 0.3** : la présente version intègre les retours de deux cycles de revue interne du 13 mai 2026. Le premier cycle a conduit à un enrichissement structurel substantiel (passage de la v0.1 à la v0.2) portant sur le vocabulaire institutionnel (substitution de "bailleurs" par "Partenaires Techniques et Financiers"), la classification des données visibles aux partenaires, le cadre juridique d'accès, l'extension du référentiel des domaines, l'estimation de l'effort, et l'ajout de plusieurs sections relatives à la gouvernance des accès, aux exports, aux indicateurs de pilotage et aux risques politiques. Le second cycle a conduit à des ajustements fins (v0.2 vers v0.3) portant sur la précision terminologique BAILLEUR (code) / PTF (interface), la sécurisation juridique des clauses sur les juridictions et immunités, la qualification du statut indicatif des montants exposés, l'ajout de la notion de propriétaire métier dans la Vue 360° partenaire, la mise en réserve des programmes-cadres indicatifs, et la formalisation de la note synthétique de deux pages comme livrable obligatoire pour l'atelier du 19 mai.

---

## RÉSUMÉ EXÉCUTIF

La plateforme PINS est aujourd'hui positionnée comme l'outil national de gouvernance des cas d'usage d'interopérabilité. Après la phase de cartographie des administrations, de structuration des cas d'usage et de mise en place de la Vue 360°, une nouvelle étape consiste à intégrer les Partenaires Techniques et Financiers (PTF) dans un cadre contrôlé, souverain et aligné sur les priorités nationales.

Le module PTF proposé vise à permettre au MCTN et à la Delivery Unit de disposer d'une vue consolidée des appuis extérieurs liés à la transformation numérique, d'identifier les chevauchements, les lacunes et les opportunités de cofinancement, et de canaliser les contributions des partenaires vers un portefeuille de cas d'usage validé par l'État.

L'ouverture aux PTF ne modifie pas la gouvernance de PINS : le MCTN conserve le pilotage stratégique, SENUM SA assure l'exploitation technique, et toute manifestation d'intérêt ou proposition de financement reste soumise à validation institutionnelle. Les partenaires bénéficient d'un accès sécurisé, limité et tracé, selon le principe du besoin d'en connaître.

La présente note propose une mise en œuvre progressive, avec présentation de la vision lors de l'atelier du 19 mai 2026, collecte des points focaux et domaines d'intérêt des partenaires, puis livraison d'un module fonctionnel d'ici fin juin 2026. L'effort de développement est estimé entre huit et dix jours-homme pour la version MVP, et entre quinze et vingt jours-homme pour une version stabilisée intégrant l'ensemble des dispositifs d'audit, de reporting et de gouvernance. Le calendrier réaliste est de quatre à six semaines à compter de la validation de la présente note.

Sept décisions structurantes sont soumises à validation : le périmètre fonctionnel, l'architecture technique, le calendrier, la stratégie pour l'atelier du 19 mai, le niveau d'information visible par les PTF, le cadre juridique d'accès, et l'instance de revue périodique.

---

## SOMMAIRE

1. Contexte et enjeux
2. État des lieux
3. Principes directeurs
4. Architecture cible
5. Fonctionnalités du module
6. Plan de mise en œuvre
7. Stratégie pour l'atelier du 19 mai
8. Risques et mitigations
9. Ressources et budget
10. Demandes de validation

Annexes
- A. Schéma de données détaillé
- B. Matrice de permissions par rôle
- C. Parcours utilisateur partenaire
- D. Liste cible des PTF et programmes-cadres
- E. Clauses minimales d'accès partenaire et confidentialité

---

## 1. CONTEXTE ET ENJEUX

### 1.1 La plateforme PINS et son écosystème

La Plateforme nationale d'Interopérabilité du Sénégal (PINS) est l'infrastructure de référence pour la mise en relation des systèmes d'information de l'État sénégalais. Conçue dans le cadre du New Deal Technologique et de la Vision Sénégal 2050, elle opérationnalise la convergence des données publiques au service du citoyen, de l'entreprise et de la performance de l'action publique.

Opérée par SENUM SA sous le pilotage stratégique du MCTN, PINS s'appuie sur le standard X-Road comme socle technique de l'échange sécurisé entre systèmes d'information. Au-delà du socle technique, la plateforme PINS dans sa déclinaison applicative (accessible à l'adresse https://dpi-interop.senum.sn) constitue l'espace de gouvernance partagée des cas d'usage d'interopérabilité, des questionnaires de cartographie SI remplis par les administrations, des décisions d'arbitrage prises par la Delivery Unit du MCTN, et des engagements financiers associés.

À la date de rédaction de cette note, soit le 13 mai 2026, PINS recense 213 institutions, 86 utilisateurs actifs et 76 cas d'usage d'interopérabilité couvrant les domaines des finances publiques, du climat des affaires, de la protection sociale, des services au citoyen et de la transversalité. Les chiffres présentés dans cette note correspondent à l'état de production constaté au 13 mai 2026. Ils peuvent différer du guide de démonstration du 5 mai 2026 (212 institutions, 72 utilisateurs, 75 cas d'usage), qui reflétait l'état de la plateforme à cette date. Les évolutions intervenues entre ces deux dates correspondent à la création de nouveaux comptes utilisateurs, à l'ajout d'une institution (ACBEP) et à des ajustements ponctuels du portefeuille.

Le portefeuille de 76 entrées doit être compris comme le portefeuille applicatif global incluant les cas proposés, déclarés, en consultation, en production et historiques. La nomenclature N2 actuellement en cours de rationalisation constitue, elle, le référentiel des codes pivots PINS-TECH et PINS-METIER (42 services techniques et 7 parcours métier, soit 49 codes finaux), appelé à devenir la base de classification cible. Cette double comptabilité (portefeuille global versus nomenclature rationalisée) est cohérente avec une phase d'évolution où la plateforme migre progressivement de structures historiques vers une nomenclature unifiée.

La plateforme intègre déjà un dispositif initial de suivi des financements, articulé autour de cinq partenaires techniques et financiers référencés : la Banque Mondiale, la GIZ, la JICA, la Fondation Bill & Melinda Gates et l'État du Sénégal.

### 1.2 L'atelier du 19 mai 2026 et le besoin de coordination élargie

L'atelier stratégique du 19 mai 2026, intitulé "Transformation numérique des services publics : vers une vision partagée et une action coordonnée", marque un tournant dans la gouvernance partenariale de la transformation numérique du Sénégal. Pour la première fois, l'ensemble des partenaires techniques et financiers engagés ou potentiellement engagés sur l'agenda numérique sénégalais seront réunis autour d'une même table avec les plus hautes autorités de l'État (Présidence, Primature) et les ministères techniques (MCTN, MFB, MSHP, et autres).

Trois objectifs structurent cet atelier. Le premier est d'établir une compréhension partagée des priorités du gouvernement en matière de digitalisation des services publics. Le deuxième est de cartographier les parties prenantes et de clarifier les mandats institutionnels, en identifiant les domaines où plusieurs acteurs interviennent et où une coordination accrue est nécessaire. Le troisième est de renforcer cette coordination et de définir des orientations prioritaires pour la mise en œuvre, en s'accordant sur des principes de collaboration interinstitutionnelle.

Au-delà de cet événement, le constat est structurel. Les partenaires techniques et financiers interviennent au Sénégal selon des logiques propres (programmes-cadres, fenêtres budgétaires, instruments financiers, priorités sectorielles) qui se traduisent parfois par des chevauchements, parfois par des lacunes, parfois par des doublons. Sans outil partagé permettant à chaque partenaire de connaître les engagements des autres et au MCTN de piloter l'ensemble, la coordination repose sur des réunions ad hoc, des courriers institutionnels et la mémoire des points focaux. Cette situation, tolérable jusqu'à présent, devient un facteur de risque à mesure que les engagements sur la transformation numérique se multiplient.

Le terme générique de "bailleurs" est volontairement remplacé dans la présente note par celui de "Partenaires Techniques et Financiers" (PTF), qui couvre l'ensemble des acteurs concernés : bailleurs au sens strict, agences de coopération, fondations, institutions multilatérales, partenaires publics bilatéraux. Cette terminologie est plus exacte au regard du positionnement institutionnel diversifié de ces acteurs : la GIZ intervient principalement en assistance technique, la JICA combine financement et accompagnement, la Fondation Gates positionne ses contributions comme appui programmatique. Le terme PTF, utilisé dans la littérature de l'aide au développement, est plus précis et plus respectueux de cette diversité.

### 1.3 L'enjeu : faire de PINS l'outil de coordination des appuis extérieurs

Le module PTF proposé dans la présente note vise à transformer PINS en outil de coordination de référence pour les appuis extérieurs à la transformation numérique. Concrètement, il s'agit de permettre à chaque PTF de se connecter à la plateforme, de consulter le portefeuille national des cas d'usage éligibles à appui partenaire, de manifester son intérêt pour le financement d'un cas, de proposer le financement de nouveaux cas non encore identifiés, et de visualiser ses propres engagements dans une vue consolidée.

Côté MCTN, le module offrira un tableau de bord consolidé des engagements PTF par domaine, par cas, par institution bénéficiaire et par partenaire. Il permettra à la Delivery Unit d'identifier les chevauchements (deux PTF intéressés par le même cas), les lacunes (cas prioritaires sans intérêt manifesté) et les déséquilibres sectoriels (un domaine sur-financé, un autre sous-financé).

Cet outil de coordination s'inscrit dans une logique de souveraineté assumée. Le MCTN reste le pilote, les PTF s'inscrivent dans un portefeuille construit et arbitré par l'État, et chaque manifestation d'intérêt fait l'objet d'une validation explicite par la Delivery Unit avant publication. PINS devient ainsi un instrument de pouvoir d'État au service de la coordination, pas un guichet où les partenaires sélectionneraient librement leurs interventions.

---

## 2. ÉTAT DES LIEUX

### 2.1 Architecture actuelle de PINS

La plateforme PINS dans sa version actuelle repose sur une architecture trois tiers classique : une base de données PostgreSQL pour la persistance, une API Fastify écrite en TypeScript pour la logique métier et l'exposition des services, et une application React pour l'interface utilisateur. L'authentification est assurée par JSON Web Tokens, avec deux rôles utilisateurs définis : ADMIN (réservé aux agents du MCTN et de SENUM SA chargés du pilotage) et INSTITUTION (attribué aux référents désignés par chaque administration sectorielle).

Les principaux objets métier modélisés sont les institutions, les utilisateurs, les cas d'usage MVP (qu'ils soient de type métier ou technique), les soumissions de questionnaires de cartographie SI, les flux d'échange existants, les partenaires techniques et financiers (PTF), les programmes-cadres associés et les financements rattachés aux cas. Une dimension de gouvernance documentaire est également présente, avec un journal d'avis formels, un suivi des transitions de statut et un mécanisme d'éviction des parties prenantes.

La page de gestion des financements (`/admin/financements`) propose une vue d'ensemble articulée autour de trois onglets : la cartographie des PTF et de leurs programmes, l'identification des cas orphelins (sans financement rattaché), et le suivi des expertises mobilisées. La fiche détaillée d'un cas d'usage (Vue 360°) intègre la liste des financements existants, mais cette intégration reste à la lecture seule et n'offre pas de mécanisme d'engagement direct par un partenaire externe.

### 2.2 Limitations identifiées lors de la démonstration du 5 mai 2026

La démonstration de la plateforme effectuée le 5 mai 2026 devant la Banque Mondiale et la JICA, en présence de M. Moctar de la Delivery Unit, a permis d'identifier trois familles de limitations qu'il convient de traiter avant l'élargissement aux partenaires.

La première limitation concerne le **catalogue des propositions**. La page `/catalogue/propositions` affiche actuellement les cas d'usage proposés mais ne propose aucune action de pilotage pour l'administrateur. Le pipeline officiel de gestion des propositions, qui doit conduire un cas de l'état PROPOSE à l'état EN_PRODUCTION en passant par les états DECLARE, EN_CONSULTATION, VALIDATION_CONJOINTE, QUALIFIE, PRIORISE, FINANCEMENT_OK et CONVENTIONNE, n'est pas pilotable depuis l'interface administrateur. Concrètement, l'administrateur peut consulter les propositions mais ne peut pas les qualifier, les rejeter, leur demander des compléments d'information ou décider de leur priorisation. Cette limitation rend impossible la gestion active d'un afflux de propositions, qu'elles viennent des institutions ou, demain, des partenaires.

La deuxième limitation concerne le **manque de fluidité dans la navigation administrateur ↔ institution**. Lors de la démonstration, il s'est avéré nécessaire d'ajouter un service technique de "Consultation CNI" comme prérequis du cas d'usage métier de création d'entreprise. Or, ce service technique n'existait pas dans le catalogue. Pour le créer, il a fallu se déconnecter du compte administrateur et se reconnecter avec le compte de la DGID (`dsi@dgid.sn`). Cette gymnastique d'authentification est antinomique avec le rôle d'orchestrateur national de la Delivery Unit : l'administrateur du MCTN devrait pouvoir créer et éditer des cas pour le compte d'institutions, dans une logique de pilotage transverse, sans avoir à se "déguiser" en institution. Cette limitation devient critique dès lors qu'il s'agit d'arbitrer rapidement entre plusieurs propositions de cas, de compléter des informations manquantes ou de structurer un parcours métier qui mobilise des services techniques transverses.

La troisième limitation concerne **l'absence de modèle d'accès partenaire**. Suite à la démonstration, M. Pape Samba MBENGUE, consultant ACCENTURE accompagnant le programme MVP-1 et probablement le MVP-2, a demandé un accès en lecture à la plateforme pour exploiter les données déclarées par les administrations. La même demande est attendue de la part des PTF lors de l'atelier du 19 mai. Or, la plateforme ne dispose actuellement que de deux rôles : ADMIN et INSTITUTION. Donner un accès ADMIN à un partenaire externe reviendrait à lui conférer des prérogatives de pilotage qu'il ne doit pas avoir. Lui créer un compte INSTITUTION le rattacherait à une administration fictive et ne lui donnerait pas la visibilité transverse souhaitée. Le besoin d'un rôle de type PARTENAIRE ou BAILLEUR, en lecture sélective, est désormais bloquant.

### 2.3 État des données actuelles en production

L'inventaire de la base de production révèle plusieurs caractéristiques structurelles qu'il convient de prendre en compte dans la conception du module PTF.

Le nombre de partenaires techniques et financiers référencés s'élève à cinq : la Banque Mondiale, la GIZ, la JICA, la Fondation Bill & Melinda Gates et l'État du Sénégal. La cible immédiate pour l'atelier du 19 mai inclut au minimum cinq partenaires supplémentaires : l'Agence Française de Développement (AFD), la Banque Africaine de Développement (BAD), le Programme des Nations Unies pour le Développement (PNUD), USAID et l'Union Européenne. Au total, dix partenaires devront donc être référencés et documentés avant la mise à disposition du module.

Le portefeuille de cas d'usage compte 76 entrées, dont la répartition par statut révèle une concentration sur les premières étapes du pipeline : 57 cas en état PROPOSE, 10 en DECLARE, 8 en EN_CONSULTATION, un seul en EN_PRODUCTION_360, et zéro en PRIORISE selon le statut Vue 360°. Cette dernière donnée est particulièrement importante pour le module PTF : si l'on retient comme principe que les partenaires ne voient que les cas effectivement priorisés par le MCTN, il faudra au préalable promouvoir une dizaine de cas du statut DECLARE ou QUALIFIE au statut PRIORISE, en s'appuyant sur les arbitrages déjà conduits ou à conduire par la Delivery Unit.

Le champ `axePrioritaire` qui sert aujourd'hui de domaine de classification présente une hétérogénéité préoccupante. Les neuf valeurs distinctes recensées en base ("Finances publiques", "Climat des affaires", "Finances publiques — Doing Business", "Protection sociale", "Services citoyens", "Service au citoyen", "Transversal", "Doing Business", "Équité sociale") témoignent d'une saisie en texte libre sans contrôle. Cette hétérogénéité empêche tout filtrage rigoureux par domaine, ce qui est précisément ce dont les PTF auront besoin pour identifier les cas qui relèvent de leur mandat. Une normalisation du référentiel des domaines est donc un prérequis fonctionnel du module PTF, avec un référentiel élargi pour couvrir l'ensemble du champ thématique pertinent (voir section 4.3).

Les financements existants en base s'élèvent à dix-sept, tous rattachés à un cas d'usage et à un programme. Trois des cinq PTF référencés portent au moins un financement actif. Cette base de données existante peut servir d'amorce et de démonstrateur pour le module PTF, mais elle ne reflète qu'une partie des engagements réels et devra être complétée par un travail de recensement auprès des Country Offices avant l'atelier du 19 mai.

---

## 3. PRINCIPES DIRECTEURS

La conception du module PTF s'inscrit dans la continuité des principes qui ont jusqu'à présent guidé le développement de PINS. Six principes structurent l'architecture proposée.

### 3.1 Souveraineté nationale et pilotage MCTN

PINS est et reste un outil de l'État du Sénégal. L'ouverture aux PTF ne saurait remettre en cause cette logique fondamentale. Le MCTN, via la Delivery Unit, conserve le monopole du pilotage stratégique : c'est lui qui définit le portefeuille de cas d'usage prioritaires, c'est lui qui valide les manifestations d'intérêt des partenaires avant publication, c'est lui qui arbitre les chevauchements et les conflits de financement. Les partenaires ne sont pas en situation de choisir librement leurs cas dans un guichet ouvert : ils s'inscrivent dans un portefeuille construit et arbitré par l'État.

Concrètement, ce principe se traduit par trois mécanismes. Premièrement, la visibilité des cas par les partenaires est limitée aux cas que le MCTN a effectivement priorisés et marqués comme éligibles à appui partenaire. Deuxièmement, toute manifestation d'intérêt ou proposition de financement par un partenaire passe par un état d'attente de validation avant d'être publiée. Troisièmement, la Delivery Unit dispose d'une vue consolidée des engagements et peut à tout moment ajuster le portefeuille, retirer un cas, ou redéployer un engagement.

### 3.2 Transparence sélective et anti-chevauchement

La coordination entre partenaires nécessite un niveau de transparence sur les engagements réciproques. Sans visibilité partagée, chaque partenaire agit en aveugle, avec le risque de chevauchements ou de désynchronisations. Le principe retenu est cependant celui d'une transparence sélective, calibrée pour servir la coordination sans exposer indûment les stratégies internes de chaque partenaire.

Concrètement, chaque partenaire voit uniquement ses propres manifestations et ses propres engagements. Il ne voit pas les manifestations des autres partenaires sur les mêmes cas. En revanche, lorsqu'il consulte la fiche détaillée d'un cas d'usage, il voit dans la section "Co-financement" les partenaires qui ont déjà engagé un financement formel sur ce cas (statut ACCORDE ou EN_COURS). Cette transparence sur les engagements formalisés permet d'éviter les doublons d'investissement, sans pour autant exposer les intérêts en cours d'examen ou les stratégies en construction.

Le MCTN, de son côté, dispose d'une vue intégrale : toutes les manifestations, tous les intérêts, tous les engagements, par cas, par partenaire, par domaine. Cette vue intégrale permet à la Delivery Unit d'identifier les chevauchements potentiels en amont, de stimuler les co-financements lorsque c'est pertinent, ou au contraire d'orienter un partenaire vers un cas non encore couvert.

### 3.3 Validation institutionnelle obligatoire

Aucun engagement partenaire ne devient public sur PINS sans validation explicite de la Delivery Unit du MCTN. Ce principe protège trois intérêts. D'abord celui de l'État du Sénégal, qui garde le contrôle de la narration publique des engagements internationaux sur sa transformation numérique. Ensuite celui des partenaires, qui peuvent ainsi discuter informellement de leurs intentions sans s'engager publiquement avant d'avoir mené leurs validations internes. Enfin celui de la coordination, en évitant que des manifestations contradictoires ou non mûres ne polluent le tableau de bord partagé.

Le workflow proposé comprend quatre états : `DRAFT` (le partenaire prépare sa manifestation, visible uniquement par lui), `EN_VALIDATION_MCTN` (la manifestation est soumise au MCTN pour examen, visible uniquement par le partenaire et le MCTN), `PUBLIE` (la manifestation est validée et apparaît dans les vues consolidées), `REJETE` (la manifestation est refusée, avec motif consigné et historique préservé).

### 3.4 Co-construction avec les partenaires

Si le MCTN garde le pilotage, la construction du portefeuille ne saurait être unilatérale. Les partenaires apportent une expertise sectorielle, une expérience d'autres pays, et parfois une vision prospective qui peut enrichir le portefeuille national. Le module PTF reconnaît cette contribution en permettant aux partenaires de proposer eux-mêmes des cas d'usage non encore identifiés.

Concrètement, un partenaire peut soumettre une proposition de cas (par exemple : "Carnet de santé numérique pour la mère et l'enfant", proposé par la Fondation Gates). Cette proposition entre dans le catalogue des propositions au même titre que celles soumises par les administrations sénégalaises, avec une source identifiée (`source = PARTENAIRE`). La Delivery Unit examine la proposition, la qualifie, peut demander des compléments, peut l'aligner avec une administration cheffe de file pertinente, et décide de sa promotion ou de son rejet. Le partenaire initiateur est tenu informé du parcours de sa proposition.

Cette logique de co-construction préserve la souveraineté (le MCTN reste l'arbitre final) tout en valorisant l'expertise des partenaires (leurs propositions sont prises en considération formellement).

### 3.5 Subsidiarité et alignement national

Les Partenaires Techniques et Financiers interviennent dans le respect des priorités nationales arrêtées par l'État du Sénégal. Le module PTF de PINS ne crée pas un canal parallèle de sélection des projets numériques. Il organise l'alignement des appuis extérieurs sur un portefeuille validé par le MCTN, en cohérence avec le New Deal Technologique, le Digital Master Plan et les orientations de la Delivery Unit. Les propositions formulées par les partenaires sont recevables comme contributions techniques, mais elles ne deviennent des cas d'usage PINS qu'après qualification, rattachement institutionnel et validation par les autorités compétentes.

Ce principe de subsidiarité est central pour préserver la dynamique nationale. Il évite que l'agenda numérique sénégalais ne soit progressivement façonné par les intérêts sectoriels des partenaires, sous prétexte que ces derniers disposent de moyens financiers significatifs. La plateforme PINS reste un outil d'État qui canalise l'appui extérieur vers les priorités nationales, et non un mécanisme par lequel les priorités nationales seraient construites par juxtaposition des intérêts des partenaires.

### 3.6 Confidentialité graduée

L'accès des PTF aux données de PINS est gradué selon le principe du besoin d'en connaître. Les informations exposées dans l'espace partenaire sont limitées aux métadonnées nécessaires à la compréhension, à l'alignement et à la coordination des appuis. Les informations relatives aux architectures internes des administrations, aux flux détaillés, aux données sensibles, aux avis institutionnels et aux arbitrages internes restent réservées au MCTN, à SENUM SA et aux institutions concernées.

Concrètement, trois niveaux de classification structurent l'accès aux données. Le niveau 1 regroupe les métadonnées publiques contrôlées : titre du cas, domaine, objectif, institution cheffe de file, statut général, besoin d'appui exprimé. Le niveau 2 couvre les informations de coordination : estimation budgétaire indicative, fenêtre de mise en œuvre, type d'appui attendu, dépendances institutionnelles, risques généraux. Le niveau 3 regroupe les informations sensibles non visibles aux partenaires par défaut : détails techniques d'API, données échangées, registres nationaux touchés, architecture SI des administrations, flux détaillés, parties prenantes sensibles, commentaires d'arbitrage de la Delivery Unit.

La Vue 360° exposée aux PTF est ainsi une version filtrée de la Vue 360° institutionnelle. Elle constitue une **Vue 360° partenaire**, filtrée selon le principe du besoin d'en connaître. Les informations techniques sensibles, les détails de sécurité, les flux nominaux, les identifiants de services, les avis internes et les arbitrages DU restent réservés au MCTN, à SENUM SA et aux institutions parties prenantes. Cette distinction est essentielle pour préserver à la fois la confidentialité opérationnelle des administrations et la conformité avec les obligations de protection des données.

---

## 4. ARCHITECTURE CIBLE

### 4.1 Vue d'ensemble

L'architecture proposée s'inscrit dans la continuité de la plateforme PINS existante et n'introduit aucune rupture technologique. Elle étend les modèles de données existants, ajoute deux tables nouvelles dédiées au workflow PTF, élargit le système de rôles utilisateurs, et enrichit l'interface utilisateur d'un espace partenaire distinct. Le socle technique reste inchangé : PostgreSQL pour la persistance, Fastify pour l'API, React pour le frontend, JSON Web Tokens pour l'authentification.

Cette continuité technologique est un choix délibéré : elle minimise le risque, capitalise sur les compétences déjà mobilisées sur PINS, et permet une livraison rapide. Les évolutions structurelles plus ambitieuses (séparation back-office / front-office, microservices, file de messages) sont reportées à des phases ultérieures lorsque le besoin sera avéré et le volume justifié.

### 4.2 Évolution du système de rôles

Le système de rôles utilisateurs actuel comprend deux valeurs : ADMIN et INSTITUTION. La présente note propose d'ajouter une troisième valeur : BAILLEUR (terme technique conservé pour l'énuméré de base, dénotant en interface l'ensemble des partenaires techniques et financiers). Cette extension de l'énuméré `Role` se fait par migration Prisma classique et reste rétrocompatible avec l'existant.

Le rôle BAILLEUR ouvre quatre capacités principales : la consultation du portefeuille filtré (uniquement les cas en statut PRIORISE, marqués éligibles à appui partenaire, et relevant des domaines d'intérêt déclarés du partenaire), la création de manifestations d'intérêt sur ces cas, la création de propositions de financement sur ces mêmes cas, et la proposition de nouveaux cas d'usage non encore identifiés. Toutes ces capacités sont contrôlées par des middlewares de permissions au niveau backend, et matérialisées par une interface utilisateur dédiée au frontend.

Une distinction fine entre BAILLEUR_LECTURE_SEULE et BAILLEUR_CONTRIBUTEUR avait été envisagée. Elle a été écartée pour la version initiale du module au profit d'un rôle unique BAILLEUR. Cette simplification est justifiée par trois considérations : la complexité ajoutée par deux rôles distincts n'apporte pas de valeur immédiate, la granularité fine peut être obtenue plus tard via un champ `canPropose` booléen sur l'utilisateur, et la maintenabilité du code est meilleure avec un nombre limité de rôles.

Une seconde évolution structurelle concerne le rattachement du partenaire. Aujourd'hui, un utilisateur INSTITUTION est rattaché à une institution via le champ `institutionId`. Un utilisateur BAILLEUR sera rattaché à un partenaire technique et financier via un nouveau champ `ptfId` (Foreign Key vers la table `ptf`). Ce champ sera nullable pour préserver la compatibilité avec les rôles existants, mais une contrainte applicative imposera que tout utilisateur de rôle BAILLEUR ait un `ptfId` renseigné.

Une précision terminologique mérite d'être posée. Dans le code applicatif et le schéma de base de données, le rôle technique `BAILLEUR` est conservé pour des raisons de compatibilité, de concision et de cohérence avec les énumérations existantes. Dans l'interface utilisateur, la documentation et les communications institutionnelles, ce rôle est toujours affiché sous le libellé "Partenaire Technique et Financier" ou son abréviation "PTF". Cette dualité terminologique est documentée dans le guide utilisateur et dans la documentation technique du module, de manière à éviter toute confusion lors des échanges entre équipes techniques et institutionnelles.

### 4.3 Évolution du modèle de données

Au-delà des champs ajoutés au modèle User, l'architecture proposée introduit deux nouvelles tables et plusieurs ajouts ciblés aux tables existantes.

**Table `bailleur_domaine_interet`**. Cette table associe à chaque PTF la liste des domaines d'interopérabilité sur lesquels il déclare un intérêt. Par exemple, la GIZ peut déclarer un intérêt sur les domaines FINANCES_PUBLIQUES et TRANSVERSAL, la Fondation Gates sur SANTE_NUMERIQUE et PROTECTION_SOCIALE, la BAD sur CLIMAT_AFFAIRES, PROTECTION_SOCIALE et FINANCES_PUBLIQUES. Cette table sert de filtre pour la consultation du portefeuille par le partenaire : un utilisateur BAILLEUR rattaché à la GIZ ne verra que les cas dont le domaine est inclus dans les domaines d'intérêt déclarés de la GIZ.

Les domaines référencés dans cette table doivent être issus d'un référentiel normalisé. C'est l'occasion de normaliser le champ `axePrioritaire` actuellement hétérogène. Un nouvel énuméré `Domaine` est introduit avec quatorze valeurs initiales, couvrant l'ensemble du champ thématique pertinent pour la transformation numérique du Sénégal : `FINANCES_PUBLIQUES`, `CLIMAT_AFFAIRES`, `PROTECTION_SOCIALE`, `SANTE_NUMERIQUE`, `EDUCATION`, `IDENTITE_NUMERIQUE`, `JUSTICE_ETAT_CIVIL`, `FONCIER_CADASTRE`, `AGRICULTURE_NUMERIQUE`, `EMPLOI_FORMATION`, `SERVICES_CITOYENS`, `GOUVERNANCE_DONNEES`, `CYBERSECURITE`, `TRANSVERSAL`.

Cette extension par rapport à un référentiel plus restreint est justifiée par la diversité réelle des cas d'usage PINS (NINEA, RCCM, casier judiciaire, état civil, fiscalité, douane, protection sociale, etc.) et par la nécessité d'anticiper les positionnements sectoriels des PTF (Banque Africaine de Développement sur les finances publiques et la protection sociale, USAID sur l'éducation et la santé, AFD sur la justice et le foncier, et ainsi de suite). Un référentiel trop pauvre deviendrait rapidement bloquant et nécessiterait des migrations ultérieures.

Les 76 cas existants seront migrés vers ce référentiel via un script de cleanup qui mappera les valeurs texte actuelles vers les valeurs canoniques. Ce travail de normalisation sera conduit en mode collaboratif avec la Delivery Unit, car certains mappings peuvent être ambigus.

**Table `manifestation_interet`**. Cette table porte le workflow d'engagement des partenaires. Chaque ligne représente une manifestation d'intérêt ou une proposition de financement d'un partenaire sur un cas d'usage spécifique. Les colonnes principales sont les suivantes : identifiant unique, identifiant du cas d'usage (`casUsageId`), identifiant du PTF (`ptfId`), identifiant de l'utilisateur ayant créé la manifestation (`userId`), type de manifestation (`type` : INTERET ou FINANCEMENT), statut (`statut` : DRAFT, EN_VALIDATION, PUBLIE, REJETE, RETIRE), montant estimé et devise (pour les manifestations de type FINANCEMENT), instrument financier envisagé (don, prêt concessionnel, assistance technique), commentaire libre, identifiant de l'utilisateur ayant validé (`valideParUserId`, peuplé après validation MCTN), date de validation, motif de rejet le cas échéant, dates de création et de mise à jour.

Cette table est distincte de la table `financements` existante. La distinction est essentielle. Une manifestation représente un intérêt ou une proposition en cours d'examen. Un financement représente un engagement formalisé, conventionné, qui se traduit par un décaissement à venir. Le passage d'une manifestation validée à un financement formel se fait via un acte de gestion explicite par la Delivery Unit : une fois la manifestation publiée, le MCTN et le partenaire peuvent négocier les termes précis, signer une convention, et matérialiser l'accord par la création d'un enregistrement dans la table `financements`. Cette séparation respecte le principe de réalité juridique : seul ce qui est signé entre dans le suivi des financements officiels.

**Table `journal_audit_ptf`**. Pour assurer la traçabilité de toutes les actions structurantes sur le module PTF, une table dédiée de journalisation est introduite. Chaque action effectuée par un utilisateur (consultation de fiche, création de manifestation, modification, soumission, validation, rejet, demande de complément, modification des domaines d'intérêt d'un PTF, téléchargement de document, export) est enregistrée avec son horodatage, l'identifiant de l'utilisateur, l'objet concerné, le type d'action, et le détail des modifications le cas échéant. Cette table est en lecture seule en dehors des insertions automatiques effectuées par l'application, et son contenu est consultable par les utilisateurs ADMIN à des fins de contrôle interne et d'audit.

**Ajouts à la table `cas_usage_mvp`**. Trois ajouts sont proposés. Le premier est un champ booléen `aFinancer` (par défaut `false`) qui marque explicitement les cas ouverts à appui partenaire. Ce champ est distinct du statut Vue 360° : un cas peut être en statut PRIORISE sans être ouvert à l'appui externe (par exemple s'il est entièrement financé par l'État du Sénégal), et inversement un cas peut être ouvert à appui partenaire dans une phase préparatoire. Le second est un champ `domaine` de type énuméré `Domaine`, qui remplace progressivement le champ `axePrioritaire` libre. Le troisième est l'extension de l'énuméré `SourceProposition` pour ajouter une valeur `BAILLEUR`, permettant de tracer les cas proposés par les partenaires.

### 4.4 Workflow de manifestation d'intérêt

Le workflow d'engagement d'un partenaire sur un cas comprend cinq étapes principales.

À l'étape initiale, le partenaire consulte le portefeuille filtré et identifie un cas qui correspond à ses centres d'intérêt. Il accède à la fiche détaillée du cas (Vue 360° partenaire), où il prend connaissance des éléments de niveau 1 et 2 (titre, objectif, domaine, institution cheffe de file, estimation budgétaire, fenêtre de mise en œuvre, type d'appui attendu), et décide de manifester son intérêt ou de proposer un financement. Deux boutons distincts sont proposés : "Manifester un intérêt" (geste léger, non engageant) et "Proposer un financement" (geste plus structurant, qui demande la saisie d'un montant et de conditions).

À l'étape de création, le partenaire remplit un formulaire avec les éléments adaptés au type de manifestation. Pour une manifestation d'intérêt, le formulaire est minimal : un commentaire libre exprimant l'intérêt et éventuellement les conditions générales. Pour une proposition de financement, le formulaire ajoute le montant estimé, la devise, l'instrument financier envisagé, et le programme-cadre de rattachement potentiel. La manifestation est créée en statut DRAFT.

À l'étape de soumission, le partenaire passe sa manifestation de DRAFT à EN_VALIDATION. À ce moment, le système notifie automatiquement la Delivery Unit par email (mode cible) ou inscrit la notification dans la file de notifications à traiter (mode dégradé), et la manifestation devient visible dans le tableau de bord MCTN des manifestations en attente. Le partenaire ne peut plus modifier le contenu de la manifestation après soumission, mais il peut la retirer si nécessaire (passage à RETIRE avec motif).

À l'étape de validation MCTN, la Delivery Unit examine la manifestation. Trois actions sont possibles : validation (passage à PUBLIE, la manifestation devient visible dans les vues consolidées et le partenaire est notifié), rejet (passage à REJETE avec motif consigné, le partenaire est notifié), demande de complément (la manifestation revient en DRAFT avec commentaire de la DU, le partenaire peut amender et resoumettre).

À l'étape post-validation, la manifestation publiée alimente le tableau de bord du partenaire dans son espace personnel, ainsi que le tableau de bord consolidé du MCTN. Pour les manifestations de type FINANCEMENT, le MCTN peut ensuite engager le processus de conventionnement formel, qui aboutit à la création d'un enregistrement dans la table `financements` et au déclassement de la manifestation initiale.

### 4.5 Workflow de proposition de cas par un partenaire

Le second workflow majeur du module PTF est celui de la proposition d'un nouveau cas d'usage par un partenaire. Ce workflow tire parti du mécanisme existant de propositions de cas (visible dans la page `/catalogue/propositions`) en y ajoutant une dimension partenaire.

Lorsqu'un partenaire identifie un besoin d'interopérabilité qui ne figure pas dans le portefeuille PINS, il peut soumettre une proposition de cas via un formulaire dédié dans son espace. Le formulaire est volontairement simplifié par rapport à la fiche complète d'un cas : le partenaire renseigne l'intitulé proposé, l'objectif, le domaine de rattachement, les institutions sénégalaises potentiellement impliquées (sous forme de suggestion), et un commentaire libre. Le partenaire peut également joindre des documents (notes de positionnement, études préalables, expériences d'autres pays).

La proposition est créée comme un nouvel enregistrement dans `cas_usage_mvp` avec le statut `PROPOSE`, le champ `sourceProposition = BAILLEUR`, et le champ `proposeurUserId` renseigné. Elle apparaît dans la page `/catalogue/propositions` au même titre que les autres propositions, mais identifiée visuellement comme issue d'un partenaire (badge ou icône). La Delivery Unit examine la proposition selon le processus existant : qualification, demande de complément, association à une administration cheffe de file pertinente, validation conjointe, priorisation. Le partenaire initiateur est tenu informé du parcours via notifications email aux changements de statut.

Si la proposition est promue en cas effectif du portefeuille PINS, le partenaire peut alors manifester son intérêt ou proposer un financement selon le workflow décrit en 4.4. Cette continuité permet au partenaire de suivre une logique cohérente : "je propose un cas, j'attends qu'il soit qualifié et priorisé, je m'engage formellement à le financer".

### 4.6 Gouvernance des accès et révocation

Les comptes PTF sont créés nominativement. Aucun compte générique n'est autorisé. Chaque utilisateur est rattaché à un PTF, à une fonction et à une adresse professionnelle vérifiable. La création d'un compte par l'administrateur MCTN suppose l'identification préalable du point focal désigné par le partenaire, et la transmission au MCTN des coordonnées officielles via un canal traçable (email institutionnel du Country Office, courrier officiel).

Avant l'activation effective du compte, le partenaire accepte les Conditions Générales d'Utilisation de la plateforme et le protocole d'accès partenaire (voir Annexe E). Cette acceptation est matérialisée par une signature électronique simple (case à cocher avec horodatage) lors de la première connexion, et par la signature d'un protocole d'accès formel par le représentant légal du Country Office, transmis au MCTN. Aucun accès opérationnel n'est ouvert sans cette double acceptation.

Le MCTN peut suspendre ou révoquer un accès à tout moment dans plusieurs situations : changement de fonction du point focal au sein du PTF, inactivité prolongée du compte (plus de six mois sans connexion), constatation d'un non-respect des conditions d'utilisation (export non autorisé, partage de données hors cadre), fin du cadre de collaboration entre le PTF et le Sénégal, demande motivée du PTF lui-même (rotation interne, changement d'organisation).

Une revue trimestrielle des comptes actifs est conduite par la Delivery Unit. Cette revue examine les connexions effectives, les actions réalisées, l'actualité institutionnelle des points focaux, et propose le cas échéant des ajustements (réactivation, suspension, révocation, ajout de comptes complémentaires). La revue alimente également les statistiques d'usage du module.

---

## 5. FONCTIONNALITÉS DU MODULE

### 5.1 Espace partenaire — Vue d'ensemble

L'espace partenaire est accessible aux utilisateurs de rôle BAILLEUR via l'interface PINS principale, après authentification et acceptation des conditions d'utilisation. Il s'organise autour de quatre pages principales accessibles depuis la barre de navigation latérale : un tableau de bord, un portefeuille national filtré, un journal des manifestations, et un formulaire de proposition de cas.

Le **tableau de bord partenaire** affiche en page d'accueil une synthèse personnalisée. La partie supérieure présente quatre indicateurs clés : le nombre de cas correspondant aux domaines d'intérêt déclarés, le nombre de manifestations d'intérêt en cours, le nombre de propositions de financement en cours, et le montant total potentiellement engagé toutes manifestations confondues. La partie médiane présente une liste des manifestations récentes du partenaire, classées par date avec leur statut. La partie inférieure affiche une sélection de cas suggérés correspondant aux domaines d'intérêt mais sans manifestation existante du partenaire, comme une incitation à compléter le portefeuille.

Le **portefeuille national filtré** présente la liste des cas d'usage visibles par le partenaire. Le filtrage est automatique selon deux critères combinés : le cas doit être en statut PRIORISE et avoir le flag `aFinancer = true`, et son domaine doit figurer dans les domaines d'intérêt déclarés du PTF auquel le partenaire est rattaché. Des filtres supplémentaires sont proposés à l'utilisateur : par domaine (parmi ceux déclarés), par administration cheffe de file, par état de manifestation (sans manifestation, avec manifestation en attente, avec manifestation publiée). Chaque entrée du portefeuille propose un accès à la Vue 360° partenaire du cas et un raccourci pour créer une manifestation.

Le **journal des manifestations** présente la liste exhaustive des manifestations créées par les utilisateurs du PTF du partenaire. Chaque ligne précise le cas concerné, le type de manifestation (intérêt ou financement), le statut actuel, la date de création, l'utilisateur ayant créé la manifestation, et le montant le cas échéant. Des actions sont proposées selon le statut : éditer (si DRAFT), soumettre (DRAFT → EN_VALIDATION), retirer (EN_VALIDATION → RETIRE), créer une copie (pour proposer un montant révisé après rejet).

Le **formulaire de proposition de cas** est accessible via un bouton de la page Portefeuille ("Proposer un nouveau cas") ou directement depuis la barre de navigation. Il guide le partenaire en cinq étapes : intitulé du cas (avec validation pour éviter les doublons), objectif et contexte, domaine de rattachement, institutions sénégalaises potentiellement impliquées (suggestion alimentée par le référentiel des institutions PINS), pièces jointes optionnelles. À la soumission, le partenaire reçoit une confirmation et un identifiant de suivi, et la proposition apparaît dans le catalogue des propositions avec un statut PROPOSE.

### 5.2 Espace MCTN — Validation et arbitrage

L'espace MCTN, accessible aux utilisateurs de rôle ADMIN, est enrichi de quatre pages spécifiques au module PTF.

La **page de validation des manifestations** (`/admin/manifestations`) liste toutes les manifestations soumises par les partenaires, par défaut filtrées sur celles en statut EN_VALIDATION. L'administrateur voit pour chaque manifestation l'ensemble des informations : partenaire, utilisateur, cas concerné, type, montant le cas échéant, commentaire. Trois actions sont proposées par manifestation : valider (passage à PUBLIE), rejeter (passage à REJETE avec saisie obligatoire du motif), demander un complément (la manifestation revient en DRAFT chez le partenaire avec un commentaire de la DU). Une page de détail permet d'accéder à l'historique complet d'une manifestation et aux échanges associés, ainsi qu'au journal d'audit lié.

La **page de tableau de bord consolidé** (`/admin/coordination-ptf`) offre la vue intégrale des engagements partenaires. Elle présente quatre vues commutables. La vue par PTF affiche un tableau avec, pour chaque partenaire, le nombre de manifestations actives, le nombre de financements signés, le montant total engagé, les domaines d'engagement. La vue par cas affiche un tableau avec, pour chaque cas d'usage ouvert à appui, les partenaires intéressés, les montants proposés, le statut de chaque manifestation. La vue par domaine présente une cartographie par domaine d'interopérabilité : montants engagés, montants en discussion, identification des sur-investissements et des sous-investissements. La vue cartographique propose une matrice domaines × PTF pour identifier visuellement les chevauchements et les lacunes.

La **page de gestion des domaines d'intérêt** (`/admin/ptf/:id/domaines`) permet à l'administrateur de déclarer ou modifier les domaines d'intérêt d'un PTF. Cette gestion est faite par l'administrateur en concertation avec le PTF concerné lors de l'onboarding. Une évolution future pourrait permettre au partenaire lui-même de gérer ses domaines depuis son espace, mais pour la version initiale, cette gestion reste sous contrôle MCTN.

La **page de gestion des comptes partenaires** (`/admin/partenaires`) étend la page existante de gestion des utilisateurs avec un onglet dédié aux comptes BAILLEUR. L'administrateur peut créer un compte partenaire en sélectionnant le PTF de rattachement, l'utilisateur (nom, prénom, email professionnel, fonction), et les droits initiaux. Le compte est créé avec un mot de passe initial à changer à la première connexion, et un email de bienvenue est envoyé à l'utilisateur (en mode dégradé : envoi manuel par l'admin ; en mode cible : envoi automatique).

### 5.3 Vue 360° partenaire d'un cas d'usage

La fiche détaillée d'un cas d'usage, aujourd'hui accessible à l'administrateur et aux institutions parties prenantes en version intégrale (Vue 360° institutionnelle), est déclinée pour les partenaires sous une forme filtrée appelée **Vue 360° partenaire**. Cette déclinaison applique la classification à trois niveaux décrite en section 3.6.

La Vue 360° partenaire affiche les informations de **niveau 1 et 2** : titre du cas, code, domaine canonique, statut, objectif, institution cheffe de file, propriétaire métier, point focal administratif, état de validation MCTN, parties prenantes (en libellé général, sans détails de contacts), estimation budgétaire indicative, fenêtre de mise en œuvre, type d'appui attendu, dépendances institutionnelles principales, risques généraux exprimés en termes d'enjeux. Elle n'affiche pas les informations de **niveau 3** : détails techniques des API, données échangées au niveau du champ, registres nationaux touchés au niveau des références techniques, architecture SI des administrations, flux détaillés, identifiants de services, commentaires d'arbitrage de la Delivery Unit, avis institutionnels formels.

La présence d'informations sur le propriétaire métier (qui porte le besoin côté État) et le point focal administratif (qui en assure le suivi opérationnel) est essentielle pour donner au partenaire une compréhension claire du dispositif institutionnel sénégalais derrière chaque cas. Ces informations restent en libellé général (intitulé de poste, direction concernée) sans exposer de coordonnées personnelles directes, qui sont communiquées le cas échéant par voie institutionnelle après validation MCTN d'une manifestation.

Une mention particulière doit être faite sur le statut des montants exposés dans la Vue 360° partenaire. Les montants affichés (estimation budgétaire indicative, fenêtre budgétaire, ordres de grandeur de l'appui attendu) sont strictement indicatifs et ne valent ni demande officielle de financement de la part de l'État du Sénégal, ni engagement budgétaire de l'État, ni promesse d'allocation par le partenaire. Ces montants servent uniquement à donner au partenaire une compréhension générale de l'ampleur du cas et à éclairer sa décision d'engagement éventuel. Toute discussion budgétaire formelle s'inscrit dans le cadre des négociations bilatérales ultérieures et fait l'objet d'instruments distincts (conventions, accords de financement).

Au-delà de ce contenu filtré, la Vue 360° partenaire intègre deux sections spécifiques au workflow PTF.

La section **"Financements et engagements"** liste les financements formalisés (table `financements`) sur ce cas, en filtrant pour ne montrer au partenaire que les financements de son propre PTF (transparence sélective conformément au principe 3.2). Pour chaque entrée, les éléments affichés sont le PTF, le programme-cadre, le montant alloué, l'instrument financier, le statut, les dates clés. Une mention agrégée non nominative peut indiquer la présence d'autres financements (par exemple "Ce cas bénéficie également de 2 autres financements totalisant X millions"), sans identification des partenaires concernés.

La section **"Mes manifestations sur ce cas"** liste les manifestations actives du partenaire connecté sur ce cas spécifique (statut DRAFT, EN_VALIDATION ou PUBLIE). Elle ne liste pas les manifestations des autres partenaires.

L'affichage de ces sections respecte les principes de visibilité posés en section 3.2 : chaque partenaire voit ses propres engagements, l'ADMIN voit tout, les INSTITUTIONS ne voient ni les manifestations ni les financements détaillés.

### 5.4 Système de notifications

Le module PTF s'appuie sur un système de notifications email pour informer les acteurs aux moments clés du workflow. Ce système est conçu en deux temps : un dispositif minimal pour la première version du module, et une évolution structurée intégrée au futur système d'envoi d'emails de PINS (voir section 9.2).

Dans sa version minimale, les notifications email sont produites par le backend et déposées dans une file de messages persistée en base, sans envoi automatique. La Delivery Unit consulte régulièrement cette file et envoie manuellement les emails depuis sa messagerie professionnelle. Cette solution dégradée permet de ne pas bloquer la mise en production du module en attendant la mise en place de l'infrastructure email complète.

Dans sa version cible, les notifications sont émises automatiquement aux événements suivants : à la création d'un compte partenaire (email de bienvenue avec identifiants et lien d'acceptation des conditions), à la soumission d'une manifestation (notification à la DU), à la validation d'une manifestation (notification au partenaire), au rejet d'une manifestation (notification au partenaire avec motif), à la demande de complément (notification au partenaire avec commentaire de la DU), à la publication d'une nouvelle proposition de cas par un partenaire (notification à la DU), à la promotion d'une proposition en cas effectif (notification au partenaire initiateur), à la suspension ou révocation d'un compte (notification au point focal concerné).

### 5.5 Export et reporting

Le module PTF permettra la génération de rapports consolidés pour répondre aux besoins de reporting des différentes parties prenantes. Côté MCTN, les exports porteront sur les engagements par PTF, par domaine, par cas d'usage, par statut de manifestation et par niveau de financement, sous formats PDF et Excel. Ces exports alimenteront les revues internes du MCTN, les comités de pilotage interministériels, et le cas échéant les rapports parlementaires sur la transformation numérique.

Côté partenaires, les exports seront limités aux données du PTF de l'utilisateur connecté : ses manifestations (par statut, par cas, par date), ses financements formalisés, ses propositions de cas. Ces exports permettent au partenaire de constituer ses propres tableaux de bord internes et de rendre compte de son engagement à ses instances de tutelle.

Tous les exports sont journalisés dans la table `journal_audit_ptf` avec horodatage et identification de l'utilisateur, dans une logique de traçabilité complète des données sorties de la plateforme.

### 5.6 Indicateurs de pilotage

Le module PTF intègre un dispositif d'indicateurs de pilotage destiné à mesurer l'efficacité de la coordination des appuis partenaires. Dix indicateurs clés sont proposés.

Les premiers indicateurs portent sur l'activité du module : nombre de PTF actifs sur la plateforme, nombre d'utilisateurs partenaires connectés mensuellement, nombre de cas d'usage ouverts à contribution. Les indicateurs de production mesurent le volume des manifestations : nombre de manifestations reçues, taux de validation des manifestations par la DU, délai moyen de validation. Les indicateurs de transformation mesurent la conversion des manifestations en engagements : taux de transformation manifestation → financement formalisé, nombre de propositions PTF acceptées et promues en cas. Les indicateurs de couverture mesurent l'équilibre du portefeuille : nombre de cas sans appui, nombre de cas avec risque de chevauchement (deux ou plus partenaires manifestant un intérêt), montant total engagé par domaine.

Ces indicateurs sont affichés dans le tableau de bord MCTN et dans les exports mensuels. Ils servent à piloter activement la coordination : si le taux de validation est faible, c'est que les manifestations soumises ne correspondent pas aux priorités ; si le délai de validation est long, c'est que la DU est en sous-capacité ; si certains domaines concentrent toutes les manifestations et d'autres aucune, c'est que la communication auprès des partenaires doit être réajustée.

---

## 6. PLAN DE MISE EN ŒUVRE

### 6.1 Approche générale et calendrier

Le développement du module PTF est planifié sur une période de quatre à six semaines calendaires, articulée autour de six phases techniques séquentielles. Cette planification est délibérément calibrée pour privilégier la qualité du livrable plutôt que la précipitation. La date de livraison cible est fin juin 2026, ce qui laisse environ six semaines depuis la validation de la présente note.

Cette approche se distingue d'une logique d'urgence qui aurait visé une livraison pour l'atelier du 19 mai 2026. Ce choix a été assumé explicitement : il est jugé préférable de présenter lors de l'atelier la vision et la roadmap du module PTF (avec une démonstration de l'existant fonctionnel), plutôt que de livrer en six jours un module partiel comportant des risques de bugs en production devant les plus hautes autorités de l'État et les partenaires internationaux. La stratégie pour l'atelier du 19 mai est détaillée en section 7.

Les six phases techniques sont organisées de manière à minimiser les dépendances et à permettre des validations intermédiaires. Chaque phase se conclut par un livrable testé, une revue avec la Delivery Unit, et une décision explicite de poursuite vers la phase suivante.

### 6.2 Phase 1 — Fondations RBAC et permissions

La première phase établit les fondations techniques du module en évolutivant le système de rôles utilisateurs et en introduisant un dispositif de permissions plus fin que le binaire ADMIN / INSTITUTION actuel.

Les livrables techniques de cette phase comprennent l'extension de l'énuméré `Role` dans le schéma Prisma avec l'ajout de la valeur BAILLEUR, la migration Prisma associée, l'ajout du champ `ptfId` nullable au modèle `User`, la mise à jour du type de payload JWT pour intégrer le nouveau rôle, la création du middleware `authenticatePartenaire` dans le backend, l'extension du composant `ProtectedRoute` du frontend pour gérer le nouveau rôle, et la mise à jour des matrices de tests unitaires.

Les livrables fonctionnels comprennent une page d'administration permettant à un administrateur de créer un compte BAILLEUR rattaché à un PTF spécifique, la mise à jour de la page de connexion pour rediriger les utilisateurs BAILLEUR vers leur espace dédié, le mécanisme d'acceptation des conditions d'utilisation à la première connexion, et un parcours minimal de connexion / déconnexion validé en environnement de recette.

L'effort estimé pour cette phase est d'une journée et demie-homme de développement, suivie d'une demi-journée de tests et de recette.

### 6.3 Phase 2 — Modèle de données et normalisation

La deuxième phase complète le modèle de données en introduisant les nouvelles tables nécessaires au workflow PTF et en normalisant le référentiel des domaines.

Les livrables techniques comprennent la création de la table `bailleur_domaine_interet` avec sa contrainte d'unicité, la création de la table `manifestation_interet` avec ses énumérés associés (`ManifestationType`, `ManifestationStatus`), la création de la table `journal_audit_ptf`, l'ajout des champs `aFinancer` et `domaine` au modèle `CasUsageMVP`, l'extension de l'énuméré `SourceProposition` avec la valeur `BAILLEUR`, et la création de l'énuméré `Domaine` avec les quatorze valeurs canoniques.

Le travail de normalisation du référentiel des domaines mérite une attention particulière. Il consiste à examiner les 76 cas existants, à proposer un mapping des valeurs actuelles du champ `axePrioritaire` vers les valeurs canoniques de l'énuméré `Domaine`, et à appliquer ce mapping via un script de migration de données. Ce travail doit être validé par la Delivery Unit avant exécution, car certains mappings peuvent être ambigus.

L'effort estimé est d'une journée et demie-homme de développement, dont une demi-journée pour la normalisation supervisée.

### 6.4 Phase 3 — Référentiel PTF élargi et données initiales

La troisième phase complète le référentiel des partenaires techniques et financiers et amorce les données initiales nécessaires à la démonstration et à l'usage opérationnel du module.

Les livrables comprennent l'ajout des cinq PTF manquants par rapport à la cible (AFD, BAD, PNUD, USAID, UE), la création d'au moins un programme-cadre par PTF, la déclaration initiale des domaines d'intérêt par PTF, et l'identification d'une dizaine de cas du portefeuille existant à promouvoir en statut PRIORISE avec le flag `aFinancer = true`.

Cette dernière étape requiert un travail conjoint avec la Delivery Unit pour valider que les cas retenus sont effectivement mûrs et ouverts à appui partenaire. La cible est d'avoir un portefeuille initial de dix à quinze cas immédiatement disponibles pour les partenaires lors de la mise en service.

L'effort estimé est d'une journée-homme de développement, complétée par une journée de travail collaboratif avec la Delivery Unit.

### 6.5 Phase 4 — Workflow manifestation et API partenaire

La quatrième phase implémente le cœur fonctionnel du module : le workflow de manifestation d'intérêt et l'API associée, ainsi que le mécanisme d'audit.

Les livrables techniques comprennent les routes API pour les partenaires (`GET /api/partenaire/cas-usage`, `GET /api/partenaire/manifestations`, `POST /api/partenaire/manifestations`, `PATCH /api/partenaire/manifestations/:id`, `POST /api/partenaire/propositions-cas`), les routes API pour l'administration des manifestations côté MCTN (`GET /api/admin/manifestations`, `PATCH /api/admin/manifestations/:id/validate`, `PATCH /api/admin/manifestations/:id/reject`), la mise en place du système de notifications en mode dégradé (file persistée en base), l'implémentation du mécanisme de journalisation automatique des actions, et les tests d'intégration de bout en bout des workflows.

L'effort estimé est de deux journées et demie-homme de développement.

### 6.6 Phase 5 — Interface utilisateur partenaire et MCTN

La cinquième phase construit l'interface utilisateur des deux espaces (partenaire et MCTN) en s'appuyant sur les API développées en phase 4.

Les livrables côté espace partenaire comprennent la page de tableau de bord avec les quatre indicateurs clés, la page de portefeuille filtré avec les filtres dynamiques, la page de journal des manifestations avec les actions contextuelles, le formulaire de proposition de cas en cinq étapes, et la Vue 360° partenaire avec ses sections spécifiques (réutilisation et adaptation du composant Vue 360° existant).

Les livrables côté espace MCTN comprennent la page de validation des manifestations, le tableau de bord consolidé avec ses quatre vues commutables, la page de gestion des domaines d'intérêt d'un PTF, l'enrichissement de la page de gestion des utilisateurs avec l'onglet partenaires, et la page d'export et de reporting.

L'effort estimé est de trois journées-homme de développement, complétées par une journée de tests utilisateurs.

### 6.7 Phase 6 — Tests, documentation et déploiement

La sixième et dernière phase consolide le module avant sa mise en production.

Les activités comprennent les tests d'intégration de bout en bout avec scénarios utilisateurs typiques, les tests de charge sur les volumes attendus, la documentation utilisateur (deux guides : un pour les partenaires, un pour les administrateurs MCTN), la formation des équipes MCTN, la création des comptes partenaires réels en concertation avec les Country Offices, le pré-remplissage de la base avec les engagements connus, la rédaction des conditions d'utilisation et du protocole d'accès partenaire (avec la DAJ), et enfin le déploiement en production avec procédure de rollback documentée.

L'effort estimé est d'une journée-homme et demie de développement, réparti sur une semaine calendaire.

### 6.8 Synthèse de l'effort et du calendrier

| Phase | Périmètre | Effort dev MVP | Effort version stabilisée | Calendrier |
|-------|-----------|----------------|---------------------------|------------|
| 1     | Fondations RBAC + CGU | 1,5 j-h | 2 j-h | Semaine 1 |
| 2     | Modèle de données + normalisation + audit | 1,5 j-h | 2,5 j-h | Semaine 1-2 |
| 3     | Référentiel PTF + données initiales | 1 j-h | 1,5 j-h | Semaine 2 |
| 4     | Workflow manifestation + API + journalisation | 2,5 j-h | 4 j-h | Semaine 2-3 |
| 5     | Interface utilisateur partenaire + MCTN + exports | 3 j-h | 5 j-h | Semaine 3-4 |
| 6     | Tests + documentation + déploiement | 1,5 j-h | 3 j-h | Semaine 4-6 |
| **Total** | **Module complet** | **~11 j-h** | **~18 j-h** | **4 à 6 semaines** |

L'effort version MVP totalise environ onze jours-homme de développement effectif, dans une fourchette de huit à dix jours pour un développeur très familier du code à quatorze jours pour un développement avec apprentissage. L'effort version stabilisée totalise environ dix-huit jours-homme, dans une fourchette de quinze à vingt jours selon le niveau d'exigence sur les tests, la documentation, l'observabilité et les exports.

La distinction entre MVP et version stabilisée n'est pas une distinction de périmètre fonctionnel (les fonctionnalités sont identiques) mais une distinction de robustesse : la version stabilisée intègre une couverture de tests plus large, des logs structurés, des dashboards de supervision, des exports formatés pour les rapports institutionnels, une documentation utilisateur complète, et l'ensemble des dispositifs de gouvernance des accès (revues trimestrielles automatisées, alertes d'inactivité, etc.).

---

## 7. STRATÉGIE POUR L'ATELIER DU 19 MAI 2026

### 7.1 Positionnement général

L'atelier stratégique du 19 mai 2026 est un moment privilégié pour positionner PINS auprès des partenaires techniques et financiers internationaux, mais il ne saurait être l'occasion d'une démonstration en direct d'un module qui n'est pas encore prêt. Tenter de livrer un module PTF fonctionnel en six jours présenterait un risque significatif de défaillance technique au moment le moins opportun : devant la Présidence, la Primature, la Banque Mondiale, la GIZ, la Fondation Gates, la JICA, et l'ensemble des décideurs.

Le 19 mai, PINS doit être présenté comme la plateforme nationale déjà opérationnelle de gouvernance des cas d'usage, et le module PTF comme l'extension naturelle destinée à organiser l'alignement des partenaires. L'objectif de l'atelier n'est pas de faire une recette technique du module PTF, mais d'obtenir un mandat politique, des points focaux PTF, des domaines d'intérêt et un calendrier d'intégration.

### 7.2 Préparation en amont

La préparation de l'atelier comprend deux volets : la consolidation du contenu existant et la préparation des supports pédagogiques.

Côté consolidation, il convient d'assurer que la plateforme actuelle est en état impeccable au 18 mai au soir. Cela suppose la résolution des derniers bugs d'affichage identifiés post-démo (catalogue propositions sans actions admin, manque de fluidité navigation), la promotion en statut PRIORISE de huit à dix cas emblématiques pour qu'ils soient prêts à être présentés, l'enrichissement des fiches Vue 360° de ces cas (parties prenantes, services techniques mobilisés, registres nationaux touchés, financements existants), et la vérification que les comptes existants fonctionnent et que les démos préparées tournent sans accroc.

Côté supports pédagogiques, deux livrables sont obligatoires pour l'atelier. Le premier est une présentation PowerPoint de quinze à vingt slides présentant la vision PINS, le portefeuille actuel, et le module PTF en perspective. Le second est une **note synthétique de deux pages** à remettre à chaque partenaire participant, présentant la finalité du module PTF, les données visibles par les partenaires, les engagements attendus à l'issue de l'atelier (cf. section 7.4), le calendrier d'onboarding et les modalités pratiques d'inscription. Cette note de deux pages est un livrable obligatoire de la préparation : elle constitue le support de référence que les partenaires ramèneront dans leurs Country Offices et qui servira de base aux échanges internes au sein des PTF dans les deux semaines suivant l'atelier.

### 7.3 Programme PINS pendant l'atelier

L'atelier du 19 mai est structuré en six sessions sur une journée. PINS a vocation à apparaître dans plusieurs sessions, mais avec des positionnements différents.

Lors de l'**ouverture (9h00-9h30)**, PINS peut être cité dans l'allocution du MCTN comme un outil opérationnel de pilotage de la transformation numérique, sans entrer dans le détail.

Lors de la **Session 1 (9h30-10h45, cadre stratégique)**, PINS prend une place plus importante. Une intervention de quinze à vingt minutes peut présenter le portefeuille des cas d'usage prioritaires, la méthode de construction, et les premiers résultats.

Lors de la **Session 2 (11h00-12h00, paysage des partenaires et bailleurs)**, PINS est présenté comme l'outil de coordination des engagements partenaires. C'est ici qu'intervient la présentation du module PTF en projet : la vision, la trajectoire, l'invitation à s'inscrire. Cette session est aussi l'occasion de demander à chaque partenaire de désigner un point focal pour le module PTF.

Lors de la **Session 3 (13h00-14h00, état des lieux des initiatives et acteurs)**, PINS sert de support à l'identification des chevauchements et des lacunes. Une démonstration en direct du tableau de bord administrateur peut illustrer concrètement les apports de l'outil.

Lors des **Sessions 4 et 5 (14h00-16h30)**, PINS revient ponctuellement comme cadre de référence des engagements pris dans l'atelier.

### 7.4 Engagements concrets attendus des partenaires à l'issue de l'atelier

Il ne faut pas laisser les partenaires repartir sans action concrète. À la fin de l'atelier, six engagements précis doivent être demandés à chaque partenaire participant.

Le premier engagement est la **désignation d'un point focal PTF** pour le module PINS, avec nom, fonction, email professionnel et coordonnées. Cette désignation peut être faite sur place ou dans les jours qui suivent l'atelier, avec une cible de transmission avant le 26 mai.

Le deuxième engagement est la **transmission des domaines d'intérêt formalisés** sur la base du référentiel à quatorze valeurs présenté lors de l'atelier. Le partenaire indique les domaines sur lesquels il intervient actuellement et ceux sur lesquels il anticipe d'intervenir dans les trois à cinq prochaines années.

Le troisième engagement est la **transmission de la liste des programmes numériques en cours** du partenaire au Sénégal, avec leur intitulé, leur montant indicatif, leur fenêtre temporelle, et les administrations bénéficiaires.

Le quatrième engagement est la **transmission de la liste des projets en préparation** susceptibles de toucher le portefeuille PINS dans les douze prochains mois.

Le cinquième engagement est l'**identification, dans le portefeuille PINS présenté lors de l'atelier, des cas d'usage déjà pertinents** pour le partenaire et sur lesquels il manifeste un intérêt initial. Cette identification se fait sur la base de la liste de huit à dix cas emblématiques préparée par le MCTN.

Le sixième engagement est l'**accord de principe pour un onboarding sur le module PTF en juin 2026**, sous réserve de la signature du protocole d'accès et de l'acceptation des conditions d'utilisation.

Ces six engagements peuvent être recueillis via un formulaire papier remis à chaque partenaire en fin d'atelier, à retourner sous quinze jours, ou via un formulaire en ligne dédié.

### 7.5 Calendrier post-atelier

Trois jalons structurent le calendrier post-atelier. Le premier est le **2 juin 2026** : date limite de transmission par les partenaires des six engagements concrets définis en section 7.4. Le deuxième est le **30 juin 2026** : livraison du module PTF fonctionnel sur PINS, création des comptes pour les points focaux désignés, migration des engagements initiaux reçus en juin. Une session de formation des partenaires (en ligne, deux heures) est organisée la première semaine de juillet. Le troisième est **septembre 2026** : atelier de suivi pour faire le bilan des trois premiers mois d'utilisation du module PTF, identifier les ajustements nécessaires, et conduire une revue stratégique du portefeuille au regard des engagements effectivement formalisés. Cet atelier de suivi peut être organisé en format hybride pour permettre la participation des Country Offices basés à l'étranger.

---

## 8. RISQUES ET MITIGATIONS

### 8.1 Risques techniques

Le premier risque technique concerne la **complexité de migration du référentiel des domaines**. La normalisation des 76 cas existants vers les quatorze valeurs canoniques de l'énuméré `Domaine` peut générer des ambiguïtés et des erreurs de classification. La mitigation consiste à conduire ce travail en mode collaboratif avec la Delivery Unit, à valider chaque mapping en amont, et à préserver le champ texte `axePrioritaire` initial pour permettre des retours en arrière si nécessaire.

Le second risque technique concerne **l'absence de système d'envoi d'emails opérationnel**. Le workflow de manifestation s'appuie sur des notifications email pour informer les acteurs aux moments clés. En l'absence d'infrastructure email mature, la mitigation passe par le mode dégradé décrit en section 5.4 : file de notifications persistée en base, envoi manuel par la Delivery Unit.

Le troisième risque technique concerne **les volumes et la montée en charge**. Bien que les volumes attendus restent modestes (dizaines d'utilisateurs partenaires, centaines de manifestations par an), une croissance imprévue pourrait stresser la plateforme. La mitigation passe par des tests de charge en phase 6 et par la mise en place d'une supervision active (logs, métriques de performance, alertes).

### 8.2 Risques institutionnels

Le premier risque institutionnel concerne la **réception du module par les partenaires**. Tous les partenaires ne sont pas également à l'aise avec l'idée de manifester publiquement leurs intérêts sur une plateforme contrôlée par l'État sénégalais. Certains pourraient préférer maintenir leurs stratégies en discussion bilatérale. La mitigation passe par les principes posés en section 3 : transparence sélective, validation MCTN avant publication, et co-construction.

Le second risque institutionnel concerne la **coordination avec la Direction des Affaires Juridiques (DAJ) du MCTN**. La mise en place d'un système où des partenaires internationaux interagissent avec des données institutionnelles sénégalaises soulève des questions juridiques : conventions de mise à disposition de la plateforme, conditions générales d'utilisation, traitement des données personnelles (loi 2008-12), responsabilité en cas de litige. La mitigation passe par une concertation précoce avec la DAJ pour valider le cadre juridique du module, et par la production d'une note juridique d'accompagnement et d'un protocole d'accès partenaire (cf. Annexe E).

Le troisième risque institutionnel concerne **les attentes générées par l'atelier du 19 mai**. Si la communication lors de l'atelier promet une mise à disposition immédiate du module, et que la livraison effective intervient seulement fin juin, la frustration des partenaires peut peser sur la crédibilité du MCTN. La mitigation passe par une communication claire : présenter la vision, annoncer la trajectoire, prendre des engagements de calendrier que l'on est sûr de tenir.

### 8.3 Risques opérationnels

Le premier risque opérationnel concerne la **charge sur la Delivery Unit**. Le workflow de validation des manifestations introduit une nouvelle tâche pour la DU : examiner chaque manifestation soumise, décider de la validation, du rejet ou de la demande de complément. Avec une dizaine de partenaires et une cadence raisonnable de manifestations, cette charge devrait rester maîtrisable (estimation : une heure par semaine). Mais une montée en puissance imprévue pourrait engorger le dispositif. La mitigation passe par une dimension organisationnelle (désignation d'un référent module PTF au sein de la DU, calendrier de revue hebdomadaire des manifestations) et technique (notification par email à chaque soumission, tableau de bord des manifestations en attente avec ancienneté).

Le second risque opérationnel concerne la **qualité des données saisies par les partenaires**. Les manifestations soumises peuvent contenir des informations imprécises, incohérentes ou incomplètes. La mitigation passe par la validation MCTN qui sert de filtre qualité, par un guide utilisateur précisant les attendus de chaque champ, et par la possibilité de demander des compléments au partenaire sans rejeter sa manifestation.

### 8.4 Risques politiques et réputationnels

Un risque politique et réputationnel mérite une attention particulière. Le module PTF peut être interprété par certains acteurs comme une plateforme de mise en concurrence des partenaires ou comme un outil de visibilité publique des engagements extérieurs. Cette perception pourrait susciter des réserves de certains partenaires, en particulier ceux qui préfèrent traditionnellement maintenir leurs stratégies d'intervention dans un cadre bilatéral confidentiel. À l'opposé, une absence d'ouverture pourrait faire passer le MCTN pour un acteur peu transparent dans la gestion de l'aide.

La mitigation de ce risque passe par une communication claire et constante sur la finalité du module : coordination, alignement et réduction des doublons, et non classement des partenaires ni publication non consentie de leurs stratégies d'intervention. Cette communication doit être portée dès l'atelier du 19 mai, et matérialisée par les principes de confidentialité graduée (3.6) et de transparence sélective (3.2) qui structurent l'architecture du module.

Un second risque politique concerne la **perception du caractère national versus international** de la plateforme. PINS doit rester clairement identifiée comme un outil souverain de l'État du Sénégal. L'intégration des partenaires ne doit pas conduire à une perception d'une plateforme co-gérée. La mitigation passe par la posture institutionnelle (la communication officielle reste portée par le MCTN), par l'architecture (pilotage MCTN explicite), et par le calendrier (la plateforme préexistante a été construite sans les partenaires, c'est elle qui les accueille).

---

## 9. RESSOURCES ET BUDGET

### 9.1 Effort de développement

L'effort de développement total est estimé entre huit et dix jours-homme pour la version MVP, et entre quinze et vingt jours-homme pour une version stabilisée, comme détaillé dans le tableau de synthèse de la section 6.8. Cet effort est compatible avec une mobilisation d'un développeur à temps plein sur quatre à six semaines.

Le profil de compétences requis combine la maîtrise du stack technique de PINS (TypeScript, Fastify, Prisma, PostgreSQL côté backend ; React, Tailwind, shadcn/ui côté frontend) et une compréhension fonctionnelle des enjeux d'interopérabilité et de financement institutionnel. Ce profil est aujourd'hui assuré au sein de la mobilisation existante autour de PINS, sans nécessiter de ressource externe additionnelle.

### 9.2 Infrastructure et chantiers connexes

Au-delà de l'effort de développement direct, deux chantiers d'infrastructure méritent d'être lancés en parallèle pour soutenir la mise en service du module.

Le premier chantier est la **mise en place d'un système d'envoi d'emails opérationnel**. Aujourd'hui, PINS n'envoie aucun email automatique. Plusieurs options existent : utiliser un service externe (Brevo, SendGrid, Amazon SES, Mailgun), mettre en place un relais SMTP interne SENUM, ou s'appuyer sur un compte Gmail Workspace MCTN. Le choix relève d'un arbitrage technique et économique à conduire en concertation avec les équipes SENUM.

Le second chantier est la **mise en place d'une UI de réinitialisation des mots de passe côté administrateur**. Aujourd'hui, la réinitialisation d'un mot de passe utilisateur passe par une intervention en base de données. Une mini-fonctionnalité dans l'interface administrateur permettrait de gagner un temps significatif sur les opérations de support. Cette fonctionnalité est estimée à un jour-homme de développement.

### 9.3 Validations institutionnelles à conduire en parallèle

Trois validations institutionnelles doivent être conduites en parallèle du développement.

La première est la **validation par M. DIABY et Moctar** de la présente note de cadrage. Cette validation conditionne le lancement du développement et fixe le périmètre fonctionnel. La cible de validation est le 16 mai 2026.

La seconde est la **concertation avec la DAJ MCTN** sur le cadre juridique du module PTF : conditions générales d'utilisation, protocole d'accès partenaire (Annexe E), traitement des données personnelles, responsabilités. Cette concertation peut être engagée dès la validation de la note et conduite en parallèle du développement. La cible est d'avoir un cadre juridique validé pour la mise en production fin juin.

La troisième est la **coordination avec les Country Offices des partenaires** pour identifier les points focaux qui seront les utilisateurs du module, recueillir leurs domaines d'intérêt formalisés, et collecter les éléments de leurs programmes-cadres. Cette coordination peut s'engager dès l'atelier du 19 mai.

### 9.4 Coûts non techniques

Au-delà des coûts de développement, plusieurs postes de coûts non techniques doivent être anticipés.

L'**atelier d'onboarding des partenaires** prévu en juillet 2026 nécessitera la mobilisation d'une demi-journée d'experts MCTN et SENUM, la préparation de supports de formation, éventuellement la mise en place d'une session en ligne avec retransmission pour les Country Offices basés à l'étranger.

La **production du guide utilisateur** (deux versions : pour les partenaires et pour les administrateurs MCTN) nécessitera environ deux jours-homme de rédaction et de mise en forme, avec des captures d'écran à produire après le déploiement.

Le **support fonctionnel** au démarrage absorbera une demi-journée par semaine de la Delivery Unit pendant les deux premiers mois, pour répondre aux questions des partenaires, traiter les demandes de modification de domaines d'intérêt, et conduire les premières validations de manifestations.

Le **temps de validation des manifestations** par la DU sera de l'ordre d'une heure par semaine en régime de croisière, avec des pics possibles autour de l'atelier du 19 mai et lors des revues trimestrielles.

Le **temps de coordination DAJ** pour la rédaction et la validation du cadre juridique est estimé à trois à cinq jours-homme.

Le **temps de coordination Country Offices** pour l'identification des points focaux et la collecte des engagements initiaux est estimé à une demi-journée par partenaire, soit cinq jours-homme pour les dix partenaires cibles.

La **maintenance évolutive** du module au-delà de la livraison initiale doit être anticipée : ajustements ergonomiques après retours utilisateurs, intégration progressive des évolutions du référentiel des domaines, enrichissement du tableau de bord. Une provision de cinq à dix jours-homme par trimestre est raisonnable pour les six premiers mois suivant la livraison.

---

## 10. DEMANDES DE VALIDATION

La présente note de cadrage soumet à validation sept décisions structurantes.

**Décision 1 — Validation du périmètre fonctionnel du module PTF.** Le périmètre proposé inclut un espace partenaire dédié, un espace MCTN enrichi, une Vue 360° partenaire avec classification à trois niveaux, un système de notifications en mode dégradé puis cible, un dispositif d'audit et de journalisation, et des fonctionnalités d'export et de reporting. Validation demandée sur ce périmètre, avec ou sans ajustements.

**Décision 2 — Validation de l'architecture technique cible.** L'architecture proposée s'inscrit dans la continuité du stack existant et introduit un nouveau rôle BAILLEUR, trois nouvelles tables (`bailleur_domaine_interet`, `manifestation_interet`, `journal_audit_ptf`), trois ajouts au modèle `CasUsageMVP`, et un référentiel normalisé des domaines (énuméré `Domaine` à quatorze valeurs). Validation demandée sur cette architecture, avec ou sans ajustements.

**Décision 3 — Validation du calendrier de mise en œuvre.** Le calendrier proposé est de quatre à six semaines à compter de la validation de la présente note, avec une livraison cible fin juin 2026. Six phases techniques sont identifiées, totalisant entre huit et dix jours-homme d'effort MVP et entre quinze et vingt jours-homme pour une version stabilisée. Validation demandée sur ce calendrier, ou ajustement vers une trajectoire plus ou moins ambitieuse.

**Décision 4 — Validation de la stratégie pour l'atelier du 19 mai 2026.** La stratégie proposée est de ne pas chercher à livrer le module PTF en six jours, mais de présenter lors de l'atelier la vision et la trajectoire, accompagnées d'une démonstration de l'existant fonctionnel, et de recueillir six engagements concrets de chaque partenaire participant. Validation demandée sur cette posture, ou inflexion vers une autre stratégie.

**Décision 5 — Validation du niveau d'information visible par les PTF.** La classification à trois niveaux (métadonnées publiques, informations de coordination, informations sensibles) est proposée pour structurer la Vue 360° partenaire. La liste précise des champs visibles et non visibles est à valider en annexe. Validation demandée sur le principe de classification, et délégation à la DU pour la liste détaillée des champs.

**Décision 6 — Validation du cadre juridique d'accès.** L'accès des PTF à la plateforme suppose l'acceptation des Conditions Générales d'Utilisation lors de la première connexion, et la signature d'un protocole d'accès partenaire par le représentant légal du Country Office (Annexe E). Validation demandée sur ce dispositif, avec délégation à la DAJ MCTN pour la rédaction définitive des textes.

**Décision 7 — Validation de l'instance de revue périodique.** Une revue trimestrielle des engagements PTF et des comptes actifs est proposée, conduite par la Delivery Unit avec la participation des ministères sectoriels concernés et, le cas échéant, des PTF engagés. La périodicité peut être ajustée (mensuelle, bimestrielle, trimestrielle, semestrielle). Validation demandée sur la périodicité et sur la composition de l'instance.

La validation peut prendre la forme d'une revue collective de 60 à 90 minutes entre l'auteur, M. DIABY et M. Moctar, ou d'une validation par retour écrit sur la présente note. La date de validation cible est le vendredi 16 mai 2026 à 12h00 pour permettre un démarrage opérationnel le lundi 19 mai 2026 en parallèle de l'atelier stratégique.

---

## ANNEXE A — SCHÉMA DE DONNÉES DÉTAILLÉ

### A.1 Évolutions de l'énuméré Role

```
enum Role {
  ADMIN
  INSTITUTION
  BAILLEUR  // NOUVEAU — désigne les utilisateurs partenaires (PTF)
}
```

### A.2 Nouvel énuméré Domaine (14 valeurs)

```
enum Domaine {
  FINANCES_PUBLIQUES
  CLIMAT_AFFAIRES
  PROTECTION_SOCIALE
  SANTE_NUMERIQUE
  EDUCATION
  IDENTITE_NUMERIQUE
  JUSTICE_ETAT_CIVIL
  FONCIER_CADASTRE
  AGRICULTURE_NUMERIQUE
  EMPLOI_FORMATION
  SERVICES_CITOYENS
  GOUVERNANCE_DONNEES
  CYBERSECURITE
  TRANSVERSAL
}
```

### A.3 Évolution du modèle User

```
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  password              String
  role                  Role
  institutionId         String?
  institution           Institution? @relation(...)
  ptfId                 String?  // NOUVEAU
  ptf                   Ptf?     @relation(...)  // NOUVEAU
  cguAccepteesAt        DateTime?  // NOUVEAU - acceptation CGU
  mustChangePassword    Boolean  @default(true)
  lastLoginAt           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### A.4 Évolution du modèle CasUsageMVP

```
model CasUsageMVP {
  // ... champs existants
  aFinancer             Boolean  @default(false)  // NOUVEAU
  domaine               Domaine?                  // NOUVEAU
  axePrioritaire        String?  // CONSERVÉ pour compatibilité
  sourceProposition     SourceProposition         // étendu avec BAILLEUR
}

enum SourceProposition {
  MCTN
  INSTITUTION
  DELIVERY_UNIT
  CONSULTATION
  HISTORIQUE
  BAILLEUR  // NOUVEAU
}
```

### A.5 Table bailleur_domaine_interet

```
model BailleurDomaineInteret {
  id          String   @id @default(cuid())
  ptfId       String
  ptf         Ptf      @relation(fields: [ptfId], references: [id], onDelete: Cascade)
  domaine     Domaine
  declaresPar String?  // userId de l'admin ayant déclaré
  createdAt   DateTime @default(now())

  @@unique([ptfId, domaine])
}
```

### A.6 Table manifestation_interet

```
enum ManifestationType {
  INTERET
  FINANCEMENT
}

enum ManifestationStatus {
  DRAFT
  EN_VALIDATION
  PUBLIE
  REJETE
  RETIRE
}

model ManifestationInteret {
  id              String   @id @default(cuid())
  casUsageId      String
  casUsage        CasUsageMVP @relation(fields: [casUsageId], references: [id])
  ptfId           String
  ptf             Ptf      @relation(fields: [ptfId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  type            ManifestationType
  statut          ManifestationStatus @default(DRAFT)
  commentaire     String?  @db.Text
  montantEstime   Float?
  devise          String?
  instrumentFinancier String?
  valideParUserId String?
  valideParUser   User?    @relation("ValidateurManifestation", fields: [valideParUserId], references: [id])
  dateValidation  DateTime?
  motifRejet      String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([casUsageId])
  @@index([ptfId])
  @@index([statut])
}
```

### A.7 Table journal_audit_ptf

```
enum AuditAction {
  CONSULTATION_FICHE
  CREATION_MANIFESTATION
  MODIFICATION_MANIFESTATION
  SOUMISSION_MANIFESTATION
  RETRAIT_MANIFESTATION
  VALIDATION_MANIFESTATION
  REJET_MANIFESTATION
  DEMANDE_COMPLEMENT
  CREATION_PROPOSITION
  MODIFICATION_DOMAINES_PTF
  EXPORT_DONNEES
  TELECHARGEMENT_DOCUMENT
  CONNEXION
  ACCEPTATION_CGU
}

model JournalAuditPtf {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  action          AuditAction
  objetType       String?  // "manifestation", "cas_usage", "ptf", etc.
  objetId         String?  // ID de l'objet concerné
  details         Json?    // Détails de l'action (avant/après pour modifications)
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## ANNEXE B — MATRICE DE PERMISSIONS PAR RÔLE

### B.1 Permissions sur les cas d'usage

| Action | ADMIN | INSTITUTION | BAILLEUR |
|--------|-------|-------------|----------|
| Consulter le catalogue complet | OUI | OUI | NON |
| Consulter le portefeuille filtré (PRIORISE + aFinancer + domaine) | OUI | OUI | OUI |
| Consulter la Vue 360° institutionnelle complète | OUI | partielle si partie prenante | NON |
| Consulter la Vue 360° partenaire (niveaux 1-2) | OUI | OUI | OUI |
| Voir les informations sensibles (niveau 3) | OUI | partielle si partie prenante | NON |
| Créer un cas | OUI | OUI (en attente validation) | OUI (proposition) |
| Éditer un cas existant | OUI | si partie prenante | NON |
| Changer le statut Vue 360 | OUI | NON | NON |
| Marquer comme aFinancer | OUI | NON | NON |

### B.2 Permissions sur les manifestations

| Action | ADMIN | INSTITUTION | BAILLEUR |
|--------|-------|-------------|----------|
| Voir toutes les manifestations | OUI | NON | NON |
| Voir mes propres manifestations | OUI | NON | OUI |
| Créer une manifestation | NON | NON | OUI |
| Éditer ma manifestation (statut DRAFT) | NON | NON | OUI |
| Soumettre ma manifestation | NON | NON | OUI |
| Retirer ma manifestation | NON | NON | OUI |
| Valider une manifestation | OUI | NON | NON |
| Rejeter une manifestation | OUI | NON | NON |
| Demander un complément | OUI | NON | NON |

### B.3 Permissions sur les financements

| Action | ADMIN | INSTITUTION | BAILLEUR |
|--------|-------|-------------|----------|
| Voir tous les financements | OUI | NON | NON |
| Voir les financements de mon PTF | OUI | NON | OUI |
| Voir mention agrégée des autres financements | OUI | NON | OUI (non nominative) |
| Créer un financement | OUI | NON | NON |
| Éditer un financement | OUI | NON | NON |
| Voir le tableau de bord consolidé | OUI | NON | NON |

### B.4 Permissions sur les utilisateurs et comptes

| Action | ADMIN | INSTITUTION | BAILLEUR |
|--------|-------|-------------|----------|
| Créer un utilisateur | OUI | NON | NON |
| Voir tous les utilisateurs | OUI | NON | NON |
| Voir les utilisateurs de mon PTF | OUI | NON | OUI (sans détails sensibles) |
| Réinitialiser un mot de passe | OUI | NON | NON |
| Suspendre/révoquer un compte | OUI | NON | NON |
| Accepter les CGU | NON | NON | OUI (obligatoire) |

### B.5 Permissions sur le journal d'audit

| Action | ADMIN | INSTITUTION | BAILLEUR |
|--------|-------|-------------|----------|
| Consulter le journal d'audit complet | OUI | NON | NON |
| Consulter mes propres actions journalisées | OUI | NON | OUI |
| Exporter le journal d'audit | OUI | NON | NON |

---

## ANNEXE C — PARCOURS UTILISATEUR PARTENAIRE

### C.1 Onboarding d'un nouveau partenaire

Étape 1 — Le point focal du PTF est identifié lors de l'atelier du 19 mai ou via la coordination Country Office. Ses coordonnées (nom, prénom, email professionnel, fonction) sont transmises au MCTN par voie officielle (email institutionnel ou courrier du Country Office).

Étape 2 — Le représentant légal du PTF signe le protocole d'accès partenaire (Annexe E) et le retourne au MCTN. Sans cette signature, le compte n'est pas activé.

Étape 3 — L'administrateur MCTN crée le compte utilisateur dans l'interface PINS : sélection du PTF, rôle BAILLEUR, saisie des coordonnées, génération d'un mot de passe initial.

Étape 4 — L'administrateur déclare les domaines d'intérêt du PTF (en concertation avec le point focal) via la page de gestion des domaines.

Étape 5 — Un email de bienvenue est envoyé au point focal contenant le lien vers la plateforme, l'identifiant et le mot de passe temporaire.

Étape 6 — Le point focal se connecte, change son mot de passe, lit et accepte les Conditions Générales d'Utilisation (acceptation horodatée et journalisée), et arrive sur son tableau de bord.

### C.2 Création d'une manifestation d'intérêt

Étape 1 — Depuis le tableau de bord, le partenaire clique sur "Consulter le portefeuille".

Étape 2 — Le portefeuille filtré s'affiche, listant les cas en PRIORISE et aFinancer dans les domaines d'intérêt du PTF.

Étape 3 — Le partenaire identifie un cas qui l'intéresse, clique pour accéder à sa Vue 360° partenaire.

Étape 4 — En bas de la fiche, deux boutons sont proposés : "Manifester un intérêt" et "Proposer un financement". Le partenaire choisit l'action adaptée.

Étape 5 — Un formulaire s'ouvre, simplifié pour l'intérêt, plus structuré pour le financement (montant, devise, instrument, programme). Le partenaire saisit ses éléments et sauvegarde en DRAFT.

Étape 6 — Le partenaire retourne à son tableau de bord, voit sa manifestation en DRAFT, peut l'éditer si besoin.

Étape 7 — Quand prêt, le partenaire clique "Soumettre". La manifestation passe en EN_VALIDATION. Le MCTN est notifié et l'action est journalisée.

Étape 8 — Le MCTN examine la manifestation et la valide (passage à PUBLIE). Le partenaire est notifié.

### C.3 Proposition d'un nouveau cas

Étape 1 — Depuis la barre de navigation, le partenaire clique sur "Proposer un nouveau cas".

Étape 2 — Un formulaire en cinq étapes s'ouvre : (a) Intitulé du cas avec vérification doublons ; (b) Objectif et contexte ; (c) Domaine parmi les 14 valeurs ; (d) Institutions sénégalaises potentiellement impliquées avec suggestion ; (e) Pièces jointes optionnelles.

Étape 3 — À la soumission, la proposition est créée dans `cas_usage_mvp` avec statut PROPOSE, source BAILLEUR, et apparaît dans `/catalogue/propositions`.

Étape 4 — Le partenaire reçoit confirmation et identifiant de suivi. La DU est notifiée.

Étape 5 — La DU examine la proposition. Le partenaire est notifié à chaque changement de statut.

Étape 6 — Si la proposition est promue en PRIORISE, le partenaire peut alors créer une manifestation de financement sur ce cas.

---

## ANNEXE D — LISTE CIBLE DES PTF ET PROGRAMMES-CADRES

### D.1 PTF existants en base (5)

| Code     | Nom                                         | Type         | Programmes-cadres connus            |
|----------|---------------------------------------------|--------------|-------------------------------------|
| BM       | Groupe de la Banque Mondiale                | MULTILATERAL | Senegal Digital Acceleration Project|
| GIZ      | Coopération Allemande au Développement      | BILATERAL    | Goin' Digital, SET                  |
| JICA     | Agence Japonaise de Coopération Int.        | BILATERAL    | PINS X-Road                         |
| GATES    | Fondation Bill & Melinda Gates              | FONDATION    | À documenter                        |
| ETAT-SN  | État du Sénégal                             | ETAT         | Budget Loi de Finances              |

### D.2 PTF à créer (5 prioritaires)

| Code     | Nom                                         | Type         | Programmes-cadres à investiguer     |
|----------|---------------------------------------------|--------------|-------------------------------------|
| AFD      | Agence Française de Développement           | BILATERAL    | Digital Senegal, Choose Africa      |
| BAD      | Banque Africaine de Développement           | MULTILATERAL | Stratégie numérique BAD             |
| PNUD     | Programme des Nations Unies                 | MULTILATERAL | Accelerator Labs                    |
| USAID    | United States Agency for Int. Development   | BILATERAL    | Power Africa, Digital Africa        |
| UE       | Union Européenne                            | MULTILATERAL | Global Gateway, Team Europe         |

**Important** : les programmes-cadres listés dans les sections D.1 et D.2 sont strictement indicatifs et issus d'une recherche documentaire de surface. Ils devront être confirmés bilatéralement avec chaque PTF lors de l'onboarding, sur la base des programmes effectivement actifs ou en préparation au Sénégal. Certains intitulés peuvent recouvrir des réalités opérationnelles plus larges ou plus restreintes que ce que leur dénomination laisse supposer, et certains partenaires peuvent intervenir au Sénégal via des instruments non listés ici. La consolidation définitive du référentiel des programmes-cadres est un livrable de la phase 3 du projet, conduit en concertation avec les Country Offices.

### D.3 PTF de seconde phase

| Code     | Nom                                         | Justification report                 |
|----------|---------------------------------------------|--------------------------------------|
| FIDA     | Fonds International de Développement Agricole | Périmètre sectoriel restreint      |
| BID-IsDB | Banque Islamique de Développement            | Mobilisation à confirmer            |
| OMS      | Organisation Mondiale de la Santé            | Focus santé numérique               |
| UNICEF   | Fonds des Nations Unies pour l'Enfance       | Périmètre sectoriel restreint      |
| FAO      | Organisation pour l'Alimentation et l'Agri.  | Volet agriculture numérique         |

### D.4 Mapping initial des domaines d'intérêt par PTF

Le mapping ci-dessous est une proposition initiale qui devra être validée bilatéralement avec chaque PTF lors de l'onboarding. Il sert d'amorce pour le paramétrage du module.

| PTF      | Domaines d'intérêt présumés                                                |
|----------|----------------------------------------------------------------------------|
| BM       | FINANCES_PUBLIQUES, IDENTITE_NUMERIQUE, SERVICES_CITOYENS, GOUVERNANCE_DONNEES, TRANSVERSAL |
| GIZ      | FINANCES_PUBLIQUES, GOUVERNANCE_DONNEES, CLIMAT_AFFAIRES, EMPLOI_FORMATION, TRANSVERSAL |
| JICA     | IDENTITE_NUMERIQUE, JUSTICE_ETAT_CIVIL, TRANSVERSAL, CYBERSECURITE         |
| GATES    | SANTE_NUMERIQUE, PROTECTION_SOCIALE, IDENTITE_NUMERIQUE                     |
| AFD      | JUSTICE_ETAT_CIVIL, FONCIER_CADASTRE, EDUCATION, SERVICES_CITOYENS, TRANSVERSAL |
| BAD      | CLIMAT_AFFAIRES, PROTECTION_SOCIALE, FINANCES_PUBLIQUES, AGRICULTURE_NUMERIQUE |
| PNUD     | TRANSVERSAL, SERVICES_CITOYENS, IDENTITE_NUMERIQUE, GOUVERNANCE_DONNEES    |
| USAID    | SANTE_NUMERIQUE, EDUCATION, CLIMAT_AFFAIRES, CYBERSECURITE                  |
| UE       | TRANSVERSAL, FINANCES_PUBLIQUES, IDENTITE_NUMERIQUE, CYBERSECURITE, GOUVERNANCE_DONNEES |
| ETAT-SN  | TOUS LES DOMAINES                                                          |

---

## ANNEXE E — CLAUSES MINIMALES D'ACCÈS PARTENAIRE ET CONFIDENTIALITÉ

### E.1 Objet

La présente annexe précise les clauses minimales du protocole d'accès partenaire et des Conditions Générales d'Utilisation (CGU) du module PTF de la plateforme PINS. Ces textes seront formalisés par la Direction des Affaires Juridiques (DAJ) du MCTN, en cohérence avec le cadre juridique sénégalais applicable (loi 2008-12 sur les données personnelles, code des marchés publics, conventions internationales de coopération).

### E.2 Données visibles aux partenaires

Les partenaires accèdent aux données suivantes de la plateforme PINS, sous le rôle BAILLEUR :

a) Métadonnées des cas d'usage en statut PRIORISE et marqués éligibles à appui partenaire, dans les domaines d'intérêt déclarés du PTF : titre, code, domaine, objectif, institution cheffe de file, statut, besoin d'appui exprimé, estimation budgétaire indicative, fenêtre de mise en œuvre, type d'appui attendu, dépendances institutionnelles principales.

b) Vue 360° partenaire des cas accessibles : informations de niveaux 1 et 2 telles que définies en section 3.6 de la présente note.

c) Manifestations d'intérêt et propositions de financement créées par les utilisateurs du PTF lui-même, dans tous les statuts.

d) Financements formalisés du PTF lui-même, avec leurs montants, instruments et statuts.

e) Mention agrégée non nominative de la présence d'autres engagements sur un cas (par exemple "Ce cas bénéficie de 3 autres financements totalisant X millions"), sans identification des partenaires concernés.

f) Référentiel des PTF et de leurs programmes-cadres, en mode consultation.

g) Référentiel des institutions sénégalaises, en mode consultation, pour les besoins de proposition de cas.

### E.3 Données non visibles aux partenaires

Les partenaires n'accèdent pas aux données suivantes, qui restent réservées au MCTN, à SENUM SA et aux institutions parties prenantes :

a) Informations techniques détaillées : architectures SI des administrations, détails des API, données échangées au niveau des champs, registres nationaux touchés au niveau des références techniques, identifiants de services, flux nominaux.

b) Informations institutionnelles internes : avis formels des administrations, arbitrages de la Delivery Unit, commentaires internes, échanges entre la DU et les administrations.

c) Informations relatives aux autres partenaires : manifestations en cours d'examen d'autres PTF, propositions soumises par d'autres PTF, stratégies déclarées d'autres PTF.

d) Données personnelles des utilisateurs hors du PTF du partenaire connecté.

e) Soumissions de questionnaires de cartographie SI des administrations, dans leur intégralité.

### E.4 Obligations du partenaire

Le partenaire bénéficiant d'un accès au module PTF de PINS s'engage à :

a) Désigner nominativement le ou les points focaux habilités à accéder à la plateforme, avec leurs coordonnées professionnelles vérifiables.

b) N'utiliser les données accessibles via la plateforme que dans le cadre strict de la coordination des appuis numériques au Sénégal, à l'exclusion de toute autre finalité.

c) Ne pas extraire, copier, diffuser ou réutiliser les données hors du cadre de cette coordination, sauf autorisation expresse et écrite du MCTN.

d) Respecter la confidentialité des informations accessibles, notamment lors des échanges internes au sein du PTF.

e) Informer le MCTN sans délai de tout changement affectant l'identité ou les fonctions du point focal désigné.

f) Informer le MCTN de toute violation suspectée de la sécurité des accès.

g) Respecter les principes de souveraineté des données publiques sénégalaises et reconnaître que la plateforme PINS et ses données restent la propriété de l'État du Sénégal.

### E.5 Droits et obligations du MCTN

Le MCTN, opérateur institutionnel de la plateforme PINS via SENUM SA, s'engage à :

a) Garantir la disponibilité raisonnable de la plateforme dans des conditions normales d'exploitation.

b) Préserver la confidentialité des données accessibles au partenaire selon les principes définis.

c) Notifier le partenaire de toute évolution majeure du module ou des conditions d'accès.

d) Réviser périodiquement les droits d'accès et procéder aux ajustements nécessaires.

e) Fournir un accompagnement à la prise en main du module (formation, documentation, support).

Le MCTN se réserve les droits suivants :

a) Suspendre ou révoquer un accès en cas de non-respect des présentes clauses, sans préavis si la violation est grave.

b) Modifier les paramètres d'accès (domaines d'intérêt visibles, cas éligibles à appui) en cohérence avec l'évolution du portefeuille national.

c) Conduire un audit des actions du partenaire sur la plateforme, via le journal d'audit, à des fins de contrôle de conformité.

d) Faire évoluer les présentes clauses, avec notification préalable au partenaire.

### E.6 Durée et révocation

L'accès au module PTF est accordé pour la durée du cadre de collaboration entre le partenaire et l'État du Sénégal sur la transformation numérique. Il peut être révoqué à tout moment par le MCTN dans les cas suivants : fin du cadre de collaboration, non-respect des présentes clauses, inactivité prolongée du compte (plus de six mois sans connexion), demande motivée du partenaire lui-même.

Une revue trimestrielle des accès est conduite par la Delivery Unit du MCTN. Les ajustements éventuels (suspension, révocation, ajout, modification de domaines d'intérêt) sont notifiés au partenaire concerné.

### E.7 Litiges

Tout litige relatif à l'application des présentes clauses est traité prioritairement par voie de concertation entre le MCTN et le partenaire concerné, dans un esprit de bonne foi et de respect mutuel des engagements institutionnels.

En cas d'échec de la concertation, le traitement du différend s'effectue conformément au droit applicable, aux accords de coopération en vigueur entre l'État du Sénégal et le partenaire concerné, et, le cas échéant, aux privilèges et immunités reconnus au partenaire en vertu de sa qualité d'organisation internationale, d'agence de coopération, de fondation, ou de toute autre qualité institutionnelle particulière. La rédaction définitive des clauses de règlement des litiges est confiée à la Direction des Affaires Juridiques du MCTN, en concertation avec les services juridiques de chaque partenaire concerné, afin de tenir compte des spécificités statutaires de chacun.

---

**Fin de la note de cadrage stratégique (version 0.2)**

*Document produit par Birama DIOP, Point Focal National d'Interopérabilité, MCTN / SENUM SA, le 13 mai 2026, pour validation par M. Mohamed DIABY, Directeur de la Delivery Unit du MCTN, et diffusion aux équipes techniques élargies.*

*La présente version 0.2 intègre les retours de la revue interne du 13 mai 2026. Elle est soumise à validation collégiale avant transmission à la DAJ MCTN pour formalisation des annexes E (CGU et protocole d'accès) en collaboration avec les services juridiques.*

---


