import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2, Search, Eye } from 'lucide-react';

const DOMAINES = ['IDENTITE_NUMERIQUE','PROTECTION_SOCIALE','SANTE_NUMERIQUE','EDUCATION','JUSTICE_ETAT_CIVIL','FONCIER_CADASTRE','CLIMAT_AFFAIRES','FINANCES_PUBLIQUES','EMPLOI_FORMATION','AGRICULTURE_NUMERIQUE','SERVICES_CITOYENS','GOUVERNANCE_DONNEES','CYBERSECURITE','TRANSVERSAL'];

export function PartenaireTechniqueCataloguePage() {
  const [q, setQ] = useState('');
  const [domaine, setDomaine] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (domaine) params.set('domaine', domaine);
  params.set('page', String(page));
  params.set('pageSize', '20');

  const { data, isLoading } = useQuery({
    queryKey: ['partenaire-tech-catalogue', params.toString()],
    queryFn: () => api.get(`/partenaire-tech/catalogue?${params.toString()}`).then(r => r.data),
    placeholderData: (prev: any) => prev,
  });

  const cas = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
          <Search className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Catalogue national</h1>
          <p className="text-sm text-gray-500">Cas d'usage d'interopérabilité — {total} résultat{total > 1 ? 's' : ''}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3">
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher..." className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64" />
          <select value={domaine} onChange={e => { setDomaine(e.target.value); setPage(1); }} className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            <option value="">Tous les domaines</option>
            {DOMAINES.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-navy text-sm">{total} cas d'usage</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs text-gray-500">Code</th>
                    <th className="py-2 px-3 text-left text-xs text-gray-500">Titre</th>
                    <th className="py-2 px-3 text-left text-xs text-gray-500">Domaine</th>
                    <th className="py-2 px-3 text-left text-xs text-gray-500">Statut</th>
                    <th className="py-2 px-3 text-xs text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {cas.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-xs text-teal-700">{c.code}</td>
                      <td className="py-2 px-3 text-xs">{c.titre}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{c.domaine?.replace(/_/g, ' ') || '—'}</Badge></td>
                      <td className="py-2 px-3 text-xs text-gray-500">{c.statutVueSection}</td>
                      <td className="py-2 px-3">
                        <Link to={`/partenaire-tech/cas/${c.id}`} className="text-teal-700 hover:underline"><Eye className="w-4 h-4 inline" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div className="flex justify-between items-center mt-4 text-xs">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-30">Précédent</button>
                <span className="text-gray-500">Page {page} / {Math.ceil(total / 20)}</span>
                <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-30">Suivant</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
