import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, BarChart3, Briefcase, Inbox, Layers, Construction } from 'lucide-react';

const PALETTE = ['#0A6B68', '#0C1F3A', '#D4A820', '#C55A18', '#3B82F6', '#10B981', '#A855F7', '#EF4444'];

export function AdminPtfDashboardPage() {
  const { data: ptfList, isLoading } = useQuery({
    queryKey: ['admin-ptf-dashboard-ptf'],
    queryFn: () => api.get('/admin/ptf?actif=true&pageSize=100').then((r) => r.data),
  });

  const { data: manifs } = useQuery({
    queryKey: ['admin-ptf-dashboard-manifs'],
    queryFn: () => api.get('/admin/manifestations?pageSize=200').then((r) => r.data),
  });

  // Dédupe PTF par ptfId pour ne pas compter 2x quand 2 users partagent le même PTF
  const chartData = useMemo(() => {
    const ptfs = (ptfList?.data || []) as any[];
    const map = new Map<string, { ptf: string; nom: string; total: number; enValidation: number }>();
    ptfs.forEach((u: any) => {
      const code = u.ptf?.code;
      if (!code) return;
      if (!map.has(code)) {
        map.set(code, {
          ptf: code,
          nom: u.ptf.nom,
          total: u.stats.total || 0,
          enValidation: u.stats.EN_VALIDATION || 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [ptfList]);

  const ptfActifsUniques = useMemo(() => {
    const seen = new Set<string>();
    (ptfList?.data || []).forEach((u: any) => { if (u.ptf?.id) seen.add(u.ptf.id); });
    return seen.size;
  }, [ptfList]);

  const totalManif = manifs?.total || 0;
  const casCouverts = useMemo(() => {
    const set = new Set<string>();
    (manifs?.data || []).forEach((m: any) => {
      if (['DRAFT', 'EN_VALIDATION', 'PUBLIE'].includes(m.statut) && m.casUsage?.id) {
        set.add(m.casUsage.id);
      }
    });
    return set.size;
  }, [manifs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Tableau de bord transverse PTF</h1>
          <p className="text-sm text-gray-500">Vue agrégée des engagements partenaires sur le portefeuille PINS</p>
        </div>
      </div>

      {/* Bandeau Phase 6 */}
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="pt-4 flex items-start gap-3 text-sm text-amber-900">
          <Construction className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Vue consolidée — disponible avec la Phase 6 du module PTF (cible juin 2026)</p>
            <p className="mt-1">
              La version finale agrégera : engagements par domaine, par cas, par PTF, identification des
              chevauchements et des déséquilibres sectoriels, suivi temporel des manifestations, lien automatique
              avec les conventions de financement.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI socle (mardi 19/05) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="PTF actifs" value={ptfActifsUniques} icon={<Briefcase className="w-5 h-5 text-teal-700" />} accent="teal" />
        <KpiCard label="Manifestations totales" value={totalManif} icon={<Inbox className="w-5 h-5 text-gold" />} accent="gold" />
        <KpiCard label="Cas couverts par ≥ 1 manifestation" value={casCouverts} icon={<Layers className="w-5 h-5 text-navy" />} accent="navy" />
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-base">Manifestations par PTF</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Aucune donnée à afficher.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="ptf" tick={{ fontSize: 12, fill: '#0C1F3A' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 6, border: '1px solid #E5E7EB' }}
                  formatter={(value: any, name: any) => [value, name === 'total' ? 'Manifestations totales' : name === 'enValidation' ? 'Dont EN_VALIDATION' : name]}
                  labelFormatter={(l: any) => {
                    const row = chartData.find(d => d.ptf === l);
                    return row ? `${row.ptf} — ${row.nom}` : l;
                  }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 italic">
        Données calculées à partir de la file globale des manifestations.
        <Link to="/admin/manifestations" className="ml-1 text-teal-700 hover:underline">
          Voir le détail dans la file →
        </Link>
      </p>
    </div>
  );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: 'teal' | 'gold' | 'navy' }) {
  const cls = accent === 'teal' ? 'border-teal/40' : accent === 'gold' ? 'border-gold/40' : 'border-navy/30';
  const numCls = accent === 'teal' ? 'text-teal-700' : accent === 'gold' ? 'text-gold' : 'text-navy';
  return (
    <Card className={`border ${cls}`}>
      <CardContent className="pt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-3xl font-bold ${numCls}`}>{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
