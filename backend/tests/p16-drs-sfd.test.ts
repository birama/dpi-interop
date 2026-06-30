/**
 * Tests P16 — DRS-SFD.VerifierAgrementSFD (Phase A, stub)
 *
 * Scénarios :
 * 1. Agrément VALIDE (AGR-001)
 * 2. Agrément SUSPENDU (AGR-002)
 * 3. Agrément RETIRE (AGR-003)
 * 4. SFD inconnu → null
 */

import { describe, it, expect } from 'vitest';
import { verifierAgrementSFD, getStubAgrements } from '../src/modules/drs-sfd/stub.service.js';

describe('P16 — DRS-SFD.VerifierAgrementSFD (stub Phase A)', () => {
  it('retourne VALIDE pour AGR-001 (Microfinance Solidaire)', async () => {
    const result = await verifierAgrementSFD({ numeroAgrement: 'AGR-001' });
    expect(result).not.toBeNull();
    expect(result!.statut).toBe('VALIDE');
    expect(result!.raisonSociale).toBe('Microfinance Solidaire SA');
    expect(result!.portee).toContain('national');
    expect(result!.source).toBe('DRS-SFD');
    expect(result!._stub).toBe(true);
  });

  it('retourne SUSPENDU pour AGR-002 (Crédit Rural Express)', async () => {
    const result = await verifierAgrementSFD({ numeroAgrement: 'AGR-002' });
    expect(result).not.toBeNull();
    expect(result!.statut).toBe('SUSPENDU');
    expect(result!.raisonSociale).toBe('Crédit Rural Express');
    expect(result!.portee).toContain('Thiès');
  });

  it('retourne RETIRE pour AGR-003 (Finance Plus)', async () => {
    const result = await verifierAgrementSFD({ numeroAgrement: 'AGR-003' });
    expect(result).not.toBeNull();
    expect(result!.statut).toBe('RETIRE');
    expect(result!.raisonSociale).toBe('Finance Plus Sénégal');
    // Agrément retiré : date d'expiration dépassée ou forcée
    expect(new Date(result!.dateExpiration) < new Date()).toBe(true);
  });

  it('retourne null pour un SFD inconnu', async () => {
    const result = await verifierAgrementSFD({ numeroAgrement: 'AGR-999' });
    expect(result).toBeNull();
  });

  it('accepte le NINEA en option sans erreur', async () => {
    const result = await verifierAgrementSFD({
      numeroAgrement: 'AGR-001',
      ninea: 'NINEA-TEST-12345',
    });
    expect(result).not.toBeNull();
    expect(result!.statut).toBe('VALIDE');
  });

  it('le stub contient exactement 3 agréments de test', () => {
    const agrements = getStubAgrements();
    expect(agrements).toHaveLength(3);
    expect(agrements).toContain('AGR-001');
    expect(agrements).toContain('AGR-002');
    expect(agrements).toContain('AGR-003');
  });

  it('tous les agréments stub sont marqués _stub:true', async () => {
    for (const agr of getStubAgrements()) {
      const result = await verifierAgrementSFD({ numeroAgrement: agr });
      expect(result!._stub).toBe(true);
    }
  });
});
