import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import {
  Loader2, ArrowLeft, Briefcase, Mail, Phone, Globe, Calendar, Coins,
  UserCheck, Tags, Inbox, Activity, Eye, FileText,
} from 'lucide-react';

const STATUTS = ['DRAFT', 'EN_VALIDATION', 'PUBLIE', 'REJETE', 'RETIRE'] as const;
type Statut = typeof STATUTS[number];

const STATUT_META: Record<Statut, { label: string; cls: string }> = {
  DRAFT:         { label: 'Brouillon',     cls: 'bg-gray-100 text-gray-700 border-gray-300' },
  EN_VALIDATION: { label: 'En validation', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  PUBLIE:        { label: 'Publiée',       cls: 'bg-teal/15 text-teal-800 border-teal/40' },
  REJETE:        { label: 'Refusée',       cls: 'bg-red-100 text-red-700 border-red-300' },
  RETIRE:        { label: 'Retirée',       cls: 'bg-gray-100 text-gray-500 border-gray-300' },
};

const TABS = ['profil', 'domaines', 'manifestations', 'activite'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, { label: string; icon: any }> = {
  profil: { label: 'Profil', icon: UserCheck },
  domaines: { label: 'Domaines d\'intérêt', icon: Tags },
  manifestations: { label: 'Manifestations', icon: Inbox },
  activite: { label: 'Activité', icon: Activity },
};

export function AdminPtfDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('manifestations');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-ptf-detail', id],
    queryFn: () => api.get(`/admin/ptf/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: manifResp } = useQuery({
    queryKey: ['admin-ptf-manifestations', id],
    queryFn: () => api.get(`/admin/ptf/${id}/manifestations`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading || !detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  const ptf = detail.ptf;
  const stats = detail.stats || {};
  const manifs: any[] = manifResp?.data || [];
  const manifKpis: Record<string, number> = manifResp?.kpis || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/ptf')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Liste PTF
        </Button>
      </div>

      {/* Banner */}
      <Card className="bg-slate-50 border-teal/30">
        <CardContent className="pt-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-lg bg-teal/15 flex items-center justify-center font-bold text-teal-700 text-xl">
              {(ptf?.code || detail.email).slice(0, 3).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-navy">{ptf?.nom || detail.email}</h1>
              {ptf?.code && <p className="text-sm text-gray-500">{ptf.code} {ptf.acronyme && `· ${ptf.acronyme}`}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <Badge variant="outline" className={detail.actif ? 'bg-teal/10 text-teal-800 border-teal/30' : 'bg-gray-100 text-gray-500'}>
                  {detail.actif ? 'Actif' : 'Inactif'}
                </Badge>
                <span className="text-gray-500">
                  <Mail className="inline w-3 h-3 mr-1" /> {detail.email}
                </span>
                {ptf?.type && (
                  <span className="text-gray-500"><Briefcase className="inline w-3 h-3 mr-1" />{ptf.type.replace(/_/g, ' ')}</span>
                )}
                {ptf?.pays && <span className="text-gray-500"><Globe className="inline w-3 h-3 mr-1" />{ptf.pays}</span>}
                <span className="text-gray-500">
                  <Calendar className="inline w-3 h-3 mr-1" />Compte créé le {new Date(detail.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-gray-500">
                  Dernière connexion :{' '}
                  {detail.derniereConnexion
                    ? new Date(detail.derniereConnexion).toLocaleString('fr-FR')
                    : <span className="italic">jamais</span>}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniKpi label="Manifestations" value={stats.total || 0} />
              <MiniKpi label="En validation" value={stats.EN_VALIDATION || 0} highlight />
              <MiniKpi label="Cas couverts" value={stats.casCouverts || 0} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {TABS.map((t) => {
          const M = TAB_LABELS[t];
          const Icon = M.icon;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === t ? 'border-teal-700 text-teal-800 font-medium' : 'border-transparent text-gray-600 hover:text-navy'
              }`}
            >
              <Icon className="w-4 h-4" />
              {M.label}
            </button>
          );
        })}
      </div>

      {tab === 'profil' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-base">Profil du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Email">{detail.email}</Row>
            <Row label="Organisation">{ptf?.nom} {ptf?.code && <span className="text-gray-400">({ptf.code})</span>}</Row>
            {ptf?.acronyme && <Row label="Acronyme">{ptf.acronyme}</Row>}
            {ptf?.type && <Row label="Type">{ptf.type.replace(/_/g, ' ')}</Row>}
            {ptf?.pays && <Row label="Pays"><Globe className="inline w-3 h-3 mr-1 text-gray-400" />{ptf.pays}</Row>}
            {ptf?.contactNom && <Row label="Point focal PTF">{ptf.contactNom}</Row>}
            {ptf?.contactEmail && <Row label="Email contact"><Mail className="inline w-3 h-3 mr-1 text-gray-400" />{ptf.contactEmail}</Row>}
            {ptf?.contactTel && <Row label="Téléphone"><Phone className="inline w-3 h-3 mr-1 text-gray-400" />{ptf.contactTel}</Row>}
            <Row label="Compte créé le">{new Date(detail.createdAt).toLocaleString('fr-FR')}</Row>
            <Row label="Dernière connexion">
              {detail.derniereConnexion ? new Date(detail.derniereConnexion).toLocaleString('fr-FR') : <span className="italic text-gray-400">jamais</span>}
            </Row>
            <Row label="Connexions sur 30 jours">{stats.connexions30j ?? 0}</Row>
            <Row label="CGU acceptées">
              {detail.cguAccepteesAt
                ? new Date(detail.cguAccepteesAt).toLocaleString('fr-FR')
                : <span className="text-amber-700 italic">En attente</span>}
            </Row>
            <p className="text-xs italic text-gray-500 mt-3 border-t pt-3">
              Modification du compte ou du profil PTF : faire une demande à la DU (admin/utilisateurs).
            </p>
          </CardContent>
        </Card>
      )}

      {tab === 'domaines' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-base">Domaines d'intérêt déclarés</CardTitle>
          </CardHeader>
          <CardContent>
            {(detail.domainesAvecEligibilite || []).length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun domaine d'intérêt déclaré.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {detail.domainesAvecEligibilite.map((d: any) => (
                  <div key={d.domaine} className="border rounded-md p-3 flex items-center justify-between">
                    <Badge className="bg-teal/10 text-teal-800 border border-teal/30">
                      {d.domaine.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    <span className="text-xs text-gray-700">
                      <b>{d.nbEligibles}</b> cas éligibles
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs italic text-gray-500 mt-4 border-t pt-3">
              Les domaines sont modifiables sur demande à la Delivery Unit MCTN.
              Un cas est <i>éligible</i> s'il est priorisé, à financer et dans le périmètre du PTF.
            </p>
          </CardContent>
        </Card>
      )}

      {tab === 'manifestations' && (
        <>
          {/* mini-KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STATUTS.map((s) => (
              <Card key={s}>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500">{STATUT_META[s].label}</p>
                  <p className="text-2xl font-bold text-navy">{manifKpis[s] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {manifs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                Ce PTF n'a déposé aucune manifestation.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-navy text-base">{manifs.length} manifestation{manifs.length > 1 ? 's' : ''}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr className="text-left text-xs text-gray-500">
                        <th className="py-2 px-3">Date dépôt</th>
                        <th className="py-2 px-3">Cas concerné</th>
                        <th className="py-2 px-3">Domaine</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Montant</th>
                        <th className="py-2 px-3">Statut</th>
                        <th className="py-2 px-3 text-right">Détail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manifs.map((m: any) => {
                        const meta = STATUT_META[m.statut as Statut] || { label: m.statut, cls: '' };
                        return (
                          <tr key={m.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-xs text-gray-700">
                              {new Date(m.createdAt).toLocaleDateString('fr-FR')}
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
                              <Link to={`/admin/manifestations?ptfId=${ptf?.id}`}>
                                <Button size="sm" variant="outline" title="Voir dans la file globale"><Eye className="w-4 h-4" /></Button>
                              </Link>
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
          <Link to="/admin/manifestations" className="inline-flex items-center text-xs text-teal-700 hover:underline">
            <FileText className="w-3 h-3 mr-1" /> Voir toutes les manifestations de la file globale
          </Link>
        </>
      )}

      {tab === 'activite' && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500 space-y-2">
            <Activity className="w-10 h-10 mx-auto text-gray-300" />
            <p>Timeline détaillée d'activité PTF (connexions, consultations, manifestations).</p>
            <p className="text-xs italic">Disponible en Phase 5 du module PTF — cible juin 2026.</p>
            <p className="text-xs text-gray-700 mt-3">
              Données disponibles dès aujourd'hui : <b>{stats.connexions30j ?? 0}</b> connexion(s) sur 30 jours,
              dernière connexion le {detail.derniereConnexion ? new Date(detail.derniereConnexion).toLocaleString('fr-FR') : '—'}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniKpi({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 min-w-[5rem] ${highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-amber-700' : 'text-navy'}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="md:col-span-2 font-medium text-gray-900">{children}</p>
    </div>
  );
}

function truncate(s: string | undefined, n: number) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
