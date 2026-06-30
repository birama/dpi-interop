import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { STATUT_ACCOMPAGNEMENT_LABELS, TYPE_ACCOMPAGNEMENT_LABELS, TYPE_JALON_LABELS, STATUT_JALON_LABELS, VISIBILITE_LABELS } from '@/types';
import type { AccompagnementAMO, VisibiliteCommentaire } from '@/types';

export function PartenaireTechniqueAccompagnementDetailPage() {
  const { accompagnementId } = useParams<{ accompagnementId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'jalons' | 'commentaires'>('overview');
  const [newComment, setNewComment] = useState('');
  const [visibilite, setVisibilite] = useState<VisibiliteCommentaire>('DU_ET_AMO');

  const { data: acc, isLoading } = useQuery({
    queryKey: ['pt-accompagnement', accompagnementId],
    queryFn: () => api.get(`/partenaire-tech/accompagnements/${accompagnementId}`).then(r => r.data),
    enabled: !!accompagnementId,
  });

  const addComment = useMutation({
    mutationFn: (data: { contenu: string; visibilite: VisibiliteCommentaire }) =>
      api.post(`/partenaire-tech/accompagnements/${accompagnementId}/commentaires`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-accompagnement', accompagnementId] });
      setNewComment('');
      toast({ title: 'Commentaire ajouté' });
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e.response?.data?.error || 'Impossible d\'ajouter le commentaire' });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => api.delete(`/partenaire-tech/accompagnements/commentaires/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-accompagnement', accompagnementId] });
      toast({ title: 'Commentaire supprimé' });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>;
  if (!acc) return <div className="text-center py-12 text-gray-400">Accompagnement introuvable</div>;

  const a: AccompagnementAMO = acc;
  const cu = a.casUsageMVP;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/partenaire-tech/mes-cas" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">{cu?.titre}</h1>
          <p className="text-sm text-gray-500">{TYPE_ACCOMPAGNEMENT_LABELS[a.type]} — {STATUT_ACCOMPAGNEMENT_LABELS[a.statut]}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['overview', 'jalons', 'commentaires'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-teal-700 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {{ overview: 'Vue d\'ensemble', jalons: 'Jalons', commentaires: 'Commentaires' }[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-navy">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><Badge variant="outline">{TYPE_ACCOMPAGNEMENT_LABELS[a.type]}</Badge></div>
              <div className="flex justify-between"><span className="text-gray-500">Statut</span><Badge className={a.statut === 'ACTIF' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}>{STATUT_ACCOMPAGNEMENT_LABELS[a.statut]}</Badge></div>
              <div className="flex justify-between"><span className="text-gray-500">Score maturité</span>
                {a.scoreMaturite ? <Badge className="bg-navy text-white">{a.scoreMaturite}/5</Badge> : <span className="text-gray-400">Non évalué</span>}
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Début</span><span>{a.dateDebut ? new Date(a.dateDebut).toLocaleDateString('fr') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fin prévue</span><span>{a.dateFinPrevue ? new Date(a.dateFinPrevue).toLocaleDateString('fr') : '-'}</span></div>
              {a.description && <p className="text-gray-600 pt-2 border-t">{a.description}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-navy">Cas d'usage</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Code</span><span className="font-mono text-teal-700">{cu?.code}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Domaine</span><span>{cu?.domaine || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Statut Vue</span><Badge variant="outline">{cu?.statutVueSection}</Badge></div>
              <div className="flex justify-between"><span className="text-gray-500">Implémentation</span><Badge variant="outline">{cu?.statutImpl}</Badge></div>
              <Link to={`/partenaire-tech/cas/${cu?.id}`} className="text-teal-700 hover:underline text-xs block pt-2 border-t">Voir la fiche complète →</Link>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'jalons' && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-navy">{a.jalons?.length || 0} jalon{(a.jalons?.length || 0) > 1 ? 's' : ''}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Type</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Libellé</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Trimestre</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Statut</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Prévu</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Réel</th>
                </tr>
              </thead>
              <tbody>
                {a.jalons?.map((j: any) => (
                  <tr key={j.id} className="border-b border-gray-100">
                    <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{TYPE_JALON_LABELS[j.type as keyof typeof TYPE_JALON_LABELS] || j.type}</Badge></td>
                    <td className="py-2 px-3 text-xs">{j.libelle}</td>
                    <td className="py-2 px-3 text-xs">{j.trimestre || '-'}</td>
                    <td className="py-2 px-3">
                      <Badge className={`text-xs ${j.statut === 'REALISE' ? 'bg-teal-100 text-teal-700' : j.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-700' : j.statut === 'REPORTE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {STATUT_JALON_LABELS[j.statut as keyof typeof STATUT_JALON_LABELS] || j.statut}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-xs">{j.datePrevue ? new Date(j.datePrevue).toLocaleDateString('fr') : '-'}</td>
                    <td className="py-2 px-3 text-xs">{j.dateReelle ? new Date(j.dateReelle).toLocaleDateString('fr') : '-'}</td>
                  </tr>
                ))}
                {(!a.jalons || a.jalons.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun jalon</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'commentaires' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-navy">Ajouter un commentaire</CardTitle></CardHeader>
            <CardContent>
              <textarea className="w-full border rounded p-3 text-sm min-h-[80px]" placeholder="Votre commentaire..."
                value={newComment} onChange={e => setNewComment(e.target.value)} />
              <div className="flex items-center justify-between mt-3">
                <select className="border rounded px-2 py-1 text-xs" value={visibilite} onChange={e => setVisibilite(e.target.value as VisibiliteCommentaire)}>
                  <option value="DU_ET_AMO">{VISIBILITE_LABELS.DU_ET_AMO}</option>
                  <option value="AMO_ONLY">{VISIBILITE_LABELS.AMO_ONLY}</option>
                </select>
                <Button size="sm" className="bg-teal hover:bg-teal-dark text-white" disabled={!newComment.trim() || addComment.isPending}
                  onClick={() => addComment.mutate({ contenu: newComment, visibilite })}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {a.commentaires?.map((c: any) => (
              <Card key={c.id} className={c.visibilite === 'AMO_ONLY' ? 'border-amber-200 bg-amber-50/50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-navy">{c.createdBy}</span>
                        <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('fr')}</span>
                        <Badge className={`text-xs ${c.visibilite === 'AMO_ONLY' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {VISIBILITE_LABELS[c.visibilite as keyof typeof VISIBILITE_LABELS] || c.visibilite}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.contenu}</p>
                    </div>
                    {c.createdBy === 'accenture-jica@senum.sn' && (
                      <button onClick={() => { if (confirm('Supprimer ce commentaire ?')) deleteComment.mutate(c.id); }}
                        className="text-gray-300 hover:text-red-500 ml-2"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!a.commentaires || a.commentaires.length === 0) && (
              <p className="text-center py-8 text-gray-400">Aucun commentaire</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
