import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';
import { Pencil, Plus, X, Loader2, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUCHE_CONFIG: Record<string, { label: string; couleur: string }> = {
  FONDATION: { label: 'Couche Fondation', couleur: '#0C1F3A' },
  INTEGRATION: { label: 'Couche Intégration', couleur: '#0A6B68' },
  INFRASTRUCTURE: { label: 'Couche Infrastructure', couleur: '#D4A820' },
  APPLICATION: { label: 'Couche Application', couleur: '#2D6A4F' },
};

const STATUT_LABELS: Record<string, string> = {
  OPERATIONNEL: 'Opérationnel', EN_DEPLOIEMENT: 'En déploiement', PLANIFIE: 'Planifié', NON_DEMARRE: 'Non démarré',
};
const STATUT_COLORS: Record<string, string> = {
  OPERATIONNEL: 'bg-success text-white', EN_DEPLOIEMENT: 'bg-teal text-white', PLANIFIE: 'bg-gold text-white', NON_DEMARRE: 'bg-gray-400 text-white',
};

const EMPTY_FORM = { code: '', nom: '', description: '', couche: 'FONDATION', statut: 'NON_DEMARRE', operateur: '', compatibleXRoad: false, technologie: '', urlDocumentation: '', observations: '', ordre: 0 };

export function CataloguePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState<string | null>(null); // couche for new
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery({
    queryKey: ['building-blocks'],
    queryFn: () => api.get('/building-blocks').then(r => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/building-blocks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['building-blocks'] }); closeForm(); toast({ title: 'Building block mis à jour' }); },
  });
  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/building-blocks', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['building-blocks'] }); closeForm(); toast({ title: 'Building block créé' }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/building-blocks/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['building-blocks'] }); toast({ title: 'Building block supprimé' }); },
  });

  const closeForm = () => { setEditing(null); setCreating(null); setForm({ ...EMPTY_FORM }); };

  const openEdit = (block: any) => {
    setEditing(block);
    setCreating(null);
    setForm({ ...block });
  };

  const openCreate = (couche: string) => {
    setCreating(couche);
    setEditing(null);
    setForm({ ...EMPTY_FORM, couche });
  };

  const handleSave = () => {
    if (editing) {
      const { id, createdAt, updatedAt, ...rest } = form;
      updateMut.mutate({ id: editing.id, data: rest });
    } else {
      createMut.mutate(form);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const blocks = data || [];
  const groupedByCouche: Record<string, any[]> = {};
  for (const couche of ['FONDATION', 'INTEGRATION', 'INFRASTRUCTURE', 'APPLICATION']) {
    groupedByCouche[couche] = blocks.filter((b: any) => b.couche === couche);
  }

  const showForm = editing || creating;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Catalogue des Building Blocks DPI</h1>
        <p className="text-gray-500 mt-1">Composants d'infrastructure publique numérique du Sénégal (CatIS)</p>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUT_LABELS).map(([key, label]) => (
          <span key={key} className={cn('px-3 py-1 rounded-full text-xs font-medium', STATUT_COLORS[key])}>{label}</span>
        ))}
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-navy/10 text-navy border border-navy/20">Compatible X-Road</span>
      </div>

      {/* Modal édition/création */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-navy text-white px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
              <h3 className="font-bold">{editing ? `Modifier : ${editing.nom}` : `Nouveau building block`}</h3>
              <button onClick={closeForm}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-xs">Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex: DATA-EXCHANGE" disabled={!!editing} /></div>
                <div><Label className="text-xs">Nom</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
                <div><Label className="text-xs">Opérateur</Label><Input value={form.operateur || ''} onChange={e => setForm({ ...form, operateur: e.target.value })} placeholder="Ex: SENUM SA" /></div>
              </div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Couche</Label>
                  <select value={form.couche} onChange={e => setForm({ ...form, couche: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md" disabled={!!editing && !creating}>
                    {Object.entries(COUCHE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Statut</Label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md">
                    {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><Label className="text-xs">Technologie</Label><Input value={form.technologie || ''} onChange={e => setForm({ ...form, technologie: e.target.value })} placeholder="Ex: X-Road 7" /></div>
                <div><Label className="text-xs">Ordre</Label><Input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">URL documentation</Label><Input value={form.urlDocumentation || ''} onChange={e => setForm({ ...form, urlDocumentation: e.target.value })} placeholder="https://..." /></div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={form.compatibleXRoad} onChange={e => setForm({ ...form, compatibleXRoad: e.target.checked })} className="rounded border-gray-300 text-teal" />
                    <span>Compatible X-Road</span>
                  </label>
                </div>
              </div>
              <div><Label className="text-xs">Observations</Label><Textarea value={form.observations || ''} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} /></div>
              <div className="flex space-x-2 pt-2 border-t">
                <Button onClick={handleSave} disabled={!form.code || !form.nom} className="bg-teal hover:bg-teal-dark">
                  {(updateMut.isPending || createMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editing ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button variant="outline" onClick={closeForm}>Annuler</Button>
                {editing && isAdmin && (
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 ml-auto" onClick={() => { if (confirm('Supprimer ce building block ?')) { deleteMut.mutate(editing.id); closeForm(); } }}>Supprimer</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Couches */}
      {Object.entries(COUCHE_CONFIG).map(([couche, config]) => (
        <div key={couche}>
          <h2 className="text-lg font-bold text-white px-4 py-3 rounded-t-lg" style={{ backgroundColor: config.couleur }}>
            {config.label}
            <span className="text-xs font-normal ml-2 opacity-75">({groupedByCouche[couche]?.length || 0} blocs)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-b-lg border border-t-0">
            {groupedByCouche[couche]?.map((block: any) => (
              <Card key={block.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.couleur + '15' }}>
                      <Network className="w-4 h-4" style={{ color: config.couleur }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy text-xs">{block.nom}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{block.description}</p>
                      <div className="flex items-center flex-wrap gap-1 mt-1.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', STATUT_COLORS[block.statut])}>{STATUT_LABELS[block.statut]}</span>
                        {block.compatibleXRoad && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-navy/10 text-navy">X-Road</span>}
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1">Opérateur : {block.operateur || '—'}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="mt-2 pt-1.5 border-t flex justify-end">
                      <button onClick={() => openEdit(block)} className="text-[10px] text-teal hover:text-teal-dark flex items-center">
                        <Pencil className="w-3 h-3 mr-0.5" /> Modifier
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Bouton ajouter (admin) */}
            {isAdmin && (
              <button onClick={() => openCreate(couche)} className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center text-gray-400 hover:text-teal hover:border-teal transition-colors">
                <Plus className="w-5 h-5 mr-2" />
                <span className="text-sm">Ajouter un bloc</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
