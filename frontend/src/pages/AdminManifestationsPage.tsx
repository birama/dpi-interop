import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/services/api';
import {
  Loader2, Calendar, Coins, Mail, Inbox, Eye, ChevronLeft, ChevronRight,
  Building2, FileText, ExternalLink, History,
} from 'lucide-react';

const STATUTS = ['DRAFT', 'EN_VALIDATION', 'PUBLIE', 'REJETE', 'RETIRE'] as const;
type Statut = typeof STATUTS[number];

const STATUT_META: Record<Statut, { label: string; cls: string; cardCls: string }> = {
  DRAFT:         { label: 'Brouillon',     cls: 'bg-gray-100 text-gray-700 border-gray-300',         cardCls: 'border-gray-300' },
  EN_VALIDATION: { label: 'En validation', cls: 'bg-amber-100 text-amber-800 border-amber-300',      cardCls: 'border-amber-400 bg-amber-50' },
  PUBLIE:        { label: 'Publiée',       cls: 'bg-teal/15 text-teal-800 border-teal/40',            cardCls: 'border-teal/40' },
  REJETE:        { label: 'Refusée',       cls: 'bg-red-100 text-red-700 border-red-300',             cardCls: 'border-red-300' },
  RETIRE:        { label: 'Retirée',       cls: 'bg-gray-100 text-gray-500 border-gray-300',          cardCls: 'border-gray-300' },
};

const DOMAINES = [
  'FINANCES_PUBLIQUES', 'CLIMAT_AFFAIRES', 'PROTECTION_SOCIALE', 'SANTE_NUMERIQUE',
  'EDUCATION', 'IDENTITE_NUMERIQUE', 'JUSTICE_ETAT_CIVIL', 'FONCIER_CADASTRE',
  'AGRICULTURE_NUMERIQUE', 'EMPLOI_FORMATION', 'SERVICES_CITOYENS',
  'GOUVERNANCE_DONNEES', 'CYBERSECURITE', 'TRANSVERSAL',
];

const ACTION_LABELS: Record<string, string> = {
  CREATION_MANIFESTATION: 'Création (brouillon)',
  MODIFICATION_MANIFESTATION: 'Modification',
  SOUMISSION_MANIFESTATION: 'Soumission à la DU',
  RETRAIT_MANIFESTATION: 'Retrait / suppression',
  VALIDATION_MANIFESTATION: 'Validation DU',
  REJET_MANIFESTATION: 'Rejet DU',
};

export function AdminManifestationsPage() {
  const [statut, setStatut] = useState<Statut | 'ALL'>('EN_VALIDATION');
  const [ptfId, setPtfId] = useState<string>('');
  const [domaine, setDomaine] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Liste des PTF pour le filtre (réutilise /admin/ptf)
  const { data: ptfList } = useQuery({
    queryKey: ['admin-ptf-filter'],
    queryFn: () => api.get('/admin/ptf?pageSize=100').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const params = new URLSearchParams();
  if (statut !== 'ALL') params.set('statut', statut);
  if (ptfId) params.set('ptfId', ptfId);
  if (domaine) params.set('domaine', domaine);
  if (dateDebut) params.set('dateDebut', dateDebut);
  if (dateFin) params.set('dateFin', dateFin);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-manifestations', params.toString()],
    queryFn: () => api.get(`/admin/manifestations?${params.toString()}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const items: any[] = data?.data || [];
  const kpis: Record<string, number> = data?.kpis || {};
  const total: number = data?.total || 0;
  const totalPages: number = data?.totalPages || 1;

  const { data: detail } = useQuery({
    queryKey: ['admin-manifestation', selectedId],
    queryFn: () => api.get(`/admin/manifestations/${selectedId}`).then((r) => r.data),
    enabled: !!selectedId,
  });

  const resetFilters = () => {
    setStatut('EN_VALIDATION'); setPtfId(''); setDomaine('');
    setDateDebut(''); setDateFin(''); setPage(1);
  };

  const ptfOptions = useMemo(() => (ptfList?.data || []) as any[], [ptfList]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
          <Inbox className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Manifestations d'intérêt PTF</h1>
          <p className="text-sm text-gray-500">
            File des manifestations déposées par les Partenaires Techniques et Financiers
          </p>
        </div>
      </div>

      {/* KPI 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUTS.map((s) => (
          <Card key={s} className={`border ${STATUT_META[s].cardCls}`}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">{STATUT_META[s].label}</p>
              <p className="text-2xl font-bold text-navy">{kpis[s] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-navy text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <Label className="text-xs text-gray-500">Statut</Label>
            <Select value={statut} onValueChange={(v) => { setStatut(v as any); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {STATUTS.map((s) => (<SelectItem key={s} value={s}>{STATUT_META[s].label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">PTF émetteur</Label>
            <Select value={ptfId || 'ALL'} onValueChange={(v) => { setPtfId(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {ptfOptions.map((u: any) => (
                  u.ptf && <SelectItem key={u.ptf.id} value={u.ptf.id}>{u.ptf.code} — {u.ptf.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Domaine du cas</Label>
            <Select value={domaine || 'ALL'} onValueChange={(v) => { setDomaine(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="ALL">Tous</SelectItem>
                {DOMAINES.map((d) => (
                  <SelectItem key={d} value={d}>{d.replace(/_/g, ' ').toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Soumis du</Label>
            <Input type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); setPage(1); }} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Soumis au</Label>
            <Input type="date" value={dateFin} onChange={(e) => { setDateFin(e.target.value); setPage(1); }} />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button variant="outline" size="sm" onClick={resetFilters}>Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Aucune manifestation pour ces filtres.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-base">
              {total} manifestation{total > 1 ? 's' : ''} — page {page}/{totalPages}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 px-3">Soumis le</th>
                    <th className="py-2 px-3">PTF émetteur</th>
                    <th className="py-2 px-3">Cas concerné</th>
                    <th className="py-2 px-3">Domaine</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Montant</th>
                    <th className="py-2 px-3">Statut</th>
                    <th className="py-2 px-3 text-right">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m: any) => {
                    const meta = STATUT_META[m.statut as Statut] || { label: m.statut, cls: '' };
                    return (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-xs text-gray-700 whitespace-nowrap">
                          <Calendar className="inline w-3 h-3 mr-1 text-gray-400" />
                          {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          <Link to={`/admin/ptf/${m.user?.id}`} className="font-medium text-navy hover:underline">
                            {m.ptf?.code} — {m.ptf?.nom}
                          </Link>
                          {m.user?.email && <p className="text-gray-500">{m.user.email}</p>}
                        </td>
                        <td className="py-2.5 px-3">
                          <Link to={`/admin/cas-usage/${m.casUsage?.id}`} className="hover:underline">
                            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                              {m.casUsage?.code}
                            </span>
                            <span className="text-navy">{truncate(m.casUsage?.titre, 50)}</span>
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-700">
                          {m.casUsage?.domaine?.replace(/_/g, ' ').toLowerCase() || '—'}
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
                          <Badge variant="outline" className={`${meta.cls} text-[11px]`}>{meta.label}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(m.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50">
                <p className="text-xs text-gray-500">
                  Affichage {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}
                </p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal détail enrichi */}
      <Dialog open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail ? `Manifestation — ${detail.ptf?.code} sur ${detail.casUsage?.code}` : 'Détail'}
            </DialogTitle>
          </DialogHeader>
          {!detail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
            </div>
          ) : (
            <ManifestationDetail manif={detail} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedId(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ManifestationDetail({ manif }: { manif: any }) {
  const meta = STATUT_META[manif.statut as Statut] || { label: manif.statut, cls: '' };
  return (
    <div className="text-sm space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
        <Badge variant="outline">
          {manif.type === 'FINANCEMENT' ? 'Financement' : 'Intérêt'}
        </Badge>
        {manif.type === 'FINANCEMENT' && manif.montantEstime != null && (
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
            <Coins className="w-3 h-3 mr-1" />
            {Number(manif.montantEstime).toLocaleString('fr-FR')} {manif.devise}
          </Badge>
        )}
        {manif.instrumentFinancier && (
          <Badge variant="outline">{manif.instrumentFinancier.replace(/_/g, ' ').toLowerCase()}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3 bg-slate-50">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Partenaire
          </p>
          <Link to={`/admin/ptf/${manif.user?.id}`} className="font-medium text-navy hover:underline">
            {manif.ptf?.nom} ({manif.ptf?.code}) <ExternalLink className="inline w-3 h-3" />
          </Link>
          {manif.ptf?.contactNom && (
            <p className="text-xs text-gray-700 mt-1">Point focal : {manif.ptf.contactNom}</p>
          )}
          {manif.ptf?.contactEmail && (
            <p className="text-xs text-gray-600"><Mail className="inline w-3 h-3 mr-1" />{manif.ptf.contactEmail}</p>
          )}
          {manif.ptf?.contactTel && (
            <p className="text-xs text-gray-600">Tél : {manif.ptf.contactTel}</p>
          )}
          {manif.user?.email && (
            <p className="text-xs text-gray-500 italic mt-1">Compte déposant : {manif.user.email}</p>
          )}
        </div>

        <div className="border rounded p-3 bg-slate-50">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Cas d'usage
          </p>
          <Link to={`/admin/cas-usage/${manif.casUsage?.id}`} className="font-medium text-navy hover:underline">
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
              {manif.casUsage?.code}
            </span>
            {manif.casUsage?.titre} <ExternalLink className="inline w-3 h-3" />
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            Domaine : {manif.casUsage?.domaine?.replace(/_/g, ' ').toLowerCase() || '—'}
            {' · '}Statut : {manif.casUsage?.statutVueSection?.replace(/_/g, ' ') || '—'}
          </p>
        </div>
      </div>

      {manif.fenetreTemporelle && (
        <div>
          <p className="text-xs text-gray-500">Fenêtre temporelle envisagée</p>
          <p className="font-medium">{manif.fenetreTemporelle}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-1">Description</p>
        <p className="whitespace-pre-line text-gray-800 border rounded p-3 bg-white">
          {manif.commentaire}
        </p>
      </div>

      {manif.statut === 'REJETE' && manif.motifRejet && (
        <div>
          <p className="text-xs text-red-700 mb-1">Motif de refus</p>
          <p className="whitespace-pre-line text-red-900 border border-red-200 rounded p-3 bg-red-50">
            {manif.motifRejet}
          </p>
        </div>
      )}

      {/* Historique */}
      {Array.isArray(manif.historique) && manif.historique.length > 0 && (
        <div className="border rounded p-3 bg-white">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <History className="w-3 h-3" /> Historique des actions PTF
          </p>
          <ol className="space-y-1.5 border-l-2 border-teal/30 pl-3">
            {manif.historique.map((h: any) => (
              <li key={h.id} className="text-xs">
                <p className="text-gray-700">
                  <span className="font-medium text-navy">{ACTION_LABELS[h.action] || h.action}</span>
                  {h.userEmail && <span className="text-gray-500"> par {h.userEmail}</span>}
                </p>
                <p className="text-gray-400">{new Date(h.createdAt).toLocaleString('fr-FR')}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t">
        <p>Créée le {new Date(manif.createdAt).toLocaleString('fr-FR')}</p>
        <p>Mise à jour le {new Date(manif.updatedAt).toLocaleString('fr-FR')}</p>
        {manif.dateValidation && (
          <p>Validée le {new Date(manif.dateValidation).toLocaleString('fr-FR')}</p>
        )}
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        <b>Workflow d'arbitrage</b> — Valider / Rejeter / Demander complément sera disponible
        avec la <b>Phase 5 du module PTF (cible juin 2026)</b>. Pour le MVP actuel, la prise
        de contact avec le PTF se fait par voie directe via le point focal renseigné ci-dessus.
      </div>
    </div>
  );
}

function truncate(s: string | undefined, n: number) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
