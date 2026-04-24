export const TYPOLOGIE_BADGE: Record<string, { bg: string; label: string }> = {
  METIER:    { bg: 'bg-navy/10 text-navy border border-navy/30',     label: 'Parcours metier' },
  TECHNIQUE: { bg: 'bg-teal/10 text-teal border border-teal/30',     label: 'Service technique' },
};

export const MATURITE_BADGE: Record<string, { bg: string; label: string }> = {
  ESQUISSE:         { bg: 'bg-gray-100 text-gray-600 border border-gray-300',        label: 'Esquisse' },
  PRE_CADREE:       { bg: 'bg-amber-50 text-amber-700 border border-amber-200',      label: 'Pre-cadree' },
  PRETE_A_ADOPTER:  { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Prete a adopter' },
};

export const SOURCE_LABELS: Record<string, string> = {
  ATELIER_CADRAGE:             'Atelier de cadrage',
  ETUDE_SENUM:                 'Etude interne SENUM',
  RECOMMANDATION:              'Recommandation autorite',
  CADRAGE_STRATEGIQUE:         'Cadrage strategique national',
  PROPOSITION_INSTITUTIONNELLE:'Proposition institutionnelle',
};

export const ROLE_PRESSENTI_LABELS: Record<string, string> = {
  INITIATEUR_PRESSENTI:       'Initiateur pressenti',
  FOURNISSEUR_PRESSENTI:      'Fournisseur pressenti',
  CONSOMMATEUR_PRESSENTI:     'Consommateur pressenti',
  PARTIE_PRENANTE_PRESSENTIE: 'Partie prenante pressentie',
};

export const ROLE_PRESSENTI_BADGE: Record<string, string> = {
  INITIATEUR_PRESSENTI:       'border-navy/50 text-navy bg-navy/5',
  FOURNISSEUR_PRESSENTI:      'border-teal/50 text-teal bg-teal/5',
  CONSOMMATEUR_PRESSENTI:     'border-yellow-600/50 text-yellow-800 bg-yellow-50',
  PARTIE_PRENANTE_PRESSENTIE: 'border-gray-400 text-gray-600 bg-gray-50',
};
