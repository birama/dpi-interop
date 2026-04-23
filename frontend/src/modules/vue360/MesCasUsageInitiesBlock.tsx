import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { VUE360_STATUT_COLORS, FEEDBACK_TYPE_STYLES } from './constants';

export function MesCasUsageInitiesBlock() {
  const { data, isLoading } = useQuery({
    queryKey: ['vue360-outgoing'],
    queryFn: () => api.get('/me/use-cases/outgoing').then(r => r.data),
    retry: 1,
  });

  if (isLoading) return <Card className="border-l-4 border-navy"><CardContent className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-navy mx-auto" /></CardContent></Card>;

  const items = data || [];

  return (
    <Card className="border-l-4 border-navy">
      <div className="p-4 border-b border-gray-100">
        <div className="font-bold text-navy flex items-center gap-2">
          <Zap className="w-4 h-4 text-navy" />
          Mes cas d'usage inities
        </div>
        <div className="text-xs text-gray-500">{items.length} cas d'usage declares par mon institution</div>
      </div>
      <div className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="p-4 text-xs text-gray-400 italic text-center">Aucun cas d'usage initie par votre institution</div>
        ) : (
          items.slice(0, 5).map((item: any) => {
            const cu = item.casUsage;
            const stats = item.consultationsStats;
            const sc = VUE360_STATUT_COLORS[cu.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;

            return (
              <div key={cu.id} className="p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{cu.code}</span>
                  <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', sc.chip)}>{sc.label}</span>
                </div>
                <div className="font-semibold text-navy text-sm">{cu.titre}</div>

                {/* Barre statut consultations */}
                {stats.total > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                    <span className="text-gray-500">Avis :</span>
                    {cu.stakeholders360?.filter((s: any) => s.role !== 'INITIATEUR').map((sh: any) => {
                      const lastFb = sh.consultations?.[0]?.feedbacks?.[0];
                      const fbStyle = lastFb ? FEEDBACK_TYPE_STYLES[lastFb.type] : null;
                      const coStatus = sh.consultations?.[0]?.status;

                      return (
                        <span key={sh.id} className={cn(
                          'px-1.5 py-0.5 rounded font-semibold',
                          fbStyle ? fbStyle.bg : coStatus === 'EN_ATTENTE' ? 'bg-amber/15 text-amber' : 'bg-gray-100 text-gray-500'
                        )}>
                          {sh.institution?.code} {fbStyle ? fbStyle.icon : coStatus === 'EN_ATTENTE' ? '⏳' : '—'}
                        </span>
                      );
                    })}
                  </div>
                )}

                {stats.total === 0 && (
                  <div className="text-[11px] text-gray-500 mt-1">Aucune consultation ouverte</div>
                )}

                <Link to={`/admin/cas-usage/${cu.id}`} className="inline-flex items-center gap-1 text-teal text-[11px] font-semibold mt-1 hover:underline">
                  Voir details →
                </Link>
              </div>
            );
          })
        )}
      </div>
      <div className="p-3 text-center border-t border-gray-100">
        <Link to="/admin/roadmap" className="inline-flex items-center gap-1 text-teal text-xs font-semibold hover:underline">
          + Declarer un nouveau cas d'usage
        </Link>
      </div>
    </Card>
  );
}
