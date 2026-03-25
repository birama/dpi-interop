import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submissionsApi, api } from '@/services/api';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FluxEntry {
  donnee: string;
  mode: string;
  frequence: string;
  source: 'questionnaire' | 'reference' | 'mvp' | 'historique';
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  questionnaire: { label: 'Questionnaire', color: 'bg-blue-100 text-blue-700' },
  reference: { label: 'Référence JICA', color: 'bg-teal-50 text-teal' },
  mvp: { label: 'Cas d\'usage MVP', color: 'bg-gold-50 text-gold' },
  historique: { label: 'Historique 2017', color: 'bg-orange-100 text-orange-600' },
};

export function MatricePage() {
  const [selectedCell, setSelectedCell] = useState<{ src: string; dst: string } | null>(null);
  const [filters, setFilters] = useState({ questionnaire: true, reference: true, mvp: true, historique: true });

  const { data: subsData, isLoading: loadingSubs } = useQuery({
    queryKey: ['all-subs-matrice'],
    queryFn: () => submissionsApi.getAll({ limit: 500 }),
  });

  const { data: mvpData, isLoading: loadingMVP } = useQuery({
    queryKey: ['cas-usage-mvp-matrice'],
    queryFn: () => api.get('/cas-usage-mvp'),
  });

  if (loadingSubs || loadingMVP) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;
  }

  const subs = subsData?.data?.data || [];
  const mvpCasUsages = mvpData?.data || [];

  // Build matrix from ALL sources
  const matrix: Record<string, Record<string, FluxEntry[]>> = {};
  const institutionSet = new Set<string>();

  function addFlux(src: string, dst: string, entry: FluxEntry) {
    if (!src || !dst || src === dst) return;
    if (!filters[entry.source]) return;
    institutionSet.add(src);
    institutionSet.add(dst);
    if (!matrix[src]) matrix[src] = {};
    if (!matrix[src][dst]) matrix[src][dst] = [];
    matrix[src][dst].push(entry);
  }

  // SOURCE 1 — Questionnaires
  subs.forEach((sub: any) => {
    if (!['SUBMITTED', 'VALIDATED'].includes(sub.status)) return;
    (sub.fluxExistants || []).forEach((f: any) => {
      addFlux(f.source, f.destination, { donnee: f.donnee || '?', mode: f.mode || 'Manuel', frequence: f.frequence || '', source: 'questionnaire' });
    });
    (sub.donneesConsommer || []).forEach((dc: any) => {
      if (dc.source && sub.institution?.code) {
        addFlux(dc.source, sub.institution.code, { donnee: dc.donnee, mode: 'Déclaré', frequence: '', source: 'questionnaire' });
      }
    });
  });

  // SOURCE 2+3 — CasUsageMVP (reference + mvp + historique)
  mvpCasUsages.forEach((cu: any) => {
    if (!cu.institutionSourceCode || !cu.institutionCibleCode) return;
    const src = cu.code.startsWith('HIST-') ? 'historique' as const :
                cu.code.startsWith('XRN-') && cu.phaseMVPId ? 'mvp' as const : 'reference' as const;
    addFlux(cu.institutionSourceCode, cu.institutionCibleCode, {
      donnee: cu.donneesEchangees || cu.titre,
      mode: cu.observations?.includes('Manuel') ? 'Manuel' : cu.observations?.includes('Fichier') ? 'Fichier (CSV/Excel)' : 'X-Road',
      frequence: '', source: src,
    });
  });

  const institutions = Array.from(institutionSet).sort();
  const selectedFlux = selectedCell ? matrix[selectedCell.src]?.[selectedCell.dst] || [] : [];

  // Stats
  let totalFlux = 0, fluxQ = 0, fluxR = 0, fluxM = 0, fluxH = 0, fluxXRoad = 0;
  Object.values(matrix).forEach(row => Object.values(row).forEach(entries => {
    entries.forEach(e => {
      totalFlux++;
      if (e.source === 'questionnaire') fluxQ++;
      if (e.source === 'reference') fluxR++;
      if (e.source === 'mvp') fluxM++;
      if (e.source === 'historique') fluxH++;
      if (e.mode.includes('X-Road')) fluxXRoad++;
    });
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Matrice des flux de données interministériels</h1>
        <p className="text-gray-500 mt-1">Visualisation croisée fournisseur / consommateur — toutes sources</p>
      </div>

      {/* Compteurs + filtres */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-bold text-navy">{totalFlux} flux</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs">X-Road : {fluxXRoad}/{totalFlux}</span>
        </div>
        <div className="flex-1" />
        {Object.entries(SOURCE_LABELS).map(([key, cfg]) => (
          <label key={key} className="flex items-center space-x-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={filters[key as keyof typeof filters]} onChange={e => setFilters({ ...filters, [key]: e.target.checked })} className="rounded border-gray-300 text-teal" />
            <span className={cn('px-1.5 py-0.5 rounded', cfg.color)}>{cfg.label}</span>
          </label>
        ))}
      </div>

      {institutions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">Aucun flux. Activez les sources ci-dessus.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-navy text-white p-2 text-left font-medium z-10 min-w-[80px]">Source ↓ / Dest →</th>
                    {institutions.map(inst => (
                      <th key={inst} className="bg-navy text-white p-1 text-center font-medium min-w-[45px]">
                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>{inst}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {institutions.map(src => (
                    <tr key={src} className="border-b">
                      <td className="sticky left-0 bg-gray-50 p-1.5 font-medium text-navy z-10 border-r text-[10px]">{src}</td>
                      {institutions.map(dst => {
                        const flux = matrix[src]?.[dst] || [];
                        const count = flux.length;
                        const isDiag = src === dst;
                        const isSelected = selectedCell?.src === src && selectedCell?.dst === dst;
                        const hasXRoad = flux.some(f => f.mode.includes('X-Road'));
                        const hasManual = flux.some(f => f.mode === 'Manuel');
                        const hasAPI = flux.some(f => f.mode.includes('API'));

                        return (
                          <td key={dst}
                            onClick={() => count > 0 && setSelectedCell({ src, dst })}
                            className={cn('p-1 text-center border-r border-b transition-colors text-[10px]',
                              isDiag && 'bg-gray-200',
                              !isDiag && count === 0 && 'bg-gray-50',
                              !isDiag && count > 0 && count <= 2 && 'bg-teal-50 cursor-pointer hover:bg-teal-100',
                              !isDiag && count > 2 && 'bg-teal-100 cursor-pointer hover:bg-teal-200 font-bold',
                              isSelected && 'ring-2 ring-gold'
                            )}
                          >
                            {isDiag ? '—' : count > 0 ? (
                              <div className="flex flex-col items-center">
                                <span>{count}</span>
                                <div className="flex space-x-0.5 mt-0.5">
                                  {hasXRoad && <span className="w-1.5 h-1.5 rounded-full bg-teal" />}
                                  {hasAPI && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                                  {hasManual && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                </div>
                              </div>
                            ) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Légende */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-teal mr-1" />X-Road</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-success mr-1" />API</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1" />Manuel</span>
          </div>

          {/* Détail cellule */}
          {selectedFlux.length > 0 && selectedCell && (
            <Card className="border-2 border-gold">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-navy text-lg">{selectedCell.src} → {selectedCell.dst} ({selectedFlux.length} flux)</CardTitle>
                  <button onClick={() => setSelectedCell(null)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
              </CardHeader>
              <CardContent>
                {Object.entries(SOURCE_LABELS).map(([srcType, cfg]) => {
                  const items = selectedFlux.filter(f => f.source === srcType);
                  if (items.length === 0) return null;
                  return (
                    <div key={srcType} className="mb-4">
                      <h4 className={cn('text-xs font-medium px-2 py-1 rounded inline-block mb-2', cfg.color)}>{cfg.label} ({items.length})</h4>
                      <div className="space-y-1">
                        {items.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                            <span className="text-gray-700">{f.donnee}</span>
                            <div className="flex items-center space-x-2">
                              <span className={cn('px-1.5 py-0.5 rounded text-[10px]',
                                f.mode.includes('X-Road') ? 'bg-teal-50 text-teal' :
                                f.mode.includes('API') ? 'bg-emerald-50 text-emerald-700' :
                                f.mode === 'Manuel' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                              )}>{f.mode}</span>
                              {f.frequence && <span className="text-[10px] text-gray-400">{f.frequence}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
