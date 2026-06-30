/**
 * Seed — 20 cas d'usage potentiels (atelier 2026-06-12)
 *
 * Idempotent : upsert sur cle_source via le champ sourceDetail.
 * Les cas sont créés en PINS-PROP-MET-001..020, statutVueSection=PROPOSE.
 * Chaque cas reçoit sa fiche FaisabiliteCas (8 réponses brutes),
 * ses institutions pressenties (fournisseurs/consommateurs),
 * et ses points_a_confirmer en note.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping libellé → code institution (existant ou à créer)
const INST_MAP: Record<string, string> = {
  ADEPME: 'ADEPME',
  'Ageroute': 'AGEROUTE',
  ANAT: 'ANAT',
  ANEC: 'ANEC',
  ANSD: 'ANSD',
  APIX: 'APIX',
  CDC: 'CDC',
  CSS: 'CSS',
  DAF: 'DAF',
  DGD: 'DGD',
  DGID: 'DGID',
  DGPPE: 'DGPPE',
  DGPRE: 'DGPRE',
  'DGPSN(RNU)': 'DGPSN',
  DGUA: 'DGUA',
  DPGI: 'DPGI',
  FDMI: 'FDMI',
  FIMF: 'FIMF',
  IPRES: 'IPRES',
  ITA: 'ITA',
  MCAT: 'MCAT',
  MEN: 'MEN',
  MEPC: 'MEPC',
  SENCSU: 'SENCSU',
  Douane: 'DGD',
  TRESOR: 'DGCPT',
  'Ministère de l\'énergie': 'MEPM',
  CSDOSS: 'CSSDOS', // Coquille corrigée : CSDOSS → CSSDOS
  SOLDE: 'SOLDE',
  MUCTAT: 'MUCTAT',
  'Min. Commerce': 'MIC',
};

// Éclatements multi-institutions
const MULTI_MAP: Record<string, string[]> = {
  'Min.Env. ANSD': ['METE', 'ANSD'],
  'Ministère de la famille et de la solidarité': ['MFFS'],
};

// Mapping axe → domaine
const AXE_TO_DOMAINE: Record<string, string> = {
  'FINANCE PUBLIQUE': 'FINANCES_PUBLIQUES',
  'PROTECTION SOCIALE': 'PROTECTION_SOCIALE',
  'CLIMAT DES AFFAIRES': 'CLIMAT_AFFAIRES',
  'SERVICES AUX CITOYENS': 'SERVICES_CITOYENS',
};

interface UseCaseData {
  ref_local: string;
  code_cible: string;
  axe: string;
  nom: string;
  fournisseurs: string[];
  consommateurs: string[];
  donnees_necessaires: string;
  description: string;
  points_a_confirmer: string | null;
  resultat_attendu: string;
  defis: string[] | null;
  faisabilite_brute: {
    juridique: Record<string, boolean>;
    institutionnelle: Record<string, boolean>;
    gouvernance: Record<string, boolean>;
    technique: Record<string, boolean>;
  };
  source: string;
  cle_source: string;
}

// Les 20 cas (extraits du JSON)
const USE_CASES: UseCaseData[] = [
  {
    ref_local: 'UC-FIN-01', code_cible: 'PINS-PROP-MET-001', axe: 'FINANCE PUBLIQUE',
    nom: 'Vérification du NIN',
    fournisseurs: ['DAF'], consommateurs: ['TRESOR'],
    donnees_necessaires: 'NIN',
    description: 'Vérification du NIN pour identifier le contribuable',
    points_a_confirmer: null,
    resultat_attendu: 'Informations du contribuable',
    defis: ['Disponibilité des ressources (humaines, techniques, etc.)'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': false }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-85b822e584',
  },
  {
    ref_local: 'UC-FIN-02', code_cible: 'PINS-PROP-MET-002', axe: 'FINANCE PUBLIQUE',
    nom: 'Preuve de vie',
    fournisseurs: ['ANEC'], consommateurs: ['SOLDE', 'TRESOR'],
    donnees_necessaires: 'NIN',
    description: 'Verifie si la personne et vivante à partir du NIN / Vérifiacation s\'il est vivant avant le paiement .',
    points_a_confirmer: null,
    resultat_attendu: 'vérifier si la personne est vivante',
    defis: ['Disponibilité des ressources (humaines, techniques, etc.)'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': false, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': false }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': false, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': false } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-afd5b302ed',
  },
  {
    ref_local: 'UC-FIN-03', code_cible: 'PINS-PROP-MET-003', axe: 'FINANCE PUBLIQUE',
    nom: 'Informations sur les projets/programmes financés sur ressources extérieurs',
    fournisseurs: ['APIX', 'ANSD'], consommateurs: ['MEPC', 'DGPPE'],
    donnees_necessaires: 'N° identification du projet',
    description: 'Suivi des projets et programmes financés sur ressources extérieurs.',
    points_a_confirmer: 'Pourquoi, pour l\'objectif relatif aux informations sur les projets et programmes financés par des ressources extérieures, les fournisseurs de données sont-ils APIX et ANSD ?',
    resultat_attendu: 'Etat d\'avancement des projets et programmes financés sur ressources extérieurs.',
    defis: ['Ressources'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': false }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': false, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-2832a8e3fc',
  },
  {
    ref_local: 'UC-FIN-04', code_cible: 'PINS-PROP-MET-004', axe: 'FINANCE PUBLIQUE',
    nom: 'Vérification de la validité du n° d\'identification des agréments ESS (microfinance)',
    fournisseurs: ['FDMI', 'FIMF'], consommateurs: ['Ministère de la famille et de la solidarité'],
    donnees_necessaires: 'N° agrément',
    description: 'Vérification de la validité de l\'agrément',
    points_a_confirmer: 'Détailler le contenu et préciser concrètement l\'objectif ainsi que l\'impact.',
    resultat_attendu: 'Informations du demandeur',
    defis: ['Meilleur ciblage'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': false }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-05e5672328',
  },
  {
    ref_local: 'UC-PS-01', code_cible: 'PINS-PROP-MET-005', axe: 'PROTECTION SOCIALE',
    nom: 'Échange de données ménage du RNU',
    fournisseurs: ['DGPSN(RNU)'], consommateurs: ['IPRES', 'CSS'],
    donnees_necessaires: 'Population vulnérable ciblé des deux entités',
    description: 'Accès aux données en vue de croisement',
    points_a_confirmer: null,
    resultat_attendu: 'Elaboration des indicateurs en vue d\'améliorer la qualité de service, lutte contre les doublons',
    defis: ['Meilleur ciblage', 'Qualité des données', 'Elaboration des tableaux de bord'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-6abb9d7cf1',
  },
  {
    ref_local: 'UC-PS-02', code_cible: 'PINS-PROP-MET-006', axe: 'PROTECTION SOCIALE',
    nom: 'Échange de données médicales entre MSHP(Dossier Patients Informatisés) / SENCSU',
    fournisseurs: ['CSDOSS'], consommateurs: ['SENCSU'], // CSDOSS = CSSDOS (coquille corrigée)
    donnees_necessaires: 'Diagnostic des antécédents médicaux',
    description: 'Partage des données médicales à la SENCU pour le suivi des soins administrés au patient',
    points_a_confirmer: 'Renforcer concrètement le dispositif de suivi et de contrôle de la gestion des services de santé. En cas de nouveaux soins au patient, l\'accès au dossier permet de valider si c\'est opportun d\'administrer ces soins. C\'est pour une gestion optimale des soins.',
    resultat_attendu: 'Un meilleur suivi du contrôle médicale',
    defis: ['Controle médicale efficace', 'Maitrise des dépenses en santé'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': false, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': false }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': false, 'Existe-t-il des obstacles majeurs a la coordination ?': false }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': false, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': false }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': false, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': false } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-bebfa9784a',
  },
  {
    ref_local: 'UC-PS-03', code_cible: 'PINS-PROP-MET-007', axe: 'PROTECTION SOCIALE',
    nom: 'Échange de données sur les salariés DGID vers IPRES /CSS',
    fournisseurs: ['DGID'], consommateurs: ['IPRES', 'CSS'],
    donnees_necessaires: 'Données sur les salariés déclarés',
    description: 'Contrôle de déclarations des employeurs au niveau de la IPRES/CSS',
    points_a_confirmer: null,
    resultat_attendu: 'Conformité des déclarations fiscales et nominatives',
    defis: ['Lutte contre la fraude fiscale et sociale', 'Elargissement de l\'assiette fiscale'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-66903d8fbb',
  },
  {
    ref_local: 'UC-PS-04', code_cible: 'PINS-PROP-MET-008', axe: 'PROTECTION SOCIALE',
    nom: 'Échange de données sur les salariés DAF vers IPRES /CSS',
    fournisseurs: ['DAF'], consommateurs: ['IPRES', 'CSS'],
    donnees_necessaires: 'Données d\'identités du bénéficiaire',
    description: 'Vérification d\'identité du bénéficiaire des prestations IPRES/CSS',
    points_a_confirmer: null,
    resultat_attendu: 'Viabilisation des identités, lutte contre les doublons et usurpation',
    defis: ['Fiabilisation des identités,', 'lutte contre les doublons et usurpation', 'Gestion des politiques sociales'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-c8adbb863f',
  },
  {
    ref_local: 'UC-PS-05', code_cible: 'PINS-PROP-MET-009', axe: 'PROTECTION SOCIALE',
    nom: 'Échange de données de l\'état civil vers IPRES /CSS',
    fournisseurs: ['ANEC'], consommateurs: ['IPRES', 'CSS'],
    donnees_necessaires: 'Acte de naissance, acte de décés, situation matrimoniale',
    description: 'Accès à l\'Etat civil pour la vérification du dossier des salariés / retraités',
    points_a_confirmer: null,
    resultat_attendu: 'Faciliter la mise à jour des droits, éviter les paiements indus',
    defis: ['Eviter les paiements indus', 'Mise à jour des droits', 'Lutte contre l\'évasion sociale'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-914eadb2c5',
  },
  {
    ref_local: 'UC-CA-01', code_cible: 'PINS-PROP-MET-010', axe: 'CLIMAT DES AFFAIRES',
    nom: 'Bilan énergétique national du Ministère de l\'Énergie',
    fournisseurs: ['Ministère de l\'énergie'], consommateurs: ['Cimentérie', 'entreprise sidéregie', 'Senelec'],
    donnees_necessaires: 'les données indistrielles , des hydrocarbures ,de electricités ,données photovoltaique ,de biomasse, des données démongraphiques et macroéconomique',
    description: 'Le Ministère de l\'Énergie met en place un système permettant de collecter, centraliser et analyser les données énergétiques provenant des différentes structures nationales afin de produire le bilan énergétique',
    points_a_confirmer: null,
    resultat_attendu: 'générer le bilan énergétique du pays en temps réel',
    defis: ['Fiabiliser les données', 'Maitriser les données'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-46cfd30969',
  },
  {
    ref_local: 'UC-CA-02', code_cible: 'PINS-PROP-MET-011', axe: 'CLIMAT DES AFFAIRES',
    nom: 'Vérification et récupération des informations d\'une entreprise via le NINEA',
    fournisseurs: ['ANSD'], consommateurs: ['Ageroute', 'Douane', 'Ministère de l\'énergie', 'MCAT'],
    donnees_necessaires: 'NINEA',
    description: 'Vérifier l\'authenticité d\'une entreprise\nRécupérer ses informations légales',
    points_a_confirmer: 'Quel est l\'objectif ? Quels impacts concrets sont attendus ?',
    resultat_attendu: 'Faciliter la vérification rapide des entreprises Réduire les fraudes (fausses entreprises) Améliorer la confiance entre partenaires Automatiser les contrôles administratifs',
    defis: ['Faciliter la vérification rapide des entreprises', 'Réduire les fraudes (fausses entreprises)', 'Améliorer la confiance entre partenaires', 'Automatiser les contrôles administratifs'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-afb53d8666',
  },
  {
    ref_local: 'UC-CA-03', code_cible: 'PINS-PROP-MET-012', axe: 'CLIMAT DES AFFAIRES',
    nom: 'Demande d\'intervention sur le réseau routier',
    fournisseurs: ['Ageroute'], consommateurs: ['CDC', 'DAF'],
    donnees_necessaires: 'CNI,Numero de quittance',
    description: 'Dans le cadre de la gestion et de la maintenance du réseau routier, AGEROUTE met en place un système permettant de:\nVérifier l\'identité du demandeur via la DAF (Carte Nationale d\'Identité)\nVérifier la validité de la quittance de paiement via la CDC (Caisse des Dépôts et Consignations)',
    points_a_confirmer: 'S\'agit-il de vérifier la légitimité de l\'entreprise chargée des travaux ? Quels impacts concrets sont attendus ?\nQuelles sont, au niveau d\'AGEROUTE, les données de référence avec lesquelles les numéros de CNI et de reçu seront croisés ?',
    resultat_attendu: 'Sécuriser les demandes d\'intervention\nÉviter les fraudes et fausses demandes\nGarantir que les paiements sont effectués',
    defis: ['Sécuriser les demandes d\'intervention', 'Éviter les fraudes et fausses demandes', 'Garantir que les paiements sont effectués'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-496cf90f48',
  },
  {
    ref_local: 'UC-CA-04', code_cible: 'PINS-PROP-MET-013', axe: 'CLIMAT DES AFFAIRES',
    nom: 'Vérification de l\'identité du guide touristique',
    fournisseurs: ['MCAT'], consommateurs: ['DAF'],
    donnees_necessaires: 'Numéro CNI Référence quittance (CDC)',
    description: 'Le Ministère de la Culture, de l\'Artisanat et du Tourisme, garantit que les guides touristiques sont authentiques, certifiés et légalement identifiés.\nCette vérification s\'appuie sur la base de données officielle de la Direction de l\'Automatisation des Fichiers (DAF),',
    points_a_confirmer: 'Au niveau du MCAT, quelles sont les données de référence utilisées pour le croisement avec les numéros de CNI et les numéros de reçu ?',
    resultat_attendu: 'Lutter contre les faux guides touristiques Renforcer la sécurité des touristes Améliorer la crédibilité du secteur touristique',
    defis: ['Lutter contre les faux guides touristiques', 'Renforcer la sécurité des touristes', 'Améliorer la crédibilité du secteur touristique'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-aa810d3462',
  },
  {
    ref_local: 'UC-CA-05', code_cible: 'PINS-PROP-MET-014', axe: 'CLIMAT DES AFFAIRES',
    nom: 'Paiement du timbre et de la caution des hôtels',
    fournisseurs: ['MCAT'], consommateurs: ['DGID', 'CDC'],
    donnees_necessaires: 'NINEA de l\'hôtel\nRéférence paiement timbre (DGID)\nRéférence caution (CDC)',
    description: 'Le Ministère de la Culture, de l\'Artisanat et du Tourisme, les établissements doivent s\'acquitter de :\n- Timbre fiscal (géré par la DGID – Direction Générale des Impôts et Domaines)\n💰 Caution (gérée par la CDC – Caisse des Dépôts et Consignations) afin de vérifier que ces paiements ont bien été effectués avant de valider ou autoriser l\'activité d\'un hôtel.',
    points_a_confirmer: null,
    resultat_attendu: 'Garantir la conformité fiscale et financière des hôtels\nÉviter les fraudes ou faux paiements\nAutomatiser les contrôles administratifs\nAméliorer la transparence entre les institutions (DGID / CDC)',
    defis: ['Verification des données'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-c498911fcc',
  },
  {
    ref_local: 'UC-CA-06', code_cible: 'PINS-PROP-MET-015', axe: 'CLIMAT DES AFFAIRES',
    nom: 'Suivi de la TVA suspendue',
    fournisseurs: ['DGD'], consommateurs: ['APIX', 'DGID'],
    donnees_necessaires: 'Dossier d\'agrément validé (APIX)\nInformations de l\'entreprise :\nNINEA\nRaison sociale\nNuméro d\'agrément\nDurée de validité',
    description: 'Les entreprises bénéficiant d\'une suspension de la TVA après validation de leur agrément par l\'APIX, les informations de l\'entreprise doivent être transmises en temps réel à la Douane afin de permettre :\nL\'application de la suspension de TVA sur les importations\nLe suivi et le contrôle des avantages accordés',
    points_a_confirmer: null,
    resultat_attendu: 'Assurer un échange fluide et automatique entre APIX et Douane\nRéduire les délais administratifs\nGarantir la traçabilité des avantages fiscaux\nÉviter les fraudes et abus de TVA suspendue',
    defis: null,
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-9eafc7e1b4',
  },
  {
    ref_local: 'UC-SC-01', code_cible: 'PINS-PROP-MET-016', axe: 'SERVICES AUX CITOYENS',
    nom: 'Identification et régularisation des états civils des élèves',
    fournisseurs: ['ANEC'], consommateurs: ['MEN'],
    donnees_necessaires: 'régistre d\'état civil',
    description: 'Les élèves font face à des problèmes et erreurs sur leur acte d\'état civil. Ce cas permettra au MEN de vérifier et corriger en temps réel l\'état civil des élèves auprès de l\'ANEC, sans démarche manuelle, pour lever les blocages aux examens',
    points_a_confirmer: null,
    resultat_attendu: 'vérifier et corriger en temps réel l\'état civil des élèves auprès de l\'ANEC',
    defis: ['Identifiant commun : absence d\'un identifiant unique élève reconnu à la fois par MEN et l\'ANEC', 'Qualité des données ANEC : fiabilité et exhaustivité du registre d\'état civil numérique au niveau national', 'Cadre juridique : Projet de convention en cours entre MEN et ANEC'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-955d1a3c23',
  },
  {
    ref_local: 'UC-SC-02', code_cible: 'PINS-PROP-MET-017', axe: 'SERVICES AUX CITOYENS',
    nom: 'Etat Civil',
    fournisseurs: ['ANEC'], consommateurs: ['DAF'],
    donnees_necessaires: 'NIN',
    description: 'A réception du dossier de demande de CNI, la DAF vérifie si l\'acte détat civil est authentique pour éviter les fraudes sur les documents de l\'état civil',
    points_a_confirmer: null,
    resultat_attendu: 'Authentification des actes d\'etat civil, notification des naissances et deces et mise concordance entre RNEC et CNI, gestion des codes centres',
    defis: ['Gouvernance'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-edd36cba1f',
  },
  {
    ref_local: 'UC-SC-03', code_cible: 'PINS-PROP-MET-018', axe: 'SERVICES AUX CITOYENS',
    nom: 'Autorisation de forage',
    fournisseurs: ['DGPRE'], consommateurs: ['Min.Env. ANSD', 'Min. Commerce', 'DGID'],
    donnees_necessaires: 'NIN, RCCM, Titre de propriété',
    description: 'Ce cas consiste à luttre contre l\'anarchie en encadrant l\'exploitation des ressources en eau souterraine afin de lutter contre leur surexploitation, de préserver la qualité de l\'eau, tout en garantissant leur durabilité, l\'équité d\'accès et le respect des exigences réglementaires.',
    points_a_confirmer: 'Les données requises et les fournisseurs de données ne semblent pas cohérents. La DAF et le Ministère de la Justice devraient-ils être ajoutés comme fournisseurs de données ?\nMerci également de préciser plus concrètement l\'impact attendu.',
    resultat_attendu: 'encadrer l\'exploitation des ressources en eau souterraine afin de lutter contre leur surexploitation, de préserver la qualité de l\'eau, tout en garantissant leur durabilité, l\'équité d\'accès et le respect des exigences réglementaires.',
    defis: ['Accès aux données sectorielles;', 'qualité des données', 'Cadre juridique'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-8610b47b82',
  },
  {
    ref_local: 'UC-SC-04', code_cible: 'PINS-PROP-MET-019', axe: 'SERVICES AUX CITOYENS',
    nom: 'Cartographie des zones inondables',
    fournisseurs: ['DPGI'], consommateurs: ['DGID', 'ANAT', 'DGUA', 'MUCTAT'],
    donnees_necessaires: 'Données hydro climatiques, topographiques,cadastre',
    description: 'Ce cas d\'usage vise à identifier, analyser et cartographier les zones exposées aux risques d\'inondation, afin d\'appuyer la planification territoriale et la gestion des risques.',
    points_a_confirmer: 'Le MUCTAT est-il du côté du consommateur de données ?',
    resultat_attendu: 'identifier, analyser et cartographier les zones exposées aux risques d\'inondation, afin d\'appuyer la planification territoriale et la gestion des risques.',
    defis: ['Accès aux données sectorielles;', 'qualité des données', 'Cadre juridique'],
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-e47564ec0c',
  },
  {
    ref_local: 'UC-SC-05', code_cible: 'PINS-PROP-MET-020', axe: 'SERVICES AUX CITOYENS',
    nom: 'Résultat de recherche agro alimentaire',
    fournisseurs: ['ITA'], consommateurs: ['ADEPME'],
    donnees_necessaires: 'Conventions, Brevet d\'invention',
    description: 'ce cas consiste à accompagner, former,et assister les PME, travailler avec l\'ADPME dans sa mission d\'appui aux entreprises à travers le transfert de technologie,l\'incubation et le conseil',
    points_a_confirmer: 'Comment est-il concrètement envisagé que l\'ADEPME utilise et valorise ces données ?',
    resultat_attendu: 'Transfert de technologie, incubation et conseils',
    defis: null,
    faisabilite_brute: { juridique: { 'Le partage des donnees est-il legalement autorise ?': true, 'Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?': true }, institutionnelle: { 'Les institutions sont-elles disposees et aptes a partager ?': true, 'Existe-t-il des obstacles majeurs a la coordination ?': true }, gouvernance: { 'La propriete des donnees est-elle clairement definie ?': true, 'Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?': true }, technique: { 'Les systemes existants peuvent-ils prendre en charge l\'echange ?': true, 'L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?': true } },
    source: 'Atelier - TABLEAU_DES_USE_CASE_POTENTIELS.xlsx', cle_source: 'UCP-a48b518c3b',
  },
];

function resolveInst(libelle: string): string[] {
  if (MULTI_MAP[libelle]) return MULTI_MAP[libelle];
  const code = INST_MAP[libelle];
  if (code) return [code];
  // Catégories/entreprises ignorées
  if (['Cimentérie', 'entreprise sidéregie', 'Senelec'].includes(libelle)) return [];
  console.warn(`⚠️  Institution non résolue : "${libelle}"`);
  return [];
}

async function main() {
  console.log('=== SEED 20 USE CASES POTENTIELS ===\n');

  // --- Institutions ---
  const newInsts: { code: string; nom: string; ministere: string }[] = [
    { code: 'CDC', nom: 'Caisse des Dépôts et Consignations', ministere: 'Ministère des Finances et du Budget' },
    { code: 'SOLDE', nom: 'Direction de la Solde', ministere: 'Ministère des Finances et du Budget' },
    { code: 'DGUA', nom: "Direction Générale de l'Urbanisme et de l'Architecture", ministere: 'MUCTAT' },
    { code: 'DPGI', nom: "Direction de la Prévention et de la Gestion des Inondations", ministere: "Ministère de l'Eau et de l'Assainissement" },
    { code: 'CSSDOS', nom: "Cellule de la Carte Sanitaire et Sociale, de la Santé Digitale et de l'Observatoire de la Santé", ministere: "Ministère de la Santé et de l'Action Sociale" },
  ];

  // Fix MUCTA → MUCTAT
  const mucta = await prisma.institution.findUnique({ where: { code: 'MUCTA' } });
  if (mucta) {
    await prisma.institution.update({
      where: { code: 'MUCTA' },
      data: { code: 'MUCTAT', nom: "Ministère de l'Urbanisme, des Collectivités Territoriales et de l'Aménagement des Territoires" },
    });
    console.log('✅ MUCTA → MUCTAT (renommé)');
  }

  let instCreated = 0;
  for (const inst of newInsts) {
    const exists = await prisma.institution.findUnique({ where: { code: inst.code } });
    if (!exists) {
      await prisma.institution.create({
        data: {
          code: inst.code, nom: inst.nom, ministere: inst.ministere,
          responsableNom: 'À compléter', responsableFonction: 'À compléter',
          responsableEmail: `seed-${inst.code.toLowerCase()}@placeholder.pins.sn`,
          responsableTel: '+221000000000',
        },
      });
      instCreated++;
      console.log(`✅ Institution créée : ${inst.code} — ${inst.nom}`);
    } else {
      console.log(`⏭️  Institution existante : ${inst.code}`);
    }
  }

  // --- Use Cases ---
  let casCreated = 0;
  let casSkipped = 0;

  for (const uc of USE_CASES) {
    const existing = await prisma.casUsageMVP.findFirst({
      where: { sourceDetail: uc.cle_source }, // cle_source stockée dans sourceDetail
    });
    if (existing) {
      console.log(`⏭️  ${uc.code_cible} déjà présent (${uc.cle_source})`);
      casSkipped++;
      continue;
    }

    const cas = await prisma.casUsageMVP.create({
      data: {
        code: uc.code_cible,
        titre: uc.nom,
        description: uc.description,
        donneesEchangees: uc.donnees_necessaires,
        domaine: AXE_TO_DOMAINE[uc.axe] as any,
        statutVueSection: 'PROPOSE',
        statutImpl: 'IDENTIFIE',
        typologie: 'METIER',
        sourceProposition: 'ATELIER_CADRAGE',
        sourceDetail: uc.cle_source, // stocke la cle_source pour idempotence
        axePrioritaire: uc.axe,
        resumeMetier: uc.resultat_attendu,
        notes: uc.points_a_confirmer,
        prerequis: uc.defis ? uc.defis.join('; ') : null,
        conventionRequise: false,
      },
    });
    casCreated++;

    // Faisabilité
    const fb = uc.faisabilite_brute;
    await prisma.$executeRawUnsafe(
      `INSERT INTO faisabilite_cas (id, "casUsageId",
        "partageLegalementAutorise", "contraintesBloquantesProtection",
        "institutionsAptesAPartager", "obstaclesCoordination",
        "proprieteDonneesDefinie", "incoherencesNormes",
        "systemesPrennentEnCharge", "infraDisponible",
        source, notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      cas.id,
      fb.juridique['Le partage des donnees est-il legalement autorise ?'],
      fb.juridique['Existe-t-il des contraintes bloquantes en matiere de protection des donnees / vie privee ?'],
      fb.institutionnelle['Les institutions sont-elles disposees et aptes a partager ?'],
      fb.institutionnelle['Existe-t-il des obstacles majeurs a la coordination ?'],
      fb.gouvernance['La propriete des donnees est-elle clairement definie ?'],
      fb.gouvernance['Existe-t-il des incoherences majeures dans les normes/identifiants/formats ?'],
      fb.technique['Les systemes existants peuvent-ils prendre en charge l\'echange ?'],
      fb.technique['L\'infrastructure requise est-elle disponible (reseau, hebergement, ICP) ?'],
      uc.source,
      uc.points_a_confirmer,
    );

    // Institutions pressenties (fournisseurs + consommateurs)
    const seen = new Set<string>();
    for (const libelle of [...uc.fournisseurs, ...uc.consommateurs]) {
      const instCodes = resolveInst(libelle);
      for (const code of instCodes) {
        if (seen.has(code)) continue;
        seen.add(code);
        try {
          const inst = await prisma.institution.findUnique({ where: { code } });
          if (!inst) { console.warn(`  ⚠️ Institution ${code} non trouvée pour ${uc.code_cible}`); continue; }
          const role = uc.fournisseurs.includes(libelle) && uc.consommateurs.includes(libelle)
            ? 'BOTH' : uc.fournisseurs.includes(libelle) ? 'FOURNISSEUR' : 'CONSOMMATEUR';
          await prisma.$executeRawUnsafe(
            `INSERT INTO institution_pressentie (id, "casUsageId", "institutionId", "rolePressenti", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3::"RolePressenti", NOW())
             ON CONFLICT ("casUsageId", "institutionId") DO NOTHING`,
            cas.id, inst.id, role,
          );
        } catch (e: any) {
          if (!e.message?.includes('duplicate')) console.warn(`  ⚠️ Erreur ${code} pour ${uc.code_cible}: ${e.message}`);
        }
      }
    }

    const instCount = seen.size;
    console.log(`✅ ${uc.code_cible} — ${uc.nom} (${instCount} institutions pressenties)`);
  }

  console.log(`\n=== RÉSUMÉ ===`);
  console.log(`Propositions créées : ${casCreated}`);
  console.log(`Propositions déjà présentes : ${casSkipped}`);
  console.log(`Institutions créées : ${instCreated}`);
  console.log(`Total cas : ${casCreated + casSkipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
