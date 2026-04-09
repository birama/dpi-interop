import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, institutionsApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  ACCES_DONNEES: { label: 'Accès données', desc: 'Consommer des données d\'une autre administration', color: 'bg-blue-100 text-blue-700' },
  CONVENTION: { label: 'Convention', desc: 'Formaliser un protocole d\'échange', color: 'bg-teal-50 text-teal' },
  CONNEXION_PINS: { label: 'Connexion PINS', desc: 'Connecter mon SI à PINS/X-Road', color: 'bg-gold-50 text-gold' },
  ACCOMPAGNEMENT: { label: 'Accompagnement', desc: 'Appui technique de la DU', color: 'bg-emerald-50 text-emerald-700' },
  SIGNALEMENT: { label: 'Signalement', desc: 'Problème sur un flux existant', color: 'bg-red-50 text-red-500' },
};
const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  SOUMISE: { label: 'Soumise', color: 'bg-blue-100 text-blue-700' },
  EN_COURS_TRAITEMENT: { label: 'En cours', color: 'bg-gold-50 text-gold' },
  EN_ATTENTE_PARTENAIRE: { label: 'Attente partenaire', color: 'bg-orange-100 text-orange-600' },
  RESOLUE: { label: 'Résolue', color: 'bg-success/10 text-success' },
  REJETEE: { label: 'Rejetée', color: 'bg-red-50 text-red-500' },
};
const URGENCE_COLORS: Record<string, string> = { FAIBLE: 'bg-gray-100 text-gray-500', NORMALE: 'bg-blue-100 text-blue-600', HAUTE: 'bg-orange-100 text-orange-600', CRITIQUE: 'bg-red-100 text-red-700' };

export function DemandesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>({ type: 'ACCES_DONNEES', titre: '', description: '', demandeurNom: '', demandeurEmail: '', institutionCibleId: '', donneesVisees: '', justification: '', urgence: 'NORMALE' });
  const [reponse, setReponse] = useState('');
  const [newStatut, setNewStatut] = useState('');

  const { data: instsData } = useQuery({ queryKey: ['insts-demandes'], queryFn: () => institutionsApi.getAll({ limit: 500 }) });
  const instOptions = (instsData?.data?.data || []).map((i: any) => ({ value: i.id, label: i.nom, sublabel: i.code }));

  const { data: demandesData, isLoading } = useQuery({
    queryKey: ['demandes', isAdmin ? 'all' : 'mine'],
    queryFn: () => isAdmin ? api.get('/demandes') : api.get('/demandes/mine'),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post('/demandes', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['demandes'] }); setShowForm(false); toast({ title: 'Demande soumise' }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => api.patch(`/demandes/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['demandes'] }); setSelected(null); toast({ title: 'Demande mise à jour' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;

  const demandes = demandesData?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-navy">{isAdmin ? 'Demandes d\'interopérabilité' : 'Mes demandes'}</h1><p className="text-xs text-gray-500">{isAdmin ? 'Traitement des demandes des institutions' : 'Formuler une demande à la Delivery Unit'}</p></div>
        {!isAdmin && <Button size="sm" onClick={() => setShowForm(true)} className="bg-teal hover:bg-teal-dark"><Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle demande</Button>}
      </div>

      {/* Compteurs admin */}
      {isAdmin && (
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(STATUT_LABELS).map(([k, v]) => {
            const count = demandes.filter((d: any) => d.statut === k).length;
            return <Card key={k} className="border-l-4" style={{ borderLeftColor: k === 'SOUMISE' ? '#3B82F6' : k === 'RESOLUE' ? '#22C55E' : '#D4A820' }}><CardContent className="p-3"><p className="text-[10px] text-gray-500">{v.label}</p><p className="text-lg font-bold">{count}</p></CardContent></Card>;
          })}
        </div>
      )}

      {/* Formulaire nouvelle demande */}
      {showForm && (
        <Card className="border-2 border-teal/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-bold text-navy text-sm">Nouvelle demande</h3><button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md">{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.desc}</option>)}</select></div>
              <div><Label className="text-xs">Urgence</Label><select value={form.urgence} onChange={e => setForm({ ...form, urgence: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md"><option value="FAIBLE">Faible</option><option value="NORMALE">Normale</option><option value="HAUTE">Haute</option><option value="CRITIQUE">Critique</option></select></div>
            </div>
            <div><Label className="text-xs">Titre</Label><Input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Votre nom</Label><Input value={form.demandeurNom} onChange={e => setForm({ ...form, demandeurNom: e.target.value })} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Votre email</Label><Input value={form.demandeurEmail} onChange={e => setForm({ ...form, demandeurEmail: e.target.value })} className="h-8 text-sm" /></div>
            </div>
            <div><Label className="text-xs">Institution partenaire (optionnel)</Label><SearchableSelect options={instOptions} value={form.institutionCibleId} onChange={v => setForm({ ...form, institutionCibleId: v })} placeholder="Sélectionner..." /></div>
            {form.type === 'ACCES_DONNEES' && <div><Label className="text-xs">Données visées</Label><Textarea value={form.donneesVisees} onChange={e => setForm({ ...form, donneesVisees: e.target.value })} rows={2} className="text-sm" /></div>}
            <div><Label className="text-xs">Justification métier</Label><Textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} rows={2} className="text-sm" /></div>
            <Button size="sm" className="bg-teal hover:bg-teal-dark" disabled={!form.titre || !form.description || !form.demandeurNom} onClick={() => createMut.mutate(form)}>Soumettre</Button>
          </CardContent>
        </Card>
      )}

      {/* Liste */}
      <Card>
        <CardContent className="pt-4">
          {demandes.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">{isAdmin ? 'Aucune demande' : 'Vous n\'avez pas encore de demandes'}</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="border-b text-gray-500">
                {isAdmin && <th className="p-2 text-left">Institution</th>}
                <th className="p-2 text-left">Type</th><th className="p-2 text-left">Titre</th><th className="p-2 text-center">Urgence</th><th className="p-2 text-center">Statut</th><th className="p-2 text-center">Date</th><th className="p-2 text-right">Action</th>
              </tr></thead>
              <tbody>
                {demandes.map((d: any) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    {isAdmin && <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-navy/10 text-navy text-[10px]">{d.institution?.code || '?'}</span></td>}
                    <td className="p-2"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', TYPE_LABELS[d.type]?.color)}>{TYPE_LABELS[d.type]?.label}</span></td>
                    <td className="p-2 text-navy font-medium max-w-[200px] truncate">{d.titre}</td>
                    <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', URGENCE_COLORS[d.urgence])}>{d.urgence}</span></td>
                    <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', STATUT_LABELS[d.statut]?.color)}>{STATUT_LABELS[d.statut]?.label}</span></td>
                    <td className="p-2 text-center text-gray-500">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => { setSelected(d); setNewStatut(d.statut); setReponse(d.reponse || ''); }}>Détails</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between z-10">
              <h3 className="font-bold text-sm">{selected.titre}</h3>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span className={cn('px-2 py-0.5 rounded text-[10px]', TYPE_LABELS[selected.type]?.color)}>{TYPE_LABELS[selected.type]?.label}</span>
                <span className={cn('px-2 py-0.5 rounded text-[10px]', URGENCE_COLORS[selected.urgence])}>{selected.urgence}</span>
                <span className={cn('px-2 py-0.5 rounded text-[10px]', STATUT_LABELS[selected.statut]?.color)}>{STATUT_LABELS[selected.statut]?.label}</span>
              </div>
              <p className="text-xs text-gray-600">{selected.description}</p>
              {selected.donneesVisees && <div className="p-2 bg-blue-50 rounded text-xs"><p className="font-medium text-blue-700">Données visées</p><p>{selected.donneesVisees}</p></div>}
              {selected.justification && <div className="p-2 bg-gray-50 rounded text-xs"><p className="font-medium text-gray-700">Justification</p><p>{selected.justification}</p></div>}
              <p className="text-[10px] text-gray-400">Par {selected.demandeurNom} ({selected.demandeurEmail}) — {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>

              {selected.reponse && <div className="p-2 bg-teal-50 rounded text-xs border-l-4 border-l-teal"><p className="font-medium text-teal">Réponse DU</p><p>{selected.reponse}</p></div>}

              {isAdmin && (
                <div className="border-t pt-3 space-y-2">
                  <div><Label className="text-xs">Statut</Label><select value={newStatut} onChange={e => setNewStatut(e.target.value)} className="w-full h-8 px-2 text-sm border rounded-md">{Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                  <div><Label className="text-xs">Réponse</Label><Textarea value={reponse} onChange={e => setReponse(e.target.value)} rows={3} className="text-sm" /></div>
                  <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => updateMut.mutate({ id: selected.id, d: { statut: newStatut, reponse, respondantNom: user?.email } })}>Mettre à jour</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
