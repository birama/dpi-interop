import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submissionsApi } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DIMENSIONS = [
  { key: 'maturiteInfra', label: 'Infrastructure' },
  { key: 'maturiteDonnees', label: 'Données' },
  { key: 'maturiteCompetences', label: 'Compétences' },
  { key: 'maturiteGouvernance', label: 'Gouvernance' },
];

export function MaturitePage() {
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['all-submissions-maturite'],
    queryFn: () => submissionsApi.getAll({ limit: 500 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  const subs = (submissionsData?.data?.data || []).filter(
    (s: any) => s.status === 'SUBMITTED' || s.status === 'VALIDATED'
  );

  // Calculate national average
  const avgScores: Record<string, number> = {};
  DIMENSIONS.forEach((dim) => {
    const values = subs.map((s: any) => s[dim.key] || 3).filter(Boolean);
    avgScores[dim.key] = values.length > 0
      ? Math.round((values.reduce((a: number, b: number) => a + b, 0) / values.length) * 10) / 10
      : 0;
  });

  // Per-institution scores
  const institutionScores: Record<string, Record<string, number>> = {};
  subs.forEach((s: any) => {
    const code = s.institution?.code || 'Inconnu';
    institutionScores[code] = {};
    DIMENSIONS.forEach((dim) => {
      institutionScores[code][dim.key] = s[dim.key] || 3;
    });
  });

  const institutionCodes = Object.keys(institutionScores).sort();

  // Radar data
  const radarData = DIMENSIONS.map((dim) => {
    const entry: any = { dimension: dim.label, moyenne: avgScores[dim.key] };
    if (selectedInstitution && institutionScores[selectedInstitution]) {
      entry[selectedInstitution] = institutionScores[selectedInstitution][dim.key];
    }
    return entry;
  });

  // Ranking table
  const ranking = institutionCodes.map((code) => {
    const scores = institutionScores[code];
    const total = DIMENSIONS.reduce((sum, dim) => sum + (scores[dim.key] || 0), 0);
    return { code, scores, total, avg: (total / DIMENSIONS.length).toFixed(1) };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Radar de maturité numérique</h1>
        <p className="text-gray-500 mt-1">Évaluation comparative des institutions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Comparaison de maturité</CardTitle>
            <div className="mt-2">
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Moyenne nationale uniquement</option>
                {institutionCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Moyenne nationale"
                  dataKey="moyenne"
                  stroke="#0A6B68"
                  fill="#0A6B68"
                  fillOpacity={0.3}
                />
                {selectedInstitution && (
                  <Radar
                    name={selectedInstitution}
                    dataKey={selectedInstitution}
                    stroke="#D4A820"
                    fill="#D4A820"
                    fillOpacity={0.2}
                  />
                )}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scores moyens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Scores moyens nationaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DIMENSIONS.map((dim) => {
              const score = avgScores[dim.key];
              const pct = (score / 5) * 100;
              return (
                <div key={dim.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{dim.label}</span>
                    <span className="font-bold text-teal">{score}/5</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full transition-all bg-teal"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-navy">
                  {(Object.values(avgScores).reduce((a, b) => a + b, 0) / DIMENSIONS.length).toFixed(1)}
                  <span className="text-sm text-gray-400">/5</span>
                </div>
                <div className="text-xs text-gray-500">Score global moyen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Classement par institution</CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-center py-8 text-gray-400">Aucune soumission validée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">#</th>
                    <th className="text-left p-3 font-medium text-gray-500">Institution</th>
                    {DIMENSIONS.map((d) => (
                      <th key={d.key} className="text-center p-3 font-medium text-gray-500">{d.label}</th>
                    ))}
                    <th className="text-center p-3 font-medium text-gray-500">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row, i) => (
                    <tr key={row.code} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-400">{i + 1}</td>
                      <td className="p-3 font-medium text-navy">{row.code}</td>
                      {DIMENSIONS.map((d) => (
                        <td key={d.key} className="text-center p-3">{row.scores[d.key]}/5</td>
                      ))}
                      <td className="text-center p-3 font-bold text-teal">{row.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
