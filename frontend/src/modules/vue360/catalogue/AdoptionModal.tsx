import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ROLE_PRESSENTI_LABELS, ROLE_PRESSENTI_BADGE } from './constants';

interface Props {
  proposition: any;
  onClose: () => void;
}

const MIN_MOTIF = 50;

export function AdoptionModal({ proposition, onClose }: Props) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const isPressentie = proposition.institutionsPressenties?.some(
    (ip: any) => ip.institutionId === user?.institutionId
  );

  const [engagement, setEngagement] = useState(false);
  const [motif, setMotif] = useState('');
  // Par defaut : inclure toutes les pressenties (hors user lui-meme au submit)
  const [pressentiesIncluses, setPressentiesIncluses] = useState<string[]>(
    () => (proposition.institutionsPressenties || []).map((ip: any) => ip.institutionId)
  );

  const togglePressentie = (id: string) => {
    setPressentiesIncluses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const motifValid = isPressentie || motif.trim().length >= MIN_MOTIF;
  const canSubmit = engagement && motifValid;

  const mut = useMutation({
    mutationFn: () => api.post(`/catalogue/propositions/${proposition.id}/adopter`, {
      institutionInitiatriceId: user?.institutionId,
      confirmationEngagement: true,
      ajustements: { pressentiesIncluses },
      motif: isPressentie ? undefined : motif.trim(),
    }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['catalogue'] });
      qc.invalidateQueries({ queryKey: ['vue360-involved'] });
      if (res?.data?.status === 'PENDING_VALIDATION') {
        toast({
          title: 'Demande d\'adoption transmise',
          description: 'Votre institution n\'etait pas pressentie : la Delivery Unit doit valider votre demande avant l\'adoption effective.',
        });
        onClose();
      } else {
        toast({
          title: 'Adoption enregistree',
          description: `Cette proposition devient ${res?.data?.newCode} et votre institution en est desormais l'initiatrice.`,
        });
        onClose();
        if (res?.data?.casUsageId) navigate(`/admin/cas-usage/${res.data.casUsageId}`);
      }
    },
    onError: (e: any) => {
      toast({
        variant: 'destructive',
        title: 'Adoption impossible',
        description: e?.response?.data?.error || 'Erreur serveur',
      });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-10 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-[680px] max-w-[92vw] my-4">
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
              <span className="font-mono font-bold text-gray-700">{proposition.code}</span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal">
                Adoption
              </span>
            </div>
            <h3 className="text-lg font-bold text-navy">
              Adopter cette proposition — {proposition.code}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{proposition.titre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Warning institutionnel */}
          <div className="p-3 bg-navy/5 rounded-lg border border-navy/20 flex gap-2 text-xs text-navy">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              En adoptant cette proposition, votre institution en devient l'initiatrice.
              Vous vous engagez a mener la consultation des parties prenantes designees
              et a faire progresser le cas d'usage dans le pipeline.
              Les donnees seront notifiees a la Delivery Unit et aux institutions pressenties.
            </div>
          </div>

          {/* Pre-visualisation pressenties */}
          {proposition.institutionsPressenties && proposition.institutionsPressenties.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Parties prenantes a solliciter
              </div>
              <div className="space-y-1.5">
                {proposition.institutionsPressenties.map((ip: any) => {
                  const isUser = ip.institutionId === user?.institutionId;
                  const included = pressentiesIncluses.includes(ip.institutionId);
                  return (
                    <label
                      key={ip.id}
                      className={cn(
                        'flex items-start gap-2 p-2.5 border rounded-md cursor-pointer transition-colors',
                        isUser
                          ? 'border-teal bg-teal/5 cursor-default'
                          : included
                          ? 'border-gray-300 bg-white hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={isUser || included}
                        disabled={isUser}
                        onChange={() => togglePressentie(ip.institutionId)}
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy">
                            {ip.institution?.code}
                          </span>
                          <span className="text-gray-500">— {ip.institution?.nom}</span>
                          <span className={cn(
                            'inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded border ml-auto',
                            ROLE_PRESSENTI_BADGE[ip.rolePressenti]
                          )}>
                            {ROLE_PRESSENTI_LABELS[ip.rolePressenti]}
                          </span>
                        </div>
                        {isUser && (
                          <div className="text-[10px] text-teal mt-0.5">
                            Votre institution — deviendra INITIATEUR
                          </div>
                        )}
                        {ip.commentaire && (
                          <div className="text-[10px] text-gray-500 mt-0.5 italic">{ip.commentaire}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Motif obligatoire si non pressentie */}
          {!isPressentie && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Motif d'adoption <span className="text-red-500">*</span>
                <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. {MIN_MOTIF} caracteres</span>
              </label>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded mb-2 text-[11px] text-amber-800">
                Votre institution n'est pas pressentie sur cette proposition. Votre demande sera soumise
                a la validation de la Delivery Unit avant adoption effective.
              </div>
              <textarea
                rows={4}
                value={motif}
                onChange={e => setMotif(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
                placeholder="Expliquez en quoi votre institution est concernee et pourquoi elle souhaite porter ce cas d'usage."
              />
              <div className={cn('text-right text-[10px] mt-1', motif.length < MIN_MOTIF ? 'text-red-500' : 'text-teal')}>
                {motif.length} / {MIN_MOTIF} caracteres
              </div>
            </div>
          )}

          {/* Checkbox engagement */}
          <label className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={engagement}
              onChange={e => setEngagement(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-700">
              <b>Je confirme l'engagement institutionnel</b> de mon institution a porter cette proposition
              dans le pipeline, a consulter formellement les parties prenantes et a respecter les echeances.
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={!canSubmit || mut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                canSubmit && !mut.isPending ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              <CheckCircle2 className="w-3 h-3" />
              {isPressentie ? 'Adopter' : 'Transmettre la demande'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
