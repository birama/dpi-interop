import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2, Tags, Check } from 'lucide-react';

const DOMAINES = [
  'IDENTITE_NUMERIQUE',
  'PROTECTION_SOCIALE',
  'SANTE_NUMERIQUE',
  'EDUCATION',
  'JUSTICE_ETAT_CIVIL',
  'FONCIER_CADASTRE',
  'CLIMAT_AFFAIRES',
  'FINANCES_PUBLIQUES',
  'EMPLOI_FORMATION',
  'AGRICULTURE_NUMERIQUE',
  'SERVICES_CITOYENS',
  'GOUVERNANCE_DONNEES',
  'CYBERSECURITE',
  'TRANSVERSAL',
];

export function AdminPtfDomainesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ptf-domaines-matrix'],
    queryFn: () => api.get('/admin/ptf?actif=true&pageSize=100').then((r) => r.data),
  });

  const ptfActifs: any[] = useMemo(() => (data?.data || []), [data]);

  // Map ptfId → Set<domaine>
  const ptfDomainesMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    ptfActifs.forEach((u: any) => {
      const id = u.ptf?.id;
      if (!id) return;
      if (!m.has(id)) m.set(id, new Set());
      (u.ptf.domainesInteret || []).forEach((d: string) => m.get(id)!.add(d));
    });
    return m;
  }, [ptfActifs]);

  // Dédupe par ptfId pour éviter de compter 2x quand 2 users partagent le même PTF
  const ptfUniques = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    ptfActifs.forEach((u: any) => {
      if (!u.ptf?.id || seen.has(u.ptf.id)) return;
      seen.add(u.ptf.id);
      list.push(u.ptf);
    });
    return list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [ptfActifs]);

  // Compteur "X PTF actifs sur Y domaines couverts"
  const domainesCouverts = useMemo(() => {
    const set = new Set<string>();
    ptfDomainesMap.forEach((doms) => doms.forEach((d) => set.add(d)));
    return set.size;
  }, [ptfDomainesMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
          <Tags className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Domaines d'intérêt des partenaires</h1>
          <p className="text-sm text-gray-500">Vue consolidée des domaines déclarés par les PTF actifs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-base">
            Matrice {DOMAINES.length} domaines × {ptfUniques.length} PTF actifs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ptfUniques.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Aucun PTF actif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs text-gray-500 sticky left-0 bg-slate-50">Domaine</th>
                    {ptfUniques.map((p: any) => (
                      <th key={p.id} className="py-2 px-3 text-center text-xs text-gray-500" title={p.nom}>
                        <span className="text-navy font-medium">{p.code}</span>
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center text-xs text-gray-500">Couverture</th>
                  </tr>
                </thead>
                <tbody>
                  {DOMAINES.map((dom) => {
                    const compteurDomaine = ptfUniques.filter((p: any) => ptfDomainesMap.get(p.id)?.has(dom)).length;
                    return (
                      <tr key={dom} className="border-b border-gray-100 hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-xs sticky left-0 bg-white">
                          <Badge variant="outline" className="bg-teal/5 text-teal-700 border-teal/20">
                            {dom.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </td>
                        {ptfUniques.map((p: any) => {
                          const has = ptfDomainesMap.get(p.id)?.has(dom);
                          return (
                            <td key={p.id} className="py-2 px-3 text-center">
                              {has ? (
                                <Check className="w-4 h-4 text-teal-700 inline" />
                              ) : (
                                <span className="text-gray-300">·</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center">
                          <span className={`text-xs font-mono ${compteurDomaine === 0 ? 'text-gray-400' : 'text-navy font-bold'}`}>
                            {compteurDomaine}/{ptfUniques.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t">
                  <tr>
                    <td className="py-2 px-3 text-xs font-medium text-gray-500 sticky left-0 bg-slate-50">
                      Domaines déclarés
                    </td>
                    {ptfUniques.map((p: any) => (
                      <td key={p.id} className="py-2 px-3 text-center text-xs font-bold text-navy">
                        {ptfDomainesMap.get(p.id)?.size || 0}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center text-xs text-gray-500">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 italic">
        <b>{ptfUniques.length}</b> PTF actif{ptfUniques.length > 1 ? 's' : ''} sur <b>{domainesCouverts}</b> domaine
        {domainesCouverts > 1 ? 's' : ''} couvert{domainesCouverts > 1 ? 's' : ''} (sur {DOMAINES.length} domaines du référentiel).
        Modification des domaines via la fiche PTF (sur demande à la DU).
      </p>
    </div>
  );
}
