/**
 * Page Correspondance PINS ↔ e-sénégal — étape 5/5
 *
 * Grille jointe CasUsageMVP (backbone interop) ↔ ServiceGuichet (front
 * e-sénégal / TELEDAC) consommant /api/catalogue/correspondance-esenegal.
 *
 * KPIs en tête + filtres + table + export CSV. Lecture seule — création /
 * suppression de liaisons se fait depuis la fiche d'un cas d'usage (section
 * dédiée dans UseCaseDetailPage).
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { api } from '@/services/api';
import {
  Loader2, Users, Briefcase, Globe, Link2, FileDown, ExternalLink,
} from 'lucide-react';

const DOMAINES = [
  'FINANCES_PUBLIQUES', 'CLIMAT_AFFAIRES', 'PROTECTION_SOCIALE', 'SANTE_NUMERIQUE',
  'EDUCATION', 'IDENTITE_NUMERIQUE', 'JUSTICE_ETAT_CIVIL', 'FONCIER_CADASTRE',
  'AGRICULTURE_NUMERIQUE', 'EMPLOI_FORMATION', 'SERVICES_CITOYENS',
  'GOUVERNANCE_DONNEES', 'CYBERSECURITE', 'TRANSVERSAL',
];

const PUBLIC_CIBLES = ['CITOYEN', 'ENTREPRISE', 'MIXTE'] as const;

interface ServiceLink {
  id: string;
  note: string | null;
  dateAjout: string;
  serviceGuichet: {
    id: string;
    code: string;
    intitule: string;
    evenementDeVie: string | null;
    secteur: string | null;
    publicCible: 'CITOYEN' | 'ENTREPRISE' | 'MIXTE' | null;
    statutEsenegal: string | null;
    ministere: string | null;
  };
}

interface CasUsageRow {
  id: string;
  code: string;
  titre: string;
  typologie: 'METIER' | 'TECHNIQUE';
  domaine: string | null;
  statutVueSection: string;
  liaisonsGuichet: ServiceLink[];
}

interface CorrespondanceResponse {
  kpis: {
    casUsageTotal: number;
    casUsageAvecLiaison: number;
    casUsageSansLiaison: number;
    servicesGuichetLies: number;
    liaisonsCitoyen: number;
    liaisonsEntreprise: number;
    liaisonsMixte: number;
    liaisonsExposeEnLigne: number;
    liaisonsExposeNonUtilise: number;
  };
  items: CasUsageRow[];
}

const publicCibleBadge = (v: string | null) => {
  if (v === 'CITOYEN') return <Badge className="bg-teal/15 text-teal-800 border-teal/40">Citoyen</Badge>;
  if (v === 'ENTREPRISE') return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Entreprise</Badge>;
  if (v === 'MIXTE') return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Mixte</Badge>;
  return <Badge variant="outline" className="text-gray-500">non renseigné</Badge>;
};

const statutEsenegalBadge = (v: string | null) => {
  if (v === 'En ligne') return <Badge className="bg-green-100 text-green-800 border-green-300">En ligne</Badge>;
  if (v === 'En ligne mais Non utilisée') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300" title="Service en ligne mais non utilisé">En ligne (non utilisé)</Badge>;
  if (v === 'Pas en ligne') return <Badge variant="outline" className="text-gray-600">Pas en ligne</Badge>;
  if (v === 'Désactivée') return <Badge variant="outline" className="text-gray-500 line-through">Désactivée</Badge>;
  if (v === 'Pas disponible sur teledac') return <Badge variant="outline" className="text-gray-500">Hors TELEDAC</Badge>;
  if (!v) return <Badge variant="outline" className="text-gray-400">—</Badge>;
  return <Badge variant="outline">{v}</Badge>;
};

function downloadCsv(rows: CasUsageRow[]) {
  const header = [
    'casUsageCode', 'casUsageIntitule', 'typologie', 'domaine', 'statut',
    'serviceGuichetCode', 'serviceGuichetIntitule', 'secteur',
    'publicCible', 'statutEsenegal', 'evenementDeVie', 'ministere',
  ];
  const csvField = (s: any): string => {
    if (s === null || s === undefined) return '';
    const v = String(s);
    return /[",\r\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const lines = [header.join(',')];
  for (const cu of rows) {
    if (cu.liaisonsGuichet.length === 0) {
      lines.push([cu.code, cu.titre, cu.typologie, cu.domaine ?? '', cu.statutVueSection, '', '', '', '', '', '', ''].map(csvField).join(','));
      continue;
    }
    for (const l of cu.liaisonsGuichet) {
      const sg = l.serviceGuichet;
      lines.push([
        cu.code, cu.titre, cu.typologie, cu.domaine ?? '', cu.statutVueSection,
        sg.code, sg.intitule, sg.secteur ?? '',
        sg.publicCible ?? '', sg.statutEsenegal ?? '',
        sg.evenementDeVie ?? '', sg.ministere ?? '',
      ].map(csvField).join(','));
    }
  }
  // UTF-8 BOM pour Excel
  const blob = new Blob(['﻿' + lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().slice(0, 10);
  a.download = `correspondance-esenegal-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CorrespondanceEsenegalPage() {
  const [domaine, setDomaine] = useState<string>('');
  const [publicCible, setPublicCible] = useState<string>('');
  const [expose, setExpose] = useState<'ALL' | 'OUI' | 'NON'>('ALL');
  const [avecLiaison, setAvecLiaison] = useState<'ALL' | 'OUI' | 'NON'>('ALL');

  const params = new URLSearchParams();
  if (domaine) params.set('domaine', domaine);
  if (publicCible) params.set('publicCible', publicCible);
  if (avecLiaison === 'OUI') params.set('seulementAvecLiaisons', 'true');

  const { data, isLoading } = useQuery<CorrespondanceResponse>({
    queryKey: ['correspondance-esenegal', params.toString()],
    queryFn: () => api.get(`/catalogue/correspondance-esenegal?${params.toString()}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => {
    let r = data?.items ?? [];
    // Filtres côté client supplémentaires
    if (avecLiaison === 'NON') r = r.filter((cu) => cu.liaisonsGuichet.length === 0);
    if (expose !== 'ALL') {
      const isExpose = (cu: CasUsageRow) => cu.liaisonsGuichet.some(
        (l) => l.serviceGuichet.statutEsenegal === 'En ligne'
          || l.serviceGuichet.statutEsenegal === 'En ligne mais Non utilisée',
      );
      r = r.filter((cu) => (expose === 'OUI' ? isExpose(cu) : !isExpose(cu)));
    }
    return r;
  }, [data, avecLiaison, expose]);

  const kpis = data?.kpis;
  const exposeTotal = (kpis?.liaisonsExposeEnLigne ?? 0) + (kpis?.liaisonsExposeNonUtilise ?? 0);

  const resetFilters = () => {
    setDomaine('');
    setPublicCible('');
    setExpose('ALL');
    setAvecLiaison('ALL');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Correspondance PINS ↔ e-sénégal</h1>
          <p className="text-sm text-gray-600 mt-1">
            Grille jointe cas d'usage interop (backbone) ↔ services guichet citoyen (e-sénégal / TELEDAC).
            Création / suppression des liaisons : depuis la fiche d'un cas d'usage.
          </p>
        </div>
        <Button onClick={() => downloadCsv(rows)} variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-teal/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-teal-700 font-semibold">Services citoyens</div>
                <div className="text-3xl font-bold text-teal-800 mt-1">{kpis?.liaisonsCitoyen ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1">liaisons publicCible=CITOYEN</div>
              </div>
              <Users className="h-8 w-8 text-teal/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-amber-700 font-semibold">Services entreprises</div>
                <div className="text-3xl font-bold text-amber-800 mt-1">{kpis?.liaisonsEntreprise ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1">liaisons publicCible=ENTREPRISE</div>
              </div>
              <Briefcase className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-300" title={
          kpis ? `dont ${kpis.liaisonsExposeEnLigne} en ligne et ${kpis.liaisonsExposeNonUtilise} en ligne mais non utilisées`
            : ''
        }>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-green-700 font-semibold">Exposés e-sénégal</div>
                <div className="text-3xl font-bold text-green-800 mt-1">{exposeTotal}</div>
                <div className="text-xs text-gray-500 mt-1">
                  <span className="text-green-700">{kpis?.liaisonsExposeEnLigne ?? 0} en ligne</span>
                  {' · '}
                  <span className="text-yellow-700">{kpis?.liaisonsExposeNonUtilise ?? 0} non utilisé</span>
                </div>
              </div>
              <Globe className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-gray-600 font-semibold">Back-office sans liaison</div>
                <div className="text-3xl font-bold text-gray-700 mt-1">{kpis?.casUsageSansLiaison ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  sur {kpis?.casUsageTotal ?? 0} cas total
                </div>
              </div>
              <Link2 className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label className="text-xs text-gray-600">Domaine</Label>
              <Select value={domaine || 'ALL'} onValueChange={(v) => setDomaine(v === 'ALL' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  {DOMAINES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Public cible</Label>
              <Select value={publicCible || 'ALL'} onValueChange={(v) => setPublicCible(v === 'ALL' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  {PUBLIC_CIBLES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Exposé e-sénégal</Label>
              <Select value={expose} onValueChange={(v) => setExpose(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="OUI">Oui (en ligne ou non utilisé)</SelectItem>
                  <SelectItem value="NON">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Liaison</Label>
              <Select value={avecLiaison} onValueChange={(v) => setAvecLiaison(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="OUI">Avec liaison</SelectItem>
                  <SelectItem value="NON">Sans liaison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" onClick={resetFilters}>Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="animate-spin h-5 w-5" /> Chargement…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Aucun cas d'usage ne correspond aux filtres.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-left">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-gray-700">Cas d'usage</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Typologie</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Domaine</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Services guichet liés</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Public</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Statut e-sénégal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((cu) => (
                    <tr key={cu.id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3">
                        <Link to={`/admin/cas-usage/${cu.id}`} className="text-navy hover:underline font-mono text-xs">
                          {cu.code}
                        </Link>
                        <div className="text-gray-800 mt-0.5">{cu.titre}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{cu.typologie}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{cu.domaine ?? '—'}</td>
                      <td className="px-4 py-3">
                        {cu.liaisonsGuichet.length === 0 ? (
                          <span className="text-gray-400 italic text-xs">Aucune liaison</span>
                        ) : (
                          <ul className="space-y-1">
                            {cu.liaisonsGuichet.map((l) => (
                              <li key={l.id}>
                                <span className="font-mono text-xs text-gray-500">{l.serviceGuichet.code}</span>{' '}
                                <span className="text-gray-800">{l.serviceGuichet.intitule}</span>
                                {l.serviceGuichet.evenementDeVie && (
                                  <span className="text-xs text-gray-500 ml-2">· {l.serviceGuichet.evenementDeVie}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cu.liaisonsGuichet.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="space-y-1">
                            {cu.liaisonsGuichet.map((l) => (
                              <div key={l.id}>{publicCibleBadge(l.serviceGuichet.publicCible)}</div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cu.liaisonsGuichet.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="space-y-1">
                            {cu.liaisonsGuichet.map((l) => (
                              <div key={l.id}>{statutEsenegalBadge(l.serviceGuichet.statutEsenegal)}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500 flex items-center gap-1">
        <ExternalLink className="h-3 w-3" /> Source unique : <code className="bg-gray-100 px-1.5 py-0.5 rounded">GET /api/catalogue/correspondance-esenegal</code>
      </div>
    </div>
  );
}

export default CorrespondanceEsenegalPage;
