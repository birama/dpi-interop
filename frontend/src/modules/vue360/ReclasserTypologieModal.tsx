/**
 * Modale de reclassement typologique (P9 — DU only)
 *
 * PATCH /api/use-cases/:id/typologie avec motif obligatoire min 50 car.
 * Tracee append-only dans reclassementsTypologie JSON cote backend.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  cu: any;
  onClose: () => void;
}

const MIN_MOTIF = 50;

export function ReclasserTypologieModal({ cu, onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const nouvelle = cu.typologie === 'METIER' ? 'TECHNIQUE' : 'METIER';
  const [motif, setMotif] = useState('');

  const isValid = motif.trim().length >= MIN_MOTIF;

  const mut = useMutation({
    mutationFn: () => api.patch(`/use-cases/${cu.id}/typologie`, {
      typologie: nouvelle,
      motif: motif.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', cu.id] });
      qc.invalidateQueries({ queryKey: ['use-case-relations', cu.id] });
      qc.invalidateQueries({ queryKey: ['du-arbitrage'] });
      toast({
        title: 'Typologie reclassee',
        description: `${cu.code} est desormais ${nouvelle === 'METIER' ? 'un parcours metier' : 'un service technique'}.`,
      });
      onClose();
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec du reclassement' });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[92vw]">
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-navy">Reclasser la typologie</h3>
            <p className="text-xs text-gray-500 mt-0.5">{cu.code} — {cu.titre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Transition visuelle */}
          <div className="flex items-center justify-center gap-3 py-2">
            <span className={cn(
              'px-3 py-1.5 rounded text-xs font-bold',
              cu.typologie === 'METIER' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal'
            )}>
              {cu.typologie === 'METIER' ? 'Parcours metier' : 'Service technique'}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className={cn(
              'px-3 py-1.5 rounded text-xs font-bold ring-2',
              nouvelle === 'METIER' ? 'bg-navy/10 text-navy ring-navy/50' : 'bg-teal/10 text-teal ring-teal/50'
            )}>
              {nouvelle === 'METIER' ? 'Parcours metier' : 'Service technique'}
            </span>
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Ce reclassement est un <b>acte d'autorite de la Delivery Unit</b>. Il est trace
              dans l'historique inalterable avec votre motif. L'initiateur sera notifie.
              {nouvelle === 'METIER' && ' Les relations existantes (techniques mobilises) seront preservees.'}
              {nouvelle === 'TECHNIQUE' && ' Attention : les relations sortantes (techniques mobilises) ne seront plus coherentes et devront etre supprimees manuellement.'}
            </div>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Motif du reclassement <span className="text-red-500">*</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. {MIN_MOTIF} caracteres</span>
            </label>
            <textarea
              rows={4}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              placeholder="Expliquez pourquoi ce cas d'usage est reclasse : analyse de la mission, clarification du perimetre, retour d'experience..."
            />
            <div className={cn('text-right text-[10px] mt-1', motif.length < MIN_MOTIF ? 'text-red-500' : 'text-teal')}>
              {motif.length} / {MIN_MOTIF} caracteres
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={!isValid || mut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                isValid && !mut.isPending ? 'bg-navy hover:bg-navy/90' : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer le reclassement motive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
