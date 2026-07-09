import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import { AVIS_FORMEL_SENS_STYLES } from './constants';

const SENS_OPTIONS = [
  { sens: 'FAVORABLE', ...AVIS_FORMEL_SENS_STYLES.FAVORABLE },
  { sens: 'RESERVE', ...AVIS_FORMEL_SENS_STYLES.RESERVE },
  { sens: 'DEFAVORABLE', ...AVIS_FORMEL_SENS_STYLES.DEFAVORABLE },
];

interface Props {
  casUsageId: string;
  casUsageCode: string;
  casUsageTitre: string;
  isAdmin: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function AvisFormelModal({ casUsageId, casUsageCode, casUsageTitre, isAdmin, onClose, onSubmitted }: Props) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sens, setSens] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');
  const [institutionId, setInstitutionId] = useState('');

  const { data: institutions = [] } = useQuery<any[]>({
    queryKey: ['institutions-list'],
    queryFn: () => api.get('/institutions', { params: { limit: '500' } }).then(r => r.data?.data || r.data || []),
    enabled: isAdmin,
  });

  const isValid = commentaire.trim().length >= 20 && (!isAdmin || !!institutionId);

  const submitMut = useMutation({
    mutationFn: () =>
      api.post(`/use-cases/${casUsageId}/avis-formel`, {
        sens,
        commentaire: commentaire.trim(),
        ...(isAdmin ? { institutionId } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avis-formel', casUsageId] });
      toast({ title: 'Avis formel déposé', description: 'Votre avis a été enregistré de manière inaltérable.' });
      onSubmitted();
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Échec du dépôt' });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
              <span className="font-mono font-bold text-gray-700">{casUsageCode}</span>
            </div>
            <h3 className="text-lg font-bold text-navy">Déposer un avis formel</h3>
            <p className="text-xs text-gray-500 mt-0.5">{casUsageTitre}</p>
            <p className="text-[11px] text-gray-500 italic mt-1">
              Cet avis sera horodaté, signé institutionnellement et ne pourra plus être modifié.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Sens de l'avis */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Sens de l'avis</label>
            <div className="grid grid-cols-3 gap-2">
              {SENS_OPTIONS.map(opt => (
                <label
                  key={opt.sens}
                  className={cn(
                    'border-2 rounded-md p-3 text-center cursor-pointer transition-colors',
                    sens === opt.sens ? opt.bg : 'border-gray-200 hover:border-gray-400',
                  )}
                >
                  <input type="radio" name="sens" className="sr-only" checked={sens === opt.sens} onChange={() => setSens(opt.sens)} />
                  <div className="text-xl">{opt.icon}</div>
                  <div className={cn('text-[10px] font-bold mt-0.5', sens === opt.sens ? '' : 'text-gray-700')}>{opt.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Institution (admin seulement) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Institution attributaire <span className="text-red-500">*</span>
              </label>
              <select
                value={institutionId}
                onChange={e => setInstitutionId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              >
                <option value="">— Choisir une institution —</option>
                {Array.isArray(institutions) && institutions.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>{inst.code} — {inst.nom}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-0.5">L'avis est attribué à l'institution choisie, jamais anonyme.</p>
            </div>
          )}

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Commentaire <span className="text-red-500">*</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. 20 caractères</span>
            </label>
            <textarea
              rows={5}
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              placeholder="Exposer clairement la position de votre institution..."
            />
            <div className={cn('text-right text-[10px] mt-1', commentaire.length < 20 ? 'text-red-500' : 'text-gray-400')}>
              {commentaire.length} caractères {commentaire.length < 20 && '(min. 20)'}
            </div>
          </div>

          {/* Signature institutionnelle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Signature institutionnelle</div>
            <div className="text-xs text-gray-700">
              <b>{user?.email}</b> · {isAdmin ? '(AU NOM DE L\'INSTITUTION CHOISIE)' : user?.institution?.nom || 'Institution'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Cet avis sera horodaté et figé dès soumission. Aucune modification ultérieure n'est possible.
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
                isValid ? 'bg-navy hover:bg-navy/90' : 'bg-gray-300 cursor-not-allowed',
              )}
            >
              {submitMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Déposer l'avis formel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
