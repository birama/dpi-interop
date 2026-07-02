/**
 * Enrichissement relationnel des 38 cas pilotes financiers
 * Appliqué en local d'abord, prod après validation.
 * Idempotent : rejouable.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ---- CONFIG : 38 cas pilotes ----
const PROPOSITIONS = [
  // EN_PRODUCTION_360
  { code:'PINS-TECH-0051', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'},{r:'ASTER',mode:'CONSOMME'}], ndt:'PRJ_4.2' },
  // PRIORISE — boucle fiscalo-douanière + GIZ
  { code:'PINS-METIER-550', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'},{inst:'DGID',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'},{r:'SENTAX',mode:'CONSOMME'},{r:'NINEA',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-METIER-551', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'},{r:'ASTER',mode:'ALIMENTE'},{r:'SENTAX',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-METIER-552', stakeholders:[{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'ASTER',mode:'CONSOMME'},{r:'SENTAX',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-METIER-609', stakeholders:[{inst:'DAF',role:'FOURNISSEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'REG-NIN',mode:'CONSOMME'}], ndt:'PRJ_4.1' },
  { code:'PINS-METIER-610', stakeholders:[{inst:'DAF',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'},{inst:'CSS',role:'CONSOMMATEUR'},{inst:'IPRES',role:'CONSOMMATEUR'}], registres:[{r:'RNEC',mode:'CONSOMME'}], ndt:'PRJ_4.1' },
  { code:'PINS-METIER-613', stakeholders:[{inst:'ANSD',role:'FOURNISSEUR'},{inst:'DGID',role:'CONSOMMATEUR'},{inst:'DGD',role:'CONSOMMATEUR'}], registres:[{r:'NINEA',mode:'CONSOMME'}], ndt:'PRJ_4.2' },
  { code:'PINS-METIER-615', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'},{inst:'APIX',role:'CONSOMMATEUR'},{inst:'DGD',role:'CONSOMMATEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'},{r:'NINEA',mode:'CONSOMME'}], ndt:'PRJ_4.2' },
  { code:'PINS-TECH-0002', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-0004', stakeholders:[{inst:'ANSD',role:'FOURNISSEUR'}], registres:[{r:'NINEA',mode:'CONSOMME'}], ndt:'PRJ_4.2' },
  { code:'PINS-TECH-0014', stakeholders:[{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'ASTER',mode:'CONSOMME'},{r:'SENTAX',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-0015', stakeholders:[{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGD',role:'CONSOMMATEUR'}], registres:[{r:'ASTER',mode:'CONSOMME'},{r:'GAINDE',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-0056', stakeholders:[{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'CONSOMMATEUR'},{inst:'DGD',role:'CONSOMMATEUR'}], registres:[{r:'ASTER',mode:'CONSOMME'},{r:'SENTAX',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  // GIZ lot
  { code:'PINS-TECH-2001', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2002', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2003', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2004', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2005', stakeholders:[{inst:'DGD',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'GAINDE',mode:'CONSOMME'},{r:'ASTER',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2006', stakeholders:[{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGD',role:'CONSOMMATEUR'}], registres:[{r:'ASTER',mode:'CONSOMME'},{r:'GAINDE',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2007', stakeholders:[{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'CONSOMMATEUR'}], registres:[{r:'ASTER',mode:'CONSOMME'},{r:'SENTAX',mode:'ALIMENTE'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2008a', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2008b', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  { code:'PINS-TECH-2008c', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'}], ndt:'PRJ_4.2-GIZ' },
  // QUALIFIE
  { code:'PINS-METIER-560', stakeholders:[{inst:'ANSD',role:'CONSOMMATEUR'},{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'FOURNISSEUR'},{inst:'DGD',role:'FOURNISSEUR'},{inst:'MFB',role:'CONSOMMATEUR'}], registres:[{r:'SIGIF',mode:'CONSOMME'}], ndt:'PRJ_5.4' },
  { code:'PINS-METIER-561', stakeholders:[{inst:'MEPC',role:'INITIATEUR'},{inst:'MEPC',role:'CONSOMMATEUR'},{inst:'MFB',role:'CONSOMMATEUR'}], registres:[{r:'SIGIF',mode:'CONSOMME'}], ndt:'PRJ_6.3' },
  { code:'PINS-METIER-562', stakeholders:[{inst:'ANSD',role:'CONSOMMATEUR'},{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'FOURNISSEUR'},{inst:'DGD',role:'FOURNISSEUR'}], registres:[{r:'SIGIF',mode:'CONSOMME'}], ndt:'PRJ_5.4' },
  { code:'PINS-METIER-563', stakeholders:[{inst:'DCEF',role:'FOURNISSEUR'},{inst:'MFB',role:'CONSOMMATEUR'}], registres:[], ndt:'PRJ_6.3' },
  { code:'PINS-METIER-564', stakeholders:[{inst:'MEPC',role:'INITIATEUR'},{inst:'ANSD',role:'CONSOMMATEUR'},{inst:'MFB',role:'CONSOMMATEUR'},{inst:'DGCPT',role:'FOURNISSEUR'},{inst:'DGID',role:'FOURNISSEUR'},{inst:'DGD',role:'FOURNISSEUR'}], registres:[], ndt:'PRJ_5.4' },
  { code:'PINS-PROP-TECH-0001', stakeholders:[{inst:'DGID',role:'FOURNISSEUR'},{inst:'DGCPT',role:'CONSOMMATEUR'}], registres:[{r:'SENTAX',mode:'CONSOMME'},{r:'ASTER',mode:'ALIMENTE'}], ndt:'PRJ_4.2' },
  { code:'PINS-TECH-3010', stakeholders:[{inst:'ANSD',role:'FOURNISSEUR'}], registres:[], ndt:'PRJ_5.4' },
  { code:'PINS-TECH-3011', stakeholders:[{inst:'BCEAO',role:'FOURNISSEUR'}], registres:[], ndt:'PRJ_5.4' },
  { code:'PINS-TECH-3012', stakeholders:[{inst:'MEPC',role:'CONSOMMATEUR'},{inst:'MFB',role:'CONSOMMATEUR'}], registres:[], ndt:'PRJ_6.3' },
  { code:'PINS-TECH-3013', stakeholders:[{inst:'MFB',role:'FOURNISSEUR'},{inst:'ANSD',role:'CONSOMMATEUR'}], registres:[{r:'SIGIF',mode:'CONSOMME'}], ndt:'PRJ_6.3' },
  { code:'PINS-TECH-3014', stakeholders:[{inst:'ANSD',role:'CONSOMMATEUR'}], registres:[], ndt:'PRJ_5.4' },
  { code:'PINS-TECH-3015', stakeholders:[{inst:'DCEF',role:'FOURNISSEUR'}], registres:[], ndt:'PRJ_6.3' },
  { code:'PINS-TECH-3016', stakeholders:[{inst:'DCEF',role:'FOURNISSEUR'}], registres:[], ndt:'PRJ_6.3' },
  { code:'PINS-TECH-3017', stakeholders:[{inst:'MEPC',role:'FOURNISSEUR'}], registres:[], ndt:'PRJ_6.3' },
  { code:'PINS-TECH-5058', stakeholders:[{inst:'DRS-SFD',role:'FOURNISSEUR'}], registres:[{r:'REG-ASSOC',mode:'CONSOMME'}], ndt:'PRJ_6.4' },
];

const RECLASSEMENTS: Array<{code:string; domaineCible:string}> = [
  { code:'PINS-METIER-103', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-METIER-104', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-METIER-105', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-METIER-106', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-METIER-108', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-TECH-0009', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-TECH-0038', domaineCible:'FINANCES_PUBLIQUES' },
  { code:'PINS-METIER-609', domaineCible:'IDENTITE_NUMERIQUE' },
  { code:'PINS-METIER-610', domaineCible:'IDENTITE_NUMERIQUE' },
];

const INSTITUTIONS_A_CREER: Array<{code:string; nom:string; ministere:string; responsableNom:string; responsableFonction:string; responsableEmail:string; responsableTel:string}> = [
  { code:'MEPC', nom:"Ministère de l'Économie, du Plan et de la Coopération", ministere:'Primature', responsableNom:'À compléter', responsableFonction:'Point Focal Interopérabilité', responsableEmail:'mepc-pf@placeholder.pins.sn', responsableTel:'+221000000000' },
  { code:'DRS-SFD', nom:'Direction de la Réglementation et de la Surveillance des Systèmes Financiers Décentralisés', ministere:'Ministère des Finances et du Budget', responsableNom:'À compléter', responsableFonction:'Point Focal Interopérabilité', responsableEmail:'drs-sfd-pf@placeholder.pins.sn', responsableTel:'+221000000000' },
];

// ---- COMPTEURS ----
let stats = { instCreated:0, stakeholdersCreated:0, stakeholdersExisting:0, registresCreated:0, registresExisting:0, ndtOldRemoved:0, ndtNewAdded:0, reclassements:0 };

async function main() {
  // ---- AVANT ----
  const cu38 = await prisma.casUsageMVP.findMany({ where: { code: { in: PROPOSITIONS.map(p=>p.code) } }, select: { id:true, code:true } });
  console.log(`Pilotes trouvés : ${cu38.length}/38`);
  const cuMap = new Map(cu38.map(c=>[c.code, c.id]));

  const avant = await mesures('=== AVANT ===');

  // ---- 1. Créer institutions manquantes ----
  for (const i of INSTITUTIONS_A_CREER) {
    const exist = await prisma.institution.findUnique({ where: { code: i.code } });
    if (!exist) {
      await prisma.institution.create({ data: i });
      stats.instCreated++;
      console.log(`Institution créée : ${i.code}`);
    }
  }

  // ---- 2. Reclassements domaine ----
  for (const r of RECLASSEMENTS) {
    await prisma.casUsageMVP.updateMany({ where: { code: r.code }, data: { domaine: r.domaineCible as any } });
    stats.reclassements++;
  }
  console.log(`Reclassements domaine : ${stats.reclassements}`);

  // ---- 3. NDT : supprimer PRJ_11.x en masse sur les 38, poser le curé ----
  const cu38Ids = [...cuMap.values()];
  // Supprimer les rattachements PRJ_11.1 et PRJ_11.2
  const ndtToRemove = await prisma.projetNational.findMany({ where: { code: { startsWith: 'PRJ_11.' } }, select: { id:true } });
  const ndtRemoveIds = ndtToRemove.map(n=>n.id);
  const delResult = await prisma.casUsageProjet.deleteMany({ where: { casUsageMVPId: { in: cu38Ids }, projetNationalId: { in: ndtRemoveIds } } });
  stats.ndtOldRemoved = delResult.count;
  console.log(`NDT PRJ_11.x retirés : ${delResult.count}`);

  // Poser le projet curé
  for (const p of PROPOSITIONS) {
    const cuId = cuMap.get(p.code); if (!cuId) continue;
    const proj = await prisma.projetNational.findUnique({ where: { code: p.ndt } });
    if (!proj) { console.warn(`Projet NDT ${p.ndt} introuvable pour ${p.code}`); continue; }
    await prisma.casUsageProjet.upsert({
      where: { casUsageMVPId_projetNationalId: { casUsageMVPId: cuId, projetNationalId: proj.id } },
      create: { casUsageMVPId: cuId, projetNationalId: proj.id },
      update: {},
    });
    stats.ndtNewAdded++;
  }
  console.log(`NDT curés posés : ${stats.ndtNewAdded}`);

  // ---- 4. Stakeholders ----
  for (const p of PROPOSITIONS) {
    const cuId = cuMap.get(p.code); if (!cuId) continue;
    for (const sh of p.stakeholders) {
      const inst = await prisma.institution.findUnique({ where: { code: sh.inst } });
      if (!inst) { console.warn(`Institution ${sh.inst} introuvable pour ${p.code}`); continue; }
      const role = sh.role as any;
      const existing = await prisma.useCaseStakeholder.findFirst({ where: { casUsageId: cuId, institutionId: inst.id, role } });
      if (existing) { stats.stakeholdersExisting++; continue; }
      await prisma.useCaseStakeholder.create({ data: { casUsageId: cuId, institutionId: inst.id, role } });
      stats.stakeholdersCreated++;
    }
  }
  console.log(`Stakeholders : ${stats.stakeholdersCreated} créés, ${stats.stakeholdersExisting} existants`);

  // ---- 5. Registres ----
  for (const p of PROPOSITIONS) {
    const cuId = cuMap.get(p.code); if (!cuId) continue;
    for (const reg of p.registres) {
      const rn = await prisma.registreNational.findUnique({ where: { code: reg.r } });
      if (!rn) { console.warn(`Registre ${reg.r} introuvable pour ${p.code}`); continue; }
      const mode = reg.mode as any;
      const existing = await prisma.casUsageRegistre.findFirst({ where: { casUsageId: cuId, registreId: rn.id, mode } });
      if (existing) { stats.registresExisting++; continue; }
      await prisma.casUsageRegistre.create({ data: { casUsageId: cuId, registreId: rn.id, mode } });
      stats.registresCreated++;
    }
  }
  console.log(`Registres : ${stats.registresCreated} créés, ${stats.registresExisting} existants`);

  // ---- APRÈS ----
  await mesures('=== APRÈS ===');

  console.log('\n=== RÉCAP ===');
  console.log(JSON.stringify(stats, null, 2));

  await prisma.$disconnect();
}

async function mesures(label: string) {
  const codes38 = PROPOSITIONS.map(p=>p.code);
  const ids = (await prisma.casUsageMVP.findMany({ where: { code: { in: codes38 } }, select: { id:true } })).map(c=>c.id);
  const shCount = await prisma.useCaseStakeholder.count({ where: { casUsageId: { in: ids } } });
  const regCount = await prisma.casUsageRegistre.count({ where: { casUsageId: { in: ids } } });
  const ndtCount = await prisma.casUsageProjet.count({ where: { casUsageMVPId: { in: ids } } });
  const ndtSample = await prisma.casUsageProjet.findMany({ where: { casUsageMVPId: { in: ids } }, select: { projetNational: { select: { code:true } } }, distinct:['projetNationalId'] });
  const domaineNull = await prisma.casUsageMVP.count({ where: { domaine: null } });
  const reclassified = await prisma.casUsageMVP.findMany({ where:{ code:{in:RECLASSEMENTS.map(r=>r.code)} }, select:{code:true, domaine:true} });

  console.log(label);
  console.log(`  Stakeholders : ${shCount} (sur 38 cas pilotes)`);
  console.log(`  Registres    : ${regCount}`);
  console.log(`  Projets NDT  : ${ndtCount} (distincts: ${ndtSample.map(n=>n.projetNational.code).join(', ')})`);
  console.log(`  Domaine NULL restant : ${domaineNull}`);
  console.log(`  Reclassés vérifiés   : ${JSON.stringify(reclassified.map(r=>r.code+':'+(r.domaine||'NULL')))}`);
  return { shCount, regCount, ndtCount, domaineNull };
}

main().catch(async (e) => { console.error('Échec :', e); await prisma.$disconnect(); process.exit(1); });
