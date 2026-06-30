import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Coins, Loader2, ExternalLink, Inbox } from 'lucide-react';

const STATUT_META: Record<string, { label: string; cls: string }> = {
  DRAFT:         { label: 'Brouillon',     cls: 'bg-gray-100 text-gray-700 border-gray-300' },
  EN_VALIDATION: { label: 'En validation', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  PUBLIE:        { label: 'Publiée',       cls: 'bg-teal/15 text-teal-800 border-teal/40' },
  REJETE:        { label: 'Refusée',       cls: 'bg-red-100 text-red-700 border-red-300' },
  RETIRE:        { label: 'Retirée',       cls: 'bg-gray-100 text-gray-500 border-gray-300' },
};

/**
 * Bloc admin "Manifestations PTF" affiché sur la Vue 360° d'un cas.
 * Liste les manifestations déposées par les PTF sur ce cas spécifique.
 */
export function ManifestationsPtfBlock({ casUsageId }: { casUsageId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['vue360-manifestations', casUsageId],
    queryFn: () => api.get(`/admin/manifestations?casUsageId=${casUsageId}&pageSize=50`).then((r) => r.data),
    enabled: !!casUsageId,
  });

  const items: any[] = data?.data || [];

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-gold" />
          <div className="font-bold text-navy">Manifestations PTF sur ce cas ({items.length})</div>
        </div>
        <Link to={`/admin/manifestations?casUsageId=${casUsageId}`}>
          <Button variant="outline" size="sm" className="text-xs">
            Voir dans la file globale <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-teal-700" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-3">
          Aucune manifestation déposée sur ce cas pour l'instant.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b text-xs text-gray-500">
              <tr className="text-left">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">PTF</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2">Montant</th>
                <th className="py-2 px-2">Statut</th>
                <th className="py-2 px-2 text-right">Fiche PTF</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m: any) => {
                const meta = STATUT_META[m.statut] || { label: m.statut, cls: '' };
                return (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="py-2 px-2 text-xs text-gray-700">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      <Link to={`/admin/ptf/${m.user?.id}`} className="font-medium text-navy hover:underline">
                        {m.ptf?.code} — {m.ptf?.nom}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {m.type === 'FINANCEMENT' ? (
                        <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                          <Coins className="w-3 h-3 mr-1" /> Financement
                        </Badge>
                      ) : (
                        <Badge variant="outline">Intérêt</Badge>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {m.type === 'FINANCEMENT' && m.montantEstime != null
                        ? `${Number(m.montantEstime).toLocaleString('fr-FR')} ${m.devise}`
                        : '—'}
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className={`${meta.cls} text-[11px]`}>{meta.label}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Link to={`/admin/ptf/${m.user?.id}`} className="text-xs text-teal-700 hover:underline">
                        Voir fiche →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
