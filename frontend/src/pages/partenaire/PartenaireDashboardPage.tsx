import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Briefcase, Target, Layers, TrendingUp, ArrowRight, Loader2, Coins } from 'lucide-react';

export function PartenaireDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['partenaire-dashboard'],
    queryFn: () => api.get('/partenaire/dashboard').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  const ptf = data?.ptf;
  const kpis = data?.kpis || { casEligibles: 0, domainesCouverts: 0, recents7Jours: 0 };
  const recents = data?.recents || [];
  const domaines = data?.domainesInteret || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Espace partenaire</h1>
            <p className="text-sm text-gray-500">
              {ptf?.nom || 'Partenaire Technique et Financier'}
              {ptf?.code && <span className="ml-2 text-gray-400">({ptf.code})</span>}
            </p>
          </div>
        </div>
        <Link to="/partenaire/catalogue">
          <Button variant="outline">
            Voir le catalogue partenaire <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-teal">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cas éligibles à financement</CardTitle>
            <Target className="w-4 h-4 text-teal-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700">{kpis.casEligibles}</div>
            <p className="text-xs text-gray-400 mt-1">Statut PRIORISE + aFinancer</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-navy">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Domaines couverts</CardTitle>
            <Layers className="w-4 h-4 text-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{kpis.domainesCouverts}</div>
            <p className="text-xs text-gray-400 mt-1">Selon vos domaines d'intérêt</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gold">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nouveautés (7 j)</CardTitle>
            <TrendingUp className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{kpis.recents7Jours}</div>
            <p className="text-xs text-gray-400 mt-1">Cas récemment priorisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Domaines d'intérêt */}
      {domaines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-lg">Vos domaines d'intérêt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {domaines.map((d: string) => (
                <Badge key={d} className="bg-teal/10 text-teal-800 border border-teal/30">
                  {d.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Derniers cas éligibles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-navy text-lg">Derniers cas éligibles</CardTitle>
            <Link to="/partenaire/catalogue" className="text-sm text-teal-700 hover:underline">
              Voir tout
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recents.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">
              Aucun cas éligible dans vos domaines d'intérêt pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recents.map((cas: any) => (
                <Link
                  key={cas.id}
                  to={`/partenaire/cas/${cas.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {cas.code}
                      </span>
                      <Badge className="bg-gold/15 text-gold border border-gold/30 text-[10px]">
                        <Coins className="w-2.5 h-2.5 mr-1" />À financer
                      </Badge>
                      {cas.domaine && (
                        <Badge variant="outline" className="text-[10px]">
                          {cas.domaine.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-navy">{cas.titre}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
