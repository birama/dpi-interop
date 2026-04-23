import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { VUE360_STATUT_COLORS } from './constants';

export function RadarSectorielBlock() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vue360-radar'],
    queryFn: () => api.get('/me/use-cases/radar').then(r => r.data),
    retry: 1,
  });

  const autoSaisineMut = useMutation({
    mutationFn: ({ cuId }: { cuId: string }) =>
      api.post(`/use-cases/${cuId}/stakeholders`, {
        institutionId: user?.institutionId,
        role: 'PARTIE_PRENANTE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-radar'] });
      qc.invalidateQueries({ queryKey: ['vue360-involved'] });
      toast({ title: 'Auto-saisine enregistree', description: 'Vous etes maintenant partie prenante de ce cas d\'usage.' });
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec de l\'auto-saisine' });
    },
  });

  if (isLoading) return <Card className="border-l-4 border-teal"><CardContent className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-teal mx-auto" /></CardContent></Card>;

  const items = data || [];

  return (
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
                    onClick={() => autoSaisineMut.mutate({ cuId: item.id })}
                    disabled={autoSaisineMut.isPending}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-teal text-white hover:bg-teal/90 transition-colors disabled:opacity-50"
                  >
                    {autoSaisineMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
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
  );
}
