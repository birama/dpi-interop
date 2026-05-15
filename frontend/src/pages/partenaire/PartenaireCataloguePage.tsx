import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Coins, Library } from 'lucide-react';

export function PartenaireCataloguePage() {
  const [search, setSearch] = useState('');
  const [domaine, setDomaine] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['partenaire-catalogue', search, domaine],
    queryFn: () =>
      api_get('/partenaire/catalogue', { search: search || undefined, domaine: domaine || undefined, pageSize: 100 }),
  });

  const items = data?.data || [];
  const domainesPtf = data?.domainesInteret || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
          <Library className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Catalogue partenaire</h1>
          <p className="text-sm text-gray-500">
            Cas d'usage priorisés et éligibles au financement dans vos domaines d'intérêt
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, code, résumé..."
              className="pl-8"
            />
          </div>
          {domainesPtf.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Filtrer par domaine :</span>
              <button
                type="button"
                onClick={() => setDomaine('')}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  domaine === '' ? 'bg-teal text-white border-teal' : 'bg-white text-teal-700 border-teal/40 hover:bg-teal/5'
                }`}
              >
                Tous ({total})
              </button>
              {domainesPtf.map((d: string) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDomaine(d)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    domaine === d ? 'bg-teal text-white border-teal' : 'bg-white text-teal-700 border-teal/40 hover:bg-teal/5'
                  }`}
                >
                  {d.replace(/_/g, ' ').toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-400 italic">
            Aucun cas dans vos domaines d'intérêt pour le moment.
            <br />
            <span className="text-xs">
              Pour étendre votre périmètre, contactez la Delivery Unit MCTN : du@mctn.gouv.sn
            </span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((cas: any) => (
            <Link
              key={cas.id}
              to={`/partenaire/cas/${cas.id}`}
              className="block group"
            >
              <Card className="h-full hover:border-teal/40 hover:shadow-sm transition-all">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {cas.code}
                    </span>
                    <Badge className="bg-gold/15 text-gold border border-gold/30 text-[10px]">
                      <Coins className="w-2.5 h-2.5 mr-1" />À financer
                    </Badge>
                    {cas.domaine && (
                      <Badge variant="outline" className="text-[10px] bg-teal/5 text-teal-700 border-teal/20">
                        {cas.domaine.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    )}
                    {(cas._count?.financements ?? 0) === 0 && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] ml-auto">
                        Sans financement identifié
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-navy group-hover:text-teal-700 transition-colors">
                    {cas.titre}
                  </h3>
                  {cas.resumeMetier && (
                    <p className="text-xs text-gray-600 line-clamp-2">{cas.resumeMetier}</p>
                  )}
                  {cas.institutionSourceCode && (
                    <p className="text-[10px] text-gray-500">
                      Propriétaire : <b>{cas.institutionSourceCode}</b>
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Petit helper pour ne pas dépendre du wrapper axios direct
async function api_get(path: string, params: Record<string, any> = {}) {
  const { api } = await import('@/services/api');
  const r = await api.get(path, { params });
  return r.data;
}
