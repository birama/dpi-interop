/**
 * Page liste filtree par typologie (P9)
 * - /catalogue/parcours-metier  -> typologie=METIER
 * - /catalogue/services-techniques -> typologie=TECHNIQUE
 *
 * Reutilise /api/use-cases/catalog?typologie=... et affiche des cartes
 * adaptees selon la typologie :
 * - METIER : indicateur de disponibilite des services techniques
 * - TECHNIQUE : indicateur de mutualisation (nb parcours metier servis)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Loader2, Search, Users, Cog, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VUE360_STATUT_COLORS } from '../constants';

interface Props {
  typologie: 'METIER' | 'TECHNIQUE';
}

const CRITICITE_BADGE: Record<string, { bg: string; label: string }> = {
  SPECIFIQUE:     { bg: 'bg-gray-100 text-gray-600 border border-gray-300',        label: 'Usage specifique' },
  MUTUALISE:      { bg: 'bg-teal/10 text-teal border border-teal/30',              label: 'Mutualise' },
  CRITIQUE:       { bg: 'bg-amber-50 text-amber-700 border border-amber-200',      label: 'Critique' },
  HYPER_CRITIQUE: { bg: 'bg-red-50 text-red-700 border border-red-200',            label: 'Hyper-critique' },
};

function critByCount(n: number): keyof typeof CRITICITE_BADGE {
  if (n >= 10) return 'HYPER_CRITIQUE';
  if (n >= 5) return 'CRITIQUE';
  if (n >= 2) return 'MUTUALISE';
  return 'SPECIFIQUE';
}

export function TypologieListPage({ typologie }: Props) {
  const [q, setQ] = useState('');
  const isMetier = typologie === 'METIER';

  const { data, isLoading } = useQuery({
    queryKey: ['typologie-list', typologie, q],
    queryFn: () => api.get('/use-cases/catalog', {
      params: { typologie, search: q || undefined, limit: 50 },
    }).then((r: any) => r.data),
    placeholderData: (prev: any) => prev,
  });

  const items = (data?.data || []) as any[];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy flex items-center gap-2">
              {isMetier ? <Users className="w-5 h-5 text-navy" /> : <Cog className="w-5 h-5 text-teal" />}
              {isMetier ? 'Parcours metier' : 'Services techniques'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isMetier
                ? 'Services multi-administrations rendus au beneficiaire final, coordonnes par une institution porteuse.'
                : 'Echanges bilateraux entre systemes, reutilisables par plusieurs parcours metier.'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal">{items.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              {isMetier ? 'parcours' : 'services'} en pipeline
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Rechercher un ${isMetier ? 'parcours metier' : 'service technique'}...`}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-teal focus:ring-1 focus:ring-teal outline-none"
          />
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border shadow-sm p-10 text-center text-sm text-gray-400">
          Aucun {isMetier ? 'parcours metier' : 'service technique'} actif.
          {isMetier && ' Les CU METIER sont crees via le formulaire de declaration ou par reclassement DU.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm divide-y divide-gray-100">
          {items.map((cu: any) => <CasUsageLine key={cu.id} cu={cu} typologie={typologie} />)}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Ligne de liste — rendu different selon typologie
// ===========================================================================

function CasUsageLine({ cu, typologie }: { cu: any; typologie: 'METIER' | 'TECHNIQUE' }) {
  const statusBadge = VUE360_STATUT_COLORS[cu.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;
  const isMetier = typologie === 'METIER';

  // Pour METIER : indicateur de disponibilite via /relations
  // Pour TECHNIQUE : criticite calculee idem
  const { data: relData } = useQuery({
    queryKey: ['rel-indicator', cu.id],
    queryFn: () => api.get(`/use-cases/${cu.id}/relations`).then((r: any) => r.data),
    staleTime: 60000,
  });

  const relations = relData?.relations || [];
  const total = relations.length;
  const disponibles = isMetier
    ? relations.filter((r: any) => r.casUsageTechnique?.statutVueSection === 'EN_PRODUCTION_360').length
    : 0;
  const critKey = !isMetier ? critByCount(relations.length) : null;
  const critBadge = critKey ? CRITICITE_BADGE[critKey] : null;

  return (
    <Link to={`/admin/cas-usage/${cu.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {cu.code}
            </span>
            <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', statusBadge.chip)}>
              {statusBadge.label}
            </span>
            {!isMetier && critBadge && total > 0 && (
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ml-auto', critBadge.bg)}>
                <Link2 className="w-2.5 h-2.5" />
                {critBadge.label} · {total} parcours
              </span>
            )}
            {isMetier && total > 0 && (
              <span className={cn(
                'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ml-auto',
                disponibles === total ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              )}>
                {disponibles}/{total} services disponibles
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-navy">{cu.titre}</div>
          {cu.resumeMetier && (
            <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{cu.resumeMetier}</div>
          )}
          {cu.institutionSourceCode && (
            <div className="text-[10px] text-gray-500 mt-1">
              {isMetier ? 'Coordonnateur' : 'Detenteur'} : <b>{cu.institutionSourceCode}</b>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ===========================================================================
// Wrappers
// ===========================================================================

export function ParcoursMetierPage() {
  return <TypologieListPage typologie="METIER" />;
}

export function ServicesTechniquesPage() {
  return <TypologieListPage typologie="TECHNIQUE" />;
}
