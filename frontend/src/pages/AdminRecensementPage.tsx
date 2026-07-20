import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import {
  RotateCcw, Download, ChevronLeft, ChevronRight, Eye, Search, X,
} from 'lucide-react';

type ProjetRecense = {
  id: string;
  origine: string;
  institutionId?: string | null;
  ministereTutelle: string;
  ministereAutre?: string | null;
  structureNom: string;
  typeStructure: string;
  contactNom: string;
  contactFonction: string;
  contactEmail: string;
  contactTelephone?: string | null;
  intitule: string;
  description: string;
  natures: string[];
  statutAvancement: string;
  anneeDebut?: number | null;
  anneeFin?: number | null;
  budgetFourchette: string;
  budgetMontant?: number | null;
  sourceFinancement: string;
  sourceFinancementPrecision?: string | null;
  echangeDonnees?: string | null;
  echangeDonneesDetail?: string | null;
  registresConcernes: string[];
  hebergement?: string | null;
  dossierArchitecture?: string | null;
  souhaitAccompagnement?: string | null;
  observations?: string | null;
  dateSoumission: string;
  ipTronquee?: string | null;
  sessionRef: string;
  statutTraitement: string;
  notesInternes?: string | null;
};

const STATUT_TRAITEMENT_LABELS: Record<string, { label: string; color: string }> = {
  A_QUALIFIER: { label: 'À qualifier', color: 'bg-gray-100 text-gray-700' },
  QUALIFIE: { label: 'Qualifié', color: 'bg-blue-100 text-blue-700' },
  RETENU_COMITE: { label: 'Retenu comité', color: 'bg-teal-100 text-teal-700' },
  ECARTE: { label: 'Écarté', color: 'bg-red-100 text-red-700' },
};

const STATUT_AVANCEMENT_LABELS: Record<string, string> = {
  IDEE_CONCEPTION: 'Idée',
  ETUDE_CADRAGE: 'Étude',
  EN_REALISATION: 'En réalisation',
  EN_PRODUCTION: 'En production',
  EN_REFONTE: 'En refonte',
  SUSPENDU: 'Suspendu',
};

const BUDGET_LABELS: Record<string, string> = {
  MOINS_50_MILLIONS: '< 50M',
  DE_50_A_200_MILLIONS: '50-200M',
  DE_200_MILLIONS_A_1_MILLIARD: '200M-1Md',
  PLUS_1_MILLIARD: '> 1Md',
  NON_CHIFFRE: 'N/C',
};

function formatLabel(key: string, map: Record<string, string>): string {
  return map[key] || key;
}

export function AdminRecensementPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    ministere: '', typeStructure: '', statutAvancement: '',
    budgetFourchette: '', souhaitAccompagnement: '', statutTraitement: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editStatut, setEditStatut] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const queryParams = { ...filters, search, page, limit: 20 };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-recensement', queryParams],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (filters.ministere) params.ministere = filters.ministere;
      if (filters.typeStructure) params.typeStructure = filters.typeStructure;
      if (filters.statutAvancement) params.statutAvancement = filters.statutAvancement;
      if (filters.budgetFourchette) params.budgetFourchette = filters.budgetFourchette;
      if (filters.souhaitAccompagnement) params.souhaitAccompagnement = filters.souhaitAccompagnement;
      if (filters.statutTraitement) params.statutTraitement = filters.statutTraitement;
      const { data: res } = await api.get('/admin/recensement', { params });
      return res as { data: ProjetRecense[]; total: number; page: number; totalPages: number };
    },
    placeholderData: keepPreviousData,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-recensement-stats'],
    queryFn: async () => {
      const { data: res } = await api.get('/admin/recensement/stats');
      return res as { total: number; structures: number; comite: number; echange: number; parStatut: Record<string, number> };
    },
    refetchInterval: 30000,
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-recensement-detail', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data: res } = await api.get(`/admin/recensement/${selectedId}`);
      return res as ProjetRecense;
    },
    enabled: !!selectedId,
  });

  const selected = detail || null;

  // Sync edit state when detail loads
  useMemo(() => {
    if (selected) {
      setEditStatut(selected.statutTraitement);
      setEditNotes(selected.notesInternes || '');
    }
  }, [selected]);

  const handleSaveQualification = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.patch(`/admin/recensement/${selectedId}/qualification`, {
        statutTraitement: editStatut,
        notesInternes: editNotes,
      });
      qc.invalidateQueries({ queryKey: ['admin-recensement'] });
      qc.invalidateQueries({ queryKey: ['admin-recensement-detail', selectedId] });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.ministere) params.set('ministere', filters.ministere);
    if (filters.statutAvancement) params.set('statutAvancement', filters.statutAvancement);
    if (filters.statutTraitement) params.set('statutTraitement', filters.statutTraitement);
    if (filters.souhaitAccompagnement) params.set('souhaitAccompagnement', filters.souhaitAccompagnement);
    const qs = params.toString();
    const url = `/api/admin/recensement/export/csv${qs ? '?' + qs : ''}`;
    window.open(url, '_blank');
  };

  const resetFilters = () => {
    setFilters({ ministere: '', typeStructure: '', statutAvancement: '', budgetFourchette: '', souhaitAccompagnement: '', statutTraitement: '' });
    setSearch('');
    setPage(1);
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Recensement des projets numériques de l'État</h1>
          <p className="text-sm text-gray-500 mt-1">Comité GouvNum — Constitution du portefeuille national</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-navy">{stats?.total ?? '-'}</div>
            <p className="text-xs text-gray-500">Soumissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-navy">{stats?.structures ?? '-'}</div>
            <p className="text-xs text-gray-500">Structures distinctes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-teal">{stats?.comite ?? '-'}</div>
            <p className="text-xs text-gray-500">Passage comité souhaité</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber">{stats?.echange ?? '-'}</div>
            <p className="text-xs text-gray-500">Échangent avec d'autres adm.</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes doublons (ADMIN uniquement) */}
      {isAdmin && data && (() => {
        const structures = data.data.map(p => p.structureNom);
        const dups = structures.filter((s, i) => structures.indexOf(s) !== i);
        const uniqueDups = [...new Set(dups)];
        // Vérifie si la même structure apparaît en PUBLIQUE et AUTHENTIFIEE
        const crossOrigin = data.data.filter(p => uniqueDups.includes(p.structureNom));
        const hasBothOrigins = uniqueDups.some(struc => {
          const origins = crossOrigin.filter(p => p.structureNom === struc).map(p => p.origine);
          return origins.includes('PUBLIQUE') && origins.includes('AUTHENTIFIEE');
        });
        if (!hasBothOrigins) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
            Doublons probables : certaines structures ont soumis à la fois via le formulaire public et en mode connecté. Vérifiez dans la liste.
          </div>
        );
      })()}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4 pb-2">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Recherche</Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <Input
                  className="pl-8 h-9 text-sm"
                  placeholder="Intitulé, structure, email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Statut</Label>
              <select
                className="h-9 border border-gray-300 rounded-md px-2 text-sm bg-white"
                value={filters.statutAvancement}
                onChange={e => { setFilters(f => ({ ...f, statutAvancement: e.target.value })); setPage(1); }}
              >
                <option value="">Tous</option>
                {Object.entries(STATUT_AVANCEMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Qualification</Label>
              <select
                className="h-9 border border-gray-300 rounded-md px-2 text-sm bg-white"
                value={filters.statutTraitement}
                onChange={e => { setFilters(f => ({ ...f, statutTraitement: e.target.value })); setPage(1); }}
              >
                <option value="">Tous</option>
                {Object.entries(STATUT_TRAITEMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4 mr-1" /> Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3">Structure</th>
                      <th className="px-4 py-3">Intitulé</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Comité</th>
                      <th className="px-4 py-3">Qualification</th>
                      {isAdmin && <th className="px-4 py-3">Origine</th>}
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.data || []).map(p => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-navy">{p.structureNom}</div>
                          <div className="text-xs text-gray-400">{p.ministereTutelle}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[250px] truncate" title={p.intitule}>
                          {p.intitule}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {formatLabel(p.statutAvancement, STATUT_AVANCEMENT_LABELS)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {formatLabel(p.budgetFourchette, BUDGET_LABELS)}
                        </td>
                        <td className="px-4 py-3">
                          {p.souhaitAccompagnement === 'OUI' && (
                            <Badge className="bg-teal-100 text-teal-700 text-xs">Oui</Badge>
                          )}
                          {p.souhaitAccompagnement === 'NON' && <span className="text-xs text-gray-400">Non</span>}
                          {(!p.souhaitAccompagnement || p.souhaitAccompagnement === 'A_DETERMINER') && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_TRAITEMENT_LABELS[p.statutTraitement]?.color || 'bg-gray-100'}`}>
                            {STATUT_TRAITEMENT_LABELS[p.statutTraitement]?.label || p.statutTraitement}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${p.origine === 'PUBLIQUE' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                              {p.origine === 'PUBLIQUE' ? 'Public' : 'Connecté'}
                            </Badge>
                          </td>
                        )}
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(p.dateSoumission).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedId(p.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!data?.data || data.data.length === 0) && (
                      <tr>
                        <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-gray-400">
                          Aucune soumission trouvée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.total > 20 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-gray-400">
                    {data.total} soumission{data.total > 1 ? 's' : ''} — page {page}/{totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Panneau latéral — détail */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-xl bg-white shadow-xl overflow-y-auto h-full"
            onClick={e => e.stopPropagation()}
          >
            {!selected ? (
              <div className="flex justify-center py-20"><Spinner /></div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
                  <h2 className="text-lg font-bold text-navy">{selected.intitule}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <Separator />

                {/* Structure */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Structure</h3>
                  <p className="text-sm font-medium">{selected.structureNom}</p>
                  <p className="text-xs text-gray-500">{selected.ministereTutelle}</p>
                  {selected.ministereAutre && <p className="text-xs text-gray-400">({selected.ministereAutre})</p>}
                  <p className="text-xs text-gray-400">Type : {selected.typeStructure}</p>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Contact</h3>
                  <p className="text-sm">{selected.contactNom} — {selected.contactFonction}</p>
                  <p className="text-xs text-gray-500">{selected.contactEmail}</p>
                  {selected.contactTelephone && <p className="text-xs text-gray-400">{selected.contactTelephone}</p>}
                </div>

                <Separator />

                {/* Projet */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Projet</h3>
                  <div className="space-y-2 text-sm">
                    <p>{selected.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {(selected.natures || []).map(n => (
                        <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>Statut : <strong>{formatLabel(selected.statutAvancement, STATUT_AVANCEMENT_LABELS)}</strong></div>
                      <div>Budget : <strong>{formatLabel(selected.budgetFourchette, BUDGET_LABELS)}</strong>{selected.budgetMontant ? ` (${selected.budgetMontant.toLocaleString('fr-FR')} FCFA)` : ''}</div>
                      <div>Source : <strong>{selected.sourceFinancement}</strong>{selected.sourceFinancementPrecision ? ` (${selected.sourceFinancementPrecision})` : ''}</div>
                      <div>Période : {selected.anneeDebut || '?'} → {selected.anneeFin || '?'}</div>
                    </div>
                  </div>
                </div>

                {/* Qualification technique */}
                {selected.echangeDonnees && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Qualification interopérabilité</h3>
                    <div className="space-y-2 text-sm">
                      <div>Échange de données : <strong>{selected.echangeDonnees}</strong></div>
                      {selected.echangeDonneesDetail && <p className="text-xs text-gray-500">{selected.echangeDonneesDetail}</p>}
                      {selected.registresConcernes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selected.registresConcernes.map(r => (
                            <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      )}
                      <div>Hébergement : <strong>{selected.hebergement || '—'}</strong></div>
                      <div>Dossier architecture : <strong>{selected.dossierArchitecture || '—'}</strong></div>
                      <div>Souhait accompagnement : <strong>{selected.souhaitAccompagnement || '—'}</strong></div>
                    </div>
                  </div>
                )}

                {selected.observations && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Observations</h3>
                    <p className="text-sm text-gray-600">{selected.observations}</p>
                  </div>
                )}

                <Separator />

                {/* Qualification interne — ADMIN uniquement */}
                {isAdmin && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Qualification interne</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Statut de traitement</Label>
                      <select
                        className="w-full h-9 border border-gray-300 rounded-md px-2 text-sm bg-white mt-1"
                        value={editStatut}
                        onChange={e => setEditStatut(e.target.value)}
                      >
                        {Object.entries(STATUT_TRAITEMENT_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Notes internes</Label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none mt-1"
                        rows={3}
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Notes visibles uniquement par l'équipe DU..."
                      />
                    </div>
                    <Button
                      size="sm"
                      className="bg-teal hover:bg-teal-dark text-white"
                      onClick={handleSaveQualification}
                      disabled={saving}
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer la qualification'}
                    </Button>
                  </div>
                </div>
                )}

                {/* Métadonnées */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Métadonnées</h3>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Soumis le : {new Date(selected.dateSoumission).toLocaleString('fr-FR')}</div>
                    <div>IP : {selected.ipTronquee || '—'}</div>
                    <div>Session : {selected.sessionRef}</div>
                    <div>ID : {selected.id}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
