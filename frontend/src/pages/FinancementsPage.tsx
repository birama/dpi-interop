import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown, Plus, X, Pencil, Trash2, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const TYPE_COLORS: Record<string, string> = { BILATERAL: 'bg-blue-100 text-blue-700', MULTILATERAL: 'bg-violet-100 text-violet-700', FONDATION: 'bg-emerald-100 text-emerald-700', ETAT: 'bg-gold-50 text-gold', PRIVE: 'bg-gray-100 text-gray-600' };
const FIN_COLORS: Record<string, string> = { IDENTIFIE: 'bg-gray-100 text-gray-500', DEMANDE: 'bg-gold-50 text-gold', EN_NEGOCIATION: 'bg-orange-100 text-orange-600', ACCORDE: 'bg-teal-50 text-teal', EN_COURS: 'bg-emerald-50 text-emerald-700', CLOTURE: 'bg-navy/10 text-navy', REFUSE: 'bg-red-50 text-red-500' };
const IMPACT_COLORS: Record<string, string> = { CRITIQUE: 'bg-red-100 text-red-700', ELEVE: 'bg-orange-100 text-orange-700', MOYEN: 'bg-gray-100 text-gray-600', FAIBLE: 'bg-gray-50 text-gray-400' };
const STATUT_IMPL: Record<string, string> = { IDENTIFIE: 'bg-gray-100 text-gray-600', PRIORISE: 'bg-gold-50 text-gold', EN_PREPARATION: 'bg-blue-100 text-blue-600', EN_DEVELOPPEMENT: 'bg-blue-200 text-blue-700', EN_TEST: 'bg-teal-50 text-teal', EN_PRODUCTION: 'bg-success/10 text-success', SUSPENDU: 'bg-red-50 text-red-500' };

const EMPTY_PTF = { code: '', nom: '', acronyme: '', type: 'BILATERAL', pays: '', contactNom: '', contactEmail: '' };
const EMPTY_PROG = { code: '', nom: '', consortium: '', partenaireTechnique: '', composantsDPI: '', statut: 'ACTIF', description: '' };
const EMPTY_EXPERT = { nom: '', profil: '', role: '', prestataire: '', programmeId: '', dateDebut: '', dateFin: '', actif: true };

export function FinancementsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const inv = (keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  const [tab, setTab] = useState<'overview' | 'orphelins' | 'experts'>('overview');
  const [expandedPTF, setExpandedPTF] = useState<string | null>(null);
  const [expandedProg, setExpandedProg] = useState<string | null>(null);

  // Modals
  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
  const [form, setForm] = useState<any>({});

  // Queries
  const { data: ptfData, isLoading } = useQuery({ queryKey: ['ptf'], queryFn: () => api.get('/ptf') });
  const { data: orphData } = useQuery({ queryKey: ['orphelins'], queryFn: () => api.get('/cas-usage-mvp/orphelins') });
  const { data: statsData } = useQuery({ queryKey: ['fin-stats'], queryFn: () => api.get('/cas-usage-mvp/overview/stats') });
  const { data: expertsData } = useQuery({ queryKey: ['experts'], queryFn: () => api.get('/expertises') });
  const { data: allCUData } = useQuery({ queryKey: ['all-cu'], queryFn: () => api.get('/cas-usage-mvp') });

  // Mutations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mut = <T = any,>(fn: (vars: T) => Promise<any>, keys: string[], msg: string) => useMutation<any, any, T>({ mutationFn: fn, onSuccess: () => { inv(keys); setModal(null); toast({ title: msg }); }, onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || '' }) });

  const createPTF = mut((d: any) => api.post('/ptf', d), ['ptf'], 'PTF créé');
  const updatePTF = mut(({ id, d }: any) => api.patch(`/ptf/${id}`, d), ['ptf'], 'PTF modifié');
  const deletePTF = mut((id: string) => api.delete(`/ptf/${id}`), ['ptf'], 'PTF supprimé');
  const createProg = mut((d: any) => api.post('/programmes', d), ['ptf'], 'Programme créé');
  const updateProg = mut(({ id, d }: any) => api.patch(`/programmes/${id}`, d), ['ptf'], 'Programme modifié');
  const deleteProg = mut((id: string) => api.delete(`/programmes/${id}`), ['ptf'], 'Programme supprimé');
  const createFin = mut(({ cuId, d }: any) => api.post(`/cas-usage-mvp/${cuId}/financement`, d), ['ptf', 'orphelins', 'fin-stats', 'all-cu'], 'Financement ajouté');
  const updateFin = mut(({ id, d }: any) => api.patch(`/financements/${id}`, d), ['ptf', 'fin-stats'], 'Financement modifié');
  const deleteFin = mut((id: string) => api.delete(`/financements/${id}`), ['ptf', 'orphelins', 'fin-stats'], 'Financement retiré');
  const createExpert = mut((d: any) => api.post('/expertises', d), ['ptf', 'experts'], 'Expert ajouté');
  const updateExpert = mut(({ id, d }: any) => api.patch(`/expertises/${id}`, d), ['ptf', 'experts'], 'Expert modifié');
  const deleteExpert = mut((id: string) => api.delete(`/expertises/${id}`), ['ptf', 'experts'], 'Expert supprimé');

  const handleExport = async (ptfCode: string) => {
    try {
      const r = await api.get(`/reports/note-financement/${ptfCode}/word`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `note-${ptfCode}.docx`; a.click(); URL.revokeObjectURL(url);
      toast({ title: 'Note générée' });
    } catch { toast({ variant: 'destructive', title: 'Export non disponible' }); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;

  const ptfs = ptfData?.data || [];
  const orphelins = orphData?.data || [];
  const stats = statsData?.data || {};
  const allExperts = expertsData?.data || [];
  const allCU = allCUData?.data || [];
  const totalProg = ptfs.reduce((s: number, p: any) => s + (p.programmes?.length || 0), 0);
  const activeExperts = allExperts.filter((e: any) => e.actif).length;

  // Helper: CU not financed by a specific programme
  const cuNotInProg = (progId: string) => allCU.filter((cu: any) => !cu.financements?.some((f: any) => f.programmeId === progId));

  const openModal = (type: string, data?: any) => {
    setModal({ type, data });
    if (type === 'propose-fin') setForm({ programmeId: '' });
    else if (type === 'add-fin') setForm({ programmeId: data?.programmeId, casUsageMVPId: '', statut: 'IDENTIFIE', typeFinancement: '' });
    else if (type === 'edit-fin') setForm({ ...data });
    else if (type === 'edit-ptf') setForm({ ...data });
    else if (type === 'edit-prog') setForm({ ...data });
    else if (type === 'edit-expert') setForm({ ...data });
    else if (type === 'ptf') setForm({ ...EMPTY_PTF });
    else if (type === 'prog') setForm({ ...EMPTY_PROG, ptfId: data?.ptfId });
    else if (type === 'expert') setForm({ ...EMPTY_EXPERT, programmeId: data?.programmeId || '' });
    else setForm({});
  };
  const closeModal = () => setModal(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-navy">Financements & Partenaires</h1><p className="text-xs text-gray-500">PTF, programmes, allocations budgétaires et experts</p></div>
        <Button size="sm" onClick={() => openModal('ptf')} className="bg-teal hover:bg-teal-dark"><Plus className="w-3.5 h-3.5 mr-1" /> Nouveau PTF</Button>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">PTF actifs</p><p className="text-lg font-bold text-navy">{ptfs.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Programmes</p><p className="text-lg font-bold text-teal">{totalProg}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Cas financés</p><p className="text-lg font-bold text-success">{stats.casUsageFinances || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Orphelins</p><p className="text-lg font-bold text-red-500">{stats.casUsageOrphelins || 0}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Experts actifs</p><p className="text-lg font-bold text-gold">{activeExperts}</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {([['overview', 'Vue d\'ensemble'], ['orphelins', `Cas orphelins (${orphelins.length})`], ['experts', `Experts (${allExperts.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === id ? 'border-teal text-teal' : 'border-transparent text-gray-500 hover:text-gray-700')}>{label}</button>
        ))}
      </div>

      {/* ===== TAB 1 : VUE D'ENSEMBLE ===== */}
      {tab === 'overview' && ptfs.map((ptf: any) => {
        const isExp = expandedPTF === ptf.id;
        const totalFin = ptf.programmes?.reduce((s: number, p: any) => s + (p.financements?.length || 0), 0) || 0;
        const inProd = ptf.programmes?.reduce((s: number, p: any) => s + (p.financements?.filter((f: any) => f.casUsageMVP?.statutImpl === 'EN_PRODUCTION').length || 0), 0) || 0;
        return (
          <Card key={ptf.id}>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedPTF(isExp ? null : ptf.id)}>
              <div className="flex items-center space-x-3">
                {isExp ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="font-bold text-navy text-sm">{ptf.acronyme}</span>
                <span className="text-xs text-gray-400">{ptf.nom}</span>
                <span className={cn('px-1.5 py-0.5 rounded text-[10px]', TYPE_COLORS[ptf.type])}>{ptf.type}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>{ptf.programmes?.length} prog.</span>
                <span className="text-teal font-medium">{totalFin} financés</span>
                {totalFin > 0 && <span className="text-success">{inProd}/{totalFin} en prod</span>}
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openModal('edit-ptf', ptf); }}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleExport(ptf.code); }}><FileDown className="w-3 h-3" /></Button>
              </div>
            </div>

            {isExp && (
              <CardContent className="pt-0 space-y-3">
                {ptf.programmes?.map((prog: any) => {
                  const isProgExp = expandedProg === prog.id;
                  return (
                    <div key={prog.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedProg(isProgExp ? null : prog.id)}>
                        <div className="flex items-center space-x-2">
                          {isProgExp ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                          <span className="font-medium text-navy text-xs">{prog.code}</span>
                          <span className="text-xs text-gray-500">{prog.nom}</span>
                          {prog.partenaireTechnique && <span className="text-[10px] text-gray-400">• {prog.partenaireTechnique}</span>}
                        </div>
                        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px]', prog.statut === 'ACTIF' ? 'bg-teal-50 text-teal' : 'bg-gray-100 text-gray-500')}>{prog.statut}</span>
                          <Button variant="ghost" size="sm" onClick={() => openModal('edit-prog', prog)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm('Supprimer ce programme ?')) deleteProg.mutate(prog.id); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>

                      {isProgExp && (
                        <div className="border-t p-3 space-y-3 bg-gray-50/50">
                          {/* Cas d'usage financés */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-xs font-medium text-navy">Cas d'usage financés ({prog.financements?.length || 0})</h5>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => openModal('add-fin', { programmeId: prog.id, programmeName: prog.code })}><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
                            </div>
                            {prog.financements?.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead><tr className="border-b text-gray-500"><th className="p-1 text-left">Code</th><th className="p-1 text-left">Titre</th><th className="p-1 text-center">Statut impl.</th><th className="p-1 text-center">Financement</th><th className="p-1 text-right">Montant</th><th className="p-1 text-right">Actions</th></tr></thead>
                                <tbody>{prog.financements.map((fin: any) => (
                                  <tr key={fin.id} className="border-b">
                                    <td className="p-1 font-mono text-teal">{fin.casUsageMVP?.code || '—'}</td>
                                    <td className="p-1 text-navy max-w-[200px] truncate">{fin.casUsageMVP?.titre || '—'}</td>
                                    <td className="p-1 text-center"><span className={cn('px-1 py-0.5 rounded text-[9px]', STATUT_IMPL[fin.casUsageMVP?.statutImpl] || 'bg-gray-100')}>{fin.casUsageMVP?.statutImpl || '—'}</span></td>
                                    <td className="p-1 text-center"><span className={cn('px-1 py-0.5 rounded text-[9px]', FIN_COLORS[fin.statut])}>{fin.statut}</span></td>
                                    <td className="p-1 text-right">{fin.montantAlloue ? `${(fin.montantAlloue / 1000000).toFixed(1)}M` : '—'}</td>
                                    <td className="p-1 text-right">
                                      <Button variant="ghost" size="sm" onClick={() => openModal('edit-fin', fin)}><Pencil className="w-3 h-3" /></Button>
                                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm('Retirer ce financement ?')) deleteFin.mutate(fin.id); }}><Trash2 className="w-3 h-3" /></Button>
                                    </td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            ) : <p className="text-[10px] text-gray-400 italic">Aucun cas d'usage financé</p>}
                          </div>

                          {/* Experts */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="text-xs font-medium text-navy">Experts ({prog.expertises?.length || 0})</h5>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => openModal('expert', { programmeId: prog.id })}><UserPlus className="w-3 h-3 mr-1" /> Expert</Button>
                            </div>
                            {prog.expertises?.map((e: any) => (
                              <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                                <div><span className="font-medium">{e.nom}</span> <span className="text-gray-400">— {e.profil}</span> {e.prestataire && <span className="text-gray-400">({e.prestataire})</span>}</div>
                                <div className="flex items-center space-x-1">
                                  <span className={cn('px-1 py-0.5 rounded text-[9px]', e.actif ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400')}>{e.actif ? 'Actif' : 'Terminé'}</span>
                                  <Button variant="ghost" size="sm" onClick={() => openModal('edit-expert', e)}><Pencil className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm('Supprimer cet expert ?')) deleteExpert.mutate(e.id); }}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" className="text-xs" onClick={() => openModal('prog', { ptfId: ptf.id })}><Plus className="w-3 h-3 mr-1" /> Nouveau programme</Button>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* ===== TAB 2 : ORPHELINS ===== */}
      {tab === 'orphelins' && (
        <Card><CardContent className="pt-4">
          {orphelins.length === 0 ? <p className="text-center py-8 text-gray-400 text-sm">Tous les cas d'usage sont financés</p> : (
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-gray-50 text-gray-500"><th className="p-2 text-left">Code</th><th className="p-2 text-left">Titre</th><th className="p-2 text-left">Flux</th><th className="p-2 text-center">Impact</th><th className="p-2 text-center">Phase</th><th className="p-2 text-right">Actions</th></tr></thead>
              <tbody>{orphelins.map((cu: any) => (
                <tr key={cu.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-teal">{cu.code}</td>
                  <td className="p-2 text-navy font-medium max-w-[200px] truncate">{cu.titre}</td>
                  <td className="p-2 text-gray-500">{[cu.institutionSourceCode, cu.institutionCibleCode].filter(Boolean).join(' → ')}</td>
                  <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', IMPACT_COLORS[cu.impact])}>{cu.impact}</span></td>
                  <td className="p-2 text-center">{cu.phaseMVP?.code || '—'}</td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => openModal('propose-fin', cu)}><Plus className="w-3 h-3 mr-1" /> Proposer à un PTF</Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent></Card>
      )}

      {/* ===== TAB 3 : EXPERTS ===== */}
      {tab === 'experts' && (
        <Card><CardContent className="pt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openModal('expert')} className="bg-teal hover:bg-teal-dark"><UserPlus className="w-3.5 h-3.5 mr-1" /> Nouvel expert</Button>
          </div>
          {allExperts.length === 0 ? <p className="text-center py-8 text-gray-400 text-sm">Aucun expert</p> : (
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-gray-50 text-gray-500"><th className="p-2 text-left">Nom</th><th className="p-2 text-left">Profil</th><th className="p-2 text-left">Rôle</th><th className="p-2 text-left">Prestataire</th><th className="p-2 text-center">Programme</th><th className="p-2 text-center">Actif</th><th className="p-2 text-right">Actions</th></tr></thead>
              <tbody>{allExperts.map((e: any) => (
                <tr key={e.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-navy">{e.nom}</td>
                  <td className="p-2 text-gray-500">{e.profil}</td>
                  <td className="p-2 text-gray-500 max-w-[180px] truncate">{e.role || '—'}</td>
                  <td className="p-2">{e.prestataire || '—'}</td>
                  <td className="p-2 text-center"><span className="px-1.5 py-0.5 rounded bg-navy/10 text-navy text-[10px]">{e.programme?.ptf?.acronyme} / {e.programme?.code}</span></td>
                  <td className="p-2 text-center"><span className={cn('px-1 py-0.5 rounded text-[9px]', e.actif ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400')}>{e.actif ? 'Actif' : 'Terminé'}</span></td>
                  <td className="p-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openModal('edit-expert', e)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm('Supprimer ?')) deleteExpert.mutate(e.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent></Card>
      )}

      {/* ===== MODALS ===== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between z-10">
              <h3 className="font-bold text-sm">
                {modal.type === 'ptf' && 'Nouveau PTF'}
                {modal.type === 'edit-ptf' && `Modifier ${modal.data?.acronyme}`}
                {modal.type === 'prog' && 'Nouveau programme'}
                {modal.type === 'edit-prog' && `Modifier ${modal.data?.code}`}
                {(modal.type === 'expert' || modal.type === 'edit-expert') && (modal.type === 'edit-expert' ? `Modifier ${modal.data?.nom}` : 'Nouvel expert')}
                {modal.type === 'edit-fin' && 'Modifier le financement'}
                {modal.type === 'add-fin' && `Ajouter un cas d'usage à ${modal.data?.programmeName}`}
                {modal.type === 'propose-fin' && `Proposer ${modal.data?.code} à un PTF`}
              </h3>
              <button onClick={closeModal}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">

              {/* PTF Form */}
              {(modal.type === 'ptf' || modal.type === 'edit-ptf') && (<>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Code</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} disabled={modal.type === 'edit-ptf'} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Acronyme</Label><Input value={form.acronyme || ''} onChange={e => setForm({ ...form, acronyme: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Type</Label><select value={form.type || 'BILATERAL'} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="BILATERAL">Bilatéral</option><option value="MULTILATERAL">Multilatéral</option><option value="FONDATION">Fondation</option><option value="ETAT">État</option><option value="PRIVE">Privé</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nom complet</Label><Input value={form.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Pays</Label><Input value={form.pays || ''} onChange={e => setForm({ ...form, pays: e.target.value })} className="h-8 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Contact</Label><Input value={form.contactNom || ''} onChange={e => setForm({ ...form, contactNom: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Email</Label><Input value={form.contactEmail || ''} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="h-8 text-sm" /></div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => modal.type === 'edit-ptf' ? updatePTF.mutate({ id: form.id, d: { nom: form.nom, acronyme: form.acronyme, type: form.type, pays: form.pays, contactNom: form.contactNom, contactEmail: form.contactEmail } }) : createPTF.mutate(form)}>Sauvegarder</Button>
                  {modal.type === 'edit-ptf' && <Button size="sm" variant="outline" className="text-red-500 ml-auto" onClick={() => { if (confirm('Supprimer ce PTF et tous ses programmes ?')) { deletePTF.mutate(form.id); closeModal(); } }}>Supprimer le PTF</Button>}
                </div>
              </>)}

              {/* Programme Form */}
              {(modal.type === 'prog' || modal.type === 'edit-prog') && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Code</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} disabled={modal.type === 'edit-prog'} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Nom</Label><Input value={form.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="h-8 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Consortium</Label><Input value={form.consortium || ''} onChange={e => setForm({ ...form, consortium: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Partenaire technique</Label><Input value={form.partenaireTechnique || ''} onChange={e => setForm({ ...form, partenaireTechnique: e.target.value })} className="h-8 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Composants DPI</Label><Input value={form.composantsDPI || ''} onChange={e => setForm({ ...form, composantsDPI: e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Statut</Label><select value={form.statut || 'ACTIF'} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="EN_PREPARATION">En préparation</option><option value="ACTIF">Actif</option><option value="EN_CLOTURE">En clôture</option><option value="CLOTURE">Clôturé</option><option value="SUSPENDU">Suspendu</option></select></div>
                <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => modal.type === 'edit-prog' ? updateProg.mutate({ id: form.id, d: { nom: form.nom, consortium: form.consortium, partenaireTechnique: form.partenaireTechnique, composantsDPI: form.composantsDPI, statut: form.statut } }) : createProg.mutate({ ...form, ptfId: modal.data.ptfId })}>Sauvegarder</Button>
              </>)}

              {/* Expert Form */}
              {(modal.type === 'expert' || modal.type === 'edit-expert') && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nom</Label><Input value={form.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Profil</Label><Input value={form.profil || ''} onChange={e => setForm({ ...form, profil: e.target.value })} className="h-8 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Rôle</Label><Input value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} className="h-8 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Prestataire</Label><Input value={form.prestataire || ''} onChange={e => setForm({ ...form, prestataire: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Programme</Label>
                    <select value={form.programmeId || ''} onChange={e => setForm({ ...form, programmeId: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md">
                      <option value="">—</option>
                      {ptfs.flatMap((p: any) => p.programmes?.map((pr: any) => <option key={pr.id} value={pr.id}>{p.acronyme} / {pr.code}</option>) || [])}
                    </select>
                  </div>
                </div>
                <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={form.actif !== false} onChange={e => setForm({ ...form, actif: e.target.checked })} className="rounded" /><span>Actif</span></label>
                <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => {
                  const d = { nom: form.nom, profil: form.profil, role: form.role, prestataire: form.prestataire, programmeId: form.programmeId, actif: form.actif !== false };
                  modal.type === 'edit-expert' ? updateExpert.mutate({ id: form.id, d }) : createExpert.mutate(d);
                }}>Sauvegarder</Button>
              </>)}

              {/* Edit Financement */}
              {modal.type === 'edit-fin' && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Statut</Label>
                    <select value={form.statut || 'IDENTIFIE'} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md">
                      <option value="IDENTIFIE">Identifié</option><option value="DEMANDE">Demandé</option><option value="EN_NEGOCIATION">En négociation</option><option value="ACCORDE">Accordé</option><option value="EN_COURS">En cours</option><option value="CLOTURE">Clôturé</option><option value="REFUSE">Refusé</option>
                    </select>
                  </div>
                  <div><Label className="text-xs">Montant alloué (FCFA)</Label><Input type="number" value={form.montantAlloue || ''} onChange={e => setForm({ ...form, montantAlloue: parseFloat(e.target.value) || null })} className="h-8 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Type de financement</Label><Input value={form.typeFinancement || ''} onChange={e => setForm({ ...form, typeFinancement: e.target.value })} className="h-8 text-sm" placeholder="Ex: Assistance technique + Équipement" /></div>
                <div><Label className="text-xs">Observations</Label><Textarea value={form.observations || ''} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} className="text-sm" /></div>
                <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => updateFin.mutate({ id: form.id, d: { statut: form.statut, montantAlloue: form.montantAlloue, typeFinancement: form.typeFinancement, observations: form.observations } })}>Sauvegarder</Button>
              </>)}

              {/* Add Financement to programme */}
              {modal.type === 'add-fin' && (<>
                <div><Label className="text-xs">Cas d'usage</Label>
                  <select value={form.casUsageMVPId || ''} onChange={e => setForm({ ...form, casUsageMVPId: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md">
                    <option value="">— Sélectionner —</option>
                    {cuNotInProg(modal.data.programmeId).map((cu: any) => <option key={cu.id} value={cu.id}>{cu.code} — {cu.titre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Statut</Label><select value={form.statut || 'IDENTIFIE'} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="IDENTIFIE">Identifié</option><option value="DEMANDE">Demandé</option><option value="EN_NEGOCIATION">En négociation</option><option value="ACCORDE">Accordé</option><option value="EN_COURS">En cours</option></select></div>
                  <div><Label className="text-xs">Type</Label><Input value={form.typeFinancement || ''} onChange={e => setForm({ ...form, typeFinancement: e.target.value })} className="h-8 text-sm" placeholder="Ex: Assistance technique" /></div>
                </div>
                <Button size="sm" className="bg-teal hover:bg-teal-dark" disabled={!form.casUsageMVPId} onClick={() => createFin.mutate({ cuId: form.casUsageMVPId, d: { programmeId: modal.data.programmeId, statut: form.statut || 'IDENTIFIE', typeFinancement: form.typeFinancement } })}>Ajouter</Button>
              </>)}

              {/* Proposer orphelin à un PTF */}
              {modal.type === 'propose-fin' && (<>
                <p className="text-sm text-navy font-medium">{modal.data.code} — {modal.data.titre}</p>
                <p className="text-xs text-gray-500">{modal.data.institutionSourceCode} → {modal.data.institutionCibleCode}</p>
                <div><Label className="text-xs">Programme destinataire</Label>
                  <select value={form.programmeId || ''} onChange={e => setForm({ ...form, programmeId: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md">
                    <option value="">— Sélectionner —</option>
                    {ptfs.flatMap((p: any) => p.programmes?.map((pr: any) => <option key={pr.id} value={pr.id}>{p.acronyme} / {pr.code}</option>) || [])}
                  </select>
                </div>
                <Button size="sm" className="bg-teal hover:bg-teal-dark" disabled={!form.programmeId} onClick={() => createFin.mutate({ cuId: modal.data.id, d: { programmeId: form.programmeId, statut: 'IDENTIFIE' } })}>Proposer</Button>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
