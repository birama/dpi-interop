import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/api';
import { Loader2, Search, ChevronRight, ArrowUpRight, ArrowDownRight, Database, Globe, Server } from 'lucide-react';

interface InstRow {
  id: string; code: string; nom: string; ministere: string;
  nbFournisseur: number; nbConsommateur: number; nbInitiateur: number;
  enProduction: number; qualifie: number; priorise: number; propose: number;
}

interface CuEntry { casId: string; code: string; titre: string; typologie: string; domaine: string | null; statut: string; }

interface InstDetail {
  id: string; code: string; nom: string; ministere: string;
  responsableNom: string | null; responsableFonction: string | null;
  fournit: CuEntry[]; consomme: CuEntry[]; initie: CuEntry[];
  registres: Array<{ id: string; code: string; nom: string; domaine: string | null }>;
  xroad: { securityServer: string; premierService: string; premierEchange: string; hebergement: string } | null;
  liaisonsGuichet: Array<{ id: string; code: string; intitule: string; secteur: string | null; publicCible: string | null }>;
}

const statutBadge = (s: string) => {
  if (s === 'EN_PRODUCTION_360') return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">En production</Badge>;
  if (s === 'QUALIFIE') return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">Qualifié</Badge>;
  if (s === 'PRIORISE') return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Priorisé</Badge>;
  if (s === 'PROPOSE') return <Badge variant="outline" className="text-xs">Proposé</Badge>;
  return <Badge variant="outline" className="text-xs">{s}</Badge>;
};

const xroadBadge = (jalon: string | undefined) => {
  if (!jalon || jalon === 'NON_DEMARRE') return <Badge variant="outline" className="text-xs text-gray-500">Non démarré</Badge>;
  if (jalon === 'EN_COURS') return <Badge className="bg-blue-100 text-blue-800 text-xs">En cours</Badge>;
  if (jalon === 'TERMINE') return <Badge className="bg-green-100 text-green-800 text-xs">Raccordé</Badge>;
  return <Badge variant="outline" className="text-xs">{jalon}</Badge>;
};

export function InstitutionsCataloguePage() {
  const [searchQ, setSearchQ] = useState('');
  const [fProduction, setFProduction] = useState<'ALL' | 'OUI' | 'NON'>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['institutions-catalogue'],
    queryFn: () => api.get('/catalogue/institutions').then((r) => r.data),
  });

  const items: InstRow[] = useMemo(() => {
    let rows = (data?.items ?? []) as InstRow[];
    if (searchQ) { const q = searchQ.toLowerCase(); rows = rows.filter((i) => i.nom.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)); }
    if (fProduction === 'OUI') rows = rows.filter((i) => i.enProduction > 0);
    if (fProduction === 'NON') rows = rows.filter((i) => i.enProduction === 0);
    return rows;
  }, [data, searchQ, fProduction]);

  const { data: detail } = useQuery<InstDetail>({
    queryKey: ['institution-detail', detailId],
    queryFn: () => api.get(`/catalogue/institutions/${detailId}`).then((r) => r.data),
    enabled: !!detailId,
  });

  const withProd = (data?.items ?? []).filter((i: InstRow) => i.enProduction > 0).length;
  const withCases = (data?.items ?? []).filter((i: InstRow) => i.nbFournisseur + i.nbConsommateur + i.nbInitiateur > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Institutions</h1>
          <p className="text-sm text-gray-600 mt-1">Vue par administration : cas fournis, consommés, registres opérés, dépendances guichet.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-navy/20"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-navy">{data?.total ?? '—'}</div><div className="text-xs text-gray-500">Institutions</div></CardContent></Card>
        <Card className="border-teal/30"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-teal">{withCases}</div><div className="text-xs text-gray-500">Avec cas PINS</div></CardContent></Card>
        <Card className="border-green-300"><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-green-700">{withProd}</div><div className="text-xs text-gray-500">Avec cas en production</div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex gap-3 items-end">
          <div className="flex-1 min-w-[250px]"><Label className="text-xs">Recherche</Label><div className="relative"><Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" /><Input className="pl-7" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Par nom ou sigle..." /></div></div>
          <div><Label className="text-xs">Cas en production</Label><Select value={fProduction} onValueChange={(v) => setFProduction(v as any)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tous</SelectItem><SelectItem value="OUI">Oui</SelectItem><SelectItem value="NON">Non</SelectItem></SelectContent></Select></div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (<div className="p-10 flex items-center justify-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Chargement…</div>)
          : items.length === 0 ? (<div className="p-10 text-center text-gray-500">Aucune institution.</div>)
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left"><tr>
                <th className="px-3 py-2 font-semibold text-gray-700">Institution</th>
                <th className="px-3 py-2 font-semibold text-gray-700">Ministère</th>
                <th className="px-3 py-2 font-semibold text-gray-700">Cas fournis</th>
                <th className="px-3 py-2 font-semibold text-gray-700">Cas consommés</th>
                <th className="px-3 py-2 font-semibold text-gray-700">Pipeline</th>
                <th className="px-3 py-2 w-10"></th>
              </tr></thead>
              <tbody className="divide-y">
                {items.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailId(inst.id)}>
                    <td className="px-3 py-3"><div className="font-mono text-xs text-teal hover:underline">{inst.code}</div><div className="font-medium text-gray-800 mt-0.5">{inst.nom}</div></td>
                    <td className="px-3 py-3 text-xs text-gray-600">{inst.ministere || '—'}</td>
                    <td className="px-3 py-3"><span className="font-bold text-navy">{inst.nbFournisseur}</span></td>
                    <td className="px-3 py-3"><span className="font-bold text-navy">{inst.nbConsommateur}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {inst.enProduction > 0 && <Badge className="bg-green-100 text-green-800 text-xs">{inst.enProduction} prod</Badge>}
                        {inst.qualifie > 0 && <Badge className="bg-blue-100 text-blue-800 text-xs">{inst.qualifie} qual.</Badge>}
                        {inst.priorise > 0 && <Badge className="bg-amber-100 text-amber-800 text-xs">{inst.priorise} prio.</Badge>}
                        {inst.propose > 0 && <Badge variant="outline" className="text-xs">{inst.propose} prop.</Badge>}
                        {inst.enProduction + inst.qualifie + inst.priorise + inst.propose === 0 && <span className="text-gray-400 text-xs">—</span>}
                      </div>
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
        <DialogContent className="fixed right-0 top-0 bottom-0 h-full max-w-xl translate-x-0 translate-y-0 rounded-none border-l shadow-xl overflow-y-auto">
          {detail ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-navy">
                  <span className="font-mono text-sm text-teal">{detail.code}</span>
                  <div className="text-lg mt-1">{detail.nom}</div>
                  {detail.ministere && <div className="text-sm text-gray-500 font-normal">{detail.ministere}</div>}
                </DialogTitle>
              </DialogHeader>

              {/* Contact + XRoad */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {detail.responsableNom && <div><span className="text-gray-500 text-xs">Responsable</span><div>{detail.responsableNom}</div></div>}
                {detail.responsableFonction && <div><span className="text-gray-500 text-xs">Fonction</span><div className="text-xs">{detail.responsableFonction}</div></div>}
              </div>
              {detail.xroad && (
                <div className="border-t pt-3 flex items-center gap-3 text-xs">
                  <Server className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Raccordement PINS :</span>
                  {xroadBadge(detail.xroad.premierService)}
                  <span className="text-gray-400">| Hébergement : {detail.xroad.hebergement || '—'}</span>
                </div>
              )}

              {/* Fournit */}
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="h-4 w-4 text-teal" /><span className="text-xs font-semibold text-gray-500 uppercase">Fournisseur ({detail.fournit.length})</span></div>
                {detail.fournit.length === 0 ? <div className="text-xs text-gray-400 italic">Aucun cas.</div> : (
                  <ul className="space-y-1">{[...detail.fournit].sort((a,b) => {const order=['EN_PRODUCTION_360','QUALIFIE','PRIORISE','PROPOSE']; return order.indexOf(a.statut)-order.indexOf(b.statut);}).map((cu) => (
                    <li key={cu.casId} className="flex items-center gap-2 text-xs"><Link to={`/admin/cas-usage/${cu.casId}`} className="font-mono text-navy hover:underline">{cu.code}</Link><span className="text-gray-600 truncate">{cu.titre.slice(0, 55)}</span>{statutBadge(cu.statut)}</li>
                  ))}</ul>
                )}
              </div>

              {/* Consomme */}
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2"><ArrowDownRight className="h-4 w-4 text-amber-600" /><span className="text-xs font-semibold text-gray-500 uppercase">Consommateur ({detail.consomme.length})</span></div>
                {detail.consomme.length === 0 ? <div className="text-xs text-gray-400 italic">Aucun cas.</div> : (
                  <ul className="space-y-1">{[...detail.consomme].sort((a,b) => {const order=['EN_PRODUCTION_360','QUALIFIE','PRIORISE','PROPOSE']; return order.indexOf(a.statut)-order.indexOf(b.statut);}).map((cu) => (
                    <li key={cu.casId} className="flex items-center gap-2 text-xs"><Link to={`/admin/cas-usage/${cu.casId}`} className="font-mono text-navy hover:underline">{cu.code}</Link><span className="text-gray-600 truncate">{cu.titre.slice(0, 55)}</span>{statutBadge(cu.statut)}</li>
                  ))}</ul>
                )}
              </div>

              {/* Registres opérés */}
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2"><Database className="h-4 w-4 text-gray-500" /><span className="text-xs font-semibold text-gray-500 uppercase">Registres opérés ({detail.registres.length})</span></div>
                {detail.registres.length === 0 ? <div className="text-xs text-gray-400 italic">Aucun registre déclaré.</div> : (
                  <ul className="space-y-1">{detail.registres.map((r) => (
                    <li key={r.id} className="text-xs"><span className="font-mono text-gray-500">{r.code}</span> <span className="text-gray-700">{r.nom}</span> <span className="text-gray-400">({r.domaine})</span></li>
                  ))}</ul>
                )}
              </div>

              {/* Guichet */}
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2"><Globe className="h-4 w-4 text-teal" /><span className="text-xs font-semibold text-gray-500 uppercase">Dépendances guichet ({detail.liaisonsGuichet?.length ?? 0})</span></div>
                {(detail.liaisonsGuichet ?? []).length === 0 ? <div className="text-xs text-gray-400 italic">Aucune démarche guichet dépendante.</div> : (
                  <ul className="space-y-1">{(detail.liaisonsGuichet ?? []).map((sg) => (
                    <li key={sg.id} className="text-xs"><span className="font-mono text-gray-500">{sg.code}</span> <span className="text-gray-700">{sg.intitule}</span> {sg.publicCible && <Badge variant="outline" className="text-xs ml-1">{sg.publicCible}</Badge>}</li>
                  ))}</ul>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstitutionsCataloguePage;
