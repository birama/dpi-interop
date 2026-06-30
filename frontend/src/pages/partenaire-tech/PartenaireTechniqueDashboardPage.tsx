import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, BarChart3, Layers, FolderOpen } from 'lucide-react';

export function PartenaireTechniqueDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['partenaire-tech-dashboard'],
    queryFn: () => api.get('/partenaire-tech/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>;

  const kpis = data?.kpis || { totalCas: 0, casRecents7j: 0, domainesCouverts: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Vue d'ensemble du catalogue national d'interopérabilité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="Cas d'usage" value={kpis.totalCas} icon={<Layers className="w-5 h-5 text-teal-700" />} />
        <KpiCard label="Nouveautés (7 jours)" value={kpis.casRecents7j} icon={<FolderOpen className="w-5 h-5 text-gold" />} />
        <KpiCard label="Domaines couverts" value={kpis.domainesCouverts} icon={<BarChart3 className="w-5 h-5 text-navy" />} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-4 flex items-center justify-between">
        <div><p className="text-xs text-gray-500">{label}</p><p className="text-3xl font-bold text-navy">{value}</p></div>
        {icon}
      </CardContent>
    </Card>
  );
}
