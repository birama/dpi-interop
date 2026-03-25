import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { ExportPDFButton } from '@/components/ui/export-pdf-button';
import { submissionsApi, institutionsApi } from '@/services/api';
import { formatDate, getStatusBadgeColor, getStatusLabel } from '@/lib/utils';
import {
  FileText,
  Building2,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9CA3AF',
  SUBMITTED: '#D4A820',
  REVIEWED: '#0A6B68',
  VALIDATED: '#2D6A4F',
  ARCHIVED: '#0C1F3A',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  REVIEWED: 'Relu',
  VALIDATED: 'Validé',
  ARCHIVED: 'Archivé',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: submissionStats } = useQuery({
    queryKey: ['submissions-stats'],
    queryFn: () => submissionsApi.getStats(),
    enabled: isAdmin,
  });

  const { data: institutionStats } = useQuery({
    queryKey: ['institutions-stats'],
    queryFn: () => institutionsApi.getStats(),
    enabled: isAdmin,
  });

  const { data: submissions } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => submissionsApi.getAll({ limit: 10 }),
  });

  const { data: allInstitutions } = useQuery({
    queryKey: ['institutions-all-dashboard'],
    queryFn: () => institutionsApi.getAll({ limit: 500 }),
    enabled: isAdmin,
  });

  const stats = submissionStats?.data;
  const instStats = institutionStats?.data;
  const totalInstitutions = instStats?.total || 0;
  const totalSubmitted = (stats?.byStatus?.SUBMITTED || 0) + (stats?.byStatus?.REVIEWED || 0) + (stats?.byStatus?.VALIDATED || 0);
  const totalValidated = stats?.byStatus?.VALIDATED || 0;
  const tauxReponse = totalInstitutions > 0 ? Math.round((totalSubmitted / totalInstitutions) * 100) : 0;

  // Pie chart data
  const pieData = stats?.byStatus
    ? Object.entries(stats.byStatus)
        .filter(([, count]) => (count as number) > 0)
        .map(([status, count]) => ({
          name: STATUS_LABELS[status] || status,
          value: count as number,
          color: STATUS_COLORS[status] || '#ccc',
        }))
    : [];

  // Bar chart data by ministère
  const barData = instStats?.byMinistere
    ? Object.entries(instStats.byMinistere)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10)
        .map(([ministere, count]) => ({
          name: ministere.length > 15 ? ministere.substring(0, 15) + '...' : ministere,
          fullName: ministere,
          count: count as number,
        }))
    : [];

  // ======================================================================
  // ADMIN DASHBOARD
  // ======================================================================
  if (isAdmin) {
    return (
      <div className="space-y-6" id="dashboard-content">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">Tableau de bord SENUM</h1>
              <p className="text-gray-500 mt-1">Suivi des questionnaires d'interopérabilité</p>
            </div>
            <ExportPDFButton targetId="dashboard-content" filename="dashboard-senum" />
          </div>
        </div>

        {/* Section 1 — Métriques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-navy">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Institutions invitées</CardTitle>
              <Building2 className="w-4 h-4 text-navy" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">{totalInstitutions}</div>
              <p className="text-xs text-gray-400 mt-1">Décret n°2025-1431</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gold">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Questionnaires soumis</CardTitle>
              <FileText className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gold">{totalSubmitted}</div>
              <p className="text-xs text-gray-400 mt-1">
                {tauxReponse}% de taux de réponse
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Validés</CardTitle>
              <CheckCircle className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{totalValidated}</div>
              <p className="text-xs text-gray-400 mt-1">
                {totalSubmitted > 0 ? Math.round((totalValidated / totalSubmitted) * 100) : 0}% des soumissions
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Taux de réponse</CardTitle>
              <TrendingUp className="w-4 h-4 text-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal">{tauxReponse}%</div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className="h-full bg-teal rounded-full transition-all"
                  style={{ width: `${tauxReponse}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2 — Graphiques */}
        {(pieData.length > 0 || barData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart - Répartition par statut */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Bar chart - Institutions par ministère */}
            {barData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Institutions par ministère (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [value, 'Structures']}
                        labelFormatter={(label) => {
                          const item = barData.find((d) => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar dataKey="count" fill="#0A6B68" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Section 3 — Soumissions récentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-navy">Activité récente</CardTitle>
                <CardDescription>Dernières soumissions et modifications</CardDescription>
              </div>
              <Link to="/submissions">
                <Button variant="outline" size="sm">
                  Voir tout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(submissions?.data?.data?.length ?? 0) > 0 ? (
              <div className="divide-y divide-gray-100">
                {submissions?.data?.data?.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {sub.institution?.code} — {sub.institution?.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sub.institution?.ministere} · {formatDate(sub.updatedAt || sub.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                      <Link to={`/questionnaire/${sub.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune soumission pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ======================================================================
  // INSTITUTION DASHBOARD
  // ======================================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            Bienvenue, {user?.institution?.nom || user?.email}
          </p>
        </div>
        <Link to="/questionnaire">
          <Button className="mt-4 sm:mt-0 bg-teal hover:bg-teal-dark">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau questionnaire
          </Button>
        </Link>
      </div>

      {/* Mes soumissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-navy">Mes soumissions</CardTitle>
              <CardDescription>Vos questionnaires en cours et soumis</CardDescription>
            </div>
            <Link to="/submissions">
              <Button variant="outline" size="sm">
                Voir tout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {(submissions?.data?.data?.length ?? 0) > 0 ? (
            <div className="divide-y divide-gray-100">
              {submissions?.data?.data?.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{sub.institution?.nom}</p>
                    <p className="text-sm text-gray-500">{formatDate(sub.updatedAt || sub.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                    <Link to={`/questionnaire/${sub.id}`}>
                      <Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune soumission pour le moment</p>
              <Link to="/questionnaire" className="mt-4 inline-block">
                <Button className="bg-teal hover:bg-teal-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Commencer le questionnaire
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:border-teal/30 transition-colors cursor-pointer">
          <Link to="/questionnaire">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal" />
                </div>
                <div>
                  <CardTitle className="text-lg text-navy">Remplir le questionnaire</CardTitle>
                  <CardDescription>Décrivez vos systèmes et besoins d'interopérabilité</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-teal/30 transition-colors cursor-pointer">
          <Link to="/submissions">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gold-50 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <CardTitle className="text-lg text-navy">Suivre mes soumissions</CardTitle>
                  <CardDescription>Consultez l'état de vos questionnaires</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
