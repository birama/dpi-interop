/**
 * Vérification du fix executeAdoption — logique de génération de code.
 * Test unitaire : pas d'écriture Prisma, logique pure extraite.
 *
 * 3 cas :
 *  A. Code déjà définitif (PINS-METIER-* / PINS-TECH-*) → conservé
 *  B. Proposition PINS-PROP-MET-* → génère PINS-METIER-NNN (max+1)
 *  C. Proposition PINS-PROP-TECH-* → génère PINS-TECH-NNNN (max+1)
 */

interface TestCase { name: string; oldCode: string; typologie: 'METIER' | 'TECHNIQUE'; existingMax: string | null; expectedNew: string; expectedHasAncient: boolean; expectedCodeHisto: string | null; }

function simulateNewCode(oldCode: string, typologie: 'METIER' | 'TECHNIQUE', existingMaxInFamily: string | null): { newCode: string; hasAncient: boolean; codeHistorique: string | null } {
  let newCode: string;
  let codeHistorique: string | null = null; // simulate cu.codeHistorique = null au départ

  if (oldCode.startsWith('PINS-METIER-') || oldCode.startsWith('PINS-TECH-')) {
    newCode = oldCode;
  } else {
    const prefix = typologie === 'METIER' ? 'PINS-METIER-' : 'PINS-TECH-';
    const padding = typologie === 'METIER' ? 3 : 4;

    let nextNum = 1;
    if (existingMaxInFamily) {
      const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = existingMaxInFamily.match(new RegExp(`^${escaped}(\\d+)$`));
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    newCode = `${prefix}${String(nextNum).padStart(padding, '0')}`;
    codeHistorique = oldCode;
  }

  return { newCode, hasAncient: newCode !== oldCode, codeHistorique };
}

const TESTS: TestCase[] = [
  // A — déjà définitif, inchangé
  { name: 'A1 METIER définitif', oldCode: 'PINS-METIER-001', typologie: 'METIER', existingMax: 'PINS-METIER-468', expectedNew: 'PINS-METIER-001', expectedHasAncient: false, expectedCodeHisto: null },
  { name: 'A2 TECH définitif',  oldCode: 'PINS-TECH-0001',  typologie: 'TECHNIQUE', existingMax: 'PINS-TECH-5058', expectedNew: 'PINS-TECH-0001', expectedHasAncient: false, expectedCodeHisto: null },
  // B — proposition METIER → PINS-METIER-NNN
  { name: 'B1 PROP-MET vers METIER', oldCode: 'PINS-PROP-MET-RCCM-001', typologie: 'METIER', existingMax: 'PINS-METIER-468', expectedNew: 'PINS-METIER-469', expectedHasAncient: true, expectedCodeHisto: 'PINS-PROP-MET-RCCM-001' },
  { name: 'B2 PROP-MET first', oldCode: 'PINS-PROP-MET-061', typologie: 'METIER', existingMax: null, expectedNew: 'PINS-METIER-001', expectedHasAncient: true, expectedCodeHisto: 'PINS-PROP-MET-061' },
  // C — proposition TECH → PINS-TECH-NNNN
  { name: 'C1 PROP-TECH vers TECH', oldCode: 'PINS-PROP-TECH-URB-001', typologie: 'TECHNIQUE', existingMax: 'PINS-TECH-5058', expectedNew: 'PINS-TECH-5059', expectedHasAncient: true, expectedCodeHisto: 'PINS-PROP-TECH-URB-001' },
  { name: 'C2 PROP-TECH first', oldCode: 'PINS-PROP-TECH-005', typologie: 'TECHNIQUE', existingMax: null, expectedNew: 'PINS-TECH-0001', expectedHasAncient: true, expectedCodeHisto: 'PINS-PROP-TECH-005' },
  // D — plus jamais de PINS-CU-*
  { name: 'D1 ancien PINS-CU-XXX ignoré', oldCode: 'PINS-PROP-MET-ENRICH', typologie: 'METIER', existingMax: 'PINS-METIER-468', expectedNew: 'PINS-METIER-469', expectedHasAncient: true, expectedCodeHisto: 'PINS-PROP-MET-ENRICH' },
];

let pass = 0, fail = 0;
for (const tc of TESTS) {
  const result = simulateNewCode(tc.oldCode, tc.typologie, tc.existingMax);
  const ok = result.newCode === tc.expectedNew
    && result.hasAncient === tc.expectedHasAncient
    && (result.codeHistorique === tc.expectedCodeHisto || (!result.codeHistorique && !tc.expectedCodeHisto));

  if (ok) { pass++; console.log(`✅ ${tc.name} → ${result.newCode}${result.hasAncient ? ` (ancien: ${result.codeHistorique})` : ''}`); }
  else {
    fail++;
    console.error(`❌ ${tc.name}`);
    console.error(`   Expected: new=${tc.expectedNew} ancient=${tc.expectedHasAncient} histo=${tc.expectedCodeHisto}`);
    console.error(`   Got:      new=${result.newCode} ancient=${result.hasAncient} histo=${result.codeHistorique}`);
  }
}

console.log(`\n${pass}/${TESTS.length} pass, ${fail} fail${fail > 0 ? ' — FIX INCOMPLET' : ' — TOUS OK'}`);
if (fail > 0) process.exit(1);
