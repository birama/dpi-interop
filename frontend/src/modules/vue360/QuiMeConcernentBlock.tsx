import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { VUE360_STATUT_COLORS, ROLE_BADGE_STYLES, ROLE_LABELS, formatTimeAgo } from './constants';

const ROLE_FILTERS = ['Tous', 'INITIATEUR', 'FOURNISSEUR', 'CONSOMMATEUR', 'PARTIE_PRENANTE'];

export function QuiMeConcernentBlock() {
  const [roleFilter, setRoleFilter] = useState('Tous');

  const { data, isLoading } = useQuery({
    queryKey: ['vue360-involved'],
    queryFn: () => api.get('/me/use-cases/involved').then(r => r.data),
    retry: 1,
  });

  if (isLoading) return <Card className="border-l-4 border-gold"><div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" /></div></Card>;

  const allItems = data?.data || [];

  // Filtrage par role cote client
  const items = roleFilter === 'Tous'
    ? allItems
    : allItems.filter((cu: any) => cu.myRoles?.includes(roleFilter));

  // Compteurs par role
  const roleCounts: Record<string, number> = {};
  for (const cu of allItems) {
    for (const role of (cu.myRoles || [])) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  }

  return (
    <Card className="border-l-4 border-gold">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-bold text-navy flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-gold" />
            Cas d'usage qui me concernent <span className="text-gray-400 font-normal">({allItems.length})</span>
          </div>
          <div className="text-xs text-gray-500">Vue exhaustive — tous roles, tous stades</div>
        </div>
        <div className="flex gap-1 text-xs flex-wrap">
          {ROLE_FILTERS.map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                'px-2 py-1 rounded transition-colors',
                roleFilter === role ? 'bg-navy text-white' : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              {role === 'Tous' ? 'Tous' : ROLE_LABELS[role]} {role !== 'Tous' && `(${roleCounts[role] || 0})`}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2 font-semibold">Ref</th>
              <th className="px-4 py-2 font-semibold">Titre</th>
              <th className="px-4 py-2 font-semibold">Role</th>
              <th className="px-4 py-2 font-semibold">Partenaires</th>
              <th className="px-4 py-2 font-semibold">Statut</th>
              <th className="px-4 py-2 font-semibold">Derniere MAJ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs">Aucun cas d'usage pour ce filtre</td></tr>
            ) : (
              items.map((cu: any) => {
                const sc = VUE360_STATUT_COLORS[cu.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;
                const partners = cu.stakeholders360
                  ?.filter((s: any) => s.institution)
                  .map((s: any) => s.institution.code)
                  .filter((c: string, i: number, arr: string[]) => arr.indexOf(c) === i)
                  .join(', ');

                return (
                  <tr key={cu.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {}}>
                    <td className="px-4 py-2">
                      <Link to={`/admin/cas-usage/${cu.id}`} className="font-mono text-[11px] text-teal hover:underline">{cu.code}</Link>
                    </td>
                    <td className="px-4 py-2 font-medium text-navy">
                      <Link to={`/admin/cas-usage/${cu.id}`} className="hover:underline">{cu.titre}</Link>
                    </td>
                    <td className="px-4 py-2">
                      {(cu.myRoles || []).map((role: string) => (
                        <span key={role} className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border mr-1', ROLE_BADGE_STYLES[role])}>
                          {ROLE_LABELS[role]}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-gray-600">{partners || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', sc.chip)}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-gray-500">{formatTimeAgo(cu.updatedAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {allItems.length > items.length && (
        <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-100">
          {allItems.length - items.length} autres cas d'usage masques par le filtre
        </div>
      )}
    </Card>
  );
}
