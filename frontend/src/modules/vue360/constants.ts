/**
 * Constantes Vue 360° — Styles, labels, couleurs
 *
 * Rappels conventions :
 * - statutVueSection porte le statut du pipeline Vue 360° (pas statutImpl)
 * - EN_PRODUCTION_360 / SUSPENDU_360 (suffixés pour éviter conflit)
 * - institutionSourceCode = initiateur (string code, pas FK UUID)
 */

export const VUE360_STATUT_COLORS: Record<string, { chip: string; label: string }> = {
  DECLARE:              { chip: 'bg-gray-100 text-gray-700',    label: 'Declare' },
  EN_CONSULTATION:      { chip: 'bg-amber-50 text-amber-700',  label: 'Consultation' },
  VALIDATION_CONJOINTE: { chip: 'bg-blue-100 text-blue-700',   label: 'Validation conjointe' },
  QUALIFIE:             { chip: 'bg-teal/10 text-teal',        label: 'Qualifie' },
  PRIORISE:             { chip: 'bg-gold-50 text-gold',        label: 'Priorise' },
  FINANCEMENT_OK:       { chip: 'bg-emerald-50 text-emerald-700', label: 'Finance' },
  CONVENTIONNE:         { chip: 'bg-navy/10 text-navy',        label: 'Conventionne' },
  EN_PRODUCTION_360:    { chip: 'bg-green-50 text-green-700',  label: 'Production' },
  SUSPENDU_360:         { chip: 'bg-red-50 text-red-700',      label: 'Suspendu' },
  RETIRE:               { chip: 'bg-gray-200 text-gray-500',   label: 'Retire' },
};

export const ROLE_BADGE_STYLES: Record<string, string> = {
  INITIATEUR:       'border-navy text-navy bg-navy/5',
  FOURNISSEUR:      'border-teal text-teal bg-teal/5',
  CONSOMMATEUR:     'border-yellow-600 text-yellow-800 bg-yellow-50',
  PARTIE_PRENANTE:  'border-gray-400 text-gray-600 bg-gray-50',
};

export const ROLE_LABELS: Record<string, string> = {
  INITIATEUR: 'Initiateur',
  FOURNISSEUR: 'Fournisseur',
  CONSOMMATEUR: 'Consommateur',
  PARTIE_PRENANTE: 'Partie prenante',
};

export const TYPE_CONCERNEMENT_OPTIONS = [
  { value: 'DONNEES_DETENUES',      label: 'Mon institution detient ou produit les donnees concernees' },
  { value: 'PROCESSUS_IMPACTE',     label: 'Un processus metier de mon institution est directement impacte' },
  { value: 'GOUVERNANCE_TRANSVERSE', label: 'Gouvernance transverse ou responsabilite de coordination' },
  { value: 'AUTRE',                 label: 'Autre motif (a preciser dans la motivation)' },
];

export const TYPE_CONCERNEMENT_LABELS: Record<string, string> = {
  DONNEES_DETENUES: 'Donnees detenues',
  PROCESSUS_IMPACTE: 'Processus impacte',
  GOUVERNANCE_TRANSVERSE: 'Gouvernance transverse',
  AUTRE: 'Autre',
};

// Statuts ou l'amendement d'avis n'est plus recevable (cas d'usage deja fige)
export const STATUTS_NON_AMENDABLES = new Set([
  'QUALIFIE', 'PRIORISE', 'FINANCEMENT_OK', 'CONVENTIONNE',
  'EN_PRODUCTION_360', 'SUSPENDU_360', 'RETIRE',
]);

export const FEEDBACK_TYPE_STYLES: Record<string, { bg: string; icon: string }> = {
  VALIDATION:         { bg: 'bg-teal/15 text-teal',      icon: '✓' },
  RESERVE:            { bg: 'bg-red-100 text-red-700',    icon: '⚠' },
  REFUS_MOTIVE:       { bg: 'bg-red-200 text-red-800',   icon: '✗' },
  QUESTION:           { bg: 'bg-blue-100 text-blue-700',  icon: '?' },
  CONTRE_PROPOSITION: { bg: 'bg-gold-50 text-gold',       icon: '↻' },
};

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'a l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  return `il y a ${days}j`;
}

export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
