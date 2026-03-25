import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, X, Pencil, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';

const STATUT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  IDENTIFIE: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Identifié' },
  PRIORISE: { bg: 'bg-gold-50', text: 'text-gold-dark', label: 'Priorisé' },
  EN_PREPARATION: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En préparation' },
  EN_DEVELOPPEMENT: { bg: 'bg-teal-50', text: 'text-teal', label: 'En développement' },
  EN_TEST: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En test' },
  EN_PRODUCTION: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'En production' },
  SUSPENDU: { bg: 'bg-red-50', text: 'text-red-600', label: 'Suspendu' },
};
const IMPACT_COLORS: Record<string, string> = { CRITIQUE: 'bg-red-100 text-red-700', ELEVE: 'bg-orange-100 text-orange-700', MOYEN: 'bg-gray-100 text-gray-600', FAIBLE: 'bg-gray-50 text-gray-400' };
const PHASE_COLORS: Record<string, string> = { EN_COURS: 'border-l-teal', TERMINE: 'border-l-success', PLANIFIE: 'border-l-gray-300', REPORTE: 'border-l-red-300' };

const EMPTY_PHASE = { code: '', nom: '', description: '', dateDebutPrevue: '', dateFinPrevue: '', statut: 'PLANIFIE', livrablesCles: '' };
const EMPTY_CU = { code: '', titre: '', description: '', institutionSourceCode: '', institutionCibleCode: '', donneesEchangees: '', axePrioritaire: 'Finances publiques', impact: 'MOYEN', complexite: 'MOYEN', statutImpl: 'IDENTIFIE', prerequis: '', phaseMVPId: '' };

export function RoadmapPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [phaseForm, setPhaseForm] = useState<any>({ ...EMPTY_PHASE });
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [showCUForm, setShowCUForm] = useState<string | null>(null);
  const [cuForm, setCuForm] = useState<any>({ ...EMPTY_CU });
  const [editingCU, setEditingCU] = useState<any>(null);
  const [dragOverPhase, setDragOverPhase] = useState<string | null>(null);
  const draggedCU = useRef<any>(null);

  const { data: phasesData, isLoading } = useQuery({ queryKey: ['phases-mvp'], queryFn: () => api.get('/phases-mvp') });
  const { data: statsData } = useQuery({ queryKey: ['cas-usage-stats'], queryFn: () => api.get('/cas-usage-mvp/overview/stats') });

  const createPhaseMut = useMutation({
    mutationFn: (data: any) => api.post('/phases-mvp', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases-mvp'] }); setShowPhaseForm(false); setPhaseForm({ ...EMPTY_PHASE }); toast({ title: 'Phase MVP créée' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur', description: 'Code phase déjà utilisé' }),
  });
  const updatePhaseMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/phases-mvp/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases-mvp'] }); setEditingPhase(null); setShowPhaseForm(false); toast({ title: 'Phase mise à jour' }); },
  });
  const createCUMut = useMutation({
    mutationFn: (data: any) => api.post('/cas-usage-mvp', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases-mvp'] }); setShowCUForm(null); setCuForm({ ...EMPTY_CU }); toast({ title: 'Cas d\'usage créé' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur', description: 'Code déjà utilisé' }),
  });
  const updateCUMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/cas-usage-mvp/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases-mvp'] }); queryClient.invalidateQueries({ queryKey: ['cas-usage-stats'] }); setEditingCU(null); toast({ title: 'Cas d\'usage mis à jour' }); },
  });

  // Drag & drop: move CU to another phase
  const moveCUMut = useMutation({
    mutationFn: ({ cuId, phaseMVPId }: { cuId: string; phaseMVPId: string }) => api.patch(`/cas-usage-mvp/${cuId}`, { phaseMVPId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['phases-mvp'] }); toast({ title: 'Cas d\'usage déplacé' }); },
  });

  const handleDragStart = (cu: any) => { draggedCU.current = cu; };
  const handleDragOver = (e: React.DragEvent, phaseId: string) => { e.preventDefault(); setDragOverPhase(phaseId); };
  const handleDragLeave = () => setDragOverPhase(null);
  const handleDrop = (e: React.DragEvent, targetPhaseId: string) => {
    e.preventDefault();
    setDragOverPhase(null);
    if (draggedCU.current && draggedCU.current.phaseMVPId !== targetPhaseId) {
      moveCUMut.mutate({ cuId: draggedCU.current.id, phaseMVPId: targetPhaseId });
    }
    draggedCU.current = null;
  };

  const handleSavePhase = () => {
    const data = { ...phaseForm };
    if (data.dateDebutPrevue) data.dateDebutPrevue = new Date(data.dateDebutPrevue).toISOString(); else delete data.dateDebutPrevue;
    if (data.dateFinPrevue) data.dateFinPrevue = new Date(data.dateFinPrevue).toISOString(); else delete data.dateFinPrevue;
    if (editingPhase) { const { id, casUsageMVP, createdAt, updatedAt, ...clean } = data; updatePhaseMut.mutate({ id: editingPhase.id, data: clean }); }
    else createPhaseMut.mutate(data);
  };

  const handleSaveCU = (phaseMVPId: string) => {
    const data = { ...cuForm, phaseMVPId };
    if (editingCU) { const { id, phaseMVP, financements, declarationsInst, fluxInstitutions, createdAt, updatedAt, ...clean } = data; updateCUMut.mutate({ id: editingCU.id, data: clean }); }
    else createCUMut.mutate(data);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;

  const phases = phasesData?.data || [];
  const stats = statsData?.data || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">Roadmap MVP — Cas d'usage e-jokkoo</h1>
          <p className="text-xs text-gray-500 mt-0.5">Glisser-déposer les cas d'usage entre phases pour les réorganiser</p>
        </div>
        <Button size="sm" onClick={() => { setShowPhaseForm(true); setEditingPhase(null); setPhaseForm({ ...EMPTY_PHASE }); }} className="bg-teal hover:bg-teal-dark">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle phase
        </Button>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Total cas d'usage</p><p className="text-lg font-bold text-navy">{stats.totalCasUsage || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Financés</p><p className="text-lg font-bold text-teal">{stats.casUsageFinances || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Orphelins</p><p className="text-lg font-bold text-red-500">{stats.casUsageOrphelins || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">En production</p><p className="text-lg font-bold text-success">{(stats.parStatut || []).find((s: any) => s.statut === 'EN_PRODUCTION')?.count || 0}</p></CardContent></Card>
      </div>

      {/* Formulaire Phase (modal) */}
      {showPhaseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowPhaseForm(false); setEditingPhase(null); }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingPhase ? 'Modifier la phase' : 'Nouvelle phase MVP'}</h3>
              <button onClick={() => { setShowPhaseForm(false); setEditingPhase(null); }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Code</Label><Input value={phaseForm.code} onChange={e => setPhaseForm({ ...phaseForm, code: e.target.value })} disabled={!!editingPhase} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Nom</Label><Input value={phaseForm.nom} onChange={e => setPhaseForm({ ...phaseForm, nom: e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Statut</Label><select value={phaseForm.statut} onChange={e => setPhaseForm({ ...phaseForm, statut: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="PLANIFIE">Planifié</option><option value="EN_COURS">En cours</option><option value="TERMINE">Terminé</option><option value="REPORTE">Reporté</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Début prévu</Label><Input type="date" value={phaseForm.dateDebutPrevue?.split('T')[0] || ''} onChange={e => setPhaseForm({ ...phaseForm, dateDebutPrevue: e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Fin prévue</Label><Input type="date" value={phaseForm.dateFinPrevue?.split('T')[0] || ''} onChange={e => setPhaseForm({ ...phaseForm, dateFinPrevue: e.target.value })} className="h-8 text-sm" /></div>
              </div>
              <div><Label className="text-xs">Livrables clés</Label><Textarea value={phaseForm.livrablesCles} onChange={e => setPhaseForm({ ...phaseForm, livrablesCles: e.target.value })} rows={2} className="text-sm" /></div>
              <Button size="sm" onClick={handleSavePhase} disabled={!phaseForm.code || !phaseForm.nom} className="bg-teal hover:bg-teal-dark">{editingPhase ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Phases MVP avec Drag & Drop */}
      {phases.map((phase: any) => (
        <Card
          key={phase.id}
          className={cn('border-l-4 transition-all', PHASE_COLORS[phase.statut] || 'border-l-gray-300', dragOverPhase === phase.id && 'ring-2 ring-teal ring-offset-2 bg-teal-50/30')}
          onDragOver={e => handleDragOver(e, phase.id)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, phase.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-navy text-base">{phase.nom}</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  {phase.dateDebutPrevue && new Date(phase.dateDebutPrevue).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  {phase.dateFinPrevue && ` → ${new Date(phase.dateFinPrevue).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
                  <span className="ml-2 text-gray-400">({phase.casUsageMVP?.length || 0} cas d'usage)</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => { setEditingPhase(phase); setPhaseForm(phase); setShowPhaseForm(true); }} className="p-1 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', phase.statut === 'EN_COURS' ? 'bg-teal-50 text-teal' : phase.statut === 'TERMINE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>{phase.statut}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(phase.casUsageMVP || []).length === 0 ? (
              <div className="py-6 text-center text-gray-300 text-sm border-2 border-dashed rounded-lg">
                Déposer un cas d'usage ici
              </div>
            ) : (
              <div className="space-y-1.5">
                {phase.casUsageMVP.map((cu: any) => {
                  const sc = STATUT_COLORS[cu.statutImpl] || STATUT_COLORS.IDENTIFIE;
                  const ptfs = cu.financements?.map((f: any) => f.programme?.ptf?.code).filter(Boolean);
                  const isFinanced = cu.financements?.some((f: any) => ['ACCORDE', 'EN_COURS'].includes(f.statut));

                  return (
                    <div
                      key={cu.id}
                      draggable
                      onDragStart={() => handleDragStart({ ...cu, phaseMVPId: phase.id })}
                      className="flex items-center p-2 rounded-lg border hover:bg-gray-50 cursor-grab active:cursor-grabbing group"
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 mr-2 flex-shrink-0 group-hover:text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono text-teal bg-teal-50 px-1 py-0.5 rounded">{cu.code}</span>
                          <span className="font-medium text-navy text-xs truncate">{cu.titre}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {cu.institutionSourceCode && <span className="text-[10px] text-gray-500">{cu.institutionSourceCode} → {cu.institutionCibleCode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', IMPACT_COLORS[cu.impact])}>{cu.impact}</span>
                        {ptfs?.map((ptf: string) => (
                          <span key={ptf} className={cn('px-1.5 py-0.5 rounded text-[9px]', isFinanced ? 'bg-teal-50 text-teal' : 'bg-gold-50 text-gold')}>{ptf}</span>
                        ))}
                        <select
                          value={cu.statutImpl}
                          onChange={e => { e.stopPropagation(); updateCUMut.mutate({ id: cu.id, data: { statutImpl: e.target.value } }); }}
                          onClick={e => e.stopPropagation()}
                          className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium border-0 cursor-pointer', sc.bg, sc.text)}
                        >
                          {Object.entries(STATUT_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={() => { setEditingCU(cu); setCuForm(cu); setShowCUForm(phase.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded ml-1">
                          <Pencil className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulaire CU */}
            {showCUForm === phase.id ? (
              <div className="mt-3 border-2 border-dashed border-teal/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-navy text-xs">{editingCU ? 'Modifier' : 'Nouveau cas d\'usage'}</h4>
                  <button onClick={() => { setShowCUForm(null); setEditingCU(null); }}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-[10px]">Code</Label><Input value={cuForm.code} onChange={e => setCuForm({ ...cuForm, code: e.target.value })} className="h-7 text-xs" disabled={!!editingCU} /></div>
                  <div className="col-span-2"><Label className="text-[10px]">Titre</Label><Input value={cuForm.titre} onChange={e => setCuForm({ ...cuForm, titre: e.target.value })} className="h-7 text-xs" /></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-[10px]">Source</Label><Input value={cuForm.institutionSourceCode || ''} onChange={e => setCuForm({ ...cuForm, institutionSourceCode: e.target.value })} className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Cible</Label><Input value={cuForm.institutionCibleCode || ''} onChange={e => setCuForm({ ...cuForm, institutionCibleCode: e.target.value })} className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Impact</Label><select value={cuForm.impact} onChange={e => setCuForm({ ...cuForm, impact: e.target.value })} className="w-full h-7 px-1 text-xs border rounded-md"><option value="FAIBLE">Faible</option><option value="MOYEN">Moyen</option><option value="ELEVE">Élevé</option><option value="CRITIQUE">Critique</option></select></div>
                  <div><Label className="text-[10px]">Axe</Label><select value={cuForm.axePrioritaire || ''} onChange={e => setCuForm({ ...cuForm, axePrioritaire: e.target.value })} className="w-full h-7 px-1 text-xs border rounded-md"><option value="Finances publiques">Finances</option><option value="Protection sociale">Protection sociale</option><option value="Climat des affaires">Climat affaires</option><option value="Services citoyens">Citoyens</option><option value="Transversal">Transversal</option></select></div>
                </div>
                <div><Label className="text-[10px]">Données échangées</Label><Input value={cuForm.donneesEchangees || ''} onChange={e => setCuForm({ ...cuForm, donneesEchangees: e.target.value })} className="h-7 text-xs" /></div>
                <Button size="sm" onClick={() => handleSaveCU(phase.id)} disabled={!cuForm.code || !cuForm.titre} className="bg-teal hover:bg-teal-dark h-7 text-xs">{editingCU ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => { setShowCUForm(phase.id); setEditingCU(null); setCuForm({ ...EMPTY_CU }); }}>
                <Plus className="w-3 h-3 mr-1" /> Cas d'usage
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
