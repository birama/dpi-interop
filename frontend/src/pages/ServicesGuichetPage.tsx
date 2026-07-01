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
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, Plus, Trash2, CheckCircle2, Search } from 'lucide-react';

interface CuLiaison {
  id: string; mode: string | null; note: string | null; dateAjout: string;
  casUsage: { id: string; code: string; titre: string; domaine: string | null };
}

interface ServiceRow {
  id: string; code: string; intitule: string;
  evenementDeVie: string | null; secteur: string | null;
  publicCible: 'CITOYEN' | 'ENTREPRISE' | 'MIXTE' | null;
  statutEsenegal: string | null; besoinSiTiers: string | null;
  liaisons: CuLiaison[];
}

const PUBLIC_CIBLES = ['CITOYEN', 'ENTREPRISE', 'MIXTE'] as const;

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

export function ServicesGuichetPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();

  const [fSecteur, setFSecteur] = useState('');
  const [fPublicCible, setFPublicCible] = useState('');
  const [fLiaison, setFLiaison] = useState<'ALL' | 'OUI' | 'NON'>('ALL');
  const [fMode, setFMode] = useState('');
  const [searchQ, setSearchQ] = useState('');

  // Services with liaisons
  const { data, isLoading } = useQuery({
    queryKey: ['services-guichet-list', fSecteur, fPublicCible, fLiaison, fMode],
    queryFn: () => api.get(`/catalogue/services-guichet?avecLiaisons=true${fSecteur ? `&secteur=${encodeURIComponent(fSecteur)}` : ''}${fPublicCible ? `&publicCible=${fPublicCible}` : ''}`).then((r) => r.data),
  });

  const items: ServiceRow[] = useMemo(() => {
    let rows = (data?.items ?? []) as ServiceRow[];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      rows = rows.filter((s) => s.intitule.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    if (fLiaison === 'OUI') rows = rows.filter((s) => s.liaisons?.length > 0);
    if (fLiaison === 'NON') rows = rows.filter((s) => !s.liaisons || s.liaisons.length === 0);
    if (fMode) rows = rows.filter((s) => (s.liaisons ?? []).some((l) => l.mode === fMode));
    return rows;
  }, [data, searchQ, fLiaison, fMode]);

  const secteursDistincts = useMemo(() => {
    const set = new Set<string>();
    (data?.items ?? []).forEach((s: ServiceRow) => { if (s.secteur) set.add(s.secteur); });
    return [...set].sort();
  }, [data]);

  // ---- Mutations ----
  const deleteMutation = useMutation({
    mutationFn: (liaisonId: string) => api.delete(`/catalogue/liaisons-guichet/${liaisonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services-guichet-list'] }),
  });
  const confirmMutation = useMutation({
    mutationFn: (vars: { casUsageId: string; serviceGuichetId: string }) =>
      api.post(`/catalogue/cas-usage/${vars.casUsageId}/liaisons-guichet`, { serviceGuichetId: vars.serviceGuichetId, mode: 'VALIDE_HUMAIN' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services-guichet-list'] }),
  });

  // ---- Lier un CU (par ServiceGuichet) ----
  const [linkSvId, setLinkSvId] = useState<string | null>(null);
  const [linkCuId, setLinkCuId] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const { data: cuSearch } = useQuery({
    queryKey: ['cu-search', linkSvId],
    queryFn: () => api.get('/catalogue/propositions?pageSize=500').then((r) => r.data),
    enabled: !!linkSvId,
    staleTime: 120_000,
  });
  const cuOptions = useMemo(() => {
    return (cuSearch?.items ?? []).map((cu: any) => ({
      value: cu.id,
      label: `${cu.code} — ${cu.titre ?? ''}`.slice(0, 100),
      sublabel: [cu.domaine, cu.typologie].filter(Boolean).join(' · '),
    }));
  }, [cuSearch]);

  const linkMutation = useMutation({
    mutationFn: (vars: { casUsageId: string; serviceGuichetId: string; note?: string | null; mode?: string }) =>
      api.post(`/catalogue/cas-usage/${vars.casUsageId}/liaisons-guichet`, { serviceGuichetId: vars.serviceGuichetId, note: vars.note, mode: vars.mode }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-guichet-list'] }); setLinkSvId(null); setLinkCuId(''); setLinkNote(''); },
  });

  // ---- Ajouter une démarche ----
  const [showAdd, setShowAdd] = useState(false);
  const [newIntitule, setNewIntitule] = useState('');
  const [newEVD, setNewEVD] = useState('');
  const [newSecteur, setNewSecteur] = useState('');
  const [newPC, setNewPC] = useState('');
  const [newStatut, setNewStatut] = useState('');
  const [newBsi, setNewBsi] = useState('');

  const addMutation = useMutation({
    mutationFn: (vars: any) => api.post('/catalogue/services-guichet', vars),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-guichet-list'] }); setShowAdd(false); clearAddForm(); },
  });

  const clearAddForm = () => { setNewIntitule(''); setNewEVD(''); setNewSecteur(''); setNewPC(''); setNewStatut(''); setNewBsi(''); };

  // ---- KPI counts ----
  const avecLiaison = (data?.items ?? []).filter((s: ServiceRow) => (s.liaisons ?? []).length > 0).length;
  const aConfirmer = (data?.items ?? []).filter((s: ServiceRow) => (s.liaisons ?? []).some((l) => l.mode === 'MATCHING_AUTO_A_CONFIRMER')).length;
  const valides = (data?.items ?? []).filter((s: ServiceRow) => (s.liaisons ?? []).some((l) => l.mode === 'VALIDE_HUMAIN')).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Services guichet (e-sénégal)</h1>
          <p className="text-sm text-gray-600 mt-1">
            Revue des démarches guichet, de leurs liaisons au catalogue PINS, et validation des correspondances proposées.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter une démarche
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-navy/20"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-navy">{data?.total ?? '—'}</div><div className="text-xs text-gray-500">Démarches total</div></CardContent></Card>
        <Card className="border-teal/30"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-teal">{avecLiaison}</div><div className="text-xs text-gray-500">Avec liaison PINS</div></CardContent></Card>
        <Card className="border-amber-300"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-amber-700">{aConfirmer}</div><div className="text-xs text-gray-500">À confirmer</div></CardContent></Card>
        <Card className="border-green-300"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-green-700">{valides}</div><div className="text-xs text-gray-500">Validées</div></CardContent></Card>
      </div>

      {/* Add form */}
      {showAdd && isAdmin && (
        <Card className="border-blue-300 bg-blue-50/30">
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold text-navy text-sm">Nouvelle démarche guichet</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Intitulé *</Label>
                <Input value={newIntitule} onChange={(e) => setNewIntitule(e.target.value)} placeholder="Intitulé de la démarche" />
              </div>
              <div>
                <Label className="text-xs">Événement de vie</Label>
                <Input value={newEVD} onChange={(e) => setNewEVD(e.target.value)} placeholder="Ex: Je me déplace" />
              </div>
              <div>
                <Label className="text-xs">Secteur</Label>
                <Input value={newSecteur} onChange={(e) => setNewSecteur(e.target.value)} placeholder="Ex: Transport" list="secteurs-list" />
                <datalist id="secteurs-list">{secteursDistincts.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div>
                <Label className="text-xs">Public cible</Label>
                <Select value={newPC || 'NONE'} onValueChange={(v) => setNewPC(v === 'NONE' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">—</SelectItem>
                    {PUBLIC_CIBLES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Statut e-sénégal</Label>
                <Select value={newStatut || 'NONE'} onValueChange={(v) => setNewStatut(v === 'NONE' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">—</SelectItem>
                    <SelectItem value="En ligne">En ligne</SelectItem>
                    <SelectItem value="En ligne mais Non utilisée">En ligne mais Non utilisée</SelectItem>
                    <SelectItem value="Pas en ligne">Pas en ligne</SelectItem>
                    <SelectItem value="Désactivée">Désactivée</SelectItem>
                    <SelectItem value="Pas disponible sur teledac">Pas disponible sur teledac</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Besoin SI tiers</Label>
                <Input value={newBsi} onChange={(e) => setNewBsi(e.target.value)} placeholder="Description du besoin..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { clearAddForm(); setShowAdd(false); }}>Annuler</Button>
              <Button size="sm" onClick={() => addMutation.mutate({ intitule: newIntitule, evenementDeVie: newEVD, secteur: newSecteur, publicCible: newPC || undefined, statutEsenegal: newStatut || undefined, besoinSiTiers: newBsi || undefined })} disabled={!newIntitule.trim() || addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
              </Button>
            </div>
            {addMutation.isError && <div className="text-xs text-red-600">{(addMutation.error as any)?.response?.data?.error || 'Erreur'}</div>}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Recherche</Label>
            <div className="relative"><Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" /><Input className="pl-7" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Par intitulé ou code..." /></div>
          </div>
          <div>
            <Label className="text-xs">Secteur</Label>
            <Select value={fSecteur || 'ALL'} onValueChange={(v) => setFSecteur(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {secteursDistincts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Public cible</Label>
            <Select value={fPublicCible || 'ALL'} onValueChange={(v) => setFPublicCible(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {PUBLIC_CIBLES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Liaison</Label>
            <Select value={fLiaison} onValueChange={(v) => setFLiaison(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="OUI">Avec liaison</SelectItem>
                <SelectItem value="NON">Sans liaison</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mode</Label>
            <Select value={fMode || 'ALL'} onValueChange={(v) => setFMode(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="MATCHING_AUTO">MATCHING_AUTO</SelectItem>
                <SelectItem value="MATCHING_AUTO_A_CONFIRMER">À confirmer</SelectItem>
                <SelectItem value="VALIDE_HUMAIN">Validé</SelectItem>
                <SelectItem value="AJOUT_MANUEL_DU">Manuel DU</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Chargement…</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Aucun service ne correspond aux filtres.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-700">Service guichet</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Secteur</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Public</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">e-sénégal</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Liaison(s) PINS</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((svc) => (
                  <tr key={svc.id} className={`hover:bg-gray-50 align-top ${(svc.liaisons ?? []).some((l) => l.mode === 'MATCHING_AUTO_A_CONFIRMER') ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-gray-500">{svc.code}</div>
                      <div className="text-gray-800 mt-0.5 font-medium">{svc.intitule}</div>
                      {svc.evenementDeVie && <div className="text-xs text-gray-500 mt-1">{svc.evenementDeVie}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{svc.secteur || '—'}</td>
                    <td className="px-3 py-3">{pcBadge(svc.publicCible)}</td>
                    <td className="px-3 py-3">{seBadge(svc.statutEsenegal)}</td>
                    <td className="px-3 py-3 min-w-[250px]">
                      {(svc.liaisons ?? []).length === 0 ? (
                        <span className="text-gray-400 italic text-xs">Aucune liaison</span>
                      ) : (
                        <ul className="space-y-1.5">
                          {(svc.liaisons ?? []).map((l) => (
                            <li key={l.id} className="flex items-center gap-2 flex-wrap">
                              {modeBadge(l.mode)}
                              <Link to={`/admin/cas-usage/${l.casUsage.id}`} className="font-mono text-xs text-navy hover:underline">{l.casUsage.code}</Link>
                              <span className="text-xs text-gray-600">{l.casUsage.titre.slice(0, 60)}</span>
                              {isAdmin && (
                                <span className="flex gap-1 ml-auto">
                                  {l.mode === 'MATCHING_AUTO_A_CONFIRMER' && (
                                    <Button size="sm" variant="ghost" className="h-6 text-teal hover:text-teal" title="Confirmer la liaison"
                                      onClick={() => confirmMutation.mutate({ casUsageId: l.casUsage.id, serviceGuichetId: svc.id })}>
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-6 text-red-500 hover:text-red-700"
                                    onClick={() => { if (confirm(`Supprimer la liaison ${l.casUsage.code} ?`)) deleteMutation.mutate(l.id); }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isAdmin && (
                        <div>
                          {linkSvId === svc.id ? (
                            <div className="space-y-2 w-64">
                              <SearchableSelect options={cuOptions} value={linkCuId} onChange={setLinkCuId} placeholder="Cas d'usage…" />
                              <Input value={linkNote} onChange={(e) => setLinkNote(e.target.value)} placeholder="Note (facultatif)" className="h-7 text-xs" />
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => linkMutation.mutate({ casUsageId: linkCuId, serviceGuichetId: svc.id, note: linkNote || null })} disabled={!linkCuId}>Lier</Button>
                                <Button size="sm" variant="ghost" onClick={() => setLinkSvId(null)}>Annuler</Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => { setLinkSvId(svc.id); setLinkCuId(''); setLinkNote(''); }}>
                              <Plus className="h-3 w-3" /> Lier un CU
                            </Button>
                          )}
                        </div>
                      )}
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

export default ServicesGuichetPage;
