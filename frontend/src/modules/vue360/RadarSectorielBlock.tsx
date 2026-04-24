import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { VUE360_STATUT_COLORS } from './constants';
import { AutoSaisineModal } from './AutoSaisineModal';

export function RadarSectorielBlock() {
  const [selected, setSelected] = useState<{ id: string; code: string; titre: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vue360-radar'],
    queryFn: () => api.get('/me/use-cases/radar').then(r => r.data),
    retry: 1,
  });

  if (isLoading) return <Card className="border-l-4 border-teal"><CardContent className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-teal mx-auto" /></CardContent></Card>;

  const items = data || [];

  return (
    <>
      <Card className="border-l-4 border-teal">
        <div className="p-4 border-b border-gray-100">
          <div className="font-bold text-navy flex items-center gap-2">
            <Radar className="w-4 h-4 text-teal" />
            Radar sectoriel
          </div>
          <div className="text-xs text-gray-500">Cas d'usage touchant mon perimetre — auto-saisine possible</div>
        </div>
        <div className="divide-y divide-gray-100">
          {items.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 italic text-center">Aucun cas d'usage detecte dans votre perimetre</div>
          ) : (
            items.slice(0, 5).map((item: any) => {
              const sc = VUE360_STATUT_COLORS[item.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;
              return (
                <div key={item.id} className="p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{item.code}</span>
                    <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', sc.chip)}>{sc.label}</span>
                    <span className="text-[10px] text-teal font-semibold">Match : {item.matchReason}</span>
                  </div>
                  <div className="font-semibold text-navy text-sm">{item.titre}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    Initiateur : {item.institutionSourceCode} — vous n'etes pas encore partie prenante
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => setSelected({ id: item.id, code: item.code, titre: item.titre })}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-teal text-white hover:bg-teal/90 transition-colors"
                    >
                      Me porter partie prenante
                    </button>
                    <Link
                      to={`/admin/cas-usage/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md text-teal hover:bg-teal/10 transition-colors"
                    >
                      Voir details
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {selected && (
        <AutoSaisineModal
          cuId={selected.id}
          cuCode={selected.code}
          cuTitre={selected.titre}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
