import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, CheckCircle, XCircle, ClipboardCheck, Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const IMPACT_LABELS: Record<string, string> = { CRITIQUE: 'Critique', ELEVE: 'Eleve', MOYEN: 'Moyen', FAIBLE: 'Faible' };
const IMPACT_COLORS: Record<string, string> = { CRITIQUE: 'bg-red-100 text-red-700', ELEVE: 'bg-orange-100 text-orange-700', MOYEN: 'bg-gray-100 text-gray-600', FAIBLE: 'bg-gray-50 text-gray-400' };
const MODE_COLORS: Record<string, string> = { 'Manuel': 'bg-red-100 text-red-600', 'Fichier (CSV/Excel)': 'bg-orange-100 text-orange-600', 'API REST': 'bg-emerald-50 text-emerald-700', 'X-Road': 'bg-teal-50 text-teal' };
const STATUT_LABELS: Record<string, string> = { IDENTIFIE: 'Identifie', PRIORISE: 'Priorise', EN_PREPARATION: 'En preparation', EN_DEVELOPPEMENT: 'En developpement', EN_TEST: 'En test', EN_PRODUCTION: 'En production', SUSPENDU: 'Suspendu' };
const STATUT_COLORS: Record<string, string> = { IDENTIFIE: 'bg-gray-100 text-gray-600', PRIORISE: 'bg-gold-50 text-gold', EN_PREPARATION: 'bg-blue-100 text-blue-600', EN_DEVELOPPEMENT: 'bg-blue-200 text-blue-700', EN_TEST: 'bg-teal-50 text-teal', EN_PRODUCTION: 'bg-success/10 text-success', SUSPENDU: 'bg-red-50 text-red-500' };
const FIN_COLORS: Record<string, string> = { EN_COURS: 'bg-emerald-50 text-emerald-700', ACCORDE: 'bg-emerald-50 text-emerald-700', DEMANDE: 'bg-orange-100 text-orange-600', EN_NEGOCIATION: 'bg-gold-50 text-gold', IDENTIFIE: 'bg-gray-100 text-gray-500' };
const IMPACT_SCORES: Record<string, number> = { CRITIQUE: 4, ELEVE: 3, MOYEN: 2, FAIBLE: 1 };

export function QualificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [qualForm, setQualForm] = useState<any>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'code' | 'statut' | 'impact'>('score');

  const { data: items, isLoading } = useQuery({ queryKey: ['qualification-items'], queryFn: () => api.get('/qualification').then(r => r.data) });
  const { data: statsData } = useQuery({ queryKey: ['qualification-stats'], queryFn: () => api.get('/qualification/stats').then(r => r.data) });
  const { data: phasesData } = useQuery({ queryKey: ['phases-mvp-qual'], queryFn: () => api.get('/phases-mvp').then(r => r.data) });

  const qualifyMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/qualification/${id}/qualifier`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['qualification-items'] }); queryClient.invalidateQueries({ queryKey: ['qualification-stats'] }); setSelected(null); toast({ title: 'Flux qualifie' }); },
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) => api.patch(`/qualification/${id}/rejeter`, { motif }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['qualification-items'] }); setSelected(null); toast({ title: 'Flux rejete' }); },
  });

  // Filter + sort logic
  const filteredFlux = useMemo(() => {
    let result = items || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((f: any) =>
        f.code?.toLowerCase().includes(term) ||
        f.titre?.toLowerCase().includes(term) ||
        f.institutionSource?.toLowerCase().includes(term) ||
        f.institutionCible?.toLowerCase().includes(term)
      );
    }
    if (filterStatut) result = result.filter((f: any) => f.statutImpl === filterStatut);
    if (filterSource) result = result.filter((f: any) => f.source === filterSource);

    // Sort
    result = [...result].sort((a: any, b: any) => {
      if (sortBy === 'score') return (b.scoreTotal || 0) - (a.scoreTotal || 0);
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'impact') return (IMPACT_SCORES[b.impactValide] || 0) - (IMPACT_SCORES[a.impactValide] || 0);
      if (sortBy === 'statut') {
        const order = ['IDENTIFIE', 'PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION', 'SUSPENDU'];
        return order.indexOf(a.statutImpl) - order.indexOf(b.statutImpl);
      }
      return 0;
    });

    return result;
  }, [items, searchTerm, filterStatut, filterSource, sortBy]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const stats = statsData || {};
  void phasesData;

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
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Qualification des cas d'usage</h1>
        <p className="text-gray-500 text-sm mt-1">Pipeline : declare → qualifie → priorise → finance → en production</p>
      </div>

      {/* Metriques pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-gray-300"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Cas d'usage total</p><p className="text-xl font-bold text-gray-600">{stats.total || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Qualifies institution</p><p className="text-xl font-bold text-gold">{stats.qualifiesInst || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Qualifies SENUM</p><p className="text-xl font-bold text-teal">{stats.qualifiesSenum || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Retenus MVP</p><p className="text-xl font-bold text-success">{stats.retenusMVP || 0}</p></CardContent></Card>
      </div>

      {/* Filtres + Recherche */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par code, titre, institution..." className="pl-8 h-8 text-xs" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="h-8 px-2 text-xs border rounded-md">
          <option value="">Tous statuts</option>
          {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="h-8 px-2 text-xs border rounded-md">
          <option value="">Toutes sources</option>
          <option value="registre">Registre MVP</option>
          <option value="questionnaire">Questionnaire</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="h-8 px-2 text-xs border rounded-md">
          <option value="score">Tri: Score</option>
          <option value="code">Tri: Code</option>
          <option value="impact">Tri: Impact</option>
          <option value="statut">Tri: Statut</option>
        </select>
        <span className="text-[10px] text-gray-400">{filteredFlux.length} resultats</span>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="pt-4">
          {filteredFlux.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucun cas d'usage pour les filtres selectionnes.</p></div>
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
                  {filteredFlux.map((f: any) => (
                    <tr key={f.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', f.source === 'registre' ? 'bg-teal-50 text-teal' : 'bg-gold-50 text-gold')}>
                          {f.source === 'registre' ? 'MVP' : 'Quest.'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Link to={`/admin/cas-usage/${f.casUsageMVPId || f.id}`} className="font-mono text-xs text-teal font-medium hover:underline">{f.code || '—'}</Link>
                      </td>
                      <td className="p-2 text-xs text-navy max-w-[200px] truncate" title={f.titre}>{f.titre}</td>
                      <td className="p-2 text-xs text-gray-500 whitespace-nowrap">{f.institutionSource} → {f.institutionCible}</td>
                      <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', MODE_COLORS[f.modeActuel] || 'bg-gray-100 text-gray-500')}>{f.modeActuel}</span></td>
                      <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', STATUT_COLORS[f.statutImpl] || 'bg-gray-100')}>{STATUT_LABELS[f.statutImpl] || f.statutImpl}</span></td>
                      <td className="p-2 text-center text-xs font-medium text-navy">{f.phaseMVP || '—'}</td>
                      <td className="p-2 text-center">
                        {f.financement ? (
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', FIN_COLORS[f.financementStatut] || 'bg-gray-100 text-gray-500')}>{f.financement}</span>
                        ) : (
                          <span className="text-[10px] text-red-400">Non finance</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-bold text-teal">{f.scoreTotal || '—'}</td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => openQualify(f)}>Details</Button>
                          <Link to={`/admin/cas-usage/${f.casUsageMVPId || f.id}`}><Button variant="ghost" size="sm" className="h-6"><ExternalLink className="w-3 h-3 text-teal" /></Button></Link>
                        </div>
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
          <div className="w-full max-w-[550px] bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-navy text-white p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold">{selected.code || 'Flux'}</h3>
                <p className="text-xs text-white/70">{selected.titre}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/admin/cas-usage/${selected.casUsageMVPId || selected.id}`} className="text-white/70 hover:text-white"><ExternalLink className="w-4 h-4" /></Link>
                <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos generales */}
              <div className="space-y-2">
                <h4 className="font-semibold text-navy text-sm border-b pb-1">Informations</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Source:</span> <span className="font-medium">{selected.institutionSource}</span></div>
                  <div><span className="text-gray-500">Destination:</span> <span className="font-medium">{selected.institutionCible}</span></div>
                  <div><span className="text-gray-500">Donnees:</span> <span>{selected.donneesEchangees || '—'}</span></div>
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
                    <div className="p-3 bg-blue-50 rounded text-sm border-l-4 border-l-blue-400"><p className="text-xs text-blue-600 font-medium mb-1">Justification metier</p><p className="text-gray-700 text-xs">{selected.justificationMetier}</p></div>
                    {selected.problemeActuel && <div className="p-3 bg-orange-50 rounded text-sm border-l-4 border-l-orange-400"><p className="text-xs text-orange-600 font-medium mb-1">Probleme actuel</p><p className="text-gray-700 text-xs">{selected.problemeActuel}</p></div>}
                    {selected.beneficeAttendu && <div className="p-3 bg-emerald-50 rounded text-sm border-l-4 border-l-emerald-400"><p className="text-xs text-emerald-600 font-medium mb-1">Benefice attendu</p><p className="text-gray-700 text-xs">{selected.beneficeAttendu}</p></div>}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune qualification par l'institution (provient du registre MVP)</p>
                )}
              </div>

              {/* Analyse SENUM */}
              {selected.source === 'questionnaire' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-navy text-sm border-b pb-1">Analyse SENUM</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Impact valide</Label>
                      <select value={qualForm.impactValide} onChange={e => setQualForm({ ...qualForm, impactValide: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md">
                        <option value="CRITIQUE">Critique</option><option value="ELEVE">Eleve</option><option value="MOYEN">Moyen</option><option value="FAIBLE">Faible</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Complexite technique</Label>
                      <select value={qualForm.complexiteTechnique} onChange={e => setQualForm({ ...qualForm, complexiteTechnique: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md">
                        <option value="CRITIQUE">Critique</option><option value="ELEVE">Eleve</option><option value="MOYEN">Moyen</option><option value="FAIBLE">Faible</option>
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
                    <span>Complexite: <span className={cn('px-1.5 py-0.5 rounded', IMPACT_COLORS[selected.complexiteTechnique])}>{IMPACT_LABELS[selected.complexiteTechnique]}</span></span>
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
