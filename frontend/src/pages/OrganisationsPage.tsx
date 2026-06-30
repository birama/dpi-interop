import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2, Building2, Users } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  CABINET_CONSEIL: 'Cabinet de conseil',
  INTEGRATEUR: 'Intégrateur',
  EDITEUR: 'Éditeur',
  EXPERT_INDEPENDANT: 'Expert indépendant',
};

export function OrganisationsPage() {
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');

  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (statut) params.set('statut', statut);
  if (q) params.set('q', q);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-organisations', params.toString()],
    queryFn: () => api.get(`/admin/organisations?${params.toString()}`).then(r => r.data),
  });

  const orgs = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Annuaire AMO</h1>
          <p className="text-sm text-gray-500">Partenaires techniques — prestataires d'accompagnement</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3 items-center">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48" />
          <select value={type} onChange={e => setType(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={statut} onChange={e => setStatut(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-navy text-sm">{orgs.length} organisation{orgs.length > 1 ? 's' : ''}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Code</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Nom</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Type</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Secteur</th>
                  <th className="py-2 px-3 text-center text-xs text-gray-500">Utilisateurs</th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o: any) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono text-xs text-teal-700">{o.id}</td>
                    <td className="py-2 px-3 text-xs">{o.nom}</td>
                    <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{TYPE_LABELS[o.type] || o.type}</Badge></td>
                    <td className="py-2 px-3 text-xs text-gray-500">{o.secteurAccompagnement || '—'}</td>
                    <td className="py-2 px-3 text-center text-xs flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" />{o._count?.users || 0}
                    </td>
                    <td className="py-2 px-3">
                      <Badge className={o.statut === 'ACTIF' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}>{o.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
