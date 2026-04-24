import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, X, AlertTriangle, LogOut, Gavel } from 'lucide-react';
import {
  ROLE_BADGE_STYLES, ROLE_LABELS, FEEDBACK_TYPE_STYLES, TYPE_CONCERNEMENT_LABELS,
} from './constants';

interface Props {
  casUsageId: string;
  stakeholders: any[];
  onChanged?: () => void;
}

export function StakeholdersTable({ casUsageId, stakeholders, onChanged }: Props) {
  const { user } = useAuthStore();
  const [withdrawTarget, setWithdrawTarget] = useState<any | null>(null);
  const [evictTarget, setEvictTarget] = useState<any | null>(null);

  const actifs = stakeholders.filter((s: any) => s.actif !== false);
  const inactifs = stakeholders.filter((s: any) => s.actif === false);
  const isAdmin = user?.role === 'ADMIN';

  const canWithdraw = (sh: any): boolean => {
    if (!user || sh.role === 'INITIATEUR') return false;
    if (sh.institutionId !== user.institutionId) return false;
    if (!sh.autoSaisine) return false;
    const hasFeedback = (sh.feedbacks?.length || 0) > 0
      || sh.consultations?.some((c: any) => (c.feedbacks?.length || 0) > 0);
    return !hasFeedback;
  };

  const canEvict = (sh: any): boolean => {
    return isAdmin && sh.role !== 'INITIATEUR' && sh.actif !== false;
  };

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="font-bold text-navy">Parties prenantes</div>
          <div className="text-xs text-gray-500">Statut de consultation des administrations impliquees</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-2 font-semibold">Institution</th>
                <th className="px-4 py-2 font-semibold">Role</th>
                <th className="px-4 py-2 font-semibold">Statut avis</th>
                <th className="px-4 py-2 font-semibold">Auteur</th>
                <th className="px-4 py-2 font-semibold">Date</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actifs.map((sh: any) => {
                const lastCo = sh.consultations?.[0];
                const lastFb = lastCo?.feedbacks?.[0] || sh.feedbacks?.[0];
                const isWaiting = lastCo?.status === 'EN_ATTENTE';
                const fbStyle = lastFb ? FEEDBACK_TYPE_STYLES[lastFb.type] : null;

                return (
                  <tr key={sh.id} className={cn(isWaiting && 'bg-amber-50/50')}>
                    <td className="px-4 py-2">
                      <div className="font-semibold text-navy">{sh.institution?.code}</div>
                      <div className="text-[10px] text-gray-400">{sh.institution?.nom}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <span className={cn('inline-flex w-fit text-[10px] font-bold px-1.5 py-0.5 rounded border', ROLE_BADGE_STYLES[sh.role])}>
                          {ROLE_LABELS[sh.role]}
                        </span>
                        {sh.autoSaisine && (
                          <span
                            className="inline-flex w-fit items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/30"
                            title={sh.typeConcernement ? `Auto-saisie — ${TYPE_CONCERNEMENT_LABELS[sh.typeConcernement]}` : 'Auto-saisie motivee'}
                          >
                            Auto-saisie
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {sh.role === 'INITIATEUR' ? (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-teal/15 text-teal">Initiateur</span>
                      ) : lastFb ? (
                        <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', fbStyle?.bg)}>
                          {fbStyle?.icon} {lastFb.type.replace('_', ' ')}
                        </span>
                      ) : isWaiting ? (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-amber/15 text-amber">En attente</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {lastFb ? <span>{lastFb.auteurNom}</span> : sh.role === 'INITIATEUR' ? <span className="text-gray-500">Declarant</span> : <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {lastFb ? (
                        <span className="text-gray-500">{new Date(lastFb.dateAvis).toLocaleDateString('fr-FR')}</span>
                      ) : isWaiting && lastCo?.dateEcheance ? (
                        <span className="text-red-600 font-semibold">Echeance {new Date(lastCo.dateEcheance).toLocaleDateString('fr-FR')}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWithdraw(sh) && (
                          <button
                            onClick={() => setWithdrawTarget(sh)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded text-gray-600 hover:bg-gray-100 border border-gray-300"
                            title="Me retirer de ce cas d'usage"
                          >
                            <LogOut className="w-3 h-3" />
                            Me retirer
                          </button>
                        )}
                        {canEvict(sh) && (
                          <button
                            onClick={() => setEvictTarget(sh)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded text-red-700 hover:bg-red-50 border border-red-300"
                            title="Evincer cette partie prenante (Delivery Unit)"
                          >
                            <Gavel className="w-3 h-3" />
                            Evincer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section Retraits et evictions */}
        {inactifs.length > 0 && (
          <div className="border-t-2 border-gray-200">
            <div className="p-3 bg-gray-50">
              <div className="font-semibold text-navy text-xs uppercase tracking-wider">Retraits et evictions</div>
              <div className="text-[10px] text-gray-500">Historique trace des parties prenantes retirees</div>
            </div>
            <table className="min-w-full text-xs">
              <tbody className="divide-y divide-gray-100">
                {inactifs.map((sh: any) => (
                  <tr key={sh.id} className="bg-gray-50/50">
                    <td className="px-4 py-2 w-40">
                      <div className="font-semibold text-gray-600 line-through">{sh.institution?.code}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn('inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded border opacity-60', ROLE_BADGE_STYLES[sh.role])}>
                        {ROLE_LABELS[sh.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {sh.evictionParDU ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700">
                          <Gavel className="w-3 h-3" />
                          Evincee par la Delivery Unit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600">
                          <LogOut className="w-3 h-3" />
                          Retrait spontane
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-500 italic">
                      {sh.evictionMotif || sh.motifRetrait || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-right w-28">
                      {sh.dateRetrait ? new Date(sh.dateRetrait).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {withdrawTarget && (
        <WithdrawModal
          casUsageId={casUsageId}
          stakeholder={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onDone={() => { setWithdrawTarget(null); onChanged?.(); }}
        />
      )}
      {evictTarget && (
        <EvictModal
          casUsageId={casUsageId}
          stakeholder={evictTarget}
          onClose={() => setEvictTarget(null)}
          onDone={() => { setEvictTarget(null); onChanged?.(); }}
        />
      )}
    </>
  );
}

// ===========================================================================
// Modale : retrait spontane
// ===========================================================================
function WithdrawModal({ casUsageId, stakeholder, onClose, onDone }: {
  casUsageId: string; stakeholder: any; onClose: () => void; onDone: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [motif, setMotif] = useState('');

  const mut = useMutation({
    mutationFn: () => api.post(`/use-cases/${casUsageId}/stakeholders/${stakeholder.id}/withdraw`, {
      motifRetrait: motif.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', casUsageId] });
      qc.invalidateQueries({ queryKey: ['vue360-involved'] });
      qc.invalidateQueries({ queryKey: ['vue360-radar'] });
      toast({
        title: 'Retrait enregistre',
        description: 'Votre institution n\'est plus partie prenante de ce cas d\'usage. L\'initiateur en est informe.',
      });
      onDone();
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Echec du retrait', description: e?.response?.data?.error || 'Erreur' });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-w-[92vw]">
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <LogOut className="w-5 h-5 text-gray-600 shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-navy">Me retirer de ce cas d'usage</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stakeholder.institution?.code} · {ROLE_LABELS[stakeholder.role]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
            Ce retrait n'est possible que pour une auto-saisine <b>sans avis formel emis</b>.
            Il sera horodate et trace dans l'historique du cas d'usage. L'initiateur recevra une notification.
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Motif du retrait <span className="text-gray-400 font-normal normal-case">(facultatif)</span>
            </label>
            <textarea
              rows={3}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              placeholder="Ex : cas d'usage finalement hors de notre perimetre..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer le retrait
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Modale : eviction DU
// ===========================================================================
function EvictModal({ casUsageId, stakeholder, onClose, onDone }: {
  casUsageId: string; stakeholder: any; onClose: () => void; onDone: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [motif, setMotif] = useState('');
  const isValid = motif.trim().length >= 50;

  const mut = useMutation({
    mutationFn: () => api.delete(`/use-cases/${casUsageId}/stakeholders/${stakeholder.id}`, {
      data: { evictionMotif: motif.trim() },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', casUsageId] });
      toast({
        title: 'Eviction enregistree',
        description: `${stakeholder.institution?.code} a ete evincee. Une notification contradictoire lui est envoyee.`,
      });
      onDone();
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Echec de l\'eviction', description: e?.response?.data?.error || 'Erreur' });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[92vw]">
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <Gavel className="w-5 h-5 text-red-700 shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-700">Evincer cette partie prenante</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stakeholder.institution?.code} · {ROLE_LABELS[stakeholder.role]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Action reservee a la Delivery Unit. L'institution sera <b>definitivement retiree</b> du cas d'usage,
              ne pourra plus se reinscrire, et recevra une <b>notification contradictoire motivee</b>.
              L'eviction est tracee dans l'historique inaltere du cas d'usage.
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Motif de l'eviction <span className="text-red-500">*</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. 50 caracteres</span>
            </label>
            <textarea
              rows={5}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              placeholder="Exposer precisement le motif institutionnel justifiant l'eviction (absence de concernement etabli, hors perimetre, manoeuvre abusive, etc.)"
            />
            <div className={cn('text-right text-[10px] mt-1', motif.length < 50 ? 'text-red-500' : 'text-teal')}>
              {motif.length} / 50 caracteres
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={!isValid || mut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                isValid && !mut.isPending ? 'bg-red-700 hover:bg-red-800' : 'bg-gray-300 cursor-not-allowed',
              )}
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer l'eviction motivee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
