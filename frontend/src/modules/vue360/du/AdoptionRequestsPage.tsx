/**
 * File d'adoptions DU — /du/adoptions (admin only)
 *
 * Liste des AdoptionRequest :
 *   - Tab "En attente" : statut EN_ATTENTE, actions Valider / Refuser
 *   - Tab "Historique" : VALIDEE + REFUSEE, lecture seule
 *
 * API : GET /api/catalogue/adoption-requests (pas de /du/adoption-requests —
 * alias pas cree pour garder l'ensemble catalogue dans le meme module backend).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, Check, X, AlertTriangle, FileText, Clock } from 'lucide-react';

type Tab = 'EN_ATTENTE' | 'HISTORIQUE';

const MIN_MOTIF_REFUS = 50;

export function AdoptionRequestsPage() {
  const [tab, setTab] = useState<Tab>('EN_ATTENTE');
  const [refuseTarget, setRefuseTarget] = useState<any | null>(null);

  const { data: enAttente, isLoading: loadingEA } = useQuery({
    queryKey: ['adoption-requests', 'EN_ATTENTE'],
    queryFn: () => api.get('/catalogue/adoption-requests', { params: { status: 'EN_ATTENTE' } }).then((r: any) => r.data),
  });

  const { data: histValidees } = useQuery({
    queryKey: ['adoption-requests', 'VALIDEE'],
    queryFn: () => api.get('/catalogue/adoption-requests', { params: { status: 'VALIDEE' } }).then((r: any) => r.data),
    enabled: tab === 'HISTORIQUE',
  });
  const { data: histRefusees } = useQuery({
    queryKey: ['adoption-requests', 'REFUSEE'],
    queryFn: () => api.get('/catalogue/adoption-requests', { params: { status: 'REFUSEE' } }).then((r: any) => r.data),
    enabled: tab === 'HISTORIQUE',
  });

  const nbEA = (enAttente || []).length;
  const historique = [...(histValidees || []), ...(histRefusees || [])]
    .sort((a: any, b: any) => new Date(b.dateTraitement || b.dateDemande).getTime() - new Date(a.dateTraitement || a.dateDemande).getTime());

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Bandeau DU */}
      <div className="bg-navy text-white rounded-lg p-4 flex items-center gap-3">
        <div className="bg-gold text-navy px-2 py-1 rounded text-[10px] font-bold">VUE DU / SENUM</div>
        <div className="text-sm">File des demandes d'adoption par institutions non pressenties</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
        <button
          onClick={() => setTab('EN_ATTENTE')}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5',
            tab === 'EN_ATTENTE' ? 'bg-white shadow text-navy' : 'text-gray-600 hover:text-navy'
          )}
        >
          <Clock className="w-3 h-3" />
          En attente
          {nbEA > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {nbEA}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('HISTORIQUE')}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5',
            tab === 'HISTORIQUE' ? 'bg-white shadow text-navy' : 'text-gray-600 hover:text-navy'
          )}
        >
          <FileText className="w-3 h-3" />
          Historique
        </button>
      </div>

      {/* Contenu */}
      {tab === 'EN_ATTENTE' ? (
        loadingEA ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>
        ) : nbEA === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-10 text-center text-sm text-gray-400">
            Aucune demande d'adoption en attente.
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm divide-y divide-gray-100">
            {(enAttente || []).map((ar: any) => (
              <RequestLine key={ar.id} ar={ar} onRefuse={() => setRefuseTarget(ar)} />
            ))}
          </div>
        )
      ) : (
        historique.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-10 text-center text-sm text-gray-400">
            Aucune demande historisee.
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm divide-y divide-gray-100">
            {historique.map((ar: any) => (
              <HistoriqueLine key={ar.id} ar={ar} />
            ))}
          </div>
        )
      )}

      {refuseTarget && (
        <RefuseModal ar={refuseTarget} onClose={() => setRefuseTarget(null)} />
      )}
    </div>
  );
}

// ===========================================================================
// Ligne en attente
// ===========================================================================

function RequestLine({ ar, onRefuse }: { ar: any; onRefuse: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const valideMut = useMutation({
    mutationFn: () => api.post(`/catalogue/adoption-requests/${ar.id}/valider`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-requests'] });
      qc.invalidateQueries({ queryKey: ['catalogue'] });
      toast({ title: 'Adoption validee', description: `${ar.institutionDemandeuse?.code} devient initiatrice de ${ar.casUsage?.code}.` });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec validation' }),
  });

  const tronque = ar.motif && ar.motif.length > 150 && !expanded ? ar.motif.substring(0, 150) + '…' : ar.motif;

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              En attente
            </span>
            <span className="font-semibold text-navy text-sm">{ar.institutionDemandeuse?.code}</span>
            <span className="text-xs text-gray-500">— {ar.institutionDemandeuse?.nom}</span>
            <span className="text-[10px] text-gray-400 ml-auto">
              {new Date(ar.dateDemande).toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            Souhaite adopter{' '}
            <Link to={`/catalogue/propositions/${ar.casUsage?.id}`} className="font-mono font-bold text-teal hover:underline">
              {ar.casUsage?.code}
            </Link>
            {' '}— <span className="text-navy font-semibold">{ar.casUsage?.titre}</span>
          </div>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Motif</div>
            {tronque}
            {ar.motif && ar.motif.length > 150 && (
              <button onClick={() => setExpanded(!expanded)} className="text-teal underline ml-1 text-[11px]">
                {expanded ? 'moins' : 'plus'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onRefuse}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded text-red-700 border border-red-300 hover:bg-red-50"
        >
          <X className="w-3 h-3" />
          Refuser
        </button>
        <button
          onClick={() => valideMut.mutate()}
          disabled={valideMut.isPending}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded bg-teal text-white hover:bg-teal/90 disabled:opacity-50"
        >
          {valideMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          <Check className="w-3 h-3" />
          Valider l'adoption
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Ligne historique
// ===========================================================================

function HistoriqueLine({ ar }: { ar: any }) {
  const isValidee = ar.status === 'VALIDEE';
  return (
    <div className="p-3 text-xs flex items-start gap-3 flex-wrap">
      <span className={cn(
        'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded',
        isValidee ? 'bg-teal/10 text-teal border border-teal/30' : 'bg-red-50 text-red-700 border border-red-200'
      )}>
        {isValidee ? 'Validee' : 'Refusee'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-navy">{ar.institutionDemandeuse?.code}</span>
          <span className="text-gray-500">→</span>
          <Link to={`/catalogue/propositions/${ar.casUsage?.id}`} className="font-mono font-bold text-gray-600 hover:text-teal">
            {ar.casUsage?.code}
          </Link>
          <span className="text-gray-500 truncate">{ar.casUsage?.titre}</span>
          <span className="text-[10px] text-gray-400 ml-auto">
            {ar.dateTraitement ? new Date(ar.dateTraitement).toLocaleDateString('fr-FR') : '—'}
          </span>
        </div>
        {!isValidee && ar.motifTraitement && (
          <div className="text-[11px] text-red-700 italic mt-1">
            Motif refus : {ar.motifTraitement}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Modal refus
// ===========================================================================

function RefuseModal({ ar, onClose }: { ar: any; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [motif, setMotif] = useState('');
  const isValid = motif.trim().length >= MIN_MOTIF_REFUS;

  const mut = useMutation({
    mutationFn: () => api.post(`/catalogue/adoption-requests/${ar.id}/refuser`, { motif: motif.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adoption-requests'] });
      toast({ title: 'Demande refusee', description: `${ar.institutionDemandeuse?.code} a ete notifiee du refus.` });
      onClose();
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec' }),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[92vw]">
        <div className="p-5 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-700">Refuser la demande d'adoption</h3>
            <p className="text-xs text-gray-500 mt-0.5">{ar.institutionDemandeuse?.code} → {ar.casUsage?.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Le refus sera notifie a l'institution demandeuse avec le motif que vous saisissez.
              La proposition reste en catalogue, potentiellement adoptable par une autre institution.
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
              Motif du refus <span className="text-red-500">*</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case"> · min. {MIN_MOTIF_REFUS} caracteres</span>
            </label>
            <textarea
              rows={5}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              placeholder="Explication precise du refus (perimetre institutionnel incoherent, doublon avec demande existante, attente de cadrage strategique, etc.)"
            />
            <div className={cn('text-right text-[10px] mt-1', motif.length < MIN_MOTIF_REFUS ? 'text-red-500' : 'text-teal')}>
              {motif.length} / {MIN_MOTIF_REFUS} caracteres
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">Annuler</button>
            <button
              onClick={() => mut.mutate()}
              disabled={!isValid || mut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                isValid && !mut.isPending ? 'bg-red-700 hover:bg-red-800' : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer le refus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
