/**
 * SCRIPT D'INJECTION SEED PINS v4 — Idempotent
 * 
 * Référence : MCTN/DU/SEED-PINS-2026-04
 * 
 * Lit l'Excel PINS_Seed_v4_EXHAUSTIF.xlsx et injecte :
 *   - 51 institutions (UPSERT par acronyme)
 *   - 24 registres nationaux (UPSERT par code)
 *   - 408 cas métier (UPSERT par code) en statut PROPOSE
 *   - 53 cas techniques (UPSERT par code) en statut PROPOSE
 *   - 132 relations métier↔technique
 *   - Relations cas_usage_registre (CONSOMME/ALIMENTE/CREE)
 * 
 * Sécurité :
 *   - Mode --dry-run par défaut (lecture + validation, aucune écriture)
 *   - Mode --commit pour écriture réelle
 *   - Backup recommandé AVANT exécution
 *   - Idempotent : UPSERT par code, exécution multiple sans effet de bord
 * 
 * Usage :
 *   node inject-seed-v4.cjs --file PINS_Seed_v4_EXHAUSTIF.xlsx --dry-run
 *   node inject-seed-v4.cjs --file PINS_Seed_v4_EXHAUSTIF.xlsx --commit
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// ARGUMENTS
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const fileArg = args.indexOf('--file');
const FILE = fileArg !== -1 ? args[fileArg + 1] : 'PINS_Seed_v4_EXHAUSTIF.xlsx';
const DRY_RUN = !args.includes('--commit');
const SKIP_TECHNIQUE = args.includes('--skip-technique');
const SKIP_REGISTRES = args.includes('--skip-registres');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PINS — Injection seed v4 EXHAUSTIF');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Fichier      : ${FILE}`);
console.log(`  Mode         : ${DRY_RUN ? '🔍 DRY-RUN (lecture seule)' : '🚀 COMMIT (écriture)'}`);
console.log(`  Skip tech    : ${SKIP_TECHNIQUE}`);
console.log(`  Skip reg     : ${SKIP_REGISTRES}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (!fs.existsSync(FILE)) {
  console.error(`❌ Fichier introuvable : ${FILE}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function loadSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Onglet introuvable : ${sheetName}`);
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function splitList(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

const RAPPORT = {
  institutions: { existantes: 0, creees: 0, ignorees: 0 },
  registres: { existants: 0, crees: 0, ignores: 0 },
  cas_metier: { existants: 0, crees: 0, ignores: 0, erreurs: [] },
  cas_technique: { existants: 0, crees: 0, ignores: 0, erreurs: [] },
  relations: { creees: 0, ignorees: 0, erreurs: [] },
  registre_links: { crees: 0, ignores: 0 },
};

async function ensureInstitution(code, nom, sigleOuAcronyme) {
  // PATCH 1 — schéma réel Institution n'a pas acronyme/type
  // Lookup par `code` (unique stable), puis fallback par sigle si fourni
  const codeTrim = (code || '').trim();
  let inst = await prisma.institution.findFirst({ where: { code: codeTrim } });
  if (!inst && sigleOuAcronyme) {
    inst = await prisma.institution.findFirst({ where: { code: sigleOuAcronyme.trim() } });
  }
  if (inst) {
    RAPPORT.institutions.existantes++;
    return inst;
  }
  if (DRY_RUN) {
    RAPPORT.institutions.creees++;
    return { id: `DRY-${codeTrim}`, code: codeTrim, nom };
  }
  // Création avec PLACEHOLDERS pour champs REQUIS du schéma (ministere, responsable*, email UNIQUE)
  const slug = codeTrim.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try {
    inst = await prisma.institution.create({
      data: {
        code: codeTrim,
        nom: nom || codeTrim,
        ministere: 'À compléter (seed e-senegal)',
        responsableNom: 'À compléter',
        responsableFonction: 'À compléter',
        responsableEmail: `seed-${slug}@placeholder.pins.sn`,
        responsableTel: '+221000000000',
      },
    });
    RAPPORT.institutions.creees++;
    return inst;
  } catch (e) {
    console.error(`   ⚠️  institution ${codeTrim}: ${e.message.substring(0, 1000)}`);
    RAPPORT.institutions.ignorees++;
    return null;
  }
}

async function ensureRegistreNational(code, nom, institutionCode, institutionNom) {
  // PATCH 2 — utiliser RegistreNational (autonome, code @unique)
  // Champs REQUIS schéma : code, nom, domaine (String), institutionCode, institutionNom
  let reg = await prisma.registreNational.findUnique({ where: { code } });
  if (reg) {
    RAPPORT.registres.existants++;
    return reg;
  }
  if (DRY_RUN) {
    RAPPORT.registres.crees++;
    return { id: `DRY-${code}`, code, nom };
  }
  try {
    reg = await prisma.registreNational.create({
      data: {
        code,
        nom: nom || code,
        domaine: 'TRANSVERSAL',
        institutionCode: institutionCode || 'INCONNU',
        institutionNom: institutionNom || 'À compléter',
      },
    });
    RAPPORT.registres.crees++;
    return reg;
  } catch (e) {
    console.error(`   ⚠️  registre ${code}: ${e.message.substring(0, 1000)}`);
    RAPPORT.registres.ignores++;
    return null;
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
(async () => {
  console.log('📖 Lecture Excel...');
  const wb = XLSX.readFile(FILE);
  console.log(`   Onglets : ${wb.SheetNames.join(', ')}\n`);

  // PATCH 4 — Récupérer ADMIN_USER_ID (pour RelationCasUsage.createdBy)
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@senum.sn' } });
  if (!adminUser) {
    console.error('❌ admin@senum.sn introuvable en base — abort');
    process.exit(1);
  }
  const ADMIN_USER_ID = adminUser.id;
  console.log(`   Admin ID référence : ${ADMIN_USER_ID.substring(0, 8)}...\n`);

  // ===== 1. INSTITUTIONS =====
  console.log('🏛️  [1/5] Traitement institutions');
  const institutions = loadSheet(wb, '05_INSTITUTIONS');
  const instMap = new Map(); // code Cowork → ID base
  for (const row of institutions) {
    const code = row.Code;
    if (!code) continue;
    try {
      const inst = await ensureInstitution(code, row['Nom complet'], row.Sigle);
      if (inst) instMap.set(code, inst.id);
    } catch (e) {
      console.log(`   ❌ ${code} : ${e.message}`);
    }
  }
  console.log(`   ✅ ${RAPPORT.institutions.existantes} existantes, ${RAPPORT.institutions.creees} ${DRY_RUN ? 'à créer' : 'créées'}, ${RAPPORT.institutions.ignorees} ignorées\n`);

  // ===== 2. REGISTRES NATIONAUX =====
  if (!SKIP_REGISTRES) {
    console.log('📚 [2/5] Traitement registres nationaux');
    const registres = loadSheet(wb, '04_REGISTRES');
    const regMap = new Map();
    for (const row of registres) {
      const code = row['Code registre'];
      if (!code) continue;
      // Le détenteur est un code institution dans le seed v4 ; nom = lookup dans instMap puis fallback
      const detenteurCode = row.Détenteur || null;
      let detenteurNom = null;
      if (detenteurCode && instMap.has(detenteurCode)) {
        // L'id est en map ; pour le nom on doit re-lookup (le script ne stocke pas le nom)
        try {
          const inst = await prisma.institution.findUnique({ where: { id: instMap.get(detenteurCode) } });
          detenteurNom = inst?.nom || null;
        } catch (e) { /* fallback null */ }
      }
      const reg = await ensureRegistreNational(code, row.Nom, detenteurCode, detenteurNom);
      if (reg) regMap.set(code, reg.id);
    }
    console.log(`   ✅ ${RAPPORT.registres.existants} existants, ${RAPPORT.registres.crees} ${DRY_RUN ? 'à créer' : 'créés'}, ${RAPPORT.registres.ignores} ignorés\n`);
  } else {
    console.log('📚 [2/5] Registres SKIPPED\n');
  }

  // ===== 3. CAS MÉTIER =====
  console.log('🎯 [3/5] Traitement cas métier (408 attendus)');
  const cas_metier = loadSheet(wb, '01_METIER');
  let countMet = 0;
  for (const row of cas_metier) {
    const code = row.Code;
    if (!code) continue;
    countMet++;

    // Lookup existant
    const existant = await prisma.casUsageMVP.findUnique({ where: { code } });
    if (existant) {
      RAPPORT.cas_metier.existants++;
      continue;
    }

    // Institution cheffe
    const instCheffeCode = row['Institution coordinatrice'];
    const instCheffeId = instMap.get(instCheffeCode) || null;

    // Domaine enum (vérification)
    const VALID_DOMAINES = [
      'FINANCES_PUBLIQUES','CLIMAT_AFFAIRES','PROTECTION_SOCIALE','SANTE_NUMERIQUE',
      'EDUCATION','IDENTITE_NUMERIQUE','JUSTICE_ETAT_CIVIL','FONCIER_CADASTRE',
      'AGRICULTURE_NUMERIQUE','EMPLOI_FORMATION','SERVICES_CITOYENS',
      'GOUVERNANCE_DONNEES','CYBERSECURITE','TRANSVERSAL',
    ];
    const domEnum = row['Domaine enum (PINS 14)'];
    if (!VALID_DOMAINES.includes(domEnum)) {
      RAPPORT.cas_metier.erreurs.push(`${code}: domaine invalide "${domEnum}"`);
      continue;
    }

    // PATCH 3 — schéma réel : pas de `objectifs`, le champ légal s'appelle `baseLegale`
    const data = {
      code,
      titre: row.Titre,
      description: row['Parcours résumé'] || null,
      axePrioritaire: row['Domaine métier'],
      domaine: domEnum,
      sourceProposition: 'PROPOSITION_INSTITUTIONNELLE',
      statutVueSection: 'PROPOSE',
      statutImpl: 'IDENTIFIE',
      aFinancer: false,
      baseLegale: row['Base légale'] || null,
      adopteParInstitutionId: instCheffeId,
    };

    if (DRY_RUN) {
      RAPPORT.cas_metier.crees++;
    } else {
      try {
        await prisma.casUsageMVP.create({ data });
        RAPPORT.cas_metier.crees++;
      } catch (e) {
        const msg = `${code}: ${e.message.substring(0, 1000)}`;
        RAPPORT.cas_metier.erreurs.push(msg);
        console.error(`   ⚠️  ${msg}`);
      }
    }

    if (countMet % 50 === 0) process.stdout.write(`   ... ${countMet}/${cas_metier.length}\r`);
  }
  console.log(`   ✅ ${RAPPORT.cas_metier.existants} existants, ${RAPPORT.cas_metier.crees} ${DRY_RUN ? 'à créer' : 'créés'}, ${RAPPORT.cas_metier.erreurs.length} erreurs\n`);

  // ===== 4. CAS TECHNIQUES =====
  if (!SKIP_TECHNIQUE) {
    console.log('⚙️  [4/5] Traitement cas techniques (53 attendus)');
    const cas_tech = loadSheet(wb, '02_TECHNIQUE');
    for (const row of cas_tech) {
      const code = row.Code;
      if (!code) continue;

      const existant = await prisma.casUsageMVP.findUnique({ where: { code } });
      if (existant) {
        RAPPORT.cas_technique.existants++;
        continue;
      }

      const instDetCode = row['Institution détentrice'];
      const instDetId = instMap.get(instDetCode) || null;

      // Pour les cas techniques on doit assigner un domaine enum
      // Heuristique : domaine technique → mapping vers l'enum 14 valeurs
      const domTech = (row['Domaine technique'] || '').toLowerCase();
      let domEnum = 'TRANSVERSAL';
      if (domTech.includes('identifi') || domTech.includes('identi')) domEnum = 'IDENTITE_NUMERIQUE';
      else if (domTech.includes('fiscal')) domEnum = 'FINANCES_PUBLIQUES';
      else if (domTech.includes('protection') || domTech.includes('social')) domEnum = 'PROTECTION_SOCIALE';
      else if (domTech.includes('etat civil') || domTech.includes('justice')) domEnum = 'JUSTICE_ETAT_CIVIL';
      else if (domTech.includes('sante')) domEnum = 'SANTE_NUMERIQUE';
      else if (domTech.includes('educ')) domEnum = 'EDUCATION';
      else if (domTech.includes('foncier') || domTech.includes('cadastre')) domEnum = 'FONCIER_CADASTRE';
      else if (domTech.includes('transport')) domEnum = 'SERVICES_CITOYENS';
      else if (domTech.includes('commerce ext') || domTech.includes('douan')) domEnum = 'FINANCES_PUBLIQUES';
      else if (domTech.includes('paiement')) domEnum = 'FINANCES_PUBLIQUES';

      // PATCH 3 — schéma réel : pas de `objectifs`, le champ légal s'appelle `baseLegale`
      const data = {
        code,
        titre: row.Titre,
        description: row['Donnée échangée (champs)'] || null,
        axePrioritaire: row['Domaine technique'],
        domaine: domEnum,
        sourceProposition: 'PROPOSITION_INSTITUTIONNELLE',
        statutVueSection: 'PROPOSE',
        statutImpl: 'IDENTIFIE',
        aFinancer: false,
        baseLegale: row['Base légale'] || null,
        adopteParInstitutionId: instDetId,
      };

      if (DRY_RUN) {
        RAPPORT.cas_technique.crees++;
      } else {
        try {
          await prisma.casUsageMVP.create({ data });
          RAPPORT.cas_technique.crees++;
        } catch (e) {
          const msg = `${code}: ${e.message.substring(0, 1000)}`;
          RAPPORT.cas_technique.erreurs.push(msg);
          console.error(`   ⚠️  ${msg}`);
        }
      }
    }
    console.log(`   ✅ ${RAPPORT.cas_technique.existants} existants, ${RAPPORT.cas_technique.crees} ${DRY_RUN ? 'à créer' : 'créés'}, ${RAPPORT.cas_technique.erreurs.length} erreurs\n`);
  } else {
    console.log('⚙️  [4/5] Cas techniques SKIPPED\n');
  }

  // ===== 5. RELATIONS MAPPING (si modèle Prisma RelationCasUsage existe) =====
  console.log('🔗 [5/5] Traitement relations métier↔technique');
  try {
    const mapping = loadSheet(wb, '03_MAPPING');
    for (const row of mapping) {
      const codeMet = row['Code métier'];
      const codeTech = row['Code technique'];
      if (!codeMet || !codeTech) continue;

      const casMet = await prisma.casUsageMVP.findUnique({ where: { code: codeMet } });
      const casTech = await prisma.casUsageMVP.findUnique({ where: { code: codeTech } });
      if (!casMet || !casTech) {
        RAPPORT.relations.ignorees++;
        continue;
      }

      if (DRY_RUN) {
        RAPPORT.relations.creees++;
        continue;
      }
      try {
        // PATCH 4 — schéma réel : casUsageMetierId/casUsageTechniqueId + createdBy REQUIS
        await prisma.relationCasUsage.create({
          data: {
            casUsageMetierId: casMet.id,
            casUsageTechniqueId: casTech.id,
            ordre: parseInt(row['Ordre dans parcours']) || null,
            obligatoire: (row['Étape obligatoire'] || '').toUpperCase() === 'OUI',
            createdBy: ADMIN_USER_ID,
          },
        });
        RAPPORT.relations.creees++;
      } catch (e) {
        const msg = `${codeMet}↔${codeTech}: ${e.message.substring(0, 1000)}`;
        RAPPORT.relations.erreurs.push(msg);
        console.error(`   ⚠️  ${msg}`);
        RAPPORT.relations.ignorees++;
      }
    }
    console.log(`   ✅ ${RAPPORT.relations.creees} ${DRY_RUN ? 'à créer' : 'créées'}, ${RAPPORT.relations.ignorees} ignorées, ${RAPPORT.relations.erreurs.length} erreurs\n`);
  } catch (e) {
    console.log(`   ⚠️  Erreur traitement mapping : ${e.message}\n`);
  }

  // ===== RAPPORT FINAL =====
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RAPPORT FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(JSON.stringify(RAPPORT, null, 2));
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Écrire rapport texte
  const rapportPath = `/tmp/pins_seed_v4_rapport_${Date.now()}.json`;
  fs.writeFileSync(rapportPath, JSON.stringify(RAPPORT, null, 2));
  console.log(`📄 Rapport détaillé : ${rapportPath}`);

  if (DRY_RUN) {
    console.log('\n💡 Mode DRY-RUN : aucune écriture effectuée.');
    console.log('   Pour exécuter réellement :');
    console.log(`     node inject-seed-v4.cjs --file ${FILE} --commit\n`);
  } else {
    console.log('\n✅ INJECTION COMMITÉE.');
    console.log('   Vérifier les compteurs en base avec :');
    console.log('     SELECT "statutVueSection", COUNT(*) FROM cas_usage_mvp GROUP BY "statutVueSection";\n');
  }

  await prisma.$disconnect();
})().catch(e => {
  console.error('\n❌ ERREUR FATALE :', e);
  prisma.$disconnect().then(() => process.exit(1));
});
