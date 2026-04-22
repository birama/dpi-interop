import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { documentsApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Plus, X, Pencil, Trash2, Loader2, Scale, Cpu, BookOpen, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
  juridique: { label: 'Juridique', icon: Scale, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  technique: { label: 'Technique', icon: Cpu, color: 'bg-teal-50 text-teal border-teal/20' },
  guide: { label: 'Guides', icon: BookOpen, color: 'bg-gold-50 text-gold border-gold/20' },
  modele: { label: 'Modeles', icon: FileCheck, color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function DocumentsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [modal, setModal] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data, isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.getAll().then(r => r.data) });

  const createMut = useMutation({
    mutationFn: (d: any) => documentsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); setModal(null); toast({ title: 'Document ajoute' }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => documentsApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); setModal(null); toast({ title: 'Document modifie' }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast({ title: 'Document supprime' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;

  const docs = (data || []) as any[];
  const grouped = Object.keys(CATEGORIES).reduce((acc: any, cat) => {
    acc[cat] = docs.filter((d: any) => d.categorie === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">Documents de reference</h1>
          <p className="text-xs text-gray-500">Documents cadre, guides et modeles pour l'interoperabilite</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={() => { setModal('create'); setForm({ titre: '', description: '', categorie: 'guide', fichierNom: '', fichierPath: '', tailleMo: '' }); }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un document
          </Button>
        )}
      </div>

      {/* Cards par categorie */}
      {Object.entries(CATEGORIES).map(([cat, config]) => {
        const catDocs = grouped[cat] || [];
        if (catDocs.length === 0 && !isAdmin) return null;
        const Icon = config.icon;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-navy">{config.label}</h2>
              <span className="text-xs text-gray-400">({catDocs.length})</span>
            </div>
            {catDocs.length === 0 ? (
              <p className="text-xs text-gray-400 italic ml-6">Aucun document dans cette categorie</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {catDocs.map((doc: any) => (
                  <Card key={doc.id} className={cn('border', config.color.split(' ')[0])}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <h3 className="text-sm font-medium text-navy truncate">{doc.titre}</h3>
                          </div>
                          {doc.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                            {doc.tailleMo && <span>{doc.tailleMo} Mo</span>}
                            <span>{new Date(doc.datePublication).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={() => window.open(doc.fichierPath, '_blank')}>
                          <Download className="w-3 h-3 mr-1" /> Telecharger
                        </Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => { setModal('edit'); setForm({ ...doc }); }}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-red-400" onClick={() => { if (confirm('Supprimer ce document ?')) deleteMut.mutate(doc.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal create/edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between">
              <h3 className="font-bold text-sm">{modal === 'create' ? 'Ajouter un document' : 'Modifier le document'}</h3>
              <button onClick={() => setModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><Label className="text-xs">Titre</Label><Input value={form.titre || ''} onChange={e => setForm({ ...form, titre: e.target.value })} className="h-8 text-sm" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Categorie</Label>
                  <select value={form.categorie || 'guide'} onChange={e => setForm({ ...form, categorie: e.target.value })} className="w-full h-8 px-2 text-sm border rounded-md">
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div><Label className="text-xs">Taille (Mo)</Label><Input type="number" value={form.tailleMo || ''} onChange={e => setForm({ ...form, tailleMo: parseFloat(e.target.value) || null })} className="h-8 text-sm" /></div>
              </div>
              <div><Label className="text-xs">Nom du fichier</Label><Input value={form.fichierNom || ''} onChange={e => setForm({ ...form, fichierNom: e.target.value })} className="h-8 text-sm" placeholder="Ex: RGI-Senegal-2026.pdf" /></div>
              <div><Label className="text-xs">Chemin / URL du fichier</Label><Input value={form.fichierPath || ''} onChange={e => setForm({ ...form, fichierPath: e.target.value })} className="h-8 text-sm" placeholder="Ex: /uploads/documents/rgi.pdf ou URL Drive" /></div>
              <Button size="sm" className="bg-teal hover:bg-teal-dark" disabled={!form.titre || !form.fichierNom || !form.fichierPath}
                onClick={() => {
                  const d = { titre: form.titre, description: form.description, categorie: form.categorie, fichierNom: form.fichierNom, fichierPath: form.fichierPath, tailleMo: form.tailleMo };
                  modal === 'create' ? createMut.mutate(d) : updateMut.mutate({ id: form.id, d });
                }}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
