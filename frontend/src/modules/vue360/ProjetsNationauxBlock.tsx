import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Loader2, Building2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface ProjetNational {
  id: string;
  code: string;
  nom: string;
  budgetEstimatif: number | null;
  programmePrioritaire: {
    id: string;
    code: string;
    nom: string;
  };
}

export function ProjetsNationauxBlock({ casUsageId }: { casUsageId: string }) {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['cas-usage-projets', casUsageId],
    queryFn: () => api.get(`/new-deal/use-cases/${casUsageId}/projets`).then(r => r.data),
    enabled: !!casUsageId,
  });

  const projets: ProjetNational[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
      </div>
    );
  }

  if (projets.length === 0) {
    return user?.role === 'ADMIN' ? (
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-navy text-sm">Projets New Deal Technologique</span>
        </div>
        <p className="text-xs text-gray-500 italic">
          Aucun projet national associé à ce cas d'usage.
        </p>
      </div>
    ) : null;
  }

  // Grouper par PRP
  const groupes = new Map<string, { prpCode: string; prpNom: string; projets: ProjetNational[] }>();
  projets.forEach(p => {
    const key = p.programmePrioritaire.id;
    if (!groupes.has(key)) {
      groupes.set(key, {
        prpCode: p.programmePrioritaire.code,
        prpNom: p.programmePrioritaire.nom,
        projets: [],
      });
    }
    groupes.get(key)!.projets.push(p);
  });

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-teal-700" />
        <span className="font-bold text-navy text-sm">Projets New Deal Technologique</span>
        <span className="text-xs text-gray-500">({projets.length} projet{projets.length > 1 ? 's' : ''})</span>
      </div>
      <div className="space-y-2">
        {Array.from(groupes.values()).map(g => (
          <details key={g.prpCode} className="text-xs">
            <summary className="cursor-pointer text-navy font-medium hover:text-teal-700 flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-teal transition-transform" />
              {g.prpCode} — {g.prpNom} <span className="text-gray-400">({g.projets.length})</span>
            </summary>
            <ul className="mt-1 ml-5 space-y-0.5 text-gray-600">
              {g.projets.map(p => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    <span className="font-mono text-teal-700">{p.code}</span> — {p.nom}
                  </span>
                  {p.budgetEstimatif != null && (
                    <span className="text-gray-400 ml-2 flex-shrink-0">
                      {p.budgetEstimatif.toFixed(1)} Mds FCFA
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
