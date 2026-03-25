import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Import flux référence + historiques dans CasUsageMVP');
  console.log('='.repeat(70));

  // Get phase IDs
  const mvp1 = await prisma.phaseMVP.findUnique({ where: { code: 'MVP-1.0' } });
  const mvp2 = await prisma.phaseMVP.findUnique({ where: { code: 'MVP-2.0' } });

  let created = 0;

  // ============================================================================
  // M.2 — Flux référence JICA (ceux pas encore dans CasUsageMVP)
  // ============================================================================
  const fluxRef = [
    { code: 'XRN-CU-05', titre: 'NINEA vers Douanes', src: 'ANSD', dst: 'DGD', donnees: 'NINEA, raison sociale', axe: 'Finances publiques', impact: 'ELEVE' as const },
    { code: 'XRN-CU-06', titre: 'Vérification état civil', src: 'ANEC', dst: 'DGID', donnees: 'NNI, état civil', axe: 'Services citoyens', impact: 'ELEVE' as const },
    { code: 'XRN-CU-07', titre: 'Casier judiciaire pour RCCM', src: 'CNCJ', dst: 'GREFFE', donnees: 'Casier judiciaire', axe: 'Climat des affaires', impact: 'ELEVE' as const },
    { code: 'XRN-CU-08', titre: 'RCCM vers NINEA', src: 'GREFFE', dst: 'ANSD', donnees: 'RCCM, immatriculation', axe: 'Climat des affaires', impact: 'CRITIQUE' as const },
    { code: 'XRN-CU-09', titre: 'Données sociales IPRES', src: 'IPRES', dst: 'CSS', donnees: 'Cotisations, affiliations', axe: 'Protection sociale', impact: 'ELEVE' as const },
    { code: 'XRN-CU-13', titre: 'RNU vers CMU', src: 'RNU', dst: 'SEN-CSU', donnees: 'Registre National Unique', axe: 'Protection sociale', impact: 'CRITIQUE' as const },
    { code: 'XRN-CU-14', titre: 'Données fiscales vers Trésor', src: 'DGID', dst: 'DGCPT', donnees: 'Rôles impôts, télépaiements', axe: 'Finances publiques', impact: 'CRITIQUE' as const },
    { code: 'XRN-CU-15', titre: 'Suivi exécution budgétaire', src: 'DGCPT', dst: 'DGB', donnees: 'Exécution budget', axe: 'Finances publiques', impact: 'ELEVE' as const },
    { code: 'XRN-CU-16', titre: 'Statistiques commerce extérieur', src: 'DGD', dst: 'ANSD', donnees: 'Import/export stats', axe: 'Finances publiques', impact: 'MOYEN' as const },
    { code: 'XRN-CU-17', titre: 'Données foncières NICAD', src: 'DCAD', dst: 'DGID', donnees: 'NICAD, propriétés', axe: 'Finances publiques', impact: 'ELEVE' as const },
    { code: 'XRN-CU-18', titre: 'Marchés publics vers Trésor', src: 'ARCOP', dst: 'DGCPT', donnees: 'Marchés attribués', axe: 'Finances publiques', impact: 'MOYEN' as const },
    { code: 'XRN-CU-19', titre: 'Fichier électoral', src: 'DAF', dst: 'DGE-ELEC', donnees: 'Identité, adresse', axe: 'Services citoyens', impact: 'ELEVE' as const },
  ];

  for (const f of fluxRef) {
    try {
      await prisma.casUsageMVP.upsert({
        where: { code: f.code },
        update: {},
        create: {
          code: f.code, titre: f.titre, institutionSourceCode: f.src, institutionCibleCode: f.dst,
          donneesEchangees: f.donnees, axePrioritaire: f.axe, impact: f.impact,
          statutImpl: 'IDENTIFIE', phaseMVPId: mvp2?.id,
        },
      });
      created++;
    } catch (e) { /* skip if exists */ }
  }
  console.log(`✅ ${created} flux référence importés`);

  // ============================================================================
  // M.3 — Flux historiques (Dossier Conception Générale 2017)
  // ============================================================================
  const fluxHist = [
    // DGD fournit
    { code: 'HIST-01', titre: 'Import/export par contribuable', src: 'DGD', dst: 'DGID', donnees: 'Données importation/exportation, TVA import, précompte TVA', mode: 'Fichier (CSV/Excel)' },
    { code: 'HIST-02', titre: 'Recettes douanières vers Trésor', src: 'DGD', dst: 'DGCPT', donnees: 'Recettes douanières, liquidations', mode: 'Manuel' },
    { code: 'HIST-03', titre: 'Statistiques commerce extérieur', src: 'DGD', dst: 'ANSD', donnees: 'Stats commerce extérieur', mode: 'Fichier (CSV/Excel)' },
    // DGID fournit
    { code: 'HIST-04', titre: 'Fichier entreprises CGE', src: 'DGID', dst: 'DGD', donnees: 'Entreprises CGE, quitus fiscal, rôles impôts', mode: 'Fichier (CSV/Excel)' },
    { code: 'HIST-05', titre: 'Rôles impôts vers Trésor', src: 'DGID', dst: 'DGCPT', donnees: 'Rôles impôts, états comptables, quitus fiscal, télépaiements', mode: 'Fichier (CSV/Excel)' },
    { code: 'HIST-06', titre: 'MAJ informations NINEA', src: 'DGID', dst: 'ANSD', donnees: 'Mises à jour NINEA, informations comptables', mode: 'Fichier (CSV/Excel)' },
    // DGCPT fournit
    { code: 'HIST-07', titre: 'Quittances vers Impôts', src: 'DGCPT', dst: 'DGID', donnees: 'Quittances, titres remboursement, situation recouvrements', mode: 'Manuel' },
    { code: 'HIST-08', titre: 'État recouvrements vers Douanes', src: 'DGCPT', dst: 'DGD', donnees: 'État des recouvrements', mode: 'Manuel' },
    { code: 'HIST-09', titre: 'TOFE vers DGF', src: 'DGCPT', dst: 'DGF', donnees: 'TOFE, données de trésorerie', mode: 'Fichier (CSV/Excel)' },
    // ANSD fournit
    { code: 'HIST-10', titre: 'Fichier NINEA vers Impôts', src: 'ANSD', dst: 'DGID', donnees: 'Fichier immatriculation NINEA', mode: 'Fichier (CSV/Excel)' },
    { code: 'HIST-11', titre: 'Fichier NINEA vers Douanes', src: 'ANSD', dst: 'DGD', donnees: 'Fichier immatriculation NINEA', mode: 'Fichier (CSV/Excel)' },
    { code: 'HIST-12', titre: 'Fichier NINEA vers Trésor', src: 'ANSD', dst: 'DGCPT', donnees: 'Fichier NINEA', mode: 'Fichier (CSV/Excel)' },
  ];

  let histCreated = 0;
  for (const f of fluxHist) {
    try {
      await prisma.casUsageMVP.upsert({
        where: { code: f.code },
        update: {},
        create: {
          code: f.code, titre: f.titre, institutionSourceCode: f.src, institutionCibleCode: f.dst,
          donneesEchangees: f.donnees, axePrioritaire: 'Finances publiques', impact: 'ELEVE',
          statutImpl: 'IDENTIFIE',
          observations: `Flux historique 2017 — Mode actuel : ${f.mode}`,
        },
      });
      histCreated++;
    } catch (e) { /* skip */ }
  }
  console.log(`✅ ${histCreated} flux historiques 2017 importés`);

  // Stats finales
  const total = await prisma.casUsageMVP.count();
  console.log('\n' + '='.repeat(70));
  console.log(`🎉 Total CasUsageMVP en base : ${total}`);
  console.log('='.repeat(70));
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
