/**
 * Section "Service guichet correspondant" — fiche d'un CasUsageMVP.
 *
 * Lit/crée/supprime les LiaisonGuichet via /api/catalogue/cas-usage/:id/liaisons-guichet
 * et POST /api/catalogue/liaisons-guichet/:liaisonId pour DELETE.
 *
 * publicCible et statutEsenegal sont des propriétés intrinsèques de
 * ServiceGuichet — affichés en lecture seule. La page Correspondance globale
 * a son propre filtre par publicCible et statut e-sénégal.
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Trash2, Plus, Globe, Loader2 } from 'lucide-react';

interface ServiceGuichetLite {
  id: string;
  code: string;
  intitule: string;
  evenementDeVie: string | null;
  secteur: string | null;
  publicCible: 'CITOYEN' | 'ENTREPRISE' | 'MIXTE' | null;
  statutEsenegal: string | null;
  ministere: string | null;
}

interface LiaisonRow {
  id: string;
  note: string | null;
  dateAjout: string;
  serviceGuichet: ServiceGuichetLite;
}

const publicCibleBadge = (v: string | null) => {
  if (v === 'CITOYEN') return <Badge className="bg-teal/15 text-teal-800 border-teal/40">Citoyen</Badge>;
  if (v === 'ENTREPRISE') return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Entreprise</Badge>;
  if (v === 'MIXTE') return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Mixte</Badge>;
  return <Badge variant="outline" className="text-gray-500 text-xs">non renseigné</Badge>;
};

const statutEsenegalBadge = (v: string | null) => {
  if (v === 'En ligne') return <Badge className="bg-green-100 text-green-800 border-green-300">En ligne</Badge>;
  if (v === 'En ligne mais Non utilisée') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300" title="Service en ligne mais non utilisé">En ligne (non utilisé)</Badge>;
  if (v === 'Pas en ligne') return <Badge variant="outline" className="text-gray-600 text-xs">Pas en ligne</Badge>;
  if (v === 'Désactivée') return <Badge variant="outline" className="text-gray-500 text-xs line-through">Désactivée</Badge>;
  if (v === 'Pas disponible sur teledac') return <Badge variant="outline" className="text-gray-500 text-xs">Hors TELEDAC</Badge>;
  if (!v) return <Badge variant="outline" className="text-gray-400 text-xs">—</Badge>;
  return <Badge variant="outline" className="text-xs">{v}</Badge>;
};

export function LiaisonsGuichetBlock({ casUsageId }: { casUsageId: string }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [note, setNote] = useState('');

  // Liaisons existantes
  const { data: liaisonsData, isLoading } = useQuery({
    queryKey: ['liaisons-guichet', casUsageId],
    queryFn: () => api.get(`/catalogue/cas-usage/${casUsageId}/liaisons-guichet`).then((r) => r.data),
    enabled: !!casUsageId,
  });

  // Liste des services pour le combobox (seulement quand on ouvre le formulaire)
  const { data: servicesData } = useQuery({
    queryKey: ['services-guichet-all'],
    queryFn: () => api.get('/catalogue/services-guichet').then((r) => r.data),
    enabled: showAddForm && isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const liaisons: LiaisonRow[] = liaisonsData?.items ?? [];
  const linkedServiceIds = useMemo(
    () => new Set(liaisons.map((l) => l.serviceGuichet.id)),
    [liaisons],
  );

  const serviceOptions = useMemo(() => {
    const items = (servicesData?.items ?? []) as ServiceGuichetLite[];
    return items
      .filter((s) => !linkedServiceIds.has(s.id))
      .map((s) => ({
        value: s.id,
        label: `${s.code} — ${s.intitule}`,
        sublabel: [s.secteur, s.evenementDeVie].filter(Boolean).join(' · '),
      }));
  }, [servicesData, linkedServiceIds]);

  const createMutation = useMutation({
    mutationFn: (vars: { serviceGuichetId: string; note: string | null }) =>
      api.post(`/catalogue/cas-usage/${casUsageId}/liaisons-guichet`, vars).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liaisons-guichet', casUsageId] });
      qc.invalidateQueries({ queryKey: ['correspondance-esenegal'] });
      setSelectedServiceId('');
      setNote('');
      setShowAddForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (liaisonId: string) =>
      api.delete(`/catalogue/liaisons-guichet/${liaisonId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liaisons-guichet', casUsageId] });
      qc.invalidateQueries({ queryKey: ['correspondance-esenegal'] });
    },
  });

  const handleCreate = () => {
    if (!selectedServiceId) return;
    createMutation.mutate({ serviceGuichetId: selectedServiceId, note: note.trim() || null });
  };

  const handleDelete = (liaisonId: string, label: string) => {
    if (!confirm(`Supprimer la liaison ${label} ?`)) return;
    deleteMutation.mutate(liaisonId);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-teal" />
          <div className="font-bold text-navy">Service guichet correspondant (e-sénégal)</div>
          <Badge variant="outline" className="ml-2">{liaisons.length}</Badge>
        </div>
        {isAdmin && !showAddForm && (
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Lier un service
          </Button>
        )}
      </div>

      {/* Formulaire de création (ADMIN only) */}
      {showAddForm && isAdmin && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-semibold">Service guichet à lier</label>
            <SearchableSelect
              options={serviceOptions}
              value={selectedServiceId}
              onChange={setSelectedServiceId}
              placeholder="Rechercher par code ou intitulé…"
            />
            {serviceOptions.length === 0 && servicesData && (
              <div className="text-xs text-gray-500 mt-1">Tous les services guichet disponibles sont déjà liés à ce cas.</div>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-600 font-semibold">Note (facultative)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contexte du rattachement, hypothèse, etc."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAddForm(false); setSelectedServiceId(''); setNote(''); }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!selectedServiceId || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lier'}
            </Button>
          </div>
          {createMutation.isError && (
            <div className="text-xs text-red-600">
              Erreur : {(createMutation.error as any)?.response?.data?.error || 'Échec création'}
            </div>
          )}
        </div>
      )}

      {/* Liste des liaisons existantes */}
      <div>
        {isLoading ? (
          <div className="p-6 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : liaisons.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Aucun service guichet n'est encore lié à ce cas d'usage.
            {!isAdmin && ' La liaison est gérée par la DU.'}
          </div>
        ) : (
          <ul className="divide-y">
            {liaisons.map((l) => {
              const sg = l.serviceGuichet;
              return (
                <li key={l.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-500">{sg.code}</span>
                        <span className="font-medium text-navy">{sg.intitule}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                        {sg.secteur && <span>Secteur : {sg.secteur}</span>}
                        {sg.evenementDeVie && <span>· Événement : {sg.evenementDeVie}</span>}
                        {sg.ministere && <span>· {sg.ministere}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {publicCibleBadge(sg.publicCible)}
                        {statutEsenegalBadge(sg.statutEsenegal)}
                      </div>
                      {l.note && (
                        <div className="mt-2 text-xs text-gray-600 italic">Note : {l.note}</div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(l.id, `${sg.code} — ${sg.intitule}`)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
