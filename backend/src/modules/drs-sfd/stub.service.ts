/**
 * DRS-SFD Stub — Phase A (avant cadrage réel)
 *
 * Simule le endpoint de vérification d'agrément SFD de la DRS-SFD.
 * À remplacer par l'adaptateur réel après cadrage (Phase B).
 *
 * Contrat : entrée = numéro agrément ou NINEA, sortie = statut + fiche SFD.
 */

export interface AgrementSFDInput {
  numeroAgrement: string;       // obligatoire
  ninea?: string;               // optionnel, à confirmer en cadrage
}

export interface AgrementSFDOutput {
  numeroAgrement: string;
  statut: 'VALIDE' | 'SUSPENDU' | 'RETIRE';
  raisonSociale: string;
  portee: string;               // périmètre d'activité autorisé
  dateDelivrance: string;       // ISO 8601
  dateExpiration: string;       // ISO 8601, null si sans limite
  source: 'DRS-SFD';
  _stub: true;                  // marqueur Phase A — retiré en Phase B
}

// Données de test (stub)
const STUB_DATA: Record<string, AgrementSFDOutput> = {
  'AGR-001': {
    numeroAgrement: 'AGR-001',
    statut: 'VALIDE',
    raisonSociale: 'Microfinance Solidaire SA',
    portee: 'Collecte d\'épargne et octroi de crédit — périmètre national',
    dateDelivrance: '2024-03-15',
    dateExpiration: '2029-03-14',
    source: 'DRS-SFD',
    _stub: true,
  },
  'AGR-002': {
    numeroAgrement: 'AGR-002',
    statut: 'SUSPENDU',
    raisonSociale: 'Crédit Rural Express',
    portee: 'Octroi de crédit — périmètre régional (Thiès)',
    dateDelivrance: '2023-01-10',
    dateExpiration: '2028-01-09',
    source: 'DRS-SFD',
    _stub: true,
  },
  'AGR-003': {
    numeroAgrement: 'AGR-003',
    statut: 'RETIRE',
    raisonSociale: 'Finance Plus Sénégal',
    portee: 'Collecte d\'épargne — périmètre national',
    dateDelivrance: '2020-06-01',
    dateExpiration: '2025-05-31',
    source: 'DRS-SFD',
    _stub: true,
  },
};

/**
 * Vérifie un agrément SFD auprès du stub DRS-SFD.
 * Phase A : données simulées. Phase B : appel réel.
 */
export async function verifierAgrementSFD(input: AgrementSFDInput): Promise<AgrementSFDOutput | null> {
  // Simuler latence réseau (50-200ms)
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

  const result = STUB_DATA[input.numeroAgrement] || null;

  // Log l'appel pour traçabilité en test
  console.log(`[DRS-SFD STUB] vérification ${input.numeroAgrement} → ${result?.statut || 'INCONNU'}`);

  return result;
}

/**
 * Liste les agréments stub disponibles (pour tests).
 */
export function getStubAgrements(): string[] {
  return Object.keys(STUB_DATA);
}
