import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportsApi, api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/utils';
import {
  BarChart3,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Network,
  FileText,
  FileDown,
} from 'lucide-react';

const REPORT_TYPES = [
  {
    type: 'COMPILATION',
    title: 'Compilation globale',
    description: 'Synthèse de toutes les soumissions validées',
    icon: FileText,
    color: 'teal',
  },
  {
    type: 'MATRICE_FLUX',
    title: 'Matrice des flux',
    description: 'Vue des échanges entre institutions',
    icon: Network,
    color: 'navy',
  },
  {
    type: 'STATISTIQUES',
    title: 'Statistiques',
    description: 'Indicateurs et métriques clés',
    icon: BarChart3,
    color: 'gold',
  },
  {
    type: 'EXPORT_COMPLET',
    title: 'Export complet',
    description: 'Toutes les données en format JSON',
    icon: Download,
    color: 'success',
  },
];

export function ReportsPage() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: reportsHistory } = useQuery({
    queryKey: ['reports-history'],
    queryFn: () => reportsApi.getAll({ limit: 10 }),
  });

  const generateMutation = useMutation({
    mutationFn: (params: { type: string; format: string }) =>
      reportsApi.generate({ type: params.type as any, format: params.format as any }),
    onSuccess: (data, variables) => {
      setGenerating(null);
      toast({ title: 'Rapport généré', description: `Le rapport ${variables.type} a été généré` });
      if (variables.format === 'JSON' && data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.data.filename || 'rapport.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    onError: () => {
      setGenerating(null);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le rapport' });
    },
  });

  const handleGenerate = (type: string, format: string) => {
    setGenerating(`${type}-${format}`);
    generateMutation.mutate({ type, format });
  };

  const handleDownloadWord = async (endpoint: string, filename: string) => {
    setGenerating(endpoint);
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Téléchargement', description: 'Le document Word a été téléchargé' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le document' });
    }
    setGenerating(null);
  };

  const reports = reportsHistory?.data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Rapports et Exports</h1>
        <p className="text-gray-500 mt-1">Générez et téléchargez des rapports d'analyse</p>
      </div>

      {/* Export Word */}
      <Card className="border-2 border-teal/20">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <FileDown className="w-6 h-6 text-teal" />
            </div>
            <div>
              <CardTitle className="text-navy">Export Word (.docx)</CardTitle>
              <CardDescription>Documents formatés au standard du recueil d'ancrage institutionnel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              className="bg-teal hover:bg-teal-dark"
              onClick={() => handleDownloadWord('/reports/compilation/word', `compilation-interop-${new Date().toISOString().split('T')[0]}.docx`)}
              disabled={generating === '/reports/compilation/word'}
            >
              {generating === '/reports/compilation/word' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Compilation complète
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Génère un document Word avec page de garde, note de synthèse, un chapitre par institution et les annexes (matrice, points focaux).
          </p>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.type} className="hover:border-gray-300 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg bg-${report.color}/10 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-navy">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(report.type, 'JSON')}
                    disabled={generating === `${report.type}-JSON`}
                  >
                    {generating === `${report.type}-JSON` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileJson className="w-4 h-4 mr-2" />
                    )}
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(report.type, 'CSV')}
                    disabled={generating === `${report.type}-CSV`}
                  >
                    {generating === `${report.type}-CSV` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reports History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Historique des rapports</CardTitle>
          <CardDescription>Les 10 derniers rapports générés</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun rapport généré pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {report.format === 'json' ? (
                        <FileJson className="w-5 h-5 text-gray-500" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.filename}</p>
                      <p className="text-sm text-gray-500">{report.type} — {formatDateTime(report.createdAt)}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                    {report.format}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
