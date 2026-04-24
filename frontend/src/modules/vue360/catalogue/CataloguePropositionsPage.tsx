import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Loader2, Search, FolderOpen, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import {
  TYPOLOGIE_BADGE, MATURITE_BADGE, SOURCE_LABELS,
} from './constants';

export function CataloguePropositionsPage() {
  const { user } = useAuthStore();
  const [q, setQ] = useState('');
  const [typologie, setTypologie] = useState<'ALL' | 'METIER' | 'TECHNIQUE'>('ALL');
  const [niveau, setNiveau] = useState<string>('');
  const [page, setPage] = useState(1);

  // Debounce de la recherche (R4)
  const [debouncedQ, setDebouncedQ] = useState('');
  useMemo(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ['catalogue', debouncedQ, typologie, niveau, page],
    queryFn: () => api.get('/catalogue/propositions', {
      params: {
        q: debouncedQ || undefined,
        typologie: typologie === 'ALL' ? undefined : typologie,
        niveauMaturite: niveau || undefined,
        page, pageSize: 12,
      },
    }).then((r: any) => r.data),
    placeholderData: (prev: any) => prev,
  });

  const items = data?.data || [];
  const total = data?.pagination?.total || 0;
  const hasMore = data?.pagination?.hasMore || false;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-teal" />
              Catalogue des propositions
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Propositions identifiees par la Delivery Unit, disponibles pour adoption par une administration.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal">{total}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Propositions disponibles</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Titre, code, resume..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-teal focus:ring-1 focus:ring-teal outline-none"
              />
            </div>
          </div>

          {/* Tabs typologie */}
          <div className="flex gap-1 bg-gray-100 rounded-md p-1">
            {(['ALL', 'METIER', 'TECHNIQUE'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTypologie(t); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded transition-colors',
                  typologie === t ? 'bg-white shadow text-navy' : 'text-gray-600 hover:text-navy'
                )}
              >
                {t === 'ALL' ? 'Toutes' : t === 'METIER' ? 'Parcours metier' : 'Services techniques'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Maturite
            </label>
            <select
              value={niveau}
              onChange={e => { setNiveau(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-md px-2 py-2 focus:border-teal outline-none"
            >
              <option value="">Toutes</option>
              <option value="ESQUISSE">Esquisse</option>
              <option value="PRE_CADREE">Pre-cadree</option>
              <option value="PRETE_A_ADOPTER">Prete a adopter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille de cartes */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-teal" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border shadow-sm p-10 text-center text-sm text-gray-400">
          Aucune proposition ne correspond aux filtres.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p: any) => (
            <PropositionCard key={p.id} proposition={p} userInstitutionId={user?.institutionId} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            Precedent
          </button>
          <span className="text-xs text-gray-500">Page {page}</span>
          <button
            disabled={!hasMore}
            onClick={() => setPage(p => p + 1)}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

function PropositionCard({ proposition, userInstitutionId }: { proposition: any; userInstitutionId?: string }) {
  const typoBadge = TYPOLOGIE_BADGE[proposition.typologie] || TYPOLOGIE_BADGE.TECHNIQUE;
  const matBadge = proposition.niveauMaturite ? MATURITE_BADGE[proposition.niveauMaturite] : null;
  const sourceLabel = proposition.sourceProposition ? SOURCE_LABELS[proposition.sourceProposition] : null;
  const isPressentie = proposition.institutionsPressenties?.some(
    (ip: any) => ip.institutionId === userInstitutionId
  );
  const resume = proposition.resumeMetier || '';
  const resumeTronque = resume.length > 200 ? resume.substring(0, 200) + '…' : resume;

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {proposition.code}
            </span>
            <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', typoBadge.bg)}>
              {typoBadge.label}
            </span>
            {matBadge && (
              <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', matBadge.bg)}>
                {matBadge.label}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-navy mt-1.5 line-clamp-2">{proposition.titre}</h3>
        </div>
      </div>

      {resumeTronque && (
        <p className="text-xs text-gray-600 line-clamp-3">{resumeTronque}</p>
      )}

      {sourceLabel && (
        <div className="text-[10px] text-gray-500">
          <span className="uppercase tracking-wider">Source :</span> <b className="text-gray-700">{sourceLabel}</b>
        </div>
      )}

      {proposition.institutionsPressenties && proposition.institutionsPressenties.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Institutions pressenties
          </div>
          <div className="flex flex-wrap gap-1">
            {proposition.institutionsPressenties.slice(0, 5).map((ip: any) => (
              <span
                key={ip.id}
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                  ip.institutionId === userInstitutionId
                    ? 'border-teal text-teal bg-teal/5'
                    : 'border-gray-300 text-gray-600 bg-gray-50'
                )}
              >
                <Building2 className="w-2.5 h-2.5" />
                {ip.institution?.code}
              </span>
            ))}
            {proposition.institutionsPressenties.length > 5 && (
              <span className="text-[10px] text-gray-400">+{proposition.institutionsPressenties.length - 5}</span>
            )}
          </div>
        </div>
      )}

      {proposition.registresAssocies && proposition.registresAssocies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {proposition.registresAssocies.slice(0, 3).map((ra: any) => (
            <span
              key={ra.id}
              className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
            >
              {ra.registre?.code}
            </span>
          ))}
          {proposition.registresAssocies.length > 3 && (
            <span className="text-[9px] text-gray-400">+{proposition.registresAssocies.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-gray-100 flex items-center gap-2">
        <Link
          to={`/catalogue/propositions/${proposition.id}`}
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md flex-1 justify-center',
            isPressentie
              ? 'bg-teal text-white hover:bg-teal/90'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {isPressentie ? 'Adopter' : 'Voir details'}
        </Link>
      </div>
    </div>
  );
}
