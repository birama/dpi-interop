import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, institutionsApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { Loader2, Pencil, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOMAINE_COLORS: Record<string, { border: string }> = {
  'Identité & Population': { border: 'border-l-navy' },
  'Entreprises & Commerce': { border: 'border-l-teal' },
  'Foncier & Cadastre': { border: 'border-l-gold' },
  'Finances Publiques': { border: 'border-l-success' },
  'Protection Sociale': { border: 'border-l-blue-500' },
};
const STATUT_EJOKKOO: Record<string, string> = {
  'Connecté': 'bg-success/10 text-success', 'En cours': 'bg-teal-50 text-teal', 'En cours (MVP 1.0)': 'bg-teal-50 text-teal',
  'Planifié': 'bg-gold-50 text-gold', 'Non connecté': 'bg-gray-100 text-gray-500',
};
const STATUT_NUM: Record<string, string> = {
  'Opérationnel': 'bg-success/10 text-success', 'Opérationnel (en production)': 'bg-success/10 text-success',
  'En cours': 'bg-gold-50 text-gold', 'En cours (Lots 1 & 2 en validation)': 'bg-gold-50 text-gold', 'En déploiement': 'bg-gold-50 text-gold',
  'Partiel': 'bg-orange-100 text-orange-600', 'Planifié': 'bg-gray-100 text-gray-500',
};

export function RegistresNationauxPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['registres-nat'], queryFn: () => api.get('/registres-nationaux').then(r => r.data) });
  const { data: instsData } = useQuery({ queryKey: ['institutions-reg'], queryFn: () => institutionsApi.getAll({ limit: 500 }) });
  const institutions = instsData?.data?.data || [];
  const instOptions = institutions.map((i: any) => ({ value: i.code, label: i.nom, sublabel: `${i.code} — ${i.ministere}` }));

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/registres-nationaux/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['registres-nat'] }); setModal(null); toast({ title: 'Registre mis à jour' }); },
  });
  const createMut = useMutation({
    mutationFn: (d: any) => api.post('/registres-nationaux', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['registres-nat'] }); setModal(null); toast({ title: 'Registre créé' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;

  const registres = data || [];
  const filtered = filter ? registres.filter((r: any) => r.domaine === filter) : registres;
  const grouped: Record<string, any[]> = {};
  for (const r of filtered) { if (!grouped[r.domaine]) grouped[r.domaine] = []; grouped[r.domaine].push(r); }

  const domaines = [...new Set(registres.map((r: any) => r.domaine))];
  const withAPI = registres.filter((r: any) => r.disposeAPI).length;
  const connected = registres.filter((r: any) => r.statutEjokkoo?.includes('cours') || r.statutEjokkoo === 'Connecté').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-navy">Registres Nationaux</h1><p className="text-xs text-gray-500">Référentiel autoritaire des bases de données nationales</p></div>
        <Button size="sm" onClick={() => { setModal('create'); setForm({ code: '', nom: '', domaine: 'Finances Publiques', institutionCode: '', institutionNom: '', systemeSource: '', identifiantPivot: '', statutNumerisation: '', statutEjokkoo: '', disposeAPI: false, protocoleAPI: '', consommateurs: '', observations: '' }); }} className="bg-teal hover:bg-teal-dark"><Plus className="w-3.5 h-3.5 mr-1" /> Nouveau</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Registres</p><p className="text-lg font-bold text-navy">{registres.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Avec API</p><p className="text-lg font-bold text-teal">{withAPI}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">e-jokkoo</p><p className="text-lg font-bold text-success">{connected}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Domaines</p><p className="text-lg font-bold text-gold">{domaines.length}</p></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={cn('px-3 py-1 rounded-full text-xs font-medium', !filter ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600')}>Tous ({registres.length})</button>
        {domaines.map(d => <button key={d} onClick={() => setFilter(d === filter ? '' : d)} className={cn('px-3 py-1 rounded-full text-xs font-medium', d === filter ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600')}>{d}</button>)}
      </div>

      {Object.entries(grouped).map(([domaine, regs]) => {
        const dc = DOMAINE_COLORS[domaine] || { border: 'border-l-gray-400' };
        return (
          <div key={domaine}>
            <h2 className="text-sm font-bold text-navy mb-2">{domaine} <span className="text-gray-400 font-normal">({regs.length})</span></h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {regs.map((reg: any) => (
                <Card key={reg.id} className={cn('border-l-4', dc.border)}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-navy/10 text-navy font-bold">{reg.code}</span>
                          <span className="font-medium text-navy text-xs truncate">{reg.nom}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{reg.institutionCode} — {reg.institutionNom}</p>
                      </div>
                      <button onClick={() => { setModal('edit'); setForm({ ...reg }); }} className="p-1 hover:bg-gray-100 rounded"><Pencil className="w-3 h-3 text-gray-400" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reg.statutNumerisation && <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', STATUT_NUM[reg.statutNumerisation] || 'bg-gray-100 text-gray-500')}>{reg.statutNumerisation}</span>}
                      {reg.statutEjokkoo && <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', STATUT_EJOKKOO[reg.statutEjokkoo] || 'bg-gray-100 text-gray-500')}>e-jokkoo: {reg.statutEjokkoo}</span>}
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', reg.disposeAPI ? 'bg-teal-50 text-teal' : 'bg-red-50 text-red-500')}>API: {reg.disposeAPI ? 'Oui' : 'Non'}</span>
                    </div>
                    {reg.identifiantPivot && <p className="text-[10px] text-gray-500 mt-1.5">Pivot : <span className="font-medium text-navy">{reg.identifiantPivot}</span></p>}
                    {reg.systemeSource && <p className="text-[10px] text-gray-400">Système : {reg.systemeSource}</p>}
                    {reg.consommateurs && <p className="text-[10px] text-gray-400 mt-1">Consommateurs : {reg.consommateurs}</p>}
                    {reg.observations && <p className="text-[10px] text-gray-400 mt-1 italic border-t pt-1">{reg.observations}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between z-10">
              <h3 className="font-bold text-sm">{modal === 'edit' ? `Modifier ${form.code}` : 'Nouveau registre'}</h3>
              <button onClick={() => setModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Code</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} disabled={modal === 'edit'} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Label className="text-xs">Nom</Label><Input value={form.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Domaine</Label><select value={form.domaine || ''} onChange={e => setForm({ ...form, domaine: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="Identité & Population">Identité & Population</option><option value="Entreprises & Commerce">Entreprises & Commerce</option><option value="Foncier & Cadastre">Foncier & Cadastre</option><option value="Finances Publiques">Finances Publiques</option><option value="Protection Sociale">Protection Sociale</option><option value="Santé">Santé</option></select></div>
                <div>
                  <Label className="text-xs">Institution responsable</Label>
                  <SearchableSelect
                    options={instOptions}
                    value={form.institutionCode || ''}
                    onChange={(code) => {
                      const inst = institutions.find((i: any) => i.code === code);
                      setForm({ ...form, institutionCode: code, institutionNom: inst?.nom || '' });
                    }}
                    placeholder="Rechercher une institution..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Système source</Label><Input value={form.systemeSource || ''} onChange={e => setForm({ ...form, systemeSource: e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Identifiant pivot</Label><Input value={form.identifiantPivot || ''} onChange={e => setForm({ ...form, identifiantPivot: e.target.value })} className="h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Statut numérisation</Label><select value={form.statutNumerisation || ''} onChange={e => setForm({ ...form, statutNumerisation: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="">—</option><option value="Opérationnel">Opérationnel</option><option value="En cours">En cours</option><option value="En déploiement">En déploiement</option><option value="Planifié">Planifié</option></select></div>
                <div><Label className="text-xs">Statut e-jokkoo</Label><select value={form.statutEjokkoo || ''} onChange={e => setForm({ ...form, statutEjokkoo: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="">—</option><option value="Connecté">Connecté</option><option value="En cours">En cours</option><option value="En cours (MVP 1.0)">En cours (MVP 1.0)</option><option value="Planifié">Planifié</option><option value="Non connecté">Non connecté</option></select></div>
                <div className="flex items-end pb-1"><label className="flex items-center space-x-1 text-xs"><input type="checkbox" checked={form.disposeAPI || false} onChange={e => setForm({ ...form, disposeAPI: e.target.checked })} className="rounded" /><span>API disponible</span></label></div>
              </div>
              <div><Label className="text-xs">Protocole API</Label><Input value={form.protocoleAPI || ''} onChange={e => setForm({ ...form, protocoleAPI: e.target.value })} className="h-8 text-sm" /></div>
              <div>
                <Label className="text-xs">Consommateurs (institutions)</Label>
                <MultiSearchableSelect
                  options={instOptions}
                  value={form.consommateurs || ''}
                  onChange={(val) => setForm({ ...form, consommateurs: val })}
                  placeholder="Sélectionner les consommateurs..."
                />
              </div>
              <div><Label className="text-xs">Observations</Label><Textarea value={form.observations || ''} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} className="text-sm" /></div>
              <div className="flex space-x-2 pt-2">
                <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => { const { id, createdAt, updatedAt, ...d } = form; modal === 'edit' ? updateMut.mutate({ id: form.id, d }) : createMut.mutate(d); }}>Sauvegarder</Button>
                <Button size="sm" variant="outline" onClick={() => setModal(null)}>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
