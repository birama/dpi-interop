import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, Plus, Trash2, CheckCircle2, Search, ChevronRight } from 'lucide-react';

// ---- Types ----

interface CuLiaison {
  id: string; mode: string | null; note: string | null; dateAjout: string;
  casUsage: { id: string; code: string; titre: string; domaine: string | null; typologie: string };
}

interface ServiceRow {
  id: string; code: string; intitule: string;
  evenementDeVie: string | null; secteur: string | null;
  publicCible: 'CITOYEN' | 'ENTREPRISE' | 'MIXTE' | null;
  statutEsenegal: string | null; besoinSiTiers: string | null;
  pointFocalSiTiers?: string | null; ministere?: string | null;
  priorisationJson?: any; mode?: string | null; ajoutePar?: string | null; dateAjout?: string;
  liaisons: CuLiaison[];
}

const PUBLIC_CIBLES = ['CITOYEN', 'ENTREPRISE', 'MIXTE'] as const;

// ---- Badges (extraits pour réutilisation) ----

const modeBadge = (m: string | null) => {
  if (!m) return <Badge variant="outline" className="text-xs text-gray-500">manuel</Badge>;
  if (m === 'MATCHING_AUTO') return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Auto</Badge>;
  if (m === 'MATCHING_AUTO_A_CONFIRMER') return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">À confirmer</Badge>;
  if (m === 'VALIDE_HUMAIN') return <Badge className="bg-teal/15 text-teal-800 border-teal/40 text-xs">Validé</Badge>;
  if (m === 'AJOUT_MANUEL_DU') return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">Manuel DU</Badge>;
  return <Badge variant="outline" className="text-xs">{m}</Badge>;
};
const pcBadge = (v: string | null) => {
  if (v === 'CITOYEN') return <Badge className="bg-teal/15 text-teal-800 border-teal/40 text-xs">Citoyen</Badge>;
  if (v === 'ENTREPRISE') return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Entreprise</Badge>;
  if (v === 'MIXTE') return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">Mixte</Badge>;
  return <span className="text-gray-400 text-xs">—</span>;
};
const seBadge = (v: string | null) => {
  if (!v || v === 'None') return <span className="text-gray-400 text-xs">—</span>;
  if (v === 'En ligne') return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">En ligne</Badge>;
  if (v === 'En ligne mais Non utilisée') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">En ligne (non utilisé)</Badge>;
  if (v === 'Pas en ligne') return <Badge variant="outline" className="text-gray-600 text-xs">Pas en ligne</Badge>;
  return <Badge variant="outline" className="text-xs">{v}</Badge>;
};

// ---- Composant liaison (réutilisé liste + sheet) ----
function LiaisonLine({ l, isAdmin, onConfirm, onDelete }: {
  l: CuLiaison; isAdmin: boolean;
  onConfirm: (casUsageId: string) => void; onDelete: (liaisonId: string) => void;
}) {
  return (
    <li className="flex items-center gap-2 flex-wrap py-1">
      {modeBadge(l.mode)}
      <Link to={`/admin/cas-usage/${l.casUsage.id}`} className="font-mono text-xs text-navy hover:underline">{l.casUsage.code}</Link>
      <span className="text-xs text-gray-600">{l.casUsage.titre.slice(0, 60)}</span>
      {isAdmin && (
        <span className="flex gap-1 ml-auto">
          {l.mode === 'MATCHING_AUTO_A_CONFIRMER' && (
            <Button size="sm" variant="ghost" className="h-6 text-teal hover:text-teal" title="Confirmer"
              onClick={() => onConfirm(l.casUsage.id)}><CheckCircle2 className="h-4 w-4" /></Button>
          )}
          <Button size="sm" variant="ghost" className="h-6 text-red-500 hover:text-red-700" title="Supprimer"
            onClick={() => { if (confirm(`Supprimer la liaison ${l.casUsage.code} ?`)) onDelete(l.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      )}
    </li>
  );
}

// ---- Page ----
export function ServicesGuichetPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();
  const { toast } = useToast();

  const [fSecteur, setFSecteur] = useState('');
  const [fPublicCible, setFPublicCible] = useState('');
  const [fLiaison, setFLiaison] = useState<'ALL' | 'OUI' | 'NON'>('ALL');
  const [fMode, setFMode] = useState('');
  const [searchQ, setSearchQ] = useState('');

  // ---- Liste ----
  const { data, isLoading } = useQuery({
    queryKey: ['services-guichet-list', fSecteur, fPublicCible],
    queryFn: () => api.get(`/catalogue/services-guichet?avecLiaisons=true${fSecteur ? `&secteur=${encodeURIComponent(fSecteur)}` : ''}${fPublicCible ? `&publicCible=${fPublicCible}` : ''}`).then((r) => r.data),
  });
  const items: ServiceRow[] = useMemo(() => {
    let rows = (data?.items ?? []) as ServiceRow[];
    if (searchQ) { const q = searchQ.toLowerCase(); rows = rows.filter((s) => s.intitule.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)); }
    if (fLiaison === 'OUI') rows = rows.filter((s) => s.liaisons?.length > 0);
    if (fLiaison === 'NON') rows = rows.filter((s) => !s.liaisons || s.liaisons.length === 0);
    if (fMode) rows = rows.filter((s) => (s.liaisons ?? []).some((l) => l.mode === fMode));
    return rows;
  }, [data, searchQ, fLiaison, fMode]);
  const secteursDistincts = useMemo(() => {
    const set = new Set<string>(); (data?.items ?? []).forEach((s: ServiceRow) => { if (s.secteur) set.add(s.secteur); }); return [...set].sort();
  }, [data]);

  // ---- Fiche détail (sheet) ----
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail } = useQuery({
    queryKey: ['service-guichet-detail', detailId],
    queryFn: () => api.get(`/catalogue/services-guichet/${detailId}`).then((r) => r.data),
    enabled: !!detailId,
  });

  // ---- Mutations partagées ----
  const deleteMutation = useMutation({
    mutationFn: (liaisonId: string) => api.delete(`/catalogue/liaisons-guichet/${liaisonId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-guichet-list'] }); qc.invalidateQueries({ queryKey: ['service-guichet-detail'] }); },
  });
  const confirmMutation = useMutation({
    mutationFn: (vars: { casUsageId: string; serviceGuichetId: string }) =>
      api.post(`/catalogue/cas-usage/${vars.casUsageId}/liaisons-guichet`, { serviceGuichetId: vars.serviceGuichetId, mode: 'VALIDE_HUMAIN' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-guichet-list'] }); qc.invalidateQueries({ queryKey: ['service-guichet-detail'] }); },
  });

  // ---- Lier un CU (dans la liste ou le sheet) ----
  const [linkSvId, setLinkSvId] = useState<string | null>(null);
  const [linkCuId, setLinkCuId] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const { data: cuSearch } = useQuery({
    queryKey: ['cu-search-link'],
    queryFn: () => api.get('/catalogue/propositions?pageSize=500').then((r) => r.data),
    enabled: !!linkSvId, staleTime: 120_000,
  });
  const cuOptions = useMemo(() => (cuSearch?.items ?? []).map((cu: any) => ({ value: cu.id, label: `${cu.code} — ${cu.titre ?? ''}`.slice(0, 100), sublabel: [cu.domaine, cu.typologie].filter(Boolean).join(' · ') })), [cuSearch]);
  const linkMutation = useMutation({
    mutationFn: (vars: { casUsageId: string; serviceGuichetId: string; note?: string | null; mode?: string }) =>
      api.post(`/catalogue/cas-usage/${vars.casUsageId}/liaisons-guichet`, { serviceGuichetId: vars.serviceGuichetId, note: vars.note, mode: vars.mode }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-guichet-list'] }); qc.invalidateQueries({ queryKey: ['service-guichet-detail'] }); setLinkSvId(null); setLinkCuId(''); setLinkNote(''); },
  });

  // ---- Ajout modal ----
  const [showAdd, setShowAdd] = useState(false);
  const [newIntitule, setNewIntitule] = useState('');
  const [newEVD, setNewEVD] = useState('');
  const [newSecteur, setNewSecteur] = useState('');
  const [newPC, setNewPC] = useState('');
  const [newStatut, setNewStatut] = useState('');
  const [newBsi, setNewBsi] = useState('');
  const clearAddForm = () => { setNewIntitule(''); setNewEVD(''); setNewSecteur(''); setNewPC(''); setNewStatut(''); setNewBsi(''); };
  const addMutation = useMutation({
    mutationFn: (vars: any) => api.post('/catalogue/services-guichet', vars),
    onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: ['services-guichet-list'] }); setShowAdd(false); clearAddForm(); toast({ title: 'Démarche créée', description: `${data.code} — ${data.intitule}` }); },
  });

  // ---- KPIs ----
  const avecLiaison = (data?.items ?? []).filter((s: ServiceRow) => (s.liaisons ?? []).length > 0).length;
  const aConfirmer = (data?.items ?? []).filter((s: ServiceRow) => (s.liaisons ?? []).some((l) => l.mode === 'MATCHING_AUTO_A_CONFIRMER')).length;
  const valides = (data?.items ?? []).filter((s: ServiceRow) => (s.liaisons ?? []).some((l) => l.mode === 'VALIDE_HUMAIN')).length;

  // ---- Rendu priorisationJson ----
  const renderPriorisation = (pj: any) => {
    if (!pj || typeof pj !== 'object') return <span className="text-gray-400 text-xs">—</span>;
    const entries = Object.entries(pj).filter(([, v]) => v !== null && v !== undefined);
    if (entries.length === 0) return <span className="text-gray-400 text-xs">—</span>;
    return (
      <div className="space-y-1 text-xs">
        {entries.map(([k, v]) => {
          const label = k.replace(/_/g, ' ');
          if (typeof v === 'object') return <div key={k} className="text-gray-500">{label}: {JSON.stringify(v)}</div>;
          return <div key={k}><span className="text-gray-500">{label}:</span> <span className="font-medium">{String(v)}</span></div>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Services guichet (e-sénégal)</h1>
          <p className="text-sm text-gray-600 mt-1">Revue des démarches guichet, de leurs liaisons au catalogue PINS, et validation des correspondances.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" /> Ajouter une démarche</Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-navy/20"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-navy">{data?.total ?? '—'}</div><div className="text-xs text-gray-500">Démarches total</div></CardContent></Card>
        <Card className="border-teal/30"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-teal">{avecLiaison}</div><div className="text-xs text-gray-500">Avec liaison PINS</div></CardContent></Card>
        <Card className="border-amber-300"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-amber-700">{aConfirmer}</div><div className="text-xs text-gray-500">À confirmer</div></CardContent></Card>
        <Card className="border-green-300"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-green-700">{valides}</div><div className="text-xs text-gray-500">Validées</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]"><Label className="text-xs">Recherche</Label><div className="relative"><Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" /><Input className="pl-7" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Par intitulé ou code..." /></div></div>
          <div><Label className="text-xs">Secteur</Label><Select value={fSecteur || 'ALL'} onValueChange={(v) => setFSecteur(v === 'ALL' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="Tous" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tous</SelectItem>{secteursDistincts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs">Public cible</Label><Select value={fPublicCible || 'ALL'} onValueChange={(v) => setFPublicCible(v === 'ALL' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Tous" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tous</SelectItem>{PUBLIC_CIBLES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs">Liaison</Label><Select value={fLiaison} onValueChange={(v) => setFLiaison(v as any)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tous</SelectItem><SelectItem value="OUI">Avec liaison</SelectItem><SelectItem value="NON">Sans liaison</SelectItem></SelectContent></Select></div>
          <div><Label className="text-xs">Mode</Label><Select value={fMode || 'ALL'} onValueChange={(v) => setFMode(v === 'ALL' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Tous" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tous</SelectItem><SelectItem value="MATCHING_AUTO">MATCHING_AUTO</SelectItem><SelectItem value="MATCHING_AUTO_A_CONFIRMER">À confirmer</SelectItem><SelectItem value="VALIDE_HUMAIN">Validé</SelectItem><SelectItem value="AJOUT_MANUEL_DU">Manuel DU</SelectItem></SelectContent></Select></div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (<div className="p-10 flex items-center justify-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Chargement…</div>)
          : items.length === 0 ? (<div className="p-10 text-center text-gray-500">Aucun service ne correspond aux filtres.</div>)
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left"><tr>
                <th className="px-3 py-2 font-semibold text-gray-700">Service guichet</th><th className="px-3 py-2 font-semibold text-gray-700">Secteur</th><th className="px-3 py-2 font-semibold text-gray-700">Public</th><th className="px-3 py-2 font-semibold text-gray-700">e-sénégal</th><th className="px-3 py-2 font-semibold text-gray-700">Liaison(s) PINS</th><th className="px-3 py-2 font-semibold text-gray-700 w-10"></th>
              </tr></thead>
              <tbody className="divide-y">
                {items.map((svc) => (
                  <tr key={svc.id} className={`hover:bg-gray-50 align-top cursor-pointer ${(svc.liaisons ?? []).some((l) => l.mode === 'MATCHING_AUTO_A_CONFIRMER') ? 'bg-amber-50/50' : ''}`}
                    onClick={() => setDetailId(svc.id)}>
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-teal hover:underline">{svc.code}</div>
                      <div className="text-gray-800 mt-0.5 font-medium">{svc.intitule}</div>
                      {svc.evenementDeVie && <div className="text-xs text-gray-500 mt-1">{svc.evenementDeVie}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{svc.secteur || '—'}</td>
                    <td className="px-3 py-3">{pcBadge(svc.publicCible)}</td>
                    <td className="px-3 py-3">{seBadge(svc.statutEsenegal)}</td>
                    <td className="px-3 py-3 min-w-[200px]">
                      {(svc.liaisons ?? []).length === 0 ? <span className="text-gray-400 italic text-xs">Aucune liaison</span>
                        : <ul className="space-y-1">{(svc.liaisons ?? []).map((l) => <LiaisonLine key={l.id} l={l} isAdmin={isAdmin} onConfirm={(cuId) => confirmMutation.mutate({ casUsageId: cuId, serviceGuichetId: svc.id })} onDelete={(lid) => deleteMutation.mutate(lid)} />)}</ul>
                      }
                    </td>
                    <td className="px-3 py-3 text-gray-400"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* === SHEET DÉTAIL === */}
      <Dialog open={!!detailId} onOpenChange={(open) => { if (!open) setDetailId(null); }}>
        <DialogContent className="fixed right-0 top-0 bottom-0 h-full max-w-xl translate-x-0 translate-y-0 rounded-none border-l shadow-xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          {detail ? (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="text-navy">
                  <span className="font-mono text-sm text-teal">{detail.code}</span>
                  <div className="text-lg mt-1">{detail.intitule}</div>
                </DialogTitle>
              </DialogHeader>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detail.evenementDeVie && <div><span className="text-gray-500 text-xs">Événement de vie</span><div>{detail.evenementDeVie}</div></div>}
                {detail.secteur && <div><span className="text-gray-500 text-xs">Secteur</span><div>{detail.secteur}</div></div>}
                <div><span className="text-gray-500 text-xs">Public cible</span><div>{pcBadge(detail.publicCible)}</div></div>
                <div><span className="text-gray-500 text-xs">Statut e-sénégal</span><div>{seBadge(detail.statutEsenegal)}</div></div>
                {detail.besoinSiTiers && <div className="col-span-2"><span className="text-gray-500 text-xs">Besoin SI tiers</span><div className="text-xs">{detail.besoinSiTiers}</div></div>}
                {detail.pointFocalSiTiers && <div><span className="text-gray-500 text-xs">Point focal SI</span><div className="text-xs">{detail.pointFocalSiTiers}</div></div>}
                {detail.ministere && <div><span className="text-gray-500 text-xs">Ministère</span><div className="text-xs">{detail.ministere}</div></div>}
              </div>

              {/* Métadonnées */}
              <div className="border-t pt-3">
                <span className="text-gray-500 text-xs">Provenance</span>
                <div className="flex gap-2 mt-1 items-center flex-wrap text-xs">
                  {modeBadge(detail.mode)}
                  {detail.ajoutePar && detail.ajoutePar !== 'MATCHING_AUTO' && <span className="text-gray-500">par {detail.ajoutePar === 'import-enrich-2026-07' ? 'import du séminaire 16/06' : detail.ajoutePar}</span>}
                  {detail.dateAjout && <span className="text-gray-400">{new Date(detail.dateAjout).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>

              {/* Priorisation */}
              {detail.priorisationJson && (
                <div className="border-t pt-3">
                  <span className="text-gray-500 text-xs font-semibold">Priorisation (séminaire)</span>
                  <div className="mt-1">{renderPriorisation(detail.priorisationJson)}</div>
                </div>
              )}

              {/* Liaisons */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs font-semibold">Liaisons PINS ({(detail.liaisons ?? []).length})</span>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="h-7 gap-1" onClick={(e) => { e.stopPropagation(); setLinkSvId(detail.id); }}>
                      <Plus className="h-3 w-3" /> Lier un CU
                    </Button>
                  )}
                </div>
                {linkSvId === detail.id && (
                  <div className="space-y-2 mb-3 p-2 border rounded bg-gray-50">
                    <SearchableSelect options={cuOptions} value={linkCuId} onChange={setLinkCuId} placeholder="Cas d'usage…" />
                    <Input value={linkNote} onChange={(e) => setLinkNote(e.target.value)} placeholder="Note (facultatif)" className="h-7 text-xs" />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => linkMutation.mutate({ casUsageId: linkCuId, serviceGuichetId: detail.id, note: linkNote || null })} disabled={!linkCuId}>Lier</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setLinkSvId(null); setLinkCuId(''); setLinkNote(''); }}>Annuler</Button>
                    </div>
                  </div>
                )}
                {(detail.liaisons ?? []).length === 0 ? (
                  <div className="text-xs text-gray-400 italic">Aucune liaison PINS.</div>
                ) : (
                  <ul className="space-y-1">
                    {(detail.liaisons ?? []).map((l: CuLiaison) => (
                      <LiaisonLine key={l.id} l={l} isAdmin={isAdmin}
                        onConfirm={(cuId) => confirmMutation.mutate({ casUsageId: cuId, serviceGuichetId: detail.id })}
                        onDelete={(lid) => deleteMutation.mutate(lid)} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* === MODAL AJOUT === */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); clearAddForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une démarche guichet</DialogTitle>
            <DialogDescription>Création tracée (mode AJOUT_MANUEL_DU), code PINS-GUICHET-NNN auto-généré.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Intitulé *</Label><Input value={newIntitule} onChange={(e) => setNewIntitule(e.target.value)} placeholder="Intitulé de la démarche" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Événement de vie</Label><Input value={newEVD} onChange={(e) => setNewEVD(e.target.value)} placeholder="Ex: Je me déplace" /></div>
              <div>
                <Label className="text-xs">Secteur</Label>
                <Input value={newSecteur} onChange={(e) => setNewSecteur(e.target.value)} placeholder="Ex: Transport" list="secteurs-modal" />
                <datalist id="secteurs-modal">{secteursDistincts.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div><Label className="text-xs">Public cible</Label><Select value={newPC || 'NONE'} onValueChange={(v) => setNewPC(v === 'NONE' ? '' : v)}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="NONE">—</SelectItem>{PUBLIC_CIBLES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Statut e-sénégal</Label><Select value={newStatut || 'NONE'} onValueChange={(v) => setNewStatut(v === 'NONE' ? '' : v)}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="NONE">—</SelectItem><SelectItem value="En ligne">En ligne</SelectItem><SelectItem value="En ligne mais Non utilisée">En ligne mais Non utilisée</SelectItem><SelectItem value="Pas en ligne">Pas en ligne</SelectItem><SelectItem value="Désactivée">Désactivée</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Besoin SI tiers</Label><Input value={newBsi} onChange={(e) => setNewBsi(e.target.value)} placeholder="Description du besoin..." /></div>
            {addMutation.isError && <div className="text-xs text-red-600">{(addMutation.error as any)?.response?.data?.error || 'Erreur'}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAdd(false); clearAddForm(); }}>Annuler</Button>
            <Button onClick={() => addMutation.mutate({ intitule: newIntitule, evenementDeVie: newEVD || undefined, secteur: newSecteur || undefined, publicCible: newPC || undefined, statutEsenegal: newStatut || undefined, besoinSiTiers: newBsi || undefined })} disabled={!newIntitule.trim() || addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ServicesGuichetPage;
