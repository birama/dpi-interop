import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { Loader2, ListChecks, CheckCircle2, Clock, Target } from 'lucide-react';
import { STATUT_ACCOMPAGNEMENT_LABELS, TYPE_ACCOMPAGNEMENT_LABELS } from '@/types';
import type { AccompagnementAMO } from '@/types';

export function PartenaireTechniqueMesCasPage() {
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (statut) params.set('statut', statut);
  params.set('page', String(page));
  params.set('pageSize', '20');

  const { data, isLoading } = useQuery({
    queryKey: ['pt-accompagnements', params.toString()],
    queryFn: () => api.get(`/partenaire-tech/accompagnements?${params.toString()}`).then(r => r.data),
    placeholderData: (prev: any) => prev,
  });

  const accompagnements: AccompagnementAMO[] = data?.data || [];
  const total = data?.total || 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>;
  }

  const actifs = accompagnements.filter(a => a.statut === 'ACTIF').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <ListChecks className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Mes cas accompagnés</h1>
          <p className="text-sm text-gray-500">Suivi de la maturité des cas accompagnés</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard label="Total accompagnements" value={total} icon={<ListChecks className="w-5 h-5 text-teal-700" />} />
        <KpiCard label="Actifs" value={actifs} icon={<CheckCircle2 className="w-5 h-5 text-teal-700" />} />
        <KpiCard label="Suspendus" value={accompagnements.filter(a => a.statut === 'SUSPENDU').length} icon={<Clock className="w-5 h-5 text-amber-600" />} />
        <KpiCard label="Score moyen" value={(() => {
          const scored = accompagnements.filter(a => a.scoreMaturite);
          return scored.length ? (scored.reduce((s, a) => s + (a.scoreMaturite || 0), 0) / scored.length).toFixed(1) : '-';
        })()} icon={<Target className="w-5 h-5 text-navy" />} />
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">Recherche</label>
              <Input placeholder="Code ou titre..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Statut</label>
              <select className="border rounded px-3 py-2 text-sm bg-white" value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}>
                <option value="">Tous</option>
                <option value="ACTIF">Actif</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-sm">{total} accompagnement{total > 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Code cas</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Titre</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Type</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Statut</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Score</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Jalons</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {accompagnements.map((a: any) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-xs text-teal-700">{a.casUsageMVP?.code}</td>
                  <td className="py-2 px-3 text-xs max-w-[200px] truncate">{a.casUsageMVP?.titre}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{TYPE_ACCOMPAGNEMENT_LABELS[a.type as keyof typeof TYPE_ACCOMPAGNEMENT_LABELS] || a.type}</Badge></td>
                  <td className="py-2 px-3">
                    <Badge className={`text-xs ${a.statut === 'ACTIF' ? 'bg-teal-100 text-teal-700' : a.statut === 'SUSPENDU' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {STATUT_ACCOMPAGNEMENT_LABELS[a.statut as keyof typeof STATUT_ACCOMPAGNEMENT_LABELS] || a.statut}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    {a.scoreMaturite ? (
                      <Badge className={`text-xs ${a.scoreMaturite >= 4 ? 'bg-teal-100 text-teal-700' : a.scoreMaturite >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {a.scoreMaturite}/5
                      </Badge>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500">{a._count?.jalons || 0}</td>
                  <td className="py-2 px-3">
                    <Link to={`/partenaire-tech/mes-cas/${a.id}`} className="text-teal-700 hover:underline text-xs">Détail</Link>
                  </td>
                </tr>
              ))}
              {accompagnements.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun accompagnement trouvé</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
        {total > 20 && (
          <div className="flex justify-between items-center p-3 text-xs">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-30">Précédent</button>
            <span className="text-gray-500">Page {page} / {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-30">Suivant</button>
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-4 flex items-center justify-between">
        <div><p className="text-xs text-gray-500">{label}</p><p className="text-3xl font-bold text-navy">{value}</p></div>
        {icon}
      </CardContent>
    </Card>
  );
}
