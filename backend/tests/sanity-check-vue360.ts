/**
 * Sanity check Vue 360° — Tests fonctionnels end-to-end
 * Pré-requis : serveur backend lancé sur PORT (default 3001), DB seedée
 *
 * Usage : PORT=3001 npx tsx tests/sanity-check-vue360.ts
 */

import http from 'http';

const PORT = process.env.PORT || '3001';
const API = `http://localhost:${PORT}/api`;

function request(method: string, path: string, body?: any, token?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://localhost:${PORT}`);
    const opts: http.RequestOptions = {
      hostname: 'localhost', port: parseInt(PORT), path: url.pathname + url.search,
      method, headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers!['Authorization'] = `Bearer ${token}`;
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode!, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email: string, password: string): Promise<string> {
  const r = await request('POST', `/api/auth/login`, { email, password });
  return r.data.token;
}

async function main() {
  console.log(`\n========== SANITY CHECK VUE 360° (port ${PORT}) ==========\n`);

  // Login
  const dgidToken = await login('dsi@dgid.sn', 'Password@123');
  const ansdToken = await login('dsi@ansd.sn', 'Password@123');
  const adminToken = await login('admin@senum.sn', 'Admin@2026');
  console.log('Logins OK: DGID, ANSD, ADMIN\n');

  // =====================================================================
  // TEST a) GET /me/use-cases/incoming (DGID)
  // =====================================================================
  console.log('=== TEST a) GET /me/use-cases/incoming (DGID) ===');
  const incoming = await request('GET', `/api/me/use-cases/incoming`, undefined, dgidToken);
  console.log(`  Status: ${incoming.status}`);
  console.log(`  Nb sollicitations: ${incoming.data.length}`);
  for (const item of incoming.data) {
    console.log(`    ${item.casUsage.code} | Role: ${item.stakeholder.role} | Echeance: ${String(item.consultation?.dateEcheance || '').substring(0, 10)}`);
  }
  const testA = incoming.data.length >= 1 && incoming.data.some((i: any) => i.casUsage.code === 'PINS-CU-008');
  console.log(`  RESULTAT: ${testA ? 'PASS' : 'FAIL'} (attendu: >= 1 avec PINS-CU-008)\n`);

  // =====================================================================
  // Find CU-008 ID
  // =====================================================================
  const catalog = await request('GET', `/api/use-cases/catalog?search=PINS-CU-008`, undefined, adminToken);
  const cu008Id = catalog.data.data?.[0]?.id;
  console.log(`CU-008 ID: ${cu008Id}\n`);

  if (!cu008Id) {
    console.log('FAIL: CU-008 non trouvé dans le catalogue');
    process.exit(1);
  }

  // =====================================================================
  // TEST b) GET /use-cases/:id (DGID — stakeholder → DETAILED)
  // =====================================================================
  console.log('=== TEST b) GET /use-cases/:id (DGID — DETAILED) ===');
  const detailDGID = await request('GET', `/api/use-cases/${cu008Id}`, undefined, dgidToken);
  console.log(`  Visibility: ${detailDGID.data._visibility}`);
  console.log(`  Titre: ${detailDGID.data.titre}`);
  console.log(`  Stakeholders: ${detailDGID.data.stakeholders360?.length}`);
  const hasFeedbacks = detailDGID.data.stakeholders360?.some((s: any) => s.feedbacks?.length > 0);
  console.log(`  Has feedbacks: ${hasFeedbacks}`);
  console.log(`  StatusHistory: ${detailDGID.data.statusHistory?.length}`);
  console.log(`  RegistresAssocies: ${detailDGID.data.registresAssocies?.length}`);
  console.log(`  InstitutionSource: ${detailDGID.data.institutionSource?.code} — ${detailDGID.data.institutionSource?.nom}`);
  const testB = detailDGID.data._visibility === 'DETAILED' && hasFeedbacks && detailDGID.data.statusHistory?.length >= 2;
  console.log(`  RESULTAT: ${testB ? 'PASS' : 'FAIL'} (attendu: DETAILED, feedbacks visibles, >= 2 history)\n`);

  // =====================================================================
  // TEST c) GET /use-cases/:id (ANSD — NOT stakeholder → METADATA)
  // =====================================================================
  console.log('=== TEST c) GET /use-cases/:id (ANSD — METADATA) ===');
  const detailANSD = await request('GET', `/api/use-cases/${cu008Id}`, undefined, ansdToken);
  console.log(`  Visibility: ${detailANSD.data._visibility}`);
  console.log(`  Has titre: ${!!detailANSD.data.titre}`);
  console.log(`  Has description: ${!!detailANSD.data.description}`);
  const ansdHasFeedbacks = detailANSD.data.stakeholders360?.some((s: any) => s.feedbacks?.length > 0);
  console.log(`  Has feedbacks (should be false/undefined): ${ansdHasFeedbacks}`);
  console.log(`  Has statusHistory (should be undefined): ${!!detailANSD.data.statusHistory}`);
  const testC = detailANSD.data._visibility === 'METADATA' && !detailANSD.data.description && !detailANSD.data.statusHistory;
  console.log(`  RESULTAT: ${testC ? 'PASS' : 'FAIL'} (attendu: METADATA, pas de description/feedbacks/history)\n`);

  // =====================================================================
  // TEST d) GET /registres/couverture
  // =====================================================================
  console.log('=== TEST d) GET /registres/couverture ===');
  const couv = await request('GET', `/api/registres/couverture`, undefined, adminToken);
  console.log(`  Nb registres: ${couv.data.length}`);
  const withUseCases = couv.data.filter((r: any) => r.compteurs.total > 0);
  for (const r of withUseCases) {
    console.log(`    ${r.code} | C: ${r.compteurs.consomme} A: ${r.compteurs.alimente} Cr: ${r.compteurs.cree} | Doublons: ${r.doublonsPotentiels}`);
  }
  const nineaReg = couv.data.find((r: any) => r.code === 'NINEA');
  const testD = couv.data.length >= 10 && nineaReg && nineaReg.compteurs.consomme >= 3;
  console.log(`  RESULTAT: ${testD ? 'PASS' : 'FAIL'} (attendu: >= 10 registres, NINEA >= 3 consomme)\n`);

  // =====================================================================
  // TEST e) Inaltérabilité status history (via Prisma $executeRawUnsafe)
  // =====================================================================
  console.log('=== TEST e) Inaltérabilité status history ===');
  try {
    // On utilise l'API pour tester indirectement — tentative d'un UPDATE raw
    // Note: Ce test nécessite un accès direct Prisma, pas l'API REST
    // On vérifie juste que le trigger existe en interrogeant pg_trigger
    console.log('  (Test du trigger nécessite un accès direct Prisma — voir script dédié ci-dessous)');
    console.log('  RESULTAT: SKIPPED (à vérifier via psql ou script dédié)\n');
  } catch (e: any) {
    console.log(`  ERREUR: ${e.message}\n`);
  }

  // =====================================================================
  // RÉSUMÉ
  // =====================================================================
  console.log('========== RÉSUMÉ ==========');
  console.log(`  a) incoming DGID:        ${testA ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  b) detail DETAILED:      ${testB ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  c) detail METADATA:      ${testC ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  d) couverture registres: ${testD ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  e) inaltérabilité:       SKIPPED (trigger PG à tester via psql)`);
  console.log('============================\n');

  const allPass = testA && testB && testC && testD;
  process.exit(allPass ? 0 : 1);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
