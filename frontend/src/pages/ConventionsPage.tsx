import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { api, institutionsApi } from '@/services/api';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, FileCheck, Loader2, X, Pencil, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  NON_INITIEE: 'Non initiée', EN_COURS_REDACTION: 'En rédaction',
  EN_ATTENTE_SIGNATURE_A: 'Attente signature A', EN_ATTENTE_SIGNATURE_B: 'Attente signature B',
  SIGNEE: 'Signée', ACTIVE: 'Active', EXPIREE: 'Expirée', SUSPENDUE: 'Suspendue',
};
const STATUS_COLORS: Record<string, string> = {
  NON_INITIEE: 'bg-gray-100 text-gray-600', EN_COURS_REDACTION: 'bg-gold-50 text-gold',
  EN_ATTENTE_SIGNATURE_A: 'bg-orange-100 text-orange-600', EN_ATTENTE_SIGNATURE_B: 'bg-orange-100 text-orange-600',
  SIGNEE: 'bg-teal-50 text-teal', ACTIVE: 'bg-emerald-50 text-emerald-700',
  EXPIREE: 'bg-red-50 text-red-500', SUSPENDUE: 'bg-gray-200 text-gray-500',
};

const EMPTY_FORM = { institutionAId: '', institutionBId: '', objet: '', donneesVisees: '', statut: 'NON_INITIEE', referenceDocument: '', lienDocument: '', observations: '', dateInitiation: '', dateRedaction: '', dateSignatureA: '', dateSignatureB: '', dateActivation: '', dateExpiration: '' };

export function ConventionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });

  const { data: conventions, isLoading } = useQuery({ queryKey: ['conventions'], queryFn: () => api.get('/conventions') });
  const { data: instsData } = useQuery({ queryKey: ['institutions-conv'], queryFn: () => institutionsApi.getAll({ limit: 500 }) });

  const institutions = instsData?.data?.data || [];
  const instOptions = institutions.map((i: any) => ({ value: i.id, label: i.code, sublabel: i.nom }));

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/conventions', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conventions'] }); closeForm(); toast({ title: 'Convention créée' }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/conventions/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conventions'] }); closeForm(); toast({ title: 'Convention mise à jour' }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/conventions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conventions'] }); toast({ title: 'Convention supprimée' }); },
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM }); };

  const openEdit = (conv: any) => {
    setEditing(conv);
    setForm({
      institutionAId: conv.institutionAId, institutionBId: conv.institutionBId,
      objet: conv.objet || '', donneesVisees: conv.donneesVisees || '',
      statut: conv.statut, referenceDocument: conv.referenceDocument || '',
      lienDocument: conv.lienDocument || '', observations: conv.observations || '',
      dateInitiation: conv.dateInitiation?.split('T')[0] || '',
      dateRedaction: conv.dateRedaction?.split('T')[0] || '',
      dateSignatureA: conv.dateSignatureA?.split('T')[0] || '',
      dateSignatureB: conv.dateSignatureB?.split('T')[0] || '',
      dateActivation: conv.dateActivation?.split('T')[0] || '',
      dateExpiration: conv.dateExpiration?.split('T')[0] || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const data: any = { ...form };
    // Convert dates
    ['dateInitiation', 'dateRedaction', 'dateSignatureA', 'dateSignatureB', 'dateActivation', 'dateExpiration'].forEach(k => {
      if (data[k]) data[k] = new Date(data[k]).toISOString();
      else delete data[k];
    });

    if (editing) {
      const { institutionAId, institutionBId, ...updateData } = data;
      updateMut.mutate({ id: editing.id, data: updateData });
    } else {
      createMut.mutate(data);
    }
  };

  const convList = conventions?.data || [];
  const signees = convList.filter((c: any) => ['SIGNEE', 'ACTIVE'].includes(c.statut)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Conventions d'échange</h1>
          <p className="text-gray-500 mt-1">Suivi des accords de partage de données inter-administrations</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY_FORM }); }} className="bg-teal hover:bg-teal-dark">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle convention
        </Button>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-navy"><CardContent className="pt-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-navy">{convList.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="pt-4"><p className="text-xs text-gray-500">Signées / Actives</p><p className="text-2xl font-bold text-success">{signees}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="pt-4"><p className="text-xs text-gray-500">En attente</p><p className="text-2xl font-bold text-gold">{convList.length - signees}</p></CardContent></Card>
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <Card className="border-2 border-teal/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-navy">{editing ? 'Modifier la convention' : 'Nouvelle convention'}</CardTitle>
              <button onClick={closeForm}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Institutions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Institution A</Label>
                <SearchableSelect options={instOptions} value={form.institutionAId} onChange={v => setForm({ ...form, institutionAId: v })} placeholder="Sélectionner..." disabled={!!editing} />
              </div>
              <div>
                <Label>Institution B</Label>
                <SearchableSelect options={instOptions} value={form.institutionBId} onChange={v => setForm({ ...form, institutionBId: v })} placeholder="Sélectionner..." disabled={!!editing} />
              </div>
            </div>

            {/* Objet + données */}
            <div>
              <Label>Objet de la convention</Label>
              <Input value={form.objet} onChange={e => setForm({ ...form, objet: e.target.value })} placeholder="Ex: Échange données NINEA entre ANSD et DGID" />
            </div>
            <div>
              <Label>Données visées</Label>
              <Textarea value={form.donneesVisees} onChange={e => setForm({ ...form, donneesVisees: e.target.value })} rows={2} placeholder="Détails des données couvertes..." />
            </div>

            {/* Statut + référence + lien */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Statut</Label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full h-10 px-3 text-sm border rounded-md">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Référence document</Label>
                <Input value={form.referenceDocument} onChange={e => setForm({ ...form, referenceDocument: e.target.value })} placeholder="N° référence" />
              </div>
              <div>
                <Label>Lien document (URL)</Label>
                <Input value={form.lienDocument} onChange={e => setForm({ ...form, lienDocument: e.target.value })} placeholder="https://sharepoint.../convention.pdf" />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs">Date initiation</Label><Input type="date" value={form.dateInitiation} onChange={e => setForm({ ...form, dateInitiation: e.target.value })} /></div>
              <div><Label className="text-xs">Date rédaction</Label><Input type="date" value={form.dateRedaction} onChange={e => setForm({ ...form, dateRedaction: e.target.value })} /></div>
              <div><Label className="text-xs">Date signature A</Label><Input type="date" value={form.dateSignatureA} onChange={e => setForm({ ...form, dateSignatureA: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs">Date signature B</Label><Input type="date" value={form.dateSignatureB} onChange={e => setForm({ ...form, dateSignatureB: e.target.value })} /></div>
              <div><Label className="text-xs">Date activation</Label><Input type="date" value={form.dateActivation} onChange={e => setForm({ ...form, dateActivation: e.target.value })} /></div>
              <div><Label className="text-xs">Date expiration</Label><Input type="date" value={form.dateExpiration} onChange={e => setForm({ ...form, dateExpiration: e.target.value })} /></div>
            </div>

            {/* Observations */}
            <div>
              <Label>Observations</Label>
              <Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={!form.objet || (!editing && (!form.institutionAId || !form.institutionBId))} className="bg-teal hover:bg-teal-dark">
                {(createMut.isPending || updateMut.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editing ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button variant="outline" onClick={closeForm}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-teal" /></div>
          ) : convList.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucune convention enregistrée</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="p-3 text-left text-gray-500">Inst. A</th>
                <th className="p-3 text-left text-gray-500">Inst. B</th>
                <th className="p-3 text-left text-gray-500">Objet</th>
                <th className="p-3 text-center text-gray-500">Statut</th>
                <th className="p-3 text-center text-gray-500">Document</th>
                <th className="p-3 text-right text-gray-500">Actions</th>
              </tr></thead>
              <tbody>
                {convList.map((conv: any) => (
                  <tr key={conv.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{conv.institutionA?.code}</td>
                    <td className="p-3 font-medium text-navy">{conv.institutionB?.code}</td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{conv.objet}</td>
                    <td className="p-3 text-center">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[conv.statut])}>{STATUS_LABELS[conv.statut]}</span>
                    </td>
                    <td className="p-3 text-center">
                      {conv.lienDocument ? (
                        <a href={conv.lienDocument} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-teal hover:text-teal-dark text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" /> Ouvrir
                        </a>
                      ) : conv.referenceDocument ? (
                        <span className="text-xs text-gray-400">{conv.referenceDocument}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(conv)}>
                          <Pencil className="w-3 h-3 mr-1" /> Éditer
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                          if (confirm('Supprimer cette convention ?')) deleteMut.mutate(conv.id);
                        }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
