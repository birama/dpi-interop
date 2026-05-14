/**
 * SCRIPT UTILITAIRE — Renumérotation des cas adoptés
 * 
 * Référence : MCTN/DU/UTIL-RENAME-2026-01
 * 
 * Objet : faire la transition codes provisoires → codes définitifs pour les cas
 *         sortis du catalogue des propositions (statut DECLARE et au-delà).
 * 
 * Convention P8 :
 *   PINS-PROP-MET-NNN  (PROPOSE)  →  PINS-METIER-NNN  (3 chiffres, DECLARE+)
 *   PINS-PROP-TECH-NNN (PROPOSE)  →  PINS-TECH-NNNN   (4 chiffres, DECLARE+)
 * 
 * Cas spécial : codes PINS-CU-NNN générés par le bug `prioriser-rapide`
 *   → inférer le type (métier/technique) via :
 *     1. Relations RelationCasUsage (casUsageMetierId vs casUsageTechniqueId)
 *     2. Heuristique sur le titre (fallback)
 *     3. Mode interactif (cas ambigu)
 * 
 * Sécurité :
 *   --dry-run (par défaut) : liste les changements
 *   --apply : exécute en transaction atomique
 *   --types-from-backup <path.sql> : récupère les codes originaux depuis backup
 *   --interactive : demande confirmation cas par cas pour les ambigus
 * 
 * Idempotence :
 *   Les cas déjà bien nommés (PINS-METIER-* ou PINS-TECH-*) sont préservés.
 *   Les exécutions répétées n'ont aucun effet de bord.
 * 
 * Usage :
 *   node rename-cas-adoptes.cjs --dry-run
 *   node rename-cas-adoptes.cjs --apply
 *   node rename-cas-adoptes.cjs --types-from-backup /home/deploy/backups/prod_avant_merges_ptf_20260514_1607.sql --apply
 *   node rename-cas-adoptes.cjs --interactive --apply
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const readline = require('readline');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// ARGUMENTS
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const INTERACTIVE = args.includes('--interactive');
const YES = args.includes('--yes'); // skip confirmation interactive (mode batch)
const backupIdx = args.indexOf('--types-from-backup');
const BACKUP_PATH = backupIdx !== -1 ? args[backupIdx + 1] : null;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PINS — Renumérotation cas adoptés');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Mode         : ${APPLY ? '🚀 APPLY (écriture)' : '🔍 DRY-RUN (lecture seule)'}`);
console.log(`  Backup ref   : ${BACKUP_PATH || '(aucun — heuristiques seules)'}`);
console.log(`  Interactif   : ${INTERACTIVE}`);
console.log('═══════════════════════════════════════════════════════════════\n');

// ---------------------------------------------------------------------------
// STATUTS DE "CAS ADOPTÉ" (sortie du catalogue propositions)
// ---------------------------------------------------------------------------
const STATUTS_ADOPTES = [
  'DECLARE',
  'EN_CONSULTATION',
  'VALIDATION_CONJOINTE',
  'QUALIFIE',
  'PRIORISE',
  'EN_PRODUCTION_360',
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Heuristique sur le titre : détecter si métier ou technique
 * Returns: 'METIER' | 'TECH' | 'AMBIGU'
 */
function heuristiqueTitre(titre) {
  if (!titre) return 'AMBIGU';
  const t = titre.toLowerCase();
  
  // Patterns techniques (services API, données, vérifications)
  const techPatterns = [
    /^v[ée]rification/i, /^consultation/i, /^attribution/i,
    /^g[ée]n[ée]ration/i, /^cr[ée]ation \/ /i,
    /^mise [aà] jour/i, /^notification/i,
    /\bapi\b/i, /\bservice technique\b/i,
    /\battestation de/i, /\bquitus/i,
    /\baffiliation [aà]/i,  // technique : vérif affiliation
    /\bd[ée]claration [aà] (la|l')/i, /\béchange de donn[ée]es/i,
    /^référentiel/i, /^horodatage/i, /^signature [ée]lectronique/i,
  ];
  
  // Patterns métier (parcours utilisateur)
  const metierPatterns = [
    /^cr[ée]ation d['']?[a-z]+(?:rise|entreprise|SARL|SA|GIE|individuelle)/i,
    /^demande d['']/i, /^demander/i,
    /^inscription/i, /^cessation/i, /^modification des statuts/i,
    /^d[ée]claration et paiement/i,
    /^orientation et inscription/i,
    /^d[ée]claration en douane/i,
    /^immatriculation d['']un v[ée]hicule/i,
    /\bguichet unique\b/i, /\bparcours\b/i,
  ];
  
  for (const p of techPatterns) if (p.test(t)) return 'TECH';
  for (const p of metierPatterns) if (p.test(t)) return 'METIER';
  return 'AMBIGU';
}

/**
 * Inférer le type d'un cas à partir des relations RelationCasUsage
 * Returns: 'METIER' | 'TECH' | 'INCONNU'
 */
async function inferenceParRelations(casId) {
  try {
    const asMetier = await prisma.relationCasUsage.count({
      where: { casUsageMetierId: casId },
    });
    if (asMetier > 0) return 'METIER';
    const asTech = await prisma.relationCasUsage.count({
      where: { casUsageTechniqueId: casId },
    });
    if (asTech > 0) return 'TECH';
  } catch (e) {
    // Table peut-être absente du schéma
  }
  return 'INCONNU';
}

/**
 * Chercher le code original dans un backup SQL
 * Heuristique : grep ligne INSERT cas_usage_mvp avec l'UUID puis extraction du champ code
 */
function chercherCodeDansBackup(uuid, backupContent) {
  if (!backupContent) return null;
  // Pattern simplifié : on cherche l'UUID dans le dump et on extrait le code à proximité
  const lines = backupContent.split('\n');
  for (const line of lines) {
    if (line.includes(uuid)) {
      // Extraction approximative
      const match = line.match(/'(PINS-(?:METIER|TECH|PROP-MET|PROP-TECH)-\d+)'/);
      if (match) return match[1];
    }
  }
  return null;
}

/**
 * État local des séquences (initialisé une fois au lookup max en base).
 * Évite les collisions : chaque appel à `nextSequenceNumber` incrémente
 * un compteur local, indépendamment du fait que les updates ne soient
 * pas encore commités.
 */
const SEQ_STATE = { METIER: null, TECH: null };

async function initSequences() {
  const metRes = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(CAST(substring(code from 'PINS-METIER-(\\d+)') AS INTEGER)), 0) AS n FROM cas_usage_mvp WHERE code LIKE 'PINS-METIER-%'`
  );
  const techRes = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(CAST(substring(code from 'PINS-TECH-(\\d+)') AS INTEGER)), 0) AS n FROM cas_usage_mvp WHERE code LIKE 'PINS-TECH-%'`
  );
  SEQ_STATE.METIER = parseInt(metRes[0].n);
  SEQ_STATE.TECH = parseInt(techRes[0].n);
  console.log(`   Séquences initialisées : METIER max=${SEQ_STATE.METIER}, TECH max=${SEQ_STATE.TECH}\n`);
}

function nextSequenceNumber(prefix, padding) {
  // Incrémente le compteur local et retourne le code formaté
  const key = prefix === 'PINS-METIER-' ? 'METIER' : 'TECH';
  if (SEQ_STATE[key] === null) {
    throw new Error('Séquences non initialisées — appeler initSequences() avant');
  }
  SEQ_STATE[key]++;
  return `${prefix}${String(SEQ_STATE[key]).padStart(padding, '0')}`;
}

/**
 * Question interactive
 */
function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
(async () => {
  // 1. Charger backup éventuel
  let backupContent = null;
  if (BACKUP_PATH) {
    if (fs.existsSync(BACKUP_PATH)) {
      backupContent = fs.readFileSync(BACKUP_PATH, 'utf-8');
      console.log(`📂 Backup chargé : ${(backupContent.length / 1024).toFixed(0)} KB\n`);
    } else {
      console.error(`❌ Backup introuvable : ${BACKUP_PATH}`);
      process.exit(1);
    }
  }
  
  // 1.5. Initialiser les séquences locales (max courant en base)
  await initSequences();

  // 2. Lister les cas adoptés à code provisoire
  const candidats = await prisma.casUsageMVP.findMany({
    where: {
      statutVueSection: { in: STATUTS_ADOPTES },
      OR: [
        { code: { startsWith: 'PINS-PROP-MET-' } },
        { code: { startsWith: 'PINS-PROP-TECH-' } },
        { code: { startsWith: 'PINS-CU-' } },
      ],
    },
    select: {
      id: true, code: true, titre: true, statutVueSection: true,
    },
    orderBy: { code: 'asc' },
  });
  
  console.log(`🔎 ${candidats.length} cas adoptés à code provisoire identifiés\n`);
  if (candidats.length === 0) {
    console.log('✅ Aucune renumérotation nécessaire. Tous les cas adoptés ont déjà un code définitif.\n');
    await prisma.$disconnect();
    return;
  }
  
  // 3. Pour chacun, déterminer le type et le nouveau code
  const renames = [];      // {id, ancienCode, nouveauCode, type, methode, titre}
  const ambigus = [];      // cas où impossible de déterminer
  
  for (const cas of candidats) {
    let type = 'INCONNU';
    let methode = '';
    let codeOriginal = null;
    
    // Stratégie 1 : code source explicite
    if (cas.code.startsWith('PINS-PROP-MET-')) {
      type = 'METIER';
      methode = 'préfixe PROP-MET';
    } else if (cas.code.startsWith('PINS-PROP-TECH-')) {
      type = 'TECH';
      methode = 'préfixe PROP-TECH';
    } else if (cas.code.startsWith('PINS-CU-')) {
      // Code généré par le bug — inférer le type
      
      // Stratégie 2 : backup
      if (backupContent) {
        codeOriginal = chercherCodeDansBackup(cas.id, backupContent);
        if (codeOriginal) {
          if (codeOriginal.startsWith('PINS-METIER-') || codeOriginal.startsWith('PINS-PROP-MET-')) {
            type = 'METIER';
            methode = `backup → ${codeOriginal}`;
          } else if (codeOriginal.startsWith('PINS-TECH-') || codeOriginal.startsWith('PINS-PROP-TECH-')) {
            type = 'TECH';
            methode = `backup → ${codeOriginal}`;
          }
        }
      }
      
      // Stratégie 3 : relations
      if (type === 'INCONNU') {
        const typeRel = await inferenceParRelations(cas.id);
        if (typeRel !== 'INCONNU') {
          type = typeRel;
          methode = `relation RelationCasUsage`;
        }
      }
      
      // Stratégie 4 : heuristique titre
      if (type === 'INCONNU') {
        const typeTitre = heuristiqueTitre(cas.titre);
        if (typeTitre !== 'AMBIGU') {
          type = typeTitre;
          methode = `heuristique titre`;
        }
      }
    }
    
    if (type === 'INCONNU') {
      ambigus.push(cas);
      continue;
    }
    
    // Si on a le code original du backup, c'est lui qu'on restaure (priorité absolue)
    let nouveauCode;
    if (codeOriginal && (codeOriginal.startsWith('PINS-METIER-') || codeOriginal.startsWith('PINS-TECH-'))) {
      nouveauCode = codeOriginal;
      methode += ' (restauration backup)';
    } else {
      // Génération nouveau code séquencé
      const prefix = type === 'METIER' ? 'PINS-METIER-' : 'PINS-TECH-';
      const padding = type === 'METIER' ? 3 : 4;
      nouveauCode = nextSequenceNumber(prefix, padding);
    }
    
    renames.push({
      id: cas.id,
      ancienCode: cas.code,
      nouveauCode,
      type,
      methode,
      titre: cas.titre,
      statut: cas.statutVueSection,
    });
  }
  
  // 4. Traiter les cas ambigus
  if (ambigus.length > 0) {
    console.log(`⚠️  ${ambigus.length} cas AMBIGUS (type indéterminable) :\n`);
    for (const cas of ambigus) {
      console.log(`   ${cas.code.padEnd(20)} | ${cas.titre?.substring(0, 80)}`);
    }
    console.log();
    
    if (INTERACTIVE && APPLY) {
      console.log('Mode interactif activé. Pour chaque cas ambigu, indique le type :\n');
      for (const cas of ambigus) {
        const rep = await askUser(`${cas.code} — "${cas.titre?.substring(0, 60)}" → [m]étier, [t]echnique, [s]kip ? `);
        if (rep.toLowerCase().startsWith('m')) {
          const newCode = nextSequenceNumber('PINS-METIER-', 3);
          renames.push({ id: cas.id, ancienCode: cas.code, nouveauCode: newCode, type: 'METIER', methode: 'choix interactif', titre: cas.titre, statut: cas.statutVueSection });
        } else if (rep.toLowerCase().startsWith('t')) {
          const newCode = nextSequenceNumber('PINS-TECH-', 4);
          renames.push({ id: cas.id, ancienCode: cas.code, nouveauCode: newCode, type: 'TECH', methode: 'choix interactif', titre: cas.titre, statut: cas.statutVueSection });
        } else {
          console.log(`   → skip ${cas.code}`);
        }
      }
    } else {
      console.log('💡 Pour traiter ces cas, relance avec --interactive --apply (ou --types-from-backup <path>)\n');
    }
  }
  
  // 5. Affichage du plan de renumérotation
  console.log(`📋 PLAN DE RENUMÉROTATION — ${renames.length} cas à renommer\n`);
  console.log('  Type   | Statut       | Ancien code             → Nouveau code            | Méthode');
  console.log('  -------|--------------|-------------------------|------------------------|---------------------');
  for (const r of renames) {
    console.log(`  ${r.type.padEnd(6)} | ${r.statut.substring(0, 12).padEnd(12)} | ${r.ancienCode.padEnd(23)} → ${r.nouveauCode.padEnd(22)} | ${r.methode}`);
  }
  console.log();
  
  // 6. Statistiques
  const stats = {
    METIER: renames.filter(r => r.type === 'METIER').length,
    TECH: renames.filter(r => r.type === 'TECH').length,
    ambigus_non_traités: ambigus.length - renames.filter(r => r.methode === 'choix interactif').length,
  };
  console.log(`📊 Statistiques : ${stats.METIER} cas métier, ${stats.TECH} cas techniques, ${stats.ambigus_non_traités} ambigus non traités\n`);
  
  // 7. Application
  if (!APPLY) {
    console.log('💡 Mode DRY-RUN : aucune écriture. Pour appliquer :');
    console.log(`     node rename-cas-adoptes.cjs --apply${BACKUP_PATH ? ` --types-from-backup ${BACKUP_PATH}` : ''}\n`);
    await prisma.$disconnect();
    return;
  }
  
  // Confirmation finale (sauf si --yes ou --interactive)
  if (!INTERACTIVE && !YES) {
    const conf = await askUser(`⚠️  Tu vas modifier ${renames.length} codes en production. Confirmer ? [oui/NON] `);
    if (conf.toLowerCase() !== 'oui') {
      console.log('Abandon.\n');
      await prisma.$disconnect();
      return;
    }
  }
  if (YES) console.log('\n⚡ Mode --yes : confirmation skippée.');
  
  // Transaction atomique
  console.log('\n🚀 Application en transaction atomique...');
  await prisma.$transaction(async (tx) => {
    for (const r of renames) {
      await tx.casUsageMVP.update({
        where: { id: r.id },
        data: { code: r.nouveauCode, updatedAt: new Date() },
      });
    }
  });
  
  console.log(`✅ ${renames.length} cas renommés avec succès.\n`);
  
  // Rapport
  const rapportPath = `/tmp/pins_rename_rapport_${Date.now()}.json`;
  fs.writeFileSync(rapportPath, JSON.stringify({ renames, ambigus_non_traités: ambigus.length, stats }, null, 2));
  console.log(`📄 Rapport sauvegardé : ${rapportPath}`);
  
  // Vérification finale
  const remaining = await prisma.casUsageMVP.count({
    where: {
      statutVueSection: { in: STATUTS_ADOPTES },
      OR: [
        { code: { startsWith: 'PINS-PROP-' } },
        { code: { startsWith: 'PINS-CU-' } },
      ],
    },
  });
  console.log(`\n🔎 Cas adoptés à code encore provisoire après opération : ${remaining}`);
  if (remaining > 0) {
    console.log('   (ambigus non traités — relance avec --interactive si besoin)');
  }
  
  await prisma.$disconnect();
})().catch(async e => {
  console.error('\n❌ ERREUR FATALE :', e);
  await prisma.$disconnect();
  process.exit(1);
});
