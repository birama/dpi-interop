import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { submissionsApi, institutionsApi, api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown, Building2, Users, BarChart3 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export function InstitutionProfilePage() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: instData, isLoading: loadingInst } = useQuery({
    queryKey: ['institution', id],
    queryFn: () => institutionsApi.getOne(id!),
    enabled: !!id,
  });

  const { data: subsData } = useQuery({
    queryKey: ['institution-submissions', id],
    queryFn: () => submissionsApi.getAll({ institutionId: id, limit: 1 }),
    enabled: !!id,
  });

  const submissionId = subsData?.data?.data?.[0]?.id;

  const { data: subDetail } = useQuery({
    queryKey: ['submission-detail', submissionId],
    queryFn: () => submissionsApi.getOne(submissionId!),
    enabled: !!submissionId,
  });

  if (loadingInst) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;
  }

  const inst = instData?.data;
  const sub = subDetail?.data;
  if (!inst) return <div className="text-center py-12 text-gray-500">Institution non trouvée</div>;

  const radarData = sub ? [
    { dim: 'Infrastructure', score: sub.maturiteInfra },
    { dim: 'Données', score: sub.maturiteDonnees },
    { dim: 'Compétences', score: sub.maturiteCompetences },
    { dim: 'Gouvernance', score: sub.maturiteGouvernance },
  ] : [];

  const avgScore = sub ? ((sub.maturiteInfra + sub.maturiteDonnees + sub.maturiteCompetences + sub.maturiteGouvernance) / 4).toFixed(1) : '—';

  const handleExportWord = async () => {
    if (!submissionId) return;
    try {
      const response = await api.get(`/reports/institution/${submissionId}/word`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${inst.code}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le rapport' });
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">{inst.code} — {inst.nom}</h1>
              <p className="text-gray-500">{inst.ministere}</p>
            </div>
          </div>
        </div>
        {submissionId && (
          <Button onClick={handleExportWord} className="bg-teal hover:bg-teal-dark">
            <FileDown className="w-4 h-4 mr-2" /> Exporter Word
          </Button>
        )}
      </div>

      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Statut questionnaire</p>
            <p className={cn('text-lg font-bold', sub?.status === 'VALIDATED' ? 'text-success' : sub?.status === 'SUBMITTED' ? 'text-gold' : 'text-gray-400')}>
              {sub?.status === 'VALIDATED' ? 'Validé' : sub?.status === 'SUBMITTED' ? 'Soumis' : sub?.status === 'DRAFT' ? 'Brouillon' : 'Non commencé'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-navy">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Score maturité</p>
            <p className="text-lg font-bold text-navy">{avgScore}/5</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gold">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Applications</p>
            <p className="text-lg font-bold text-gold">{sub?.applications?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Flux déclarés</p>
            <p className="text-lg font-bold text-success">{sub?.fluxExistants?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts */}
        <Card>
          <CardHeader><CardTitle className="text-navy flex items-center"><Users className="w-4 h-4 mr-2" />Contacts</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{inst.responsableNom}</p>
              <p className="text-gray-500">{inst.responsableFonction}</p>
              <p className="text-teal">{inst.responsableEmail}</p>
            </div>
            {sub?.dataOwnerNom && (
              <div className="p-3 bg-teal-50/30 rounded-lg border border-teal/10">
                <p className="text-xs text-teal font-medium mb-1">Data Owner</p>
                <p className="font-medium">{sub.dataOwnerNom}</p>
                <p className="text-gray-500">{sub.dataOwnerFonction}</p>
                <p className="text-teal">{sub.dataOwnerEmail}</p>
              </div>
            )}
            {sub?.dataStewardNom && (
              <div className="p-3 bg-gold-50/30 rounded-lg border border-gold/10">
                <p className="text-xs text-gold font-medium mb-1">Data Steward</p>
                <p className="font-medium">{sub.dataStewardNom}</p>
                <p className="text-gray-500">{sub.dataStewardFonction}</p>
                <p className="text-teal">{sub.dataStewardEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-navy flex items-center"><BarChart3 className="w-4 h-4 mr-2" />Maturité numérique</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#0A6B68" fill="#0A6B68" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Applications */}
      {(sub?.applications?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-navy">Applications en production</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50"><th className="p-2 text-left text-gray-500">Nom</th><th className="p-2 text-left text-gray-500">Éditeur</th><th className="p-2 text-left text-gray-500">Description</th></tr></thead>
              <tbody>
                {sub!.applications!.map((app: any, i: number) => (
                  <tr key={app.id} className={cn('border-b', i % 2 === 1 && 'bg-gray-50/50')}>
                    <td className="p-2 font-medium">{app.nom}</td>
                    <td className="p-2 text-gray-500">{app.editeur || '—'}</td>
                    <td className="p-2 text-gray-500">{app.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Flux */}
      {(sub?.fluxExistants?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-navy">Flux de données</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50"><th className="p-2 text-left text-gray-500">Source</th><th className="p-2 text-left text-gray-500">Destination</th><th className="p-2 text-left text-gray-500">Données</th><th className="p-2 text-left text-gray-500">Mode</th></tr></thead>
              <tbody>
                {sub!.fluxExistants!.map((f: any, i: number) => (
                  <tr key={f.id} className={cn('border-b', i % 2 === 1 && 'bg-gray-50/50')}>
                    <td className="p-2 font-medium">{f.source}</td>
                    <td className="p-2">{f.destination}</td>
                    <td className="p-2 text-gray-500">{f.donnee || '—'}</td>
                    <td className="p-2"><span className={cn('px-2 py-0.5 rounded text-xs', f.mode?.includes('X-Road') ? 'bg-teal/10 text-teal' : f.mode?.includes('API') ? 'bg-success/10 text-success' : 'bg-orange-100 text-orange-600')}>{f.mode || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Cas d'usage déclarés — P.6 liaison MVP */}
      {(sub?.casUsage?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-navy">Cas d'usage déclarés</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50"><th className="p-2 text-left text-gray-500">Titre</th><th className="p-2 text-left text-gray-500">Acteurs</th><th className="p-2 text-center text-gray-500">Priorité</th><th className="p-2 text-left text-gray-500">Lié au MVP</th></tr></thead>
              <tbody>
                {sub!.casUsage!.map((cu: any) => (
                  <tr key={cu.id} className="border-b">
                    <td className="p-2 font-medium">{cu.titre}</td>
                    <td className="p-2 text-xs text-gray-500">{cu.acteurs || '—'}</td>
                    <td className="p-2 text-center"><span className="px-2 py-0.5 rounded text-xs bg-gold-50 text-gold">{cu.priorite}/5</span></td>
                    <td className="p-2 text-xs">{cu.casUsageMVP ? <span className="px-2 py-0.5 rounded bg-teal-50 text-teal">{cu.casUsageMVP.code}</span> : <span className="text-gray-400">Non lié</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Forces / Faiblesses */}
      {(sub?.forces || sub?.faiblesses) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sub?.forces && (
            <Card>
              <CardHeader><CardTitle className="text-success text-sm">Forces</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-gray-600">{sub.forces}</p></CardContent>
            </Card>
          )}
          {sub?.faiblesses && (
            <Card>
              <CardHeader><CardTitle className="text-red-500 text-sm">Faiblesses</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-gray-600">{sub.faiblesses}</p></CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
