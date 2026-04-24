/**
 * Bloc relations metier <-> technique (P9)
 *
 * - Si CU METIER : liste les services techniques mobilises (avec ordre,
 *   obligatoire/conditionnel, statut de disponibilite, bouton Ajouter/Retirer)
 * - Si CU TECHNIQUE : liste les parcours metier servis + badge criticite
 *   calcule par l'API (SPECIFIQUE/MUTUALISE/CRITIQUE/HYPER_CRITIQUE)
 *
 * Source : GET /api/use-cases/:id/relations
 * Mutations : POST (ajout), DELETE (retrait)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Cog, Users, Plus, Trash2, Link2, Loader2, X } from 'lucide-react';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { VUE360_STATUT_COLORS } from './constants';

interface Props {
  cu: any;
}

const CRITICITE_BADGE: Record<string, { bg: string; label: string }> = {
  SPECIFIQUE:      { bg: 'bg-gray-100 text-gray-600 border border-gray-300',        label: 'Usage specifique' },
  MUTUALISE:       { bg: 'bg-teal/10 text-teal border border-teal/30',              label: 'Service mutualise' },
  CRITIQUE:        { bg: 'bg-amber-50 text-amber-700 border border-amber-200',      label: 'Service critique' },
  HYPER_CRITIQUE:  { bg: 'bg-red-50 text-red-700 border border-red-200',            label: 'Hyper-critique' },
};

export function RelationsBlock({ cu }: Props) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const isMetier = cu.typologie === 'METIER';
  const isAdmin = user?.role === 'ADMIN';
  const isInitiateur = (cu.stakeholders360 || []).some(
    (s: any) => s.institutionId === user?.institutionId && s.role === 'INITIATEUR' && s.actif
  );
  const canManage = isMetier && (isAdmin || isInitiateur);

  const { data, isLoading } = useQuery({
    queryKey: ['use-case-relations', cu.id],
    queryFn: () => api.get(`/use-cases/${cu.id}/relations`).then((r: any) => r.data),
  });

  const delMut = useMutation({
    mutationFn: (relationId: string) => api.delete(`/use-cases/${cu.id}/relations/${relationId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['use-case-relations', cu.id] });
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', cu.id] });
      toast({ title: 'Relation retiree' });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec' }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-teal mx-auto" />
      </div>
    );
  }

  const relations = data?.relations || [];

  if (isMetier) {
    return (
      <>
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Cog className="w-4 h-4 text-teal" />
            <div className="font-bold text-navy text-sm">Services techniques mobilises</div>
            <span className="text-[10px] text-gray-500">
              ({relations.length})
            </span>
            {canManage && (
              <button
                onClick={() => setShowAdd(true)}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-teal/10 text-teal hover:bg-teal/20"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            )}
          </div>
          {relations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 italic">
              Aucun service technique mobilise pour ce parcours.
              {canManage && ' Utilisez "Ajouter" pour construire le parcours.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {relations.map((rel: any, idx: number) => {
                const tech = rel.casUsageTechnique;
                const statusBadge = VUE360_STATUT_COLORS[tech?.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;
                return (
                  <div key={rel.id} className="p-3 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 w-5">{rel.ordre ?? idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/admin/cas-usage/${tech?.id}`}
                          className="font-mono font-bold text-gray-600 hover:text-teal text-xs"
                        >
                          {tech?.code}
                        </Link>
                        <Link
                          to={`/admin/cas-usage/${tech?.id}`}
                          className="text-sm text-navy font-semibold hover:underline truncate"
                        >
                          {tech?.titre}
                        </Link>
                        {!rel.obligatoire && (
                          <span className="inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            Conditionnel
                          </span>
                        )}
                        <span className={cn('inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded ml-auto', statusBadge.chip)}>
                          {statusBadge.label}
                        </span>
                      </div>
                      {tech?.institutionSourceCode && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Detenu par <b>{tech.institutionSourceCode}</b>
                        </div>
                      )}
                      {rel.commentaire && (
                        <div className="text-[10px] text-gray-500 italic mt-0.5">{rel.commentaire}</div>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => { if (confirm('Retirer ce service technique ?')) delMut.mutate(rel.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        title="Retirer ce service technique"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Indicateur global de disponibilite */}
          {relations.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-600">
              {(() => {
                const enProd = relations.filter((r: any) => r.casUsageTechnique?.statutVueSection === 'EN_PRODUCTION_360').length;
                return <><b>{enProd}</b> service{enProd > 1 ? 's' : ''} technique{enProd > 1 ? 's' : ''} sur <b>{relations.length}</b> {enProd > 1 ? 'sont disponibles' : 'est disponible'} en production.</>;
              })()}
            </div>
          )}
        </div>

        {showAdd && canManage && (
          <AddTechniqueModal cu={cu} existingIds={relations.map((r: any) => r.casUsageTechnique?.id)} onClose={() => setShowAdd(false)} />
        )}
      </>
    );
  }

  // TECHNIQUE : parcours metier servis
  const criticite = data?.criticite || 'SPECIFIQUE';
  const critBadge = CRITICITE_BADGE[criticite];

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-navy" />
        <div className="font-bold text-navy text-sm">Parcours metier servis</div>
        <span className="text-[10px] text-gray-500">
          ({relations.length})
        </span>
        <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ml-auto', critBadge.bg)}>
          <Link2 className="w-2.5 h-2.5 mr-1" />
          {critBadge.label}
        </span>
      </div>
      {relations.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400 italic">
          Aucun parcours metier ne mobilise actuellement ce service technique.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {relations.map((rel: any) => {
            const metier = rel.casUsageMetier;
            const statusBadge = VUE360_STATUT_COLORS[metier?.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;
            return (
              <div key={rel.id} className="p-3 flex items-center gap-2 flex-wrap">
                <Link
                  to={`/admin/cas-usage/${metier?.id}`}
                  className="font-mono font-bold text-gray-600 hover:text-teal text-xs"
                >
                  {metier?.code}
                </Link>
                <Link
                  to={`/admin/cas-usage/${metier?.id}`}
                  className="text-sm text-navy font-semibold hover:underline flex-1"
                >
                  {metier?.titre}
                </Link>
                {metier?.institutionSourceCode && (
                  <span className="text-[10px] text-gray-500">
                    Porte par <b>{metier.institutionSourceCode}</b>
                  </span>
                )}
                <span className={cn('inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded', statusBadge.chip)}>
                  {statusBadge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Modale d'ajout d'un service technique (metier seulement)
// ===========================================================================

function AddTechniqueModal({ cu, existingIds, onClose }: {
  cu: any; existingIds: string[]; onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [csvSelection, setCsvSelection] = useState('');

  const { data: techniquesData } = useQuery({
    queryKey: ['all-techniques-for-add'],
    queryFn: () => api.get('/use-cases/catalog', {
      params: { typologie: 'TECHNIQUE', limit: 200 },
    }).then((r: any) => r.data),
  });

  const options = ((techniquesData?.data || []) as any[])
    .filter((t: any) => !existingIds.includes(t.id))
    .map((t: any) => ({
      value: t.id,
      label: `${t.code} — ${t.titre}`,
      sublabel: t.institutionSourceCode,
    }));

  const ids = csvSelection ? csvSelection.split(',').map(s => s.trim()).filter(Boolean) : [];

  const mut = useMutation({
    mutationFn: async () => {
      for (const id of ids) {
        await api.post(`/use-cases/${cu.id}/relations`, {
          casUsageTechniqueId: id,
          obligatoire: true,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['use-case-relations', cu.id] });
      toast({ title: 'Relations ajoutees', description: `${ids.length} service(s) technique(s) relie(s).` });
      onClose();
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec' }),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[92vw]">
        <div className="p-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy">Ajouter des services techniques</h3>
            <p className="text-xs text-gray-500 mt-0.5">a mobiliser pour {cu.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <MultiSearchableSelect
            options={options}
            value={csvSelection}
            onChange={setCsvSelection}
            placeholder="Rechercher et selectionner des services techniques..."
          />
          <div className="text-[11px] text-gray-500">
            {ids.length} service(s) selectionne(s). Chacun sera marque obligatoire par defaut.
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">Annuler</button>
            <button
              onClick={() => mut.mutate()}
              disabled={ids.length === 0 || mut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                ids.length > 0 && !mut.isPending ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {mut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
