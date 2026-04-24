import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, X, AlertTriangle } from 'lucide-react';
import { TYPE_CONCERNEMENT_OPTIONS } from './constants';

interface Props {
  cuId: string;
  cuCode: string;
  cuTitre: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const MIN_MOTIF = 50;

export function AutoSaisineModal({ cuId, cuCode, cuTitre, onClose, onSubmitted }: Props) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [motif, setMotif] = useState('');
  const [typeConcernement, setTypeConcernement] = useState('');

  const isValid = motif.trim().length >= MIN_MOTIF && !!typeConcernement;

  const mut = useMutation({
    mutationFn: () => api.post(`/use-cases/${cuId}/stakeholders`, {
      institutionId: user?.institutionId,
      role: 'PARTIE_PRENANTE',
      motifAutoSaisine: motif.trim(),
      typeConcernement,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', cuId] });
      qc.invalidateQueries({ queryKey: ['vue360-involved'] });
      qc.invalidateQueries({ queryKey: ['vue360-radar'] });
      toast({
        title: 'Auto-saisine enregistree',
        description: `Votre institution est partie prenante de ${cuCode}. L'initiateur en est informe.`,
      });
      onSubmitted?.();
      onClose();
    },
    onError: (e: any) => {
      toast({
        variant: 'destructive',
        title: 'Echec de l\'auto-saisine',
        description: e?.response?.data?.error || 'Verifiez votre motivation et reessayez.',
      });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[620px] max-w-[92vw] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
              <span className="font-mono font-bold text-gray-700">{cuCode}</span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal">
                Auto-saisine
              </span>
            </div>
            <h3 className="text-lg font-bold text-navy">Me porter partie prenante</h3>
            <p className="text-xs text-gray-500 mt-0.5">{cuTitre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Avertissement */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              En se declarant partie prenante, votre institution accede aux informations detaillees de ce cas d'usage
              et sera consultee formellement. L'initiateur et la Delivery Unit sont notifies de votre auto-saisine motivee.
            </div>
          </div>

          {/* Typologie */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Typologie du concernement <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {TYPE_CONCERNEMENT_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-start gap-2 p-2.5 border-2 rounded-md cursor-pointer transition-colors',
                    typeConcernement === opt.value
                      ? 'border-teal bg-teal/5'
                      : 'border-gray-200 hover:border-gray-400'
                  )}
                >
                  <input
                    type="radio"
                    name="typeConcernement"
                    value={opt.value}
                    checked={typeConcernement === opt.value}
                    onChange={() => setTypeConcernement(opt.value)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Motivation institutionnelle <span className="text-red-500">*</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. {MIN_MOTIF} caracteres</span>
            </label>
            <textarea
              rows={5}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              placeholder="Expliquez precisement pourquoi votre institution est concernee par ce cas d'usage : donnees detenues, processus impacte, responsabilite reglementaire, etc."
            />
            <div className={cn('text-right text-[10px] mt-1', motif.length < MIN_MOTIF ? 'text-red-500' : 'text-teal')}>
              {motif.length} / {MIN_MOTIF} caracteres {motif.length < MIN_MOTIF && '(insuffisant)'}
            </div>
          </div>

          {/* Signature */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Signature institutionnelle</div>
            <div className="text-xs text-gray-700">
              <b>{user?.email}</b> · {user?.institution?.nom || 'Institution'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Cette auto-saisine sera horodatee, tracee et transmise a l'initiateur et a la Delivery Unit.
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={!isValid || mut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white transition-colors',
                isValid && !mut.isPending ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer l'auto-saisine motivee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
