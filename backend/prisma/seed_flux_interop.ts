import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface FluxData {
  'ID Flux': string;
  'Cas d\'usage'?: string;
  'Processus métier'?: string;
  'Institution source'?: string;
  'Institution consommatrice'?: string;
  'Système source'?: string;
  'Système cible'?: string;
  'Données échangées'?: string;
  'Fréquence'?: string;
  'Mode d\'échange (API/X-Road)'?: string;
  'Sens du flux'?: string;
  'Déclencheur'?: string;
  'Base légale'?: string;
  'Niveau de sensibilité'?: string;
  'Mesures de sécurité'?: string;
  'SLA / Temps réel'?: string;
  'Responsable métier'?: string;
  'Responsable technique'?: string;
  'Statut'?: string;
}

// Mapping des institutions vers des codes courts
const institutionMapping: Record<string, { code: string; nom: string; ministere: string }> = {
  'DGID': { code: 'DGID', nom: 'Direction Générale des Impôts et des Domaines', ministere: 'MEF' },
  'DGD': { code: 'DGD', nom: 'Direction Générale des Douanes', ministere: 'MEF' },
  'ANSD': { code: 'ANSD', nom: 'Agence Nationale de la Statistique et de la Démographie', ministere: 'MEF' },
  'ANSD (NINEA)': { code: 'ANSD', nom: 'Agence Nationale de la Statistique et de la Démographie', ministere: 'MEF' },
  'DGCPT': { code: 'DGCPT', nom: 'Direction Générale de la Comptabilité Publique et du Trésor', ministere: 'MEF' },
  'DGCPT (comptabilite CL)': { code: 'DGCPT', nom: 'Direction Générale de la Comptabilité Publique et du Trésor', ministere: 'MEF' },
  'DGCPT (reciproque)': { code: 'DGCPT', nom: 'Direction Générale de la Comptabilité Publique et du Trésor', ministere: 'MEF' },
  'ANEC (Agence Nationale de l\'Etat Civil)': { code: 'ANEC', nom: 'Agence Nationale de l\'État Civil', ministere: 'Ministère de l\'Intérieur' },
  'DAF (Direction de l\'Automatisation des Fichiers)': { code: 'DAF', nom: 'Direction de l\'Automatisation des Fichiers', ministere: 'Ministère de l\'Intérieur' },
  'DAF / ANEC': { code: 'DAF', nom: 'Direction de l\'Automatisation des Fichiers', ministere: 'Ministère de l\'Intérieur' },
  'DGPSN': { code: 'DGPSN', nom: 'Délégation Générale à la Protection Sociale et à la Solidarité Nationale', ministere: 'Présidence' },
  'Ministère de la Justice (Greffe)': { code: 'GREFFE', nom: 'Greffe du Tribunal de Commerce (RCCM)', ministere: 'Ministère de la Justice' },
  'Greffe (RCCM)': { code: 'GREFFE', nom: 'Greffe du Tribunal de Commerce (RCCM)', ministere: 'Ministère de la Justice' },
  'Ministère de la Justice (Centre National du Casier Judiciaire)': { code: 'CNCJ', nom: 'Centre National du Casier Judiciaire', ministere: 'Ministère de la Justice' },
  'Ministère de la Justice (Greffe + Casier)': { code: 'MJ', nom: 'Ministère de la Justice', ministere: 'Ministère de la Justice' },
  'IPRES': { code: 'IPRES', nom: 'Institution de Prévoyance Retraite du Sénégal', ministere: 'MEF' },
  'IPRES (Institut de Prevoyance Retraite du Senegal)': { code: 'IPRES', nom: 'Institution de Prévoyance Retraite du Sénégal', ministere: 'MEF' },
  'CSS': { code: 'CSS', nom: 'Caisse de Sécurité Sociale', ministere: 'MFPTCT' },
  'CSS (Caisse de Securite Sociale)': { code: 'CSS', nom: 'Caisse de Sécurité Sociale', ministere: 'MFPTCT' },
  'DGE (Direction Generale des Elections)': { code: 'DGE', nom: 'Direction Générale des Elections', ministere: 'Ministère de l\'Intérieur' },
  'Direction de la Police des Frontieres': { code: 'DPF', nom: 'Direction de la Police des Frontières', ministere: 'Ministère de l\'Intérieur' },
  'DGF (Direction Generale des Finances)': { code: 'DGF', nom: 'Direction Générale des Finances', ministere: 'MEF' },
  'DGF': { code: 'DGF', nom: 'Direction Générale des Finances', ministere: 'MEF' },
  'Direction du Cadastre': { code: 'DCAD', nom: 'Direction du Cadastre', ministere: 'MEF' },
  'ARCOP': { code: 'ARCOP', nom: 'Autorité de Régulation de la Commande Publique', ministere: 'Présidence' },
  'BOCS': { code: 'BOCS', nom: 'Bureau Opérationnel de Coordination et de Suivi', ministere: 'Présidence' },
  'MCTN (portail Senegal Services)': { code: 'MCTN', nom: 'Ministère de la Communication, des Télécommunications et de l\'Économie Numérique', ministere: 'MCTN' },
  'RNU': { code: 'RNU', nom: 'Registre National Unique', ministere: 'Présidence' },
  'SEN-CSU (Couverture Sanitaire Universelle)': { code: 'SEN-CSU', nom: 'Couverture Sanitaire Universelle', ministere: 'MSAS' },
  'SEN-CSU': { code: 'SEN-CSU', nom: 'Couverture Sanitaire Universelle', ministere: 'MSAS' },
  'SAIDA': { code: 'SAIDA', nom: 'Système d\'Aide à l\'Insertion et au Développement de l\'Autonomie', ministere: 'DGPSN' },
  'SIGICMU': { code: 'SIGICMU', nom: 'Système Intégré de Gestion de l\'Indigence et de la Couverture Maladie Universelle', ministere: 'MSAS' },
  'DGAS': { code: 'DGAS', nom: 'Direction Générale de l\'Action Sociale', ministere: 'MFFS' },
  'DSTE (Direction des Statistiques du Travail)': { code: 'DSTE', nom: 'Direction des Statistiques du Travail', ministere: 'MFPTCT' },
  'Inspection du Travail': { code: 'IT', nom: 'Inspection du Travail', ministere: 'MFPTCT' },
  'DG Microfinance': { code: 'DGM', nom: 'Direction Générale de la Microfinance', ministere: 'MEF' },
  'MAER (Ministere Agriculture)': { code: 'MAER', nom: 'Ministère de l\'Agriculture et de l\'Equipement Rural', ministere: 'MAER' },
  'MESRI (Ministere Enseignement Superieur)': { code: 'MESRI', nom: 'Ministère de l\'Enseignement Supérieur', ministere: 'MESRI' },
  'MSAS (Ministere de la Sante)': { code: 'MSAS', nom: 'Ministère de la Santé et de l\'Action Sociale', ministere: 'MSAS' },
  'MCTDAT (Ministere Collectivites Territoriales)': { code: 'MCTDAT', nom: 'Ministère des Collectivités Territoriales', ministere: 'MCTDAT' },
};

// Normaliser le nom d'une institution
function normalizeInstitution(name: string): { code: string; nom: string; ministere: string } | null {
  const trimmed = name.trim();
  
  // Chercher une correspondance exacte
  if (institutionMapping[trimmed]) {
    return institutionMapping[trimmed];
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(institutionMapping)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return value;
    }
  }
  
  // Si pas de correspondance, créer une entrée générique
  const code = trimmed
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20)
    .toUpperCase();
  
  return {
    code,
    nom: trimmed,
    ministere: 'Autre',
  };
}

async function main() {
  console.log('🌱 Import des données Excel - Flux d\'interopérabilité');
  console.log('=' .repeat(80));

  // Lire le fichier JSON
  const jsonPath = path.join(__dirname, 'flux_data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Fichier flux_data.json introuvable !');
    console.error('   Assurez-vous que le fichier existe à:', jsonPath);
    process.exit(1);
  }

  const fluxDataRaw = fs.readFileSync(jsonPath, 'utf-8');
  const fluxData: FluxData[] = JSON.parse(fluxDataRaw);

  console.log(`✅ ${fluxData.length} flux chargés depuis le fichier\n`);

  // Étape 1: Créer/Récupérer les institutions
  console.log('📋 Étape 1: Création des institutions');
  console.log('-'.repeat(80));

  const institutionsSet = new Set<string>();
  
  // Collecter toutes les institutions
  for (const flux of fluxData) {
    if (flux['Institution source']) {
      flux['Institution source'].split(',').forEach(inst => institutionsSet.add(inst.trim()));
    }
    if (flux['Institution consommatrice']) {
      flux['Institution consommatrice'].split(',').forEach(inst => institutionsSet.add(inst.trim()));
    }
  }

  const institutionMap = new Map<string, string>(); // nom -> id

  let created = 0;
  let skipped = 0;

  for (const instName of Array.from(institutionsSet)) {
    const normalized = normalizeInstitution(instName);
    
    if (!normalized) {
      console.log(`⚠️  Ignoré: ${instName}`);
      skipped++;
      continue;
    }

    // Vérifier si existe déjà
    let institution = await prisma.institution.findUnique({
      where: { code: normalized.code },
    });

    if (!institution) {
      // Créer l'institution
      institution = await prisma.institution.create({
        data: {
          code: normalized.code,
          nom: normalized.nom,
          ministere: normalized.ministere,
          responsableNom: 'À définir',
          responsableFonction: 'Point focal interopérabilité',
          responsableEmail: `pfi.${normalized.code.toLowerCase()}@gouv.sn`,
          responsableTel: '+221 33 XXX XX XX',
        },
      });
      console.log(`✅ Créée: ${normalized.code} - ${normalized.nom}`);
      created++;
    } else {
      console.log(`⏭️  Existe: ${normalized.code} - ${normalized.nom}`);
      skipped++;
    }

    institutionMap.set(instName, institution.id);
  }

  console.log(`\n📊 Institutions: ${created} créées, ${skipped} existantes\n`);

  // Étape 2: Créer une soumission "Template" pour stocker les flux
  console.log('📋 Étape 2: Création soumission template');
  console.log('-'.repeat(80));

  // Utiliser ANSD comme institution de référence
  const ansdId = institutionMap.get('ANSD') || institutionMap.values().next().value;

  const templateSubmission = await prisma.submission.create({
    data: {
      institutionId: ansdId,
      status: 'VALIDATED',
      currentStep: 5,
      infrastructure: {
        description: 'Cartographie complète des flux d\'interopérabilité - Import Excel',
        source: 'Template_Identification_Flux_Interop_COMPLET.xlsx',
      },
      forces: 'Cartographie exhaustive des flux existants et planifiés',
      attentes: 'Mise en œuvre progressive via plateforme PINS (X-Road)',
    },
  });

  console.log(`✅ Soumission template créée: ${templateSubmission.id}\n`);

  // Étape 3: Créer les flux, cas d'usage, systèmes
  console.log('📋 Étape 3: Import des flux d\'interopérabilité');
  console.log('-'.repeat(80));

  let fluxCreated = 0;
  let casUsageCreated = 0;
  let systemesCreated = 0;

  for (const flux of fluxData) {
    try {
      // Créer le cas d'usage si présent
      if (flux['Cas d\'usage'] && flux['Cas d\'usage'].trim()) {
        const casUsage = await prisma.casUsage.create({
          data: {
            submissionId: templateSubmission.id,
            titre: flux['Cas d\'usage'],
            description: flux['Processus métier'] || flux['Cas d\'usage'],
            acteurs: [
              flux['Institution source'],
              flux['Institution consommatrice'],
            ].filter(Boolean).join(', '),
            priorite: flux['Statut']?.includes('Priorité 1') ? 5 : 
                      flux['Statut']?.includes('Priorité 2') ? 4 : 3,
          },
        });
        casUsageCreated++;
      }

      // Créer les systèmes sources
      if (flux['Système source']) {
        await prisma.application.create({
          data: {
            submissionId: templateSubmission.id,
            nom: flux['Système source'],
            description: `Institution: ${flux['Institution source'] || 'N/A'}`,
          },
        }).catch(() => {}); // Ignorer si dupliqué
        systemesCreated++;
      }

      // Créer les systèmes cibles
      if (flux['Système cible']) {
        const systemes = flux['Système cible'].split(',');
        for (const sys of systemes) {
          await prisma.application.create({
            data: {
              submissionId: templateSubmission.id,
              nom: sys.trim(),
              description: `Institution: ${flux['Institution consommatrice'] || 'N/A'}`,
            },
          }).catch(() => {}); // Ignorer si dupliqué
          systemesCreated++;
        }
      }

      // Créer le flux existant
      const fluxExistant = await prisma.fluxExistant.create({
        data: {
          submissionId: templateSubmission.id,
          source: flux['Institution source'] || 'N/A',
          destination: flux['Institution consommatrice'] || 'N/A',
          donnee: flux['Données échangées'] || 'N/A',
          mode: flux['Mode d\'échange (API/X-Road)'] || 'N/A',
          frequence: flux['Fréquence'] || 'N/A',
        },
      });

      fluxCreated++;
      console.log(`✅ Flux ${flux['ID Flux']}: ${flux['Cas d\'usage'] || 'Sans titre'}`);

    } catch (error) {
      console.error(`❌ Erreur flux ${flux['ID Flux']}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 IMPORT TERMINÉ AVEC SUCCÈS');
  console.log('='.repeat(80));
  console.log(`📊 Statistiques:`);
  console.log(`   - Institutions créées: ${created}`);
  console.log(`   - Flux créés: ${fluxCreated}`);
  console.log(`   - Cas d'usage créés: ${casUsageCreated}`);
  console.log(`   - Systèmes créés: ${systemesCreated}`);
  console.log('='.repeat(80));
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
