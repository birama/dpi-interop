-- Référentiel national des entités de tutelle
-- Convention de code :
--   Ministères sourcés      → MIN-SLUG-DU-LIBELLE-AAAA-NNNN
--   Présidence/Primature    → PRESIDENCE-REPUBLIQUE / PRIMATURE (sans suffixe de décret)
--   Entités historiques     → SIGLE-HIST (sans année ni numéro inventé)
-- Sigle : null sauf usage attesté (MTN, MCTN). JAMAIS unique.

-- CreateEnum
CREATE TYPE "TypeEntiteTutelle" AS ENUM ('MINISTERE', 'PRESIDENCE', 'PRIMATURE', 'AUTORITE_ADMINISTRATIVE_INDEPENDANTE', 'INSTITUTION_CONSTITUTIONNELLE', 'ORGANISATION_INTERNATIONALE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeSuccession" AS ENUM ('RENOMMAGE', 'SCISSION', 'FUSION', 'TRANSFERT_ATTRIBUTIONS');

-- AlterTable
ALTER TABLE "institutions" ADD COLUMN "entiteTutelleId" TEXT;

-- CreateTable
CREATE TABLE "entites_tutelle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelleOfficiel" TEXT NOT NULL,
    "sigle" TEXT,
    "type" "TypeEntiteTutelle" NOT NULL,
    "referenceJuridique" TEXT,
    "ordreProtocolaire" INTEGER,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entites_tutelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "successions_tutelle" (
    "id" TEXT NOT NULL,
    "predecesseurId" TEXT NOT NULL,
    "successeurId" TEXT NOT NULL,
    "type" "TypeSuccession" NOT NULL,
    "referenceJuridique" TEXT,
    "dateEffet" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "successions_tutelle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entites_tutelle_code_key" ON "entites_tutelle"("code");
CREATE INDEX "entites_tutelle_type_dateFin_idx" ON "entites_tutelle"("type", "dateFin");
CREATE INDEX "entites_tutelle_dateFin_idx" ON "entites_tutelle"("dateFin");
CREATE INDEX "successions_tutelle_predecesseurId_idx" ON "successions_tutelle"("predecesseurId");
CREATE INDEX "successions_tutelle_successeurId_idx" ON "successions_tutelle"("successeurId");

-- AddForeignKey
ALTER TABLE "successions_tutelle" ADD CONSTRAINT "successions_tutelle_predecesseurId_fkey" FOREIGN KEY ("predecesseurId") REFERENCES "entites_tutelle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "successions_tutelle" ADD CONSTRAINT "successions_tutelle_successeurId_fkey" FOREIGN KEY ("successeurId") REFERENCES "entites_tutelle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_entiteTutelleId_fkey" FOREIGN KEY ("entiteTutelleId") REFERENCES "entites_tutelle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- DONNÉES DE RÉFÉRENCE
-- ============================================================================

-- Bloc 1 — Présidence et Primature (constitutionnelles, pas créées par le décret)
INSERT INTO "entites_tutelle" ("id", "code", "libelleOfficiel", "sigle", "type", "referenceJuridique", "ordreProtocolaire", "dateDebut", "dateFin", "notes") VALUES
('tutelle-presidence', 'PRESIDENCE-REPUBLIQUE', 'Présidence de la République', NULL, 'PRESIDENCE', NULL, 1, NULL, NULL, 'Institution de rang constitutionnel. Texte fondateur à documenter.'),
('tutelle-primature', 'PRIMATURE', 'Primature', NULL, 'PRIMATURE', NULL, 2, NULL, NULL, 'Institution de rang constitutionnel. Texte fondateur à documenter.');

-- Bloc 2 — 30 ministères institués par le décret n°2026-1130 du 1er juin 2026
INSERT INTO "entites_tutelle" ("id", "code", "libelleOfficiel", "sigle", "type", "referenceJuridique", "ordreProtocolaire", "dateDebut", "dateFin", "notes") VALUES
('tutelle-forces-armees',     'MIN-FORCES-ARMEES-2026-1130',                                    'Ministère des Forces Armées',                                                                          NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 3,  '2026-06-01', NULL, NULL),
('tutelle-economie-finances', 'MIN-ECONOMIE-FINANCES-PLAN-2026-1130',                            'Ministère de l''Economie, des Finances et du Plan',                                                     NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 4,  '2026-06-01', NULL, NULL),
('tutelle-budget',            'MIN-CHARGE-BUDGET-2026-1130',                                     'Ministère chargé du Budget',                                                                           NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 5,  '2026-06-01', NULL, NULL),
('tutelle-economie-plan',     'MIN-CHARGE-ECONOMIE-PLAN-COOPERATION-2026-1130',                  'Ministère chargé de l''Economie, du Plan et de la Coopération',                                        NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 6,  '2026-06-01', NULL, NULL),
('tutelle-interieur',         'MIN-INTERIEUR-SECURITE-PUBLIQUE-2026-1130',                       'Ministère de l''Intérieur et de la Sécurité publique',                                                  NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 7,  '2026-06-01', NULL, NULL),
('tutelle-affaires-etrangeres','MIN-INTEGRATION-AFRICAINE-AFFAIRES-ETRANGERES-SENEGALAIS-EXTERIEUR-2026-1130', 'Ministère de l''Intégration Africaine, des Affaires étrangères et des Sénégalais de l''Extérieur', NULL, 'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 8, '2026-06-01', NULL, NULL),
('tutelle-justice',           'MIN-JUSTICE-GARDE-SCEAUX-2026-1130',                              'Ministère de la Justice, Garde des Sceaux',                                                             NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 9,  '2026-06-01', NULL, NULL),
('tutelle-famille',           'MIN-FAMILLE-ACTION-SOCIALE-SOLIDARITES-2026-1130',                'Ministère de la Famille, de l''Action sociale et des Solidarités',                                     NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 10, '2026-06-01', NULL, NULL),
('tutelle-enseignement-sup',  'MIN-ENSEIGNEMENT-SUPERIEUR-RECHERCHE-INNOVATION-2026-1130',       'Ministère de l''Enseignement supérieur, de la Recherche et de l''Innovation',                          NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 11, '2026-06-01', NULL, NULL),
('tutelle-energie-petrole',   'MIN-ENERGIE-PETROLE-2026-1130',                                   'Ministère de l''Energie et du Pétrole',                                                                 NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 12, '2026-06-01', NULL, NULL),
('tutelle-mines-geologie',    'MIN-MINES-GEOLOGIE-2026-1130',                                     'Ministère des Mines et de la Géologie',                                                                NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 13, '2026-06-01', NULL, NULL),
('tutelle-industrie-commerce', 'MIN-INDUSTRIE-COMMERCE-2026-1130',                                'Ministère de l''Industrie et du Commerce',                                                              NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 14, '2026-06-01', NULL, NULL),
('tutelle-hydraulique',       'MIN-HYDRAULIQUE-ASSAINISSEMENT-2026-1130',                        'Ministère de l''Hydraulique et de l''Assainissement',                                                   NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 15, '2026-06-01', NULL, NULL),
('tutelle-education-nationale','MIN-EDUCATION-NATIONALE-2026-1130',                              'Ministère de l''Education Nationale',                                                                    NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 16, '2026-06-01', NULL, NULL),
('tutelle-sante',              'MIN-SANTE-HYGIENE-PUBLIQUE-2026-1130',                            'Ministère de la Santé et de l''Hygiène Publique',                                                       NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 17, '2026-06-01', NULL, NULL),
('tutelle-urbanisme',         'MIN-URBANISME-COLLECTIVITES-TERRITORIALES-AMENAGEMENT-TERRITOIRES-2026-1130', 'Ministère de l''Urbanisme, des Collectivités Territoriales et de l''Aménagement des Territoires', NULL, 'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 18, '2026-06-01', NULL, NULL),
('tutelle-infrastructures',   'MIN-INFRASTRUCTURES-2026-1130',                                    'Ministère des Infrastructures',                                                                        NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 19, '2026-06-01', NULL, NULL),
('tutelle-transports',        'MIN-TRANSPORTS-TERRESTRES-AERIENS-2026-1130',                     'Ministère des Transports terrestres et aériens',                                                       NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 20, '2026-06-01', NULL, NULL),
('tutelle-communication',     'MIN-COMMUNICATION-RELATIONS-INSTITUTIONS-2026-1130',              'Ministère de la Communication et des Relations avec les Institutions',                                 NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 21, '2026-06-01', NULL, NULL),
('tutelle-telecoms-numerique', 'MIN-TELECOMMUNICATIONS-NUMERIQUE-2026-1130',                      'Ministère des Télécommunications et du Numérique',                                                      'MTN',  'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 22, '2026-06-01', NULL, 'Sigle MTN attesté. Le même sigle a désigné le MCTN (Ministère de la Communication, des Télécommunications et du Numérique) avant la scission du 1er juin 2026.'),
('tutelle-microfinance',      'MIN-MICROFINANCE-ECONOMIE-SOCIALE-SOLIDAIRE-2026-1130',          'Ministère de la Microfinance et de l''Economie Sociale et Solidaire',                                  NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 23, '2026-06-01', NULL, NULL),
('tutelle-agriculture',       'MIN-AGRICULTURE-SOUVERAINETE-ALIMENTAIRE-ELEVAGE-2026-1130',     'Ministère de l''Agriculture, de la Souveraineté Alimentaire et de l''Elevage',                        NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 24, '2026-06-01', NULL, NULL),
('tutelle-elevage',           'MIN-CHARGE-ELEVAGE-2026-1130',                                     'Ministère chargé de l''Elevage',                                                                        NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 25, '2026-06-01', NULL, NULL),
('tutelle-fonction-publique', 'MIN-FONCTION-PUBLIQUE-TRAVAIL-REFORME-SERVICE-PUBLIC-2026-1130',  'Ministère de la Fonction Publique, du Travail et de la Réforme du Service Public',                    NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 26, '2026-06-01', NULL, NULL),
('tutelle-emploi',            'MIN-EMPLOI-FORMATION-PROFESSIONNELLE-TECHNIQUE-2026-1130',        'Ministère de l''Emploi et de la Formation Professionnelle et Technique',                              NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 27, '2026-06-01', NULL, NULL),
('tutelle-jeunesse-sports',   'MIN-JEUNESSE-SPORTS-2026-1130',                                    'Ministère de la Jeunesse et des Sports',                                                                NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 28, '2026-06-01', NULL, NULL),
('tutelle-culture',           'MIN-CULTURE-ARTISANAT-TOURISME-2026-1130',                         'Ministère de la Culture, de l''Artisanat et du Tourisme',                                               NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 29, '2026-06-01', NULL, NULL),
('tutelle-culture-charge',    'MIN-CHARGE-CULTURE-INDUSTRIES-CREATIVES-PATRIMOINE-HISTORIQUE-2026-1130', 'Ministère chargé de la Culture, des Industries créatives et du Patrimoine historique', NULL, 'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 30, '2026-06-01', NULL, NULL),
('tutelle-peches',            'MIN-PECHES-ECONOMIE-MARITIME-2026-1130',                           'Ministère des Pêches et de l''Economie maritime',                                                        NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 31, '2026-06-01', NULL, NULL),
('tutelle-environnement',     'MIN-ENVIRONNEMENT-TRANSITION-ECOLOGIQUE-2026-1130',               'Ministère de l''Environnement et de la Transition Ecologique',                                          NULL,   'MINISTERE', 'Décret n°2026-1130 du 1er juin 2026', 32, '2026-06-01', NULL, NULL);

-- Bloc 3 — Entités historiques (gouvernements antérieurs, non documentées)
INSERT INTO "entites_tutelle" ("id", "code", "libelleOfficiel", "sigle", "type", "referenceJuridique", "ordreProtocolaire", "dateDebut", "dateFin", "notes") VALUES
('tutelle-mctn',   'MCTN-HIST',   'MCTN',   'MCTN',   'MINISTERE', NULL, NULL, NULL, '2026-05-31', 'Ministère de la Communication, des Télécommunications et du Numérique. Scindé le 1er juin 2026 en deux entités : Communication et Relations avec les Institutions d''une part, Télécommunications et Numérique d''autre part. Intitulé exact et texte fondateur à documenter. Sigle attesté. Le même sigle a désigné le périmètre MCTN avant la scission.'),
('tutelle-mctdat', 'MCTDAT-HIST', 'MCTDAT', 'MCTDAT', 'MINISTERE', NULL, NULL, NULL, NULL, 'Intitulé exact, texte fondateur et date de fin à documenter.'),
('tutelle-mittd',  'MITTD-HIST',  'MITTD',  'MITTD',  'MINISTERE', NULL, NULL, NULL, NULL, 'Ministère des Infrastructures, des Transports Terrestres et du Désenclavement. Intitulé exact, texte fondateur et date de fin à documenter.'),
('tutelle-maer',   'MAER-HIST',   'MAER',   'MAER',   'MINISTERE', NULL, NULL, NULL, NULL, 'Intitulé exact, texte fondateur et date de fin à documenter.'),
('tutelle-muctat', 'MUCTAT-HIST', 'MUCTAT', 'MUCTAT', 'MINISTERE', NULL, NULL, NULL, NULL, 'Intitulé exact, texte fondateur et date de fin à documenter.'),
('tutelle-mfptct', 'MFPTCT-HIST', 'MFPTCT', 'MFPTCT', 'MINISTERE', NULL, NULL, NULL, NULL, 'Intitulé exact, texte fondateur et date de fin à documenter.');

-- Bloc 4 — Successions : uniquement la scission MCTN (documentée par le décret 2026-1130)
INSERT INTO "successions_tutelle" ("id", "predecesseurId", "successeurId", "type", "referenceJuridique", "dateEffet", "notes") VALUES
('succ-mctn-communication',  'tutelle-mctn', 'tutelle-communication',       'SCISSION', 'Décret n°2026-1130 du 1er juin 2026', '2026-06-01', 'Volet Communication et Relations avec les Institutions.'),
('succ-mctn-telecoms',       'tutelle-mctn', 'tutelle-telecoms-numerique',  'SCISSION', 'Décret n°2026-1130 du 1er juin 2026', '2026-06-01', 'Volet Télécommunications et Numérique. Sigle MTN.');
