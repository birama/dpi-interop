import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Seed Registres Nationaux + Convention ANEC-DAF + Corrections ASTER/SIGIF ===');

  // --- 1. REGISTRES NATIONAUX ---
  const registres = [
    { code: 'RNEC', nom: 'Registre National de l\'État Civil', domaine: 'Identité & Population', institutionCode: 'ANEC', institutionNom: 'Agence Nationale de l\'État Civil', systemeSource: 'RNEC / Programme NEKKAL', identifiantPivot: 'Numéro d\'acte d\'état civil', volumeEstime: '20M actes numérisés, 10M citoyens enrôlés biométriquement', statutNumerisation: 'Opérationnel', statutEjokkoo: 'Planifié', disposeAPI: false, baseLegale: 'Loi sur l\'état civil, Programme NEKKAL (financé UE — 18 Mds FCFA)', consommateurs: 'DAF, DGID, DGD, DGPSN, SEN-CSU', observations: 'Protocole d\'interopérabilité ANEC-DAF signé juillet 2025 : authentification automatique des actes pour CNI, échange naissances/décès, annulation CNI des personnes décédées.' },
    { code: 'FICHIER-BIO', nom: 'Fichier biométrique / Fichier électoral', domaine: 'Identité & Population', institutionCode: 'DAF', institutionNom: 'Direction de l\'Automatisation des Fichiers', systemeSource: 'Système biométrique DAF', identifiantPivot: 'NNI (Numéro National d\'Identité)', statutNumerisation: 'Opérationnel', statutEjokkoo: 'Planifié', disposeAPI: true, protocoleAPI: 'REST/JSON', baseLegale: 'Décret 77-1007 du 19/11/1977', consommateurs: 'ANEC, Police, Gendarmerie, DGID' },
    { code: 'NINEA', nom: 'Répertoire National des Entreprises et Associations (RNEA) / NINEA', domaine: 'Entreprises & Commerce', institutionCode: 'ANSD', institutionNom: 'Agence Nationale de la Statistique et de la Démographie', systemeSource: 'NINEAWEB / Plateforme ModelSIS-TANDEM', identifiantPivot: 'NINEA (7 caractères)', volumeEstime: '5M+ entreprises et associations', statutNumerisation: 'Opérationnel', statutEjokkoo: 'En cours', disposeAPI: true, protocoleAPI: 'REST/JSON (via plateforme NINEA)', baseLegale: 'Décret 95-364 du 14 avril 1995', consommateurs: 'DGID, DGD, DGCPT, DGF, RCCM, APIX, toutes administrations', observations: 'Co-géré ANSD+DGID. Plateforme de partage temps réel ModelSIS/TANDEM entre 4 administrations financières (taux synchronisation 97-99%). e-NINEA opérationnel via ansd.sn. 63 variables documentées.' },
    { code: 'RCCM', nom: 'Registre du Commerce et du Crédit Mobilier', domaine: 'Entreprises & Commerce', institutionCode: 'GREFFE', institutionNom: 'Greffes des Tribunaux / Ministère de la Justice', systemeSource: 'e-RCCM / SEN\'INFOGREFFE (GAINDE 2000)', identifiantPivot: 'Numéro RCCM', statutNumerisation: 'Opérationnel', statutEjokkoo: 'Non connecté', disposeAPI: false, baseLegale: 'Acte uniforme OHADA du 15 décembre 2010', consommateurs: 'ANSD, DGID, APIX, BCE', observations: 'Harmonisation classification secteurs d\'activités entre RCCM (libre) et ANSD (normes internationales) non résolue depuis 2018.' },
    { code: 'NICAD', nom: 'Numéro d\'Identification Cadastral', domaine: 'Foncier & Cadastre', institutionCode: 'DGID', institutionNom: 'Direction Générale des Impôts et des Domaines / Direction du Cadastre', systemeSource: 'SGF (Système de Gestion du Foncier)', identifiantPivot: 'NICAD (16 caractères : RR DD AAA C/CR SSS PPPPP)', statutNumerisation: 'En cours (Lots 1 & 2 en validation)', statutEjokkoo: 'Non connecté', disposeAPI: false, baseLegale: 'Décret n°2012-396 du 27 mars 2012', consommateurs: 'DGCPT, collectivités locales, notaires', observations: 'Seul référentiel reconnu par la DGID pour l\'identification d\'une parcelle. Digitalisation SGF en cours.' },
    { code: 'GAINDE', nom: 'GAINDE Integral — Système de dédouanement', domaine: 'Finances Publiques', institutionCode: 'DGD', institutionNom: 'Direction Générale des Douanes', systemeSource: 'GAINDE Integral + ORBUS 2000', identifiantPivot: 'ID déclaration douanière + NINEA', statutNumerisation: 'Opérationnel', statutEjokkoo: 'En cours (MVP 1.0)', disposeAPI: true, protocoleAPI: 'Export FTP/Excel (actuel) → REST/JSON (cible via adaptateur)', consommateurs: 'DGID, DGCPT, ANSD, DGF', observations: 'Pionnière de la dématérialisation au Sénégal (depuis 2000). Cas d\'usage MVP 1.0 : Douanes.GetDeclarations vers DGID.' },
    { code: 'ASTER', nom: 'ASTER — Système de gestion comptable du Trésor', domaine: 'Finances Publiques', institutionCode: 'DGCPT', institutionNom: 'Direction Générale de la Comptabilité Publique et du Trésor', systemeSource: 'ASTER', identifiantPivot: 'Numéro de mandat / quittance', statutNumerisation: 'Opérationnel (en production)', statutEjokkoo: 'Planifié', consommateurs: 'DGID, DGD, DGF, MEF', observations: 'Système historique toujours en production. Cohabite avec SIGIF qui est en cours de déploiement. Les flux actuels (recettes douanières, mandats, quittances) transitent encore par ASTER.' },
    { code: 'SIGIF', nom: 'SIGIF — Système Intégré de Gestion des Finances Publiques', domaine: 'Finances Publiques', institutionCode: 'DGCPT', institutionNom: 'Direction Générale de la Comptabilité Publique et du Trésor', systemeSource: 'SIGIF', statutNumerisation: 'En déploiement', statutEjokkoo: 'Non connecté', baseLegale: 'Appui Banque Mondiale', consommateurs: 'DGID, DGD, DGF, MEF', observations: 'Nouveau système en cours de déploiement, fonctionnellement très avancé. Cohabite avec ASTER qui reste en production. À terme, SIGIF remplacera ASTER mais la transition n\'est pas encore achevée.' },
    { code: 'SIGTAS', nom: 'SIGTAS — Système d\'Information de Gestion des Taxes', domaine: 'Finances Publiques', institutionCode: 'DGID', institutionNom: 'Direction Générale des Impôts et des Domaines', systemeSource: 'SIGTAS', identifiantPivot: 'Numéro contribuable + NINEA', statutNumerisation: 'Opérationnel', statutEjokkoo: 'Planifié', consommateurs: 'DGD, DGCPT, DGF', observations: 'Informatise l\'administration des taxes, impôts et patentes. Gestion données fiscales, cadastrales, domaniales et foncières.' },
    { code: 'RNU', nom: 'Registre National Unique des ménages vulnérables', domaine: 'Protection Sociale', institutionCode: 'DGPSN', institutionNom: 'Délégation Générale à la Protection Sociale et à la Solidarité Nationale', systemeSource: 'RNU 1.0 / PNBSF', identifiantPivot: 'Référence ménage + NIN', statutNumerisation: 'Opérationnel', statutEjokkoo: 'En cours (MVP 1.0)', disposeAPI: true, protocoleAPI: 'REST/JSON (Swagger documenté)', consommateurs: 'SEN-CSU, CMU, IPRES, CSS', observations: 'Cas d\'usage MVP 1.0 : RNU.GetBeneficiaire. API prête et documentée Swagger.' },
  ];

  for (const r of registres) {
    await prisma.registreNational.upsert({
      where: { code: r.code },
      update: { ...r },
      create: { ...r },
    });
    console.log(`✅ Registre ${r.code} — ${r.nom}`);
  }

  // --- 2. CONVENTION ANEC-DAF ---
  const anec = await prisma.institution.findUnique({ where: { code: 'ANEC' } });
  const daf = await prisma.institution.findUnique({ where: { code: 'DAF' } });
  if (anec && daf) {
    const existing = await prisma.convention.findFirst({ where: { institutionAId: anec.id, institutionBId: daf.id } });
    if (!existing) {
      await prisma.convention.create({
        data: {
          institutionAId: anec.id, institutionBId: daf.id,
          objet: 'Protocole d\'interopérabilité ANEC-DAF pour l\'authentification des actes d\'état civil',
          donneesVisees: 'Actes d\'état civil (naissances, décès), données biométriques CNI, annulation CNI personnes décédées',
          statut: 'ACTIVE',
          dateSignatureA: new Date('2025-07-01'), dateSignatureB: new Date('2025-07-01'), dateActivation: new Date('2025-07-01'),
          observations: 'Première convention d\'interopérabilité signée entre deux administrations. Authentification automatique des actes pour les demandes de CNI, échange automatisé naissances/décès, annulation CNI des personnes décédées. Fonctionne en bilatéral (hors e-jokkoo pour le moment).',
        },
      });
      console.log('✅ Convention ANEC-DAF créée');
    } else {
      console.log('⏭️ Convention ANEC-DAF existe déjà');
    }
  }

  // --- 3. CORRECTIONS ASTER/SIGIF dans CasUsageMVP ---
  // Corriger les cas d'usage DGD→DGCPT pour refléter la coexistence ASTER/SIGIF
  const cuDGCPT = await prisma.casUsageMVP.findMany({
    where: { OR: [{ institutionCibleCode: 'DGCPT' }, { institutionSourceCode: 'DGCPT' }] },
  });
  for (const cu of cuDGCPT) {
    const updates: any = {};
    if (cu.donneesEchangees?.includes('ASTER') && !cu.donneesEchangees?.includes('SIGIF')) {
      updates.donneesEchangees = cu.donneesEchangees.replace('ASTER', 'ASTER (production) / SIGIF (cible)');
    }
    if (cu.registresConcernes?.includes('ASTER') && !cu.registresConcernes?.includes('SIGIF')) {
      updates.registresConcernes = cu.registresConcernes.replace('ASTER', 'ASTER (production) / SIGIF (cible)');
    }
    if (Object.keys(updates).length > 0) {
      await prisma.casUsageMVP.update({ where: { id: cu.id }, data: updates });
      console.log(`🔄 CasUsage ${cu.code}: ASTER → ASTER/SIGIF`);
    }
  }

  // --- STATS ---
  const regCount = await prisma.registreNational.count();
  const convCount = await prisma.convention.count();
  console.log(`\n=== STATS === Registres: ${regCount}, Conventions: ${convCount}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
