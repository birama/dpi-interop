import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMPACT_LABELS: Record<string, string> = { CRITIQUE: 'Critique', ELEVE: 'Élevé', MOYEN: 'Moyen', FAIBLE: 'Faible' };
const IMPACT_COLORS: Record<string, string> = { CRITIQUE: 'bg-red-100 text-red-700', ELEVE: 'bg-orange-100 text-orange-700', MOYEN: 'bg-gray-100 text-gray-600', FAIBLE: 'bg-gray-50 text-gray-400' };
const MODE_COLORS: Record<string, string> = { 'Manuel': 'bg-red-100 text-red-600', 'Fichier (CSV/Excel)': 'bg-orange-100 text-orange-600', 'API REST': 'bg-emerald-50 text-emerald-700', 'X-Road': 'bg-teal-50 text-teal' };
const STATUT_LABELS: Record<string, string> = { IDENTIFIE: 'Identifié', PRIORISE: 'Priorisé', EN_PREPARATION: 'En préparation', EN_DEVELOPPEMENT: 'En développement', EN_TEST: 'En test', EN_PRODUCTION: 'En production', SUSPENDU: 'Suspendu' };
const STATUT_COLORS: Record<string, string> = { IDENTIFIE: 'bg-gray-100 text-gray-600', PRIORISE: 'bg-gold-50 text-gold', EN_PREPARATION: 'bg-blue-100 text-blue-600', EN_DEVELOPPEMENT: 'bg-blue-200 text-blue-700', EN_TEST: 'bg-teal-50 text-teal', EN_PRODUCTION: 'bg-success/10 text-success', SUSPENDU: 'bg-red-50 text-red-500' };
const FIN_COLORS: Record<string, string> = { EN_COURS: 'bg-emerald-50 text-emerald-700', ACCORDE: 'bg-emerald-50 text-emerald-700', DEMANDE: 'bg-orange-100 text-orange-600', EN_NEGOCIATION: 'bg-gold-50 text-gold', IDENTIFIE: 'bg-gray-100 text-gray-500' };
const IMPACT_SCORES: Record<string, number> = { CRITIQUE: 4, ELEVE: 3, MOYEN: 2, FAIBLE: 1 };

export function QualificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [qualForm, setQualForm] = useState<any>({});

  const { data: items, isLoading } = useQuery({ queryKey: ['qualification-items'], queryFn: () => api.get('/qualification').then(r => r.data) });
  const { data: statsData } = useQuery({ queryKey: ['qualification-stats'], queryFn: () => api.get('/qualification/stats').then(r => r.data) });
  const { data: phasesData } = useQuery({ queryKey: ['phases-mvp-qual'], queryFn: () => api.get('/phases-mvp').then(r => r.data) });

  const qualifyMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/qualification/${id}/qualifier`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['qualification-items'] }); queryClient.invalidateQueries({ queryKey: ['qualification-stats'] }); setSelected(null); toast({ title: 'Flux qualifié' }); },
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) => api.patch(`/qualification/${id}/rejeter`, { motif }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['qualification-items'] }); setSelected(null); toast({ title: 'Flux rejeté' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const flux = items || [];
  const stats = statsData || {};
  const phases = phasesData || [];

  const openQualify = (f: any) => {
    setSelected(f);
    setQualForm({
      impactValide: f.impactValide || f.impactEstime || 'MOYEN',
      complexiteTechnique: f.complexiteTechnique || 'MOYEN',
      noteQualification: f.noteQualification || '',
      urgence: f.urgence || 3,
      prerequisConvention: f.prerequisConvention || false,
      prerequisSecurityServer: f.prerequisSecurityServer || false,
      prerequisAPI: f.prerequisAPI || false,
      prerequisNettoyage: f.prerequisNettoyage || false,
      prerequisAutre: f.prerequisAutre || '',
      phaseMVPId: f.phaseMVPId || '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Qualification des cas d'usage</h1>
        <p className="text-gray-500 mt-1">Pipeline : déclaré → qualifié → priorisé → financé → en production</p>
      </div>

      {/* Métriques pipeline */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-300"><CardContent className="pt-4"><p className="text-xs text-gray-500">Cas d'usage total</p><p className="text-2xl font-bold text-gray-600">{stats.total || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="pt-4"><p className="text-xs text-gray-500">Qualifiés institution</p><p className="text-2xl font-bold text-gold">{stats.qualifiesInst || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="pt-4"><p className="text-xs text-gray-500">Qualifiés SENUM</p><p className="text-2xl font-bold text-teal">{stats.qualifiesSenum || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="pt-4"><p className="text-xs text-gray-500">Retenus MVP</p><p className="text-2xl font-bold text-success">{stats.retenusMVP || 0}</p></CardContent></Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="pt-6">
          {flux.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucun cas d'usage dans le pipeline.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="p-2 text-left">Source</th>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Titre</th>
                  <th className="p-2 text-left">Flux</th>
                  <th className="p-2 text-center">Mode</th>
                  <th className="p-2 text-center">Statut</th>
                  <th className="p-2 text-center">Phase</th>
                  <th className="p-2 text-center">Financement</th>
                  <th className="p-2 text-center">Score</th>
                  <th className="p-2 text-right">Action</th>
                </tr></thead>
                <tbody>
                  {flux.map((f: any) => (
                    <tr key={f.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', f.source === 'registre' ? 'bg-teal-50 text-teal' : 'bg-gold-50 text-gold')}>
                          {f.source === 'registre' ? 'Registre MVP' : 'Questionnaire'}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs text-navy font-medium">{f.code || '—'}</td>
                      <td className="p-2 text-xs text-navy max-w-[200px] truncate" title={f.titre}>{f.titre}</td>
                      <td className="p-2 text-xs text-gray-500 whitespace-nowrap">{f.institutionSource} → {f.institutionCible}</td>
                      <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', MODE_COLORS[f.modeActuel] || 'bg-gray-100 text-gray-500')}>{f.modeActuel}</span></td>
                      <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', STATUT_COLORS[f.statutImpl] || 'bg-gray-100')}>{STATUT_LABELS[f.statutImpl] || f.statutImpl}</span></td>
                      <td className="p-2 text-center text-xs font-medium text-navy">{f.phaseMVP || '—'}</td>
                      <td className="p-2 text-center">
                        {f.financement ? (
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', FIN_COLORS[f.financementStatut] || 'bg-gray-100 text-gray-500')}>{f.financement}</span>
                        ) : (
                          <span className="text-[10px] text-gray-300">Non financé</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-bold text-teal">{f.scoreTotal || '—'}</td>
                      <td className="p-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => openQualify(f)}>Détails</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panneau de qualification (slide-in) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelected(null)} />
          <div className="w-[550px] bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-navy text-white p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold">{selected.code || 'Flux'}</h3>
                <p className="text-xs text-white/70">{selected.titre}</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos générales */}
              <div className="space-y-2">
                <h4 className="font-semibold text-navy text-sm border-b pb-1">Informations</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Source:</span> <span className="font-medium">{selected.institutionSource}</span></div>
                  <div><span className="text-gray-500">Destination:</span> <span className="font-medium">{selected.institutionCible}</span></div>
                  <div><span className="text-gray-500">Données:</span> <span>{selected.donneesEchangees || '—'}</span></div>
                  <div><span className="text-gray-500">Mode:</span> <span>{selected.modeActuel}</span></div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', STATUT_COLORS[selected.statutImpl])}>{STATUT_LABELS[selected.statutImpl]}</span>
                  {selected.phaseMVP && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy/10 text-navy">{selected.phaseMVP}</span>}
                  {selected.financement && <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', FIN_COLORS[selected.financementStatut] || 'bg-gray-100')}>{selected.financement}</span>}
                </div>
              </div>

              {/* Ce que dit l'institution */}
              <div className="space-y-3">
                <h4 className="font-semibold text-navy text-sm border-b pb-1">Qualification institution {selected.institutionDeclarante && `(${selected.institutionDeclarante})`}</h4>
                {selected.justificationMetier ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded text-sm border-l-4 border-l-blue-400"><p className="text-xs text-blue-600 font-medium mb-1">Justification métier</p><p className="text-gray-700 text-xs">{selected.justificationMetier}</p></div>
                    {selected.problemeActuel && <div className="p-3 bg-orange-50 rounded text-sm border-l-4 border-l-orange-400"><p className="text-xs text-orange-600 font-medium mb-1">Problème actuel</p><p className="text-gray-700 text-xs">{selected.problemeActuel}</p></div>}
                    {selected.beneficeAttendu && <div className="p-3 bg-emerald-50 rounded text-sm border-l-4 border-l-emerald-400"><p className="text-xs text-emerald-600 font-medium mb-1">Bénéfice attendu</p><p className="text-gray-700 text-xs">{selected.beneficeAttendu}</p></div>}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune qualification par l'institution (provient du registre MVP)</p>
                )}
                {selected.observations && <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 border-l-4 border-l-gray-300"><p className="text-xs text-gray-500 font-medium mb-1">Observations</p>{selected.observations}</div>}
              </div>

              {/* Analyse SENUM */}
              {selected.source === 'questionnaire' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-navy text-sm border-b pb-1">Analyse SENUM</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Impact validé</Label>
                      <select value={qualForm.impactValide} onChange={e => setQualForm({ ...qualForm, impactValide: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md">
                        <option value="CRITIQUE">Critique</option><option value="ELEVE">Élevé</option><option value="MOYEN">Moyen</option><option value="FAIBLE">Faible</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Complexité technique</Label>
                      <select value={qualForm.complexiteTechnique} onChange={e => setQualForm({ ...qualForm, complexiteTechnique: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md">
                        <option value="CRITIQUE">Critique</option><option value="ELEVE">Élevé</option><option value="MOYEN">Moyen</option><option value="FAIBLE">Faible</option>
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">Note</Label><Textarea value={qualForm.noteQualification} onChange={e => setQualForm({ ...qualForm, noteQualification: e.target.value })} rows={2} className="text-sm" /></div>
                  <div className="text-center p-3 bg-teal-50 rounded">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="text-3xl font-bold text-teal">{Math.round(((IMPACT_SCORES[qualForm.impactValide] || 2) * (qualForm.urgence || 3) * 10) / (IMPACT_SCORES[qualForm.complexiteTechnique] || 2))}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button className="flex-1 bg-teal hover:bg-teal-dark" onClick={() => qualifyMut.mutate({ id: selected.id, data: qualForm })} disabled={qualifyMut.isPending}>
                      {qualifyMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} Qualifier
                    </Button>
                    <Button variant="outline" className="text-red-500" onClick={() => { const m = prompt('Motif :'); if (m) rejectMut.mutate({ id: selected.id, motif: m }); }}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </div>
              )}

              {/* Score pour les registres */}
              {selected.source === 'registre' && (
                <div className="text-center p-4 bg-teal-50 rounded">
                  <p className="text-xs text-gray-500">Score de priorisation</p>
                  <p className="text-4xl font-bold text-teal">{selected.scoreTotal}</p>
                  <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Impact: <span className={cn('px-1.5 py-0.5 rounded', IMPACT_COLORS[selected.impactValide])}>{IMPACT_LABELS[selected.impactValide]}</span></span>
                    <span>Complexité: <span className={cn('px-1.5 py-0.5 rounded', IMPACT_COLORS[selected.complexiteTechnique])}>{IMPACT_LABELS[selected.complexiteTechnique]}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
