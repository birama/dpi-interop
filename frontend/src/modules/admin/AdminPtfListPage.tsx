import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { api } from '@/services/api';
import {
  Briefcase, Loader2, Eye, Calendar, Coins, Building2,
} from 'lucide-react';

const DOMAINES = [
  'FINANCES_PUBLIQUES', 'CLIMAT_AFFAIRES', 'PROTECTION_SOCIALE', 'SANTE_NUMERIQUE',
  'EDUCATION', 'IDENTITE_NUMERIQUE', 'JUSTICE_ETAT_CIVIL', 'FONCIER_CADASTRE',
  'AGRICULTURE_NUMERIQUE', 'EMPLOI_FORMATION', 'SERVICES_CITOYENS',
  'GOUVERNANCE_DONNEES', 'CYBERSECURITE', 'TRANSVERSAL',
];

export function AdminPtfListPage() {
  const [domaine, setDomaine] = useState<string>('');
  // Filtre par défaut : actif=true pour n'afficher que les 6 comptes demo de l'atelier
  // (les 5 comptes legacy ptf-{code}@senum.sn n'ont jamais ouvert de session — masqués).
  // L'utilisateur peut basculer sur "Tous" pour voir l'intégralité.
  const [actif, setActif] = useState<'ALL' | 'true' | 'false'>('true');

  const params = new URLSearchParams();
  if (domaine) params.set('domaine', domaine);
  if (actif !== 'ALL') params.set('actif', actif);
  params.set('pageSize', '100');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ptf-list', params.toString()],
    queryFn: () => api.get(`/admin/ptf?${params.toString()}`).then((r) => r.data),
  });

  const items: any[] = data?.data || [];
  const kpis = data?.kpis || { ptfActifs: 0, ptfAvecManifestations: 0, totalManifestations: 0, casCouverts: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Partenaires Techniques et Financiers</h1>
          <p className="text-sm text-gray-500">
            Vue d'ensemble des comptes PTF et de leur activité sur PINS
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="PTF actifs" value={kpis.ptfActifs} color="teal" hint="Comptes ayant déjà ouvert une session" />
        <Kpi label="PTF avec manifestation(s)" value={kpis.ptfAvecManifestations} color="gold" />
        <Kpi label="Manifestations (total)" value={kpis.totalManifestations} color="navy" />
        <Kpi label="Cas couverts" value={kpis.casCouverts} color="navy" hint="Distinct cas avec manifestation active" />
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-navy text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Domaine d'intérêt</Label>
            <Select value={domaine || 'ALL'} onValueChange={(v) => setDomaine(v === 'ALL' ? '' : v)}>
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
            <Label className="text-xs text-gray-500">Statut compte</Label>
            <Select value={actif} onValueChange={(v) => setActif(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="true">Actif (a déjà ouvert une session)</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={() => { setDomaine(''); setActif('ALL'); }}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-gray-500">Aucun partenaire pour ces filtres.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-base">{items.length} partenaire{items.length > 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 px-3">PTF</th>
                    <th className="py-2 px-3">Compte (point focal)</th>
                    <th className="py-2 px-3">Domaines d'intérêt</th>
                    <th className="py-2 px-3">Manifestations</th>
                    <th className="py-2 px-3">Dernière connexion</th>
                    <th className="py-2 px-3">Statut</th>
                    <th className="py-2 px-3 text-right">Fiche</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-teal/15 flex items-center justify-center font-bold text-teal-700 text-xs">
                            {(u.ptf?.code || u.email).slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <Link to={`/admin/ptf/${u.id}`} className="font-medium text-navy hover:underline">
                              {u.ptf?.nom || '—'}
                            </Link>
                            {u.ptf?.code && <p className="text-xs text-gray-500">{u.ptf.code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <p className="text-navy">{u.email}</p>
                        {u.ptf?.contactNom && <p className="text-gray-500">{u.ptf.contactNom}</p>}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {(u.ptf?.domainesInteret || []).slice(0, 4).map((d: string) => (
                            <Badge key={d} variant="outline" className="bg-teal/5 text-teal-700 border-teal/20 text-[10px]">
                              {d.replace(/_/g, ' ').toLowerCase()}
                            </Badge>
                          ))}
                          {(u.ptf?.domainesInteret?.length || 0) > 4 && (
                            <Badge variant="outline" className="text-[10px]">+{u.ptf.domainesInteret.length - 4}</Badge>
                          )}
                          {(u.ptf?.domainesInteret?.length || 0) === 0 && (
                            <span className="text-xs text-gray-400 italic">aucun</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <span className="font-bold text-navy">{u.stats.enCours}</span>
                        <span className="text-gray-400"> en cours / </span>
                        <span className="text-gray-700">{u.stats.total} total</span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-gray-600">
                        {u.derniereConnexion
                          ? <><Calendar className="inline w-3 h-3 mr-1 text-gray-400" />{new Date(u.derniereConnexion).toLocaleDateString('fr-FR')}</>
                          : <span className="text-gray-400 italic">jamais</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={u.actif ? 'bg-teal/10 text-teal-800 border-teal/30' : 'bg-gray-100 text-gray-500'}>
                          {u.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link to={`/admin/ptf/${u.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, color, hint }: { label: string; value: number; color: 'teal' | 'navy' | 'gold'; hint?: string }) {
  const cls = color === 'teal' ? 'border-teal/40' : color === 'gold' ? 'border-gold/40' : 'border-navy/20';
  const numCls = color === 'teal' ? 'text-teal-700' : color === 'gold' ? 'text-gold' : 'text-navy';
  const icon = color === 'gold' ? <Coins className="w-4 h-4 text-gold/70" /> : <Building2 className="w-4 h-4 text-gray-400" />;
  return (
    <Card className={`border ${cls}`}>
      <CardContent className="pt-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${numCls}`}>{value}</p>
          {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
