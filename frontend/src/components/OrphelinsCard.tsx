import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Gavel } from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const DOMAINE_LABELS: Record<string, string> = {
  FINANCES_PUBLIQUES: 'Finances',
  CLIMAT_AFFAIRES: 'Climat affaires',
  PROTECTION_SOCIALE: 'Protection sociale',
  SANTE_NUMERIQUE: 'Santé',
  EDUCATION: 'Éducation',
  IDENTITE_NUMERIQUE: 'Identité',
  JUSTICE_ETAT_CIVIL: 'Justice/État civil',
  FONCIER_CADASTRE: 'Foncier',
  AGRICULTURE_NUMERIQUE: 'Agriculture',
  EMPLOI_FORMATION: 'Emploi/Formation',
  SERVICES_CITOYENS: 'Services citoyens',
  GOUVERNANCE_DONNEES: 'Gouvernance',
  CYBERSECURITE: 'Cybersécurité',
  TRANSVERSAL: 'Transversal',
  SANS_DOMAINE: 'Sans domaine',
};

interface OrphelinsData {
  techsOrphelins: { total: number; items: any[] };
  metiersVides: { total: number; items: any[] };
  parDomaine: { domaine: string; nb_orphelins: number }[];
  totals: { techniques: number; metiers: number; relations: number };
}

function OrphelinsCard() {
  const { data, isLoading, isError } = useQuery<OrphelinsData>({
    queryKey: ['orphelins-coherence'],
    queryFn: () => api.get('/use-cases/orphelins').then(r => r.data),
    staleTime: 60000,
    retry: false,
  });

  const { data: violations } = useQuery<any>({
    queryKey: ['orphelins-violations'],
    queryFn: () => api.get('/use-cases/orphelins/violations').then(r => r.data),
    staleTime: 60000,
    retry: false,
  });

  if (isLoading) return null;
  if (isError || !data) return null;

  const d = data;
  const v = violations || {};
  const hasViolations = v.techsPRIORISEsansMetier?.total > 0 || v.metiersAvancesSansTech?.total > 0;

  return (
    <Card className={cn('border', hasViolations ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30')}>
      <CardContent className="p-4 space-y-3">
        {/* Ligne principale */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-amber-500" />
            Cohérence métier ↔ technique
          </h3>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white rounded p-2 border border-amber-100">
            <p className="text-gray-500">Techniques orphelins</p>
            <p className="text-lg font-bold text-amber-600">{d.techsOrphelins.total}</p>
            <p className="text-[10px] text-gray-400">sur {d.totals.techniques}</p>
          </div>
          <div className="bg-white rounded p-2 border border-amber-100">
            <p className="text-gray-500">Métiers vides</p>
            <p className="text-lg font-bold text-amber-600">{d.metiersVides.total}</p>
            <p className="text-[10px] text-gray-400">sur {d.totals.metiers}</p>
          </div>
        </div>

        {/* Violations — affiché seulement si > 0 */}
        {hasViolations && (
          <div className="bg-red-100 border border-red-200 rounded p-2 flex items-center gap-2 text-xs">
            <Gavel className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">
              {v.techsPRIORISEsansMetier?.total > 0 && `${v.techsPRIORISEsansMetier.total} technique(s) PRIORISÉ sans métier`}
              {v.techsPRIORISEsansMetier?.total > 0 && v.metiersAvancesSansTech?.total > 0 && ', '}
              {v.metiersAvancesSansTech?.total > 0 && `${v.metiersAvancesSansTech.total} métier(s) avancé sans technique`}
            </span>
          </div>
        )}

        {/* Par domaine (top 5) */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">Top domaines — orphelins techniques</p>
          {d.parDomaine.slice(0, 5).map((dd: any) => (
            <div key={dd.domaine} className="flex items-center justify-between text-[10px]">
              <span className="text-gray-600 truncate">{DOMAINE_LABELS[dd.domaine] || dd.domaine}</span>
              <span className="font-mono font-bold text-gray-500">{dd.nb_orphelins}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default OrphelinsCard;
