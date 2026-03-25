import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Liste officielle des ministères et institutions - Décret n°2025-1431
// Source: https://www.primature.sn/publications/actualites/composition-du-nouveau-gouvernement-2

interface InstitutionData {
  code: string;
  nom: string;
  ministere: string;
  responsableNom?: string;
  responsableFonction?: string;
}

const institutions: InstitutionData[] = [
  // ============================================================================
  // PRÉSIDENCE DE LA RÉPUBLIQUE
  // ============================================================================
  { code: 'PR', nom: 'Présidence de la République', ministere: 'Présidence' },
  { code: 'SGP', nom: 'Secrétariat Général de la Présidence', ministere: 'Présidence' },
  { code: 'IGE', nom: 'Inspection Générale d\'État', ministere: 'Présidence' },
  { code: 'OFNAC', nom: 'Office National de Lutte contre la Fraude et la Corruption', ministere: 'Présidence' },
  { code: 'COS-PETROGAZ', nom: 'Comité d\'Orientation Stratégique du Pétrole et du Gaz', ministere: 'Présidence' },
  { code: 'CRSE', nom: 'Commission de Régulation du Secteur de l\'Énergie', ministere: 'Présidence' },
  { code: 'ARSN', nom: 'Autorité de Radioprotection et de Sûreté Nucléaire', ministere: 'Présidence' },
  { code: 'ARSE', nom: 'Autorité de Régulation du Secteur de l\'Eau', ministere: 'Présidence' },
  { code: 'ASES', nom: 'Agence Sénégalaise d\'Études Spatiales', ministere: 'Présidence' },
  { code: 'FIG', nom: 'Fonds Intergénérationnel', ministere: 'Présidence' },

  // ============================================================================
  // PRIMATURE
  // ============================================================================
  { code: 'PM', nom: 'Cabinet du Premier Ministre', ministere: 'Primature' },
  { code: 'SGG', nom: 'Secrétariat Général du Gouvernement', ministere: 'Primature' },
  { code: 'DGSCSO', nom: 'Direction Générale de la Surveillance et du Contrôle de l\'Occupation du Sol', ministere: 'Primature' },
  { code: 'DGSCNV', nom: 'Direction Générale du Service Civique National et du Volontariat', ministere: 'Primature' },
  { code: 'BOS', nom: 'Bureau Opérationnel de Coordination et de Suivi des Projets et Programmes', ministere: 'Primature' },
  { code: 'MCA-SN', nom: 'Millenium Challenge Account - Sénégal', ministere: 'Primature' },
  { code: 'ANRAC', nom: 'Agence Nationale pour la Relance des Activités Économiques et Sociales en Casamance', ministere: 'Primature' },

  // ============================================================================
  // MINISTÈRE DE LA JUSTICE
  // ============================================================================
  { code: 'MJ', nom: 'Ministère de la Justice', ministere: 'Justice', responsableNom: 'Yassine FALL', responsableFonction: 'Ministre' },
  { code: 'DAGE-MJ', nom: 'Direction de l\'Administration Générale et de l\'Équipement (Justice)', ministere: 'Justice' },
  { code: 'DSJ', nom: 'Direction des Services Judiciaires', ministere: 'Justice' },
  { code: 'DAP', nom: 'Direction de l\'Administration Pénitentiaire', ministere: 'Justice' },
  { code: 'DESPS', nom: 'Direction de l\'Éducation Surveillée et de la Protection Sociale', ministere: 'Justice' },
  { code: 'DACG', nom: 'Direction des Affaires Criminelles et des Grâces', ministere: 'Justice' },
  { code: 'GREFFE', nom: 'Greffe du Tribunal de Commerce (RCCM)', ministere: 'Justice' },
  { code: 'CNCJ', nom: 'Centre National du Casier Judiciaire', ministere: 'Justice' },
  { code: 'CENTIF', nom: 'Cellule Nationale de Traitement des Informations Financières', ministere: 'Justice' },

  // ============================================================================
  // MINISTÈRE DE L'ÉNERGIE, DU PÉTROLE ET DES MINES
  // ============================================================================
  { code: 'MEPM', nom: 'Ministère de l\'Énergie, du Pétrole et des Mines', ministere: 'Énergie', responsableNom: 'Birame Soulèye DIOP', responsableFonction: 'Ministre' },
  { code: 'DGE', nom: 'Direction Générale de l\'Énergie', ministere: 'Énergie' },
  { code: 'DGH', nom: 'Direction Générale des Hydrocarbures', ministere: 'Énergie' },
  { code: 'DGM-MINES', nom: 'Direction Générale des Mines', ministere: 'Énergie' },
  { code: 'SENELEC', nom: 'Société Nationale d\'Électricité du Sénégal', ministere: 'Énergie' },
  { code: 'SAR', nom: 'Société Africaine de Raffinage', ministere: 'Énergie' },
  { code: 'PETROSEN', nom: 'Société des Pétroles du Sénégal', ministere: 'Énergie' },
  { code: 'ASER', nom: 'Agence Sénégalaise d\'Électrification Rurale', ministere: 'Énergie' },
  { code: 'AEME', nom: 'Agence pour l\'Économie et la Maîtrise de l\'Énergie', ministere: 'Énergie' },
  { code: 'GES-PETROGAZ', nom: 'Unité de Gestion du COS-PETROGAZ', ministere: 'Énergie' },

  // ============================================================================
  // MINISTÈRE DE L'INTÉRIEUR ET DE LA SÉCURITÉ PUBLIQUE
  // ============================================================================
  { code: 'MINT', nom: 'Ministère de l\'Intérieur et de la Sécurité Publique', ministere: 'Intérieur', responsableNom: 'Mouhamadou Bamba CISSÉ', responsableFonction: 'Ministre' },
  { code: 'DGPN', nom: 'Direction Générale de la Police Nationale', ministere: 'Intérieur' },
  { code: 'DAF', nom: 'Direction de l\'Automatisation des Fichiers', ministere: 'Intérieur' },
  { code: 'ANEC', nom: 'Agence Nationale de l\'État Civil', ministere: 'Intérieur' },
  { code: 'DGE-ELEC', nom: 'Direction Générale des Élections', ministere: 'Intérieur' },
  { code: 'DPF', nom: 'Direction de la Police des Frontières', ministere: 'Intérieur' },
  { code: 'DGPC', nom: 'Direction Générale de la Protection Civile', ministere: 'Intérieur' },
  { code: 'DSP', nom: 'Direction de la Sécurité Publique', ministere: 'Intérieur' },

  // ============================================================================
  // MINISTÈRE DE L'ÉCONOMIE, DU PLAN ET DE LA COOPÉRATION
  // ============================================================================
  { code: 'MEPC', nom: 'Ministère de l\'Économie, du Plan et de la Coopération', ministere: 'Économie', responsableNom: 'Abdourahmane SARR', responsableFonction: 'Ministre' },
  { code: 'DPEE', nom: 'Direction de la Prévision et des Études Économiques', ministere: 'Économie' },
  { code: 'DGPPE', nom: 'Direction Générale de la Planification et des Politiques Économiques', ministere: 'Économie' },
  { code: 'DCEF', nom: 'Direction de la Coopération Économique et Financière', ministere: 'Économie' },
  { code: 'ANSD', nom: 'Agence Nationale de la Statistique et de la Démographie', ministere: 'Économie' },
  { code: 'APIX', nom: 'Agence de Promotion des Investissements et des Grands Travaux', ministere: 'Économie' },
  { code: 'BOM', nom: 'Bureau Organisation et Méthodes', ministere: 'Économie' },

  // ============================================================================
  // MINISTÈRE DES FINANCES ET DU BUDGET
  // ============================================================================
  { code: 'MFB', nom: 'Ministère des Finances et du Budget', ministere: 'Finances', responsableNom: 'Cheikh DIBA', responsableFonction: 'Ministre' },
  { code: 'IGF', nom: 'Inspection Générale des Finances', ministere: 'Finances' },
  { code: 'DGID', nom: 'Direction Générale des Impôts et des Domaines', ministere: 'Finances' },
  { code: 'DGD', nom: 'Direction Générale des Douanes', ministere: 'Finances' },
  { code: 'DGCPT', nom: 'Direction Générale de la Comptabilité Publique et du Trésor', ministere: 'Finances' },
  { code: 'DGB', nom: 'Direction Générale du Budget', ministere: 'Finances' },
  { code: 'DCMP', nom: 'Direction Centrale des Marchés Publics', ministere: 'Finances' },
  { code: 'DGSF', nom: 'Direction Générale du Secteur Financier', ministere: 'Finances' },
  { code: 'DGF', nom: 'Direction Générale des Finances', ministere: 'Finances' },
  { code: 'DCAD', nom: 'Direction du Cadastre', ministere: 'Finances' },
  { code: 'DMC', nom: 'Direction de la Monnaie et du Crédit', ministere: 'Finances' },
  { code: 'DGPPE-FIN', nom: 'Direction Générale du Patrimoine de l\'État', ministere: 'Finances' },
  { code: 'ARCOP', nom: 'Autorité de Régulation de la Commande Publique', ministere: 'Finances' },

  // ============================================================================
  // MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR, DE LA RECHERCHE ET DE L'INNOVATION
  // ============================================================================
  { code: 'MESRI', nom: 'Ministère de l\'Enseignement Supérieur, de la Recherche et de l\'Innovation', ministere: 'Enseignement Supérieur', responsableNom: 'Daouda NGOM', responsableFonction: 'Ministre' },
  { code: 'DGES', nom: 'Direction Générale de l\'Enseignement Supérieur', ministere: 'Enseignement Supérieur' },
  { code: 'DGR', nom: 'Direction Générale de la Recherche', ministere: 'Enseignement Supérieur' },
  { code: 'UCAD', nom: 'Université Cheikh Anta Diop de Dakar', ministere: 'Enseignement Supérieur' },
  { code: 'UGB', nom: 'Université Gaston Berger de Saint-Louis', ministere: 'Enseignement Supérieur' },
  { code: 'UASZ', nom: 'Université Assane Seck de Ziguinchor', ministere: 'Enseignement Supérieur' },
  { code: 'ANAQ-SUP', nom: 'Autorité Nationale d\'Assurance Qualité de l\'Enseignement Supérieur', ministere: 'Enseignement Supérieur' },

  // ============================================================================
  // MINISTÈRE DES INFRASTRUCTURES, DES TRANSPORTS TERRESTRES ET AÉRIENS
  // ============================================================================
  { code: 'MITTA', nom: 'Ministère des Infrastructures, des Transports Terrestres et Aériens', ministere: 'Transports', responsableNom: 'Yankoba DIEME', responsableFonction: 'Ministre' },
  { code: 'DTR', nom: 'Direction des Transports Routiers', ministere: 'Transports' },
  { code: 'ANACIM', nom: 'Agence Nationale de l\'Aviation Civile et de la Météorologie', ministere: 'Transports' },
  { code: 'AIBD', nom: 'Aéroport International Blaise Diagne', ministere: 'Transports' },
  { code: 'AGEROUTE', nom: 'Agence des Travaux et de Gestion des Routes', ministere: 'Transports' },
  { code: 'CETUD', nom: 'Conseil Exécutif des Transports Urbains de Dakar', ministere: 'Transports' },
  { code: 'AS-SA', nom: 'Air Sénégal SA', ministere: 'Transports' },
  { code: 'TER', nom: 'Train Express Régional', ministere: 'Transports' },
  { code: 'BRT', nom: 'Bus Rapid Transit', ministere: 'Transports' },

  // ============================================================================
  // MINISTÈRE DE LA COMMUNICATION, DES TÉLÉCOMMUNICATIONS ET DU NUMÉRIQUE
  // ============================================================================
  { code: 'MCTN', nom: 'Ministère de la Communication, des Télécommunications et du Numérique', ministere: 'Numérique', responsableNom: 'Alioune SALL', responsableFonction: 'Ministre' },
  { code: 'SENUM', nom: 'Secrétariat d\'État au Numérique / SENUM', ministere: 'Numérique' },
  { code: 'ARTP', nom: 'Autorité de Régulation des Télécommunications et des Postes', ministere: 'Numérique' },
  { code: 'ADIE', nom: 'Agence de l\'Informatique de l\'État', ministere: 'Numérique' },
  { code: 'CDP', nom: 'Commission de Protection des Données Personnelles', ministere: 'Numérique' },
  { code: 'RTS', nom: 'Radiodiffusion Télévision Sénégalaise', ministere: 'Numérique' },
  { code: 'APS', nom: 'Agence de Presse Sénégalaise', ministere: 'Numérique' },
  { code: 'CNRA', nom: 'Conseil National de Régulation de l\'Audiovisuel', ministere: 'Numérique' },
  { code: 'SONATEL', nom: 'Société Nationale des Télécommunications', ministere: 'Numérique' },

  // ============================================================================
  // MINISTÈRE DE L'ÉDUCATION NATIONALE
  // ============================================================================
  { code: 'MEN', nom: 'Ministère de l\'Éducation Nationale', ministere: 'Éducation', responsableNom: 'Moustapha Mamba GUIRASSY', responsableFonction: 'Ministre' },
  { code: 'DEMSG', nom: 'Direction de l\'Enseignement Moyen et Secondaire Général', ministere: 'Éducation' },
  { code: 'DEE', nom: 'Direction de l\'Enseignement Élémentaire', ministere: 'Éducation' },
  { code: 'IA', nom: 'Inspections d\'Académie', ministere: 'Éducation' },

  // ============================================================================
  // MINISTÈRE DE L'AGRICULTURE, DE LA SOUVERAINETÉ ALIMENTAIRE ET DE L'ÉLEVAGE
  // ============================================================================
  { code: 'MASAE', nom: 'Ministère de l\'Agriculture, de la Souveraineté Alimentaire et de l\'Élevage', ministere: 'Agriculture', responsableNom: 'Mabouba DIAGNE', responsableFonction: 'Ministre' },
  { code: 'DA', nom: 'Direction de l\'Agriculture', ministere: 'Agriculture' },
  { code: 'DAPSA', nom: 'Direction de l\'Analyse, de la Prévision et des Statistiques Agricoles', ministere: 'Agriculture' },
  { code: 'SAED', nom: 'Société Nationale d\'Aménagement et d\'Exploitation des Terres du Delta', ministere: 'Agriculture' },
  { code: 'SODAGRI', nom: 'Société de Développement Agricole et Industriel', ministere: 'Agriculture' },
  { code: 'ANCAR', nom: 'Agence Nationale de Conseil Agricole et Rural', ministere: 'Agriculture' },
  { code: 'ISRA', nom: 'Institut Sénégalais de Recherches Agricoles', ministere: 'Agriculture' },
  { code: 'DSV', nom: 'Direction des Services Vétérinaires', ministere: 'Agriculture' },
  { code: 'DIREL', nom: 'Direction de l\'Élevage', ministere: 'Agriculture' },

  // ============================================================================
  // MINISTÈRE DE LA SANTÉ ET DE L'ACTION SOCIALE
  // ============================================================================
  { code: 'MSAS', nom: 'Ministère de la Santé et de l\'Action Sociale', ministere: 'Santé', responsableNom: 'Ibrahima SY', responsableFonction: 'Ministre' },
  { code: 'DGS', nom: 'Direction Générale de la Santé', ministere: 'Santé' },
  { code: 'DGAS', nom: 'Direction Générale de l\'Action Sociale', ministere: 'Santé' },
  { code: 'PNA', nom: 'Pharmacie Nationale d\'Approvisionnement', ministere: 'Santé' },
  { code: 'SEN-CSU', nom: 'Couverture Sanitaire Universelle', ministere: 'Santé' },
  { code: 'SIGICMU', nom: 'Système de Gestion de la Couverture Maladie Universelle', ministere: 'Santé' },
  { code: 'SAMU', nom: 'Service d\'Aide Médicale Urgente', ministere: 'Santé' },
  { code: 'IPD', nom: 'Institut Pasteur de Dakar', ministere: 'Santé' },

  // ============================================================================
  // MINISTÈRE DE L'HYDRAULIQUE ET DE L'ASSAINISSEMENT
  // ============================================================================
  { code: 'MHA', nom: 'Ministère de l\'Hydraulique et de l\'Assainissement', ministere: 'Hydraulique', responsableNom: 'Cheikh Tidiane DIEYE', responsableFonction: 'Ministre' },
  { code: 'DGPRE', nom: 'Direction de la Gestion et de la Planification des Ressources en Eau', ministere: 'Hydraulique' },
  { code: 'ONAS', nom: 'Office National de l\'Assainissement du Sénégal', ministere: 'Hydraulique' },
  { code: 'SDE', nom: 'Sénégalaise Des Eaux', ministere: 'Hydraulique' },
  { code: 'SONES', nom: 'Société Nationale des Eaux du Sénégal', ministere: 'Hydraulique' },

  // ============================================================================
  // MINISTÈRE DE LA FAMILLE ET DES SOLIDARITÉS
  // ============================================================================
  { code: 'MFFS', nom: 'Ministère de la Famille et des Solidarités', ministere: 'Famille', responsableNom: 'Maimouna DIEYE', responsableFonction: 'Ministre' },
  { code: 'DPF-FAM', nom: 'Direction de la Promotion de la Famille', ministere: 'Famille' },
  { code: 'DGPSN', nom: 'Délégation Générale à la Protection Sociale et à la Solidarité Nationale', ministere: 'Famille' },
  { code: 'RNU', nom: 'Registre National Unique', ministere: 'Famille' },
  { code: 'SAIDA', nom: 'Système d\'Aide à l\'Insertion et au Développement de l\'Autonomie', ministere: 'Famille' },

  // ============================================================================
  // MINISTÈRE DE L'EMPLOI ET DE LA FORMATION PROFESSIONNELLE
  // ============================================================================
  { code: 'MEFP', nom: 'Ministère de l\'Emploi et de la Formation Professionnelle', ministere: 'Emploi', responsableNom: 'Amadou Moustapha Ndieck SARRE', responsableFonction: 'Ministre' },
  { code: 'DE', nom: 'Direction de l\'Emploi', ministere: 'Emploi' },
  { code: 'DFPT', nom: 'Direction de la Formation Professionnelle et Technique', ministere: 'Emploi' },
  { code: 'ONFP', nom: 'Office National de Formation Professionnelle', ministere: 'Emploi' },
  { code: 'ANPEJ', nom: 'Agence Nationale pour la Promotion de l\'Emploi des Jeunes', ministere: 'Emploi' },
  { code: 'DER-FJ', nom: 'Délégation à l\'Entrepreneuriat Rapide des Femmes et des Jeunes', ministere: 'Emploi' },
  { code: '3FPT', nom: 'Fonds de Financement de la Formation Professionnelle et Technique', ministere: 'Emploi' },

  // ============================================================================
  // MINISTÈRE DE L'ENVIRONNEMENT ET DE LA TRANSITION ÉCOLOGIQUE
  // ============================================================================
  { code: 'METE', nom: 'Ministère de l\'Environnement et de la Transition Écologique', ministere: 'Environnement', responsableNom: 'El Hadji Abdourahmane DIOUF', responsableFonction: 'Ministre' },
  { code: 'DEEC', nom: 'Direction de l\'Environnement et des Établissements Classés', ministere: 'Environnement' },
  { code: 'DEFCCS', nom: 'Direction des Eaux, Forêts, Chasses et de la Conservation des Sols', ministere: 'Environnement' },
  { code: 'ANA', nom: 'Agence Nationale de l\'Aquaculture', ministere: 'Environnement' },

  // ============================================================================
  // MINISTÈRE DE L'URBANISME, DES COLLECTIVITÉS TERRITORIALES ET DE L'AMÉNAGEMENT
  // ============================================================================
  { code: 'MUCTA', nom: 'Ministère de l\'Urbanisme, des Collectivités Territoriales et de l\'Aménagement', ministere: 'Urbanisme', responsableNom: 'Balla Moussa FOFANA', responsableFonction: 'Ministre' },
  { code: 'DGAT', nom: 'Direction Générale de l\'Administration Territoriale', ministere: 'Urbanisme' },
  { code: 'DUA', nom: 'Direction de l\'Urbanisme et de l\'Architecture', ministere: 'Urbanisme' },
  { code: 'ADM', nom: 'Agence de Développement Municipal', ministere: 'Urbanisme' },
  { code: 'ANAT', nom: 'Agence Nationale de l\'Aménagement du Territoire', ministere: 'Urbanisme' },
  { code: 'SN-HLM', nom: 'Société Nationale des Habitations à Loyer Modéré', ministere: 'Urbanisme' },
  { code: 'SICAP', nom: 'Société Immobilière du Cap-Vert', ministere: 'Urbanisme' },

  // ============================================================================
  // MINISTÈRE DE L'INDUSTRIE ET DU COMMERCE
  // ============================================================================
  { code: 'MIC', nom: 'Ministère de l\'Industrie et du Commerce', ministere: 'Industrie', responsableNom: 'Serigne Guèye DIOP', responsableFonction: 'Ministre' },
  { code: 'DI', nom: 'Direction de l\'Industrie', ministere: 'Industrie' },
  { code: 'DCI', nom: 'Direction du Commerce Intérieur', ministere: 'Industrie' },
  { code: 'DCE', nom: 'Direction du Commerce Extérieur', ministere: 'Industrie' },
  { code: 'ASEPEX', nom: 'Agence Sénégalaise de Promotion des Exportations', ministere: 'Industrie' },
  { code: 'ADEPME', nom: 'Agence de Développement et d\'Encadrement des PME', ministere: 'Industrie' },
  { code: 'ICS', nom: 'Industries Chimiques du Sénégal', ministere: 'Industrie' },
  { code: 'SONACOS', nom: 'Société Nationale de Commercialisation des Oléagineux', ministere: 'Industrie' },
  { code: 'CICES', nom: 'Centre International du Commerce Extérieur du Sénégal', ministere: 'Industrie' },

  // ============================================================================
  // MINISTÈRE DES PÊCHES ET DE L'ÉCONOMIE MARITIME
  // ============================================================================
  { code: 'MPEM', nom: 'Ministère des Pêches et de l\'Économie Maritime', ministere: 'Pêches', responsableNom: 'Fatou DIOUF', responsableFonction: 'Ministre' },
  { code: 'DPM', nom: 'Direction des Pêches Maritimes', ministere: 'Pêches' },
  { code: 'DPSP', nom: 'Direction de la Protection et de la Surveillance des Pêches', ministere: 'Pêches' },
  { code: 'DAMCP', nom: 'Direction des Affaires Maritimes et du Commerce Portuaire', ministere: 'Pêches' },
  { code: 'PAD', nom: 'Port Autonome de Dakar', ministere: 'Pêches' },

  // ============================================================================
  // MINISTÈRE DE LA FONCTION PUBLIQUE ET DE LA RÉFORME DU SERVICE PUBLIC
  // ============================================================================
  { code: 'MFPRSP', nom: 'Ministère de la Fonction Publique et de la Réforme du Service Public', ministere: 'Fonction Publique', responsableNom: 'Olivier BOUCAL', responsableFonction: 'Ministre' },
  { code: 'DGFP', nom: 'Direction Générale de la Fonction Publique', ministere: 'Fonction Publique' },
  { code: 'DST', nom: 'Direction des Statistiques du Travail', ministere: 'Fonction Publique' },
  { code: 'IT', nom: 'Inspection du Travail', ministere: 'Fonction Publique' },
  { code: 'CSS', nom: 'Caisse de Sécurité Sociale', ministere: 'Fonction Publique' },
  { code: 'IPRES', nom: 'Institution de Prévoyance Retraite du Sénégal', ministere: 'Fonction Publique' },
  { code: 'FNR', nom: 'Fonds National de Retraite', ministere: 'Fonction Publique' },

  // ============================================================================
  // MINISTÈRE DE LA JEUNESSE, DES SPORTS ET DE LA CULTURE
  // ============================================================================
  { code: 'MJSC', nom: 'Ministère de la Jeunesse, des Sports et de la Culture', ministere: 'Jeunesse', responsableNom: 'Khady Diène GAYE', responsableFonction: 'Ministre' },
  { code: 'DSJ', nom: 'Direction des Sports et de la Jeunesse', ministere: 'Jeunesse' },
  { code: 'CNOSS', nom: 'Comité National Olympique et Sportif Sénégalais', ministere: 'Jeunesse' },

  // ============================================================================
  // MINISTÈRE DE LA MICROFINANCE ET DE L'ÉCONOMIE SOCIALE ET SOLIDAIRE
  // ============================================================================
  { code: 'MMESS', nom: 'Ministère de la Microfinance et de l\'Économie Sociale et Solidaire', ministere: 'Microfinance', responsableNom: 'Alioune DIONE', responsableFonction: 'Ministre' },
  { code: 'DGM', nom: 'Direction Générale de la Microfinance', ministere: 'Microfinance' },
  { code: 'DRSFD', nom: 'Direction de la Réglementation et de la Supervision des SFD', ministere: 'Microfinance' },
  { code: 'FONGIP', nom: 'Fonds de Garantie des Investissements Prioritaires', ministere: 'Microfinance' },
  { code: 'FONSIS', nom: 'Fonds Souverain d\'Investissements Stratégiques', ministere: 'Microfinance' },

  // ============================================================================
  // MINISTÈRE DES INFRASTRUCTURES ET DES TRAVAUX PUBLICS
  // ============================================================================
  { code: 'MITP', nom: 'Ministère des Infrastructures et des Travaux Publics', ministere: 'Infrastructures', responsableNom: 'Déthié FALL', responsableFonction: 'Ministre' },
  { code: 'DGTP', nom: 'Direction Générale des Travaux Publics', ministere: 'Infrastructures' },
  { code: 'DGBPS', nom: 'Direction Générale des Bâtiments et du Patrimoine de l\'État', ministere: 'Infrastructures' },

  // ============================================================================
  // MINISTÈRE DE LA CULTURE, DES INDUSTRIES CRÉATIVES, DE L'ARTISANAT ET DU TOURISME
  // ============================================================================
  { code: 'MCICAT', nom: 'Ministère de la Culture, des Industries Créatives, de l\'Artisanat et du Tourisme', ministere: 'Culture', responsableNom: 'Amadou BA', responsableFonction: 'Ministre' },
  { code: 'DMC', nom: 'Direction de la Culture', ministere: 'Culture' },
  { code: 'DT', nom: 'Direction du Tourisme', ministere: 'Culture' },
  { code: 'DA-ART', nom: 'Direction de l\'Artisanat', ministere: 'Culture' },
  { code: 'TND', nom: 'Théâtre National Daniel Sorano', ministere: 'Culture' },
  { code: 'BSDA', nom: 'Bureau Sénégalais du Droit d\'Auteur', ministere: 'Culture' },

  // ============================================================================
  // MINISTÈRE DE L'INTÉGRATION AFRICAINE ET DES AFFAIRES ÉTRANGÈRES
  // ============================================================================
  { code: 'MIAAE', nom: 'Ministère de l\'Intégration Africaine et des Affaires Étrangères', ministere: 'Affaires Étrangères', responsableNom: 'Cheikh NIANG', responsableFonction: 'Ministre' },
  { code: 'DGASE', nom: 'Direction Générale des Affaires Sénégalaises à l\'Extérieur', ministere: 'Affaires Étrangères' },
  { code: 'DGCE', nom: 'Direction Générale de la Coopération et des Échanges', ministere: 'Affaires Étrangères' },

  // ============================================================================
  // MINISTÈRE DES FORCES ARMÉES
  // ============================================================================
  { code: 'MFA', nom: 'Ministère des Forces Armées', ministere: 'Forces Armées', responsableNom: 'Général Birame DIOP', responsableFonction: 'Ministre' },
  { code: 'EMGA', nom: 'État-Major Général des Armées', ministere: 'Forces Armées' },
  { code: 'DSN', nom: 'Direction de la Sécurité Nationale', ministere: 'Forces Armées' },
];

async function main() {
  console.log('🏛️  Import des Ministères et Institutions - Décret n°2025-1431');
  console.log('=' .repeat(80));
  console.log(`📅 Date du décret: 6 septembre 2025`);
  console.log(`📊 Institutions à importer: ${institutions.length}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const inst of institutions) {
    try {
      // Vérifier si existe déjà
      const existing = await prisma.institution.findUnique({
        where: { code: inst.code },
      });

      if (existing) {
        // Mettre à jour si nécessaire
        await prisma.institution.update({
          where: { code: inst.code },
          data: {
            nom: inst.nom,
            ministere: inst.ministere,
            ...(inst.responsableNom && { responsableNom: inst.responsableNom }),
            ...(inst.responsableFonction && { responsableFonction: inst.responsableFonction }),
          },
        });
        console.log(`🔄 Mis à jour: ${inst.code} - ${inst.nom}`);
        updated++;
      } else {
        // Créer nouvelle institution
        await prisma.institution.create({
          data: {
            code: inst.code,
            nom: inst.nom,
            ministere: inst.ministere,
            responsableNom: inst.responsableNom || 'À définir',
            responsableFonction: inst.responsableFonction || 'Point focal interopérabilité',
            responsableEmail: `pfi.${inst.code.toLowerCase().replace(/-/g, '')}@gouv.sn`,
            responsableTel: '+221 33 XXX XX XX',
          },
        });
        console.log(`✅ Créée: ${inst.code} - ${inst.nom}`);
        created++;
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Existe (email): ${inst.code}`);
        skipped++;
      } else {
        console.error(`❌ Erreur ${inst.code}:`, error.message);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 IMPORT TERMINÉ');
  console.log('='.repeat(80));
  console.log(`📊 Statistiques:`);
  console.log(`   ✅ Créées: ${created}`);
  console.log(`   🔄 Mises à jour: ${updated}`);
  console.log(`   ⏭️  Ignorées: ${skipped}`);
  console.log(`   📋 Total: ${institutions.length}`);
  console.log('='.repeat(80));

  // Afficher récapitulatif par ministère
  console.log('\n📋 Récapitulatif par ministère:');
  const byMinistere = institutions.reduce((acc, inst) => {
    acc[inst.ministere] = (acc[inst.ministere] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byMinistere)
    .sort((a, b) => b[1] - a[1])
    .forEach(([min, count]) => {
      console.log(`   ${min}: ${count} structures`);
    });
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
