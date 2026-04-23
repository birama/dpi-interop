import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { VUE360_STATUT_COLORS, ROLE_BADGE_STYLES, ROLE_LABELS, daysUntil } from './constants';

export function SollicitationsBlock() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vue360-incoming'],
    queryFn: () => api.get('/me/use-cases/incoming').then(r => r.data),
    retry: 1,
  });

  if (isLoading) return <Card className="border-l-4 border-amber"><CardContent className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-amber mx-auto" /></CardContent></Card>;

  const items = data || [];
  if (items.length === 0 && !error) return null;

  return (
    <Card className="border-l-4 border-amber">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="font-bold text-navy flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber" />
            Sollicitations en attente de mon avis
          </div>
          <div className="text-xs text-gray-500">{items.length} cas d'usage ou mon institution doit se prononcer</div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item: any) => {
          const cu = item.casUsage;
          const co = item.consultation;
          const days = co?.dateEcheance ? daysUntil(co.dateEcheance) : null;
          const sc = VUE360_STATUT_COLORS[cu.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;
          const roleBadge = ROLE_BADGE_STYLES[item.stakeholder.role] || '';

          return (
            <div key={cu.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{cu.code}</span>
                    <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', sc.chip)}>{sc.label}</span>
                    <span className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border', roleBadge)}>{ROLE_LABELS[item.stakeholder.role]}</span>
                    {days !== null && (
                      <span className={cn('text-[10px] font-bold', days <= 3 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-gray-500')}>
                        {days <= 0 ? 'Echu !' : `echeance J+${days}`}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-navy text-sm">{cu.titre}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Initiateur : <b>{cu.institutionSourceCode}</b>
                    {cu.resumeMetier && <span className="text-gray-500 ml-1">— {cu.resumeMetier.substring(0, 100)}...</span>}
                  </div>
                </div>
                <Link
                  to={`/admin/cas-usage/${cu.id}?action=give-feedback${co ? '&consultationId=' + co.id : ''}`}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors',
                    days !== null && days <= 3 ? 'bg-amber text-white hover:bg-amber/90' : 'bg-teal text-white hover:bg-teal/90'
                  )}
                >
                  Donner mon avis
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
