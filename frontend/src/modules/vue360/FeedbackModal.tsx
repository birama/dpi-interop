import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import { VUE360_STATUT_COLORS, ROLE_BADGE_STYLES, ROLE_LABELS } from './constants';

const FEEDBACK_TYPES = [
  { type: 'VALIDATION', icon: '✓', label: 'VALIDATION', color: 'border-teal bg-teal/5 text-teal' },
  { type: 'RESERVE', icon: '⚠', label: 'RESERVE', color: 'border-amber bg-amber/5 text-amber-700' },
  { type: 'REFUS_MOTIVE', icon: '✕', label: 'REFUS', color: 'border-red-500 bg-red-50 text-red-700' },
  { type: 'QUESTION', icon: '?', label: 'QUESTION', color: 'border-blue-500 bg-blue-50 text-blue-700' },
  { type: 'CONTRE_PROPOSITION', icon: '↻', label: 'CONTRE-PROP.', color: 'border-gold bg-gold-50 text-gold' },
];

const MIN_MOTIVATION_TYPES = ['RESERVE', 'REFUS_MOTIVE', 'QUESTION'];

interface Props {
  // Mode 'new' : consultation en attente, POST /consultations/:id/feedback
  // Mode 'amendment' : amendement d'un avis deja emis, PATCH /feedback/:id/amend
  mode?: 'new' | 'amendment';
  consultationId?: string;         // requis si mode='new'
  originalFeedbackId?: string;     // requis si mode='amendment'
  initialType?: string;            // pour pre-remplir en mode amendement
  initialMotivation?: string;
  casUsageCode: string;
  casUsageTitre: string;
  casUsageStatut: string;
  stakeholderRole: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function FeedbackModal({
  mode = 'new',
  consultationId,
  originalFeedbackId,
  initialType,
  initialMotivation,
  casUsageCode,
  casUsageTitre,
  casUsageStatut,
  stakeholderRole,
  onClose,
  onSubmitted,
}: Props) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [type, setType] = useState(initialType || 'VALIDATION');
  const [motivation, setMotivation] = useState(initialMotivation || '');

  const isAmendment = mode === 'amendment';
  const sc = VUE360_STATUT_COLORS[casUsageStatut];
  const needsMinLength = MIN_MOTIVATION_TYPES.includes(type) || isAmendment;
  const minChars = needsMinLength ? 50 : 1;
  const isValid = motivation.length >= minChars;

  const submitMut = useMutation({
    mutationFn: () => {
      if (isAmendment) {
        if (!originalFeedbackId) throw new Error('originalFeedbackId requis en mode amendement');
        return api.patch(`/feedback/${originalFeedbackId}/amend`, { type, motivation });
      }
      if (!consultationId) throw new Error('consultationId requis en mode new');
      return api.post(`/consultations/${consultationId}/feedback`, { type, motivation });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail'] });
      qc.invalidateQueries({ queryKey: ['vue360-incoming'] });
      toast({
        title: isAmendment ? 'Amendement soumis' : 'Avis soumis',
        description: isAmendment
          ? 'Votre amendement a ete enregistre — l\'avis original reste inaltere.'
          : `Votre avis ${type} a ete enregistre.`,
      });
      onSubmitted();
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec de la soumission' });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[640px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
              <span className="font-mono font-bold text-gray-700">{casUsageCode}</span>
              {sc && <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', sc.chip)}>{sc.label}</span>}
              <span className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border', ROLE_BADGE_STYLES[stakeholderRole])}>
                {ROLE_LABELS[stakeholderRole]}
              </span>
              {isAmendment && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-gold-50 text-gold">
                  Amendement
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-navy">
              {isAmendment ? 'Amender mon avis' : 'Donner mon avis'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{casUsageTitre}</p>
            {isAmendment && (
              <p className="text-[11px] text-gray-500 italic mt-1">
                L'avis original est conserve et reste visible — votre amendement sera archive a sa suite.
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type d'avis */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Type d'avis</label>
            <div className="grid grid-cols-5 gap-1.5">
              {FEEDBACK_TYPES.map(ft => (
                <label
                  key={ft.type}
                  className={cn(
                    'border-2 rounded-md p-2 text-center cursor-pointer transition-colors',
                    type === ft.type ? ft.color : 'border-gray-200 hover:border-gray-400'
                  )}
                >
                  <input type="radio" name="avis" className="sr-only" checked={type === ft.type} onChange={() => setType(ft.type)} />
                  <div className="text-xl">{ft.icon}</div>
                  <div className={cn('text-[10px] font-bold mt-0.5', type === ft.type ? '' : 'text-gray-700')}>{ft.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              {isAmendment ? 'Motivation de l\'amendement' : 'Motivation'} <span className="text-red-500">*</span>
              {needsMinLength && <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. 50 caracteres</span>}
            </label>
            <textarea
              rows={5}
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              placeholder={
                isAmendment
                  ? 'Expliquez clairement ce qui evolue dans votre position : element nouveau, clarification, changement de circonstances...'
                  : 'Exposer clairement la position institutionnelle, les conditions eventuelles et les points d\'attention...'
              }
            />
            <div className={cn('text-right text-[10px] mt-1', needsMinLength && motivation.length < 50 ? 'text-red-500' : 'text-gray-400')}>
              {motivation.length} caracteres {needsMinLength && motivation.length < 50 && `(min. 50)`}
            </div>
          </div>

          {/* Signature institutionnelle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Signature institutionnelle</div>
            <div className="text-xs text-gray-700">
              <b>{user?.email}</b> · {user?.institution?.nom || 'Institution'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {isAmendment
                ? 'Cet amendement sera horodate et fige des soumission. L\'avis original demeure inaltere.'
                : 'Cet avis sera horodate et fige des soumission'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => submitMut.mutate()}
              disabled={!isValid || submitMut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white transition-colors',
                isValid ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {submitMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {isAmendment ? 'Soumettre l\'amendement' : 'Soumettre l\'avis formel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
