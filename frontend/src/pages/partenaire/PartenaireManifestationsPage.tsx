import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import {
  Calendar, Loader2, Send, Pencil, Trash2, Eye, Coins, FileText, AlertTriangle,
} from 'lucide-react';
import { ManifestationForm } from '@/modules/partenaire/ManifestationForm';

const STATUT_BADGES: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
  EN_VALIDATION: { label: 'En validation DU', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  PUBLIE: { label: 'Publiée', cls: 'bg-teal/15 text-teal-800 border-teal/40' },
  REJETE: { label: 'Refusée', cls: 'bg-red-100 text-red-700 border-red-300' },
  RETIRE: { label: 'Retirée', cls: 'bg-gray-100 text-gray-500 border-gray-300' },
};

const STATUT_ORDER = ['DRAFT', 'EN_VALIDATION', 'PUBLIE', 'REJETE', 'RETIRE'];

export function PartenaireManifestationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCas, setEditingCas] = useState<{ id: string; code?: string; titre?: string } | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partenaire-manifestations'],
    queryFn: () => api.get('/partenaire/manifestations').then((r) => r.data),
  });

  const items: any[] = data?.data || [];

  const compteurs = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((m) => { c[m.statut] = (c[m.statut] || 0) + 1; });
    return c;
  }, [items]);

  const submitMut = useMutation({
    mutationFn: (id: string) => api.post(`/partenaire/manifestations/${id}/submit`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partenaire-manifestations'] });
      qc.invalidateQueries({ queryKey: ['partenaire-manifestation-cas'] });
      toast({
        title: 'Manifestation soumise',
        description: 'Votre manifestation a été transmise à la Delivery Unit MTN pour validation.',
      });
      setConfirmSubmit(null);
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Échec', description: err?.response?.data?.error || 'Erreur' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/partenaire/manifestations/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partenaire-manifestations'] });
      qc.invalidateQueries({ queryKey: ['partenaire-manifestation-cas'] });
      toast({ title: 'Brouillon supprimé' });
      setConfirmDelete(null);
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Échec', description: err?.response?.data?.error || 'Erreur' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  // Mode édition d'une DRAFT — affichage du formulaire en pleine page
  if (editingId && editingCas) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditingCas(null); }}>
            ← Retour à la liste
          </Button>
          <p className="text-sm text-gray-600">Édition de manifestation (brouillon)</p>
        </div>
        <ManifestationForm
          casUsageId={editingCas.id}
          casCode={editingCas.code}
          casTitre={editingCas.titre}
          manifestationId={editingId}
          onSuccess={() => { setEditingId(null); setEditingCas(null); }}
          onCancel={() => { setEditingId(null); setEditingCas(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Mes manifestations d'intérêt</h1>
          <p className="text-sm text-gray-500">
            Suivi des manifestations déposées sur les cas d'usage du portefeuille PINS
          </p>
        </div>
      </div>

      {/* Compteurs par statut */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUT_ORDER.map((s) => (
          <Card key={s}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">{STATUT_BADGES[s]?.label}</p>
              <p className="text-2xl font-bold text-navy">{compteurs[s] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-gray-300" />
            <p>Vous n'avez encore déposé aucune manifestation.</p>
            <Link to="/partenaire/catalogue">
              <Button variant="outline" size="sm">Parcourir le catalogue de cas d'usage</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-base">
              {items.length} manifestation{items.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 px-3">Cas d'usage</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Montant</th>
                    <th className="py-2 px-3">Statut</th>
                    <th className="py-2 px-3">Déposée</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => {
                    const badge = STATUT_BADGES[m.statut] || { label: m.statut, cls: '' };
                    return (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <Link to={`/partenaire/cas/${m.casUsage?.id || m.casUsageId}`} className="hover:underline">
                            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                              {m.casUsage?.code}
                            </span>
                            <span className="text-navy">{m.casUsage?.titre}</span>
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {m.type === 'FINANCEMENT' ? (
                            <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                              <Coins className="w-3 h-3 mr-1" /> Financement
                            </Badge>
                          ) : (
                            <Badge variant="outline">Intérêt</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {m.type === 'FINANCEMENT' && m.montantEstime != null
                            ? `${Number(m.montantEstime).toLocaleString('fr-FR')} ${m.devise}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className={`${badge.cls} text-[11px]`}>
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">
                          {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" title="Voir le détail" onClick={() => setViewing(m)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {m.statut === 'DRAFT' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Modifier le brouillon"
                                  onClick={() => {
                                    setEditingId(m.id);
                                    setEditingCas({ id: m.casUsage?.id || m.casUsageId, code: m.casUsage?.code, titre: m.casUsage?.titre });
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Soumettre à la DU"
                                  onClick={() => setConfirmSubmit(m)}
                                  className="text-gold hover:text-gold"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Supprimer le brouillon"
                                  onClick={() => setConfirmDelete(m)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-500 italic">
        Les manifestations soumises sont étudiées par la Delivery Unit MTN. Après validation,
        elles deviennent visibles dans le tableau de bord de coordination des partenaires.
      </p>

      {/* Confirmation soumission */}
      <Dialog open={!!confirmSubmit} onOpenChange={(v) => !v && setConfirmSubmit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soumettre la manifestation ?</DialogTitle>
            <DialogDescription>
              Une fois soumise, votre manifestation passe en validation auprès de la Delivery Unit MTN
              et ne sera plus modifiable de votre côté.
            </DialogDescription>
          </DialogHeader>
          {confirmSubmit && (
            <div className="text-sm space-y-1 border rounded p-3 bg-slate-50">
              <p>
                <span className="text-xs text-gray-500">Cas&nbsp;:</span> <b>{confirmSubmit.casUsage?.code}</b> — {confirmSubmit.casUsage?.titre}
              </p>
              <p>
                <span className="text-xs text-gray-500">Type&nbsp;:</span>{' '}
                {confirmSubmit.type === 'FINANCEMENT' ? 'Financement' : 'Intérêt'}
              </p>
              {confirmSubmit.type === 'FINANCEMENT' && (
                <p>
                  <span className="text-xs text-gray-500">Montant&nbsp;:</span>{' '}
                  {Number(confirmSubmit.montantEstime).toLocaleString('fr-FR')} {confirmSubmit.devise} ({confirmSubmit.instrumentFinancier?.replace(/_/g, ' ').toLowerCase()})
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(null)} disabled={submitMut.isPending}>
              Annuler
            </Button>
            <Button
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={() => confirmSubmit && submitMut.mutate(confirmSubmit.id)}
              disabled={submitMut.isPending}
            >
              {submitMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Confirmer la soumission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Supprimer ce brouillon ?
            </DialogTitle>
            <DialogDescription>
              Cette action est définitive. Le contenu du brouillon sera perdu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Détail (lecture seule) */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de la manifestation</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="text-sm space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUT_BADGES[viewing.statut]?.cls}>
                  {STATUT_BADGES[viewing.statut]?.label || viewing.statut}
                </Badge>
                <Badge variant="outline">
                  {viewing.type === 'FINANCEMENT' ? 'Financement' : 'Intérêt'}
                </Badge>
                {viewing.type === 'FINANCEMENT' && viewing.montantEstime != null && (
                  <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                    <Coins className="w-3 h-3 mr-1" />
                    {Number(viewing.montantEstime).toLocaleString('fr-FR')} {viewing.devise}
                  </Badge>
                )}
                {viewing.instrumentFinancier && (
                  <Badge variant="outline" className="text-[11px]">
                    {viewing.instrumentFinancier.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                )}
              </div>

              <div className="border rounded p-3 bg-slate-50">
                <p className="text-xs text-gray-500">Cas d'usage</p>
                <p className="font-medium text-navy">
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                    {viewing.casUsage?.code}
                  </span>
                  {viewing.casUsage?.titre}
                </p>
              </div>

              {viewing.fenetreTemporelle && (
                <div>
                  <p className="text-xs text-gray-500">Fenêtre temporelle envisagée</p>
                  <p>{viewing.fenetreTemporelle}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="whitespace-pre-line text-gray-800 border rounded p-3 bg-white">{viewing.commentaire}</p>
              </div>

              {viewing.statut === 'REJETE' && viewing.motifRejet && (
                <div>
                  <p className="text-xs text-red-700 mb-1">Motif de refus</p>
                  <p className="whitespace-pre-line text-red-900 border border-red-200 rounded p-3 bg-red-50">{viewing.motifRejet}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>Déposée le {new Date(viewing.createdAt).toLocaleString('fr-FR')}</p>
                <p>Dernière modification le {new Date(viewing.updatedAt).toLocaleString('fr-FR')}</p>
                {viewing.dateValidation && (
                  <p>Validée le {new Date(viewing.dateValidation).toLocaleString('fr-FR')}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
