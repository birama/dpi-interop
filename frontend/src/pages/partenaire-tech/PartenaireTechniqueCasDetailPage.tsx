import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2, ArrowLeft, Building2, Database, Network } from 'lucide-react';

export function PartenaireTechniqueCasDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: cu, isLoading } = useQuery({
    queryKey: ['partenaire-tech-cas', id],
    queryFn: () => api.get(`/partenaire-tech/cas/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>;
  if (!cu) return <p className="text-red-600">Cas d'usage introuvable.</p>;

  return (
    <div className="space-y-4">
      <Link to="/partenaire-tech/catalogue" className="text-sm text-teal-700 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Retour au catalogue
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-navy text-white">{cu.code}</Badge>
            <Badge variant="outline">{cu.typologie}</Badge>
            {cu.domaine && <Badge variant="outline" className="bg-teal/5 text-teal-700">{cu.domaine.replace(/_/g, ' ')}</Badge>}
          </div>
          <CardTitle className="text-navy text-lg">{cu.titre}</CardTitle>
          {cu.resumeMetier && <p className="text-sm text-gray-600 mt-1">{cu.resumeMetier}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {cu.description && (
            <div>
              <h3 className="font-bold text-navy text-sm mb-1">Description</h3>
              <p className="text-sm text-gray-700">{cu.description}</p>
            </div>
          )}

          {/* Stakeholders */}
          {cu.stakeholders360?.length > 0 && (
            <div>
              <h3 className="font-bold text-navy text-sm mb-2 flex items-center gap-1"><Building2 className="w-4 h-4" /> Parties prenantes</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr><th className="py-1 px-2 text-left text-xs text-gray-500">Institution</th><th className="py-1 px-2 text-left text-xs text-gray-500">Rôle</th></tr></thead>
                <tbody>
                  {cu.stakeholders360.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-100">
                      <td className="py-1 px-2 text-xs">{s.institution?.nom || s.institutionId}</td>
                      <td className="py-1 px-2 text-xs text-gray-500">{s.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Registres */}
          {cu.registresAssocies?.length > 0 && (
            <div>
              <h3 className="font-bold text-navy text-sm mb-2 flex items-center gap-1"><Database className="w-4 h-4" /> Registres nationaux</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {cu.registresAssocies.map((r: any) => (
                  <li key={r.id}>{r.registre?.nom || r.registreId} — <span className="text-gray-400">{r.mode}</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* Relations */}
          {cu.relationsMetier?.length > 0 && (
            <div>
              <h3 className="font-bold text-navy text-sm mb-2 flex items-center gap-1"><Network className="w-4 h-4" /> Services techniques associés</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {cu.relationsMetier.map((r: any) => (
                  <li key={r.id}><span className="font-mono text-teal-700">{r.casUsageTechnique?.code}</span> — {r.casUsageTechnique?.titre}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
