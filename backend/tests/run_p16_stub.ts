import { verifierAgrementSFD, getStubAgrements } from '../src/modules/drs-sfd/stub.service.js';

async function test() {
  let ok = 0, ko = 0;
  const check = (label: string, fn: () => boolean) => {
    if (fn()) { ok++; console.log(`✅ ${label}`); }
    else { ko++; console.log(`❌ ${label}`); }
  };

  const r1 = await verifierAgrementSFD({ numeroAgrement: 'AGR-001' });
  check('VALIDE', () => r1?.statut === 'VALIDE' && r1._stub === true);

  const r2 = await verifierAgrementSFD({ numeroAgrement: 'AGR-002' });
  check('SUSPENDU', () => r2?.statut === 'SUSPENDU');

  const r3 = await verifierAgrementSFD({ numeroAgrement: 'AGR-003' });
  check('RETIRE', () => r3?.statut === 'RETIRE');

  const r4 = await verifierAgrementSFD({ numeroAgrement: 'AGR-999' });
  check('INCONNU → null', () => r4 === null);

  const r5 = await verifierAgrementSFD({ numeroAgrement: 'AGR-001', ninea: 'NINEA-TEST' });
  check('NINEA optionnel', () => r5?.statut === 'VALIDE');

  check('3 agréments stub', () => getStubAgrements().length === 3);

  console.log(`\n${ko === 0 ? '✅ 6/6 VERTS' : `❌ ${ok}/${ok + ko}`}`);
}

test();
