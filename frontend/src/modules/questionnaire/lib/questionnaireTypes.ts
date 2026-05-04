// Types et constantes partages du module questionnaire.
// Extraits du monolithe pages/QuestionnairePage.tsx lors du refactor V1.

export const STEPS = [
  { id: 0, title: 'Informations', shortTitle: 'Infos', description: 'Identification et gouvernance des donnees' },
  { id: 1, title: 'Systemes', shortTitle: 'SI', description: 'Applications, registres et infrastructure' },
  { id: 2, title: 'Donnees', shortTitle: 'Donnees', description: 'Besoins en donnees et dictionnaire' },
  { id: 3, title: 'Flux', shortTitle: 'Flux', description: 'Flux existants et cas d\'usage' },
  { id: 4, title: 'Interoperabilite', shortTitle: 'Interop', description: 'Diagnostic des 5 niveaux d\'interoperabilite' },
  { id: 5, title: 'Conformite', shortTitle: 'Principes', description: 'Conformite aux principes et preparation au decret' },
  { id: 6, title: 'Maturite', shortTitle: 'Maturite', description: 'Contraintes et auto-evaluation' },
  { id: 7, title: 'Attentes', shortTitle: 'Attentes', description: 'Attentes et contributions' },
] as const;

export type StepId = typeof STEPS[number]['id'];

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

// Forme du formData utilise dans tous les steps. Reflete la structure Prisma
// Submission + sous-tables. Conserve `any[]` pour les sous-objets
// dynamiques (applications, registres, ...) car la validation se fait
// au moment de la sauvegarde.
export interface QuestionnaireFormData {
  // A - Gouvernance
  dataOwnerNom: string;
  dataOwnerFonction: string;
  dataOwnerEmail: string;
  dataOwnerTelephone: string;
  dataStewardNom: string;
  dataStewardProfil: string;
  dataStewardFonction: string;
  dataStewardEmail: string;
  dataStewardTelephone: string;

  // B - Systemes
  applications: any[];
  registres: any[];
  infrastructureItems: any[];

  // F - Cadre interoperabilite
  niveauxInterop: any[];
  dictionnaireDonnees: any[];
  conformitePrincipes: any[];
  preparationDecret: any[];

  // C - Echanges
  donneesConsommer: any[];
  donneesFournir: any[];
  fluxExistants: any[];
  casUsage: any[];
  infrastructure: { serveurs: string; sgbd: string[]; reseau: string; securite: string };

  // D - Contraintes / maturite
  contraintesJuridiques: string;
  contraintesTechniques: string;
  maturiteInfra: number;
  maturiteDonnees: number;
  maturiteCompetences: number;
  maturiteGouvernance: number;

  // E - Auto-diagnostic
  forces: string;
  faiblesses: string;

  // F - Attentes
  attentes: string;
  contributions: string;
}

export const INITIAL_FORM_DATA: QuestionnaireFormData = {
  dataOwnerNom: '',
  dataOwnerFonction: '',
  dataOwnerEmail: '',
  dataOwnerTelephone: '',
  dataStewardNom: '',
  dataStewardProfil: '',
  dataStewardFonction: '',
  dataStewardEmail: '',
  dataStewardTelephone: '',
  applications: [{ nom: '', description: '', editeur: '', anneeInstallation: '' }],
  registres: [{ nom: '', description: '', volumetrie: '' }],
  infrastructureItems: [],
  niveauxInterop: [],
  dictionnaireDonnees: [],
  conformitePrincipes: [],
  preparationDecret: [],
  donneesConsommer: [{ donnee: '', source: '', usage: '', priorite: 3 }],
  donneesFournir: [{ donnee: '', destinataires: '', frequence: '', format: '' }],
  fluxExistants: [{ source: '', destination: '', donnee: '', mode: '', frequence: '' }],
  casUsage: [{ titre: '', description: '', acteurs: '', priorite: 3 }],
  infrastructure: { serveurs: '', sgbd: [], reseau: '', securite: '' },
  contraintesJuridiques: '',
  contraintesTechniques: '',
  maturiteInfra: 3,
  maturiteDonnees: 3,
  maturiteCompetences: 3,
  maturiteGouvernance: 3,
  forces: '',
  faiblesses: '',
  attentes: '',
  contributions: '',
};

// Props communes a tous les Step{N}.tsx, mutualisees pour limiter
// le bruit dans les signatures.
export interface StepProps {
  formData: QuestionnaireFormData;
  setFormData: (updater: (prev: QuestionnaireFormData) => QuestionnaireFormData) => void;
  isReadOnly: boolean;
  institutionOptions: { value: string; label: string; sublabel?: string }[];
  // Helpers tableau (add/remove/update) ; signature stable depuis le monolithe
  addArrayItem: (field: keyof QuestionnaireFormData, template: any) => void;
  removeArrayItem: (field: keyof QuestionnaireFormData, index: number) => void;
  updateArrayItem: (field: keyof QuestionnaireFormData, index: number, key: string, value: any) => void;
  // Step 1 (Infos) lit l'institution depuis la submission chargee
  submissionInstitution?: { code: string; nom: string; ministere: string };
}
