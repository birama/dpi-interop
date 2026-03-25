import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, CheckCircle, Circle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const JALONS = [
  { key: 'serveurDedie', label: 'Serveur dédié' },
  { key: 'connectiviteReseau', label: 'Connectivité' },
  { key: 'certificatsSSL', label: 'Certificats SSL' },
  { key: 'securityServerInstall', label: 'Security Server' },
  { key: 'premierServicePublie', label: '1er service' },
  { key: 'premierEchangeReussi', label: '1er échange' },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  TERMINE: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Terminé' },
  EN_COURS: { icon: Clock, color: 'text-gold', bg: 'bg-gold-50', label: 'En cours' },
  BLOQUE: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Bloqué' },
  NON_DEMARRE: { icon: Circle, color: 'text-gray-300', bg: 'bg-gray-50', label: 'Non démarré' },
};

const HEBERGEMENT_LABELS: Record<string, { label: string; color: string }> = {
  SENUM_CENTRALISE: { label: 'SENUM', color: 'bg-teal-50 text-teal' },
  HEBERGEMENT_PROPRE: { label: 'Propre', color: 'bg-navy/10 text-navy' },
  MIXTE: { label: 'Mixte', color: 'bg-gold-50 text-gold' },
};

export function XRoadPipelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['xroad-readiness'],
    queryFn: () => api.get('/xroad-readiness'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const readiness = data?.data || [];
  const withSS = readiness.filter((r: any) => r.securityServerInstall === 'TERMINE').length;
  const withAPI = readiness.filter((r: any) => r.disposeAPI).length;
  const blocked = readiness.filter((r: any) => r.blocage).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Pipeline de déploiement X-Road</h1>
        <p className="text-gray-500 mt-1">État réel des 4 agences pilotes — synchronisé avec DAT PexOne v0.5</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-navy"><CardContent className="pt-4"><p className="text-xs text-gray-500">Agences pilotes</p><p className="text-2xl font-bold text-navy">{readiness.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="pt-4"><p className="text-xs text-gray-500">Avec API</p><p className="text-2xl font-bold text-teal">{withAPI}/{readiness.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="pt-4"><p className="text-xs text-gray-500">Security Server installé</p><p className="text-2xl font-bold text-success">{withSS}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="pt-4"><p className="text-xs text-gray-500">Bloquées</p><p className="text-2xl font-bold text-red-500">{blocked}</p></CardContent></Card>
      </div>

      {/* Tableau pipeline */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-gray-500 sticky left-0 bg-white">Institution</th>
                {JALONS.map(j => (
                  <th key={j.key} className="p-3 text-center text-gray-500 whitespace-nowrap text-xs">{j.label}</th>
                ))}
                <th className="p-3 text-center text-gray-500 text-xs">Hébergement</th>
                <th className="p-3 text-center text-gray-500 text-xs">API</th>
                <th className="p-3 text-left text-gray-500 text-xs">Blocage</th>
              </tr>
            </thead>
            <tbody>
              {readiness.map((r: any) => {
                const heb = HEBERGEMENT_LABELS[r.hebergement] || HEBERGEMENT_LABELS.SENUM_CENTRALISE;
                const hebCible = r.hebergementCible ? HEBERGEMENT_LABELS[r.hebergementCible] : null;

                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy sticky left-0 bg-white">
                      <div>
                        <span className="font-bold">{r.institution?.code}</span>
                        <span className="text-xs text-gray-400 block">{r.institution?.ministere}</span>
                      </div>
                    </td>
                    {JALONS.map(j => {
                      const status = r[j.key] || 'NON_DEMARRE';
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      return (
                        <td key={j.key} className="p-3 text-center">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mx-auto', config.bg)} title={config.label}>
                            <Icon className={cn('w-4 h-4', config.color)} />
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', heb.color)}>{heb.label}</span>
                        {hebCible && hebCible.label !== heb.label && (
                          <span className="text-[9px] text-gray-400">→ {hebCible.label}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', r.disposeAPI ? 'bg-teal-50 text-teal' : 'bg-red-50 text-red-500')}>
                          {r.disposeAPI ? 'Oui' : 'Non'}
                        </span>
                        {r.maturiteAPI && <span className="text-[9px] text-gray-400 mt-0.5">{r.maturiteAPI}</span>}
                        {r.protocoleAPI && <span className="text-[9px] text-gray-400">{r.protocoleAPI}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-red-500 max-w-[250px]">
                      {r.blocage || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Détail par agence */}
      {readiness.map((r: any) => (
        <Card key={r.id} className="border-l-4 border-l-navy">
          <CardHeader>
            <CardTitle className="text-navy text-sm">{r.institution?.code} — {r.institution?.nom}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-500 mb-1">Système source</p>
              <p>{r.systemeSource || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500 mb-1">Protocole API</p>
              <p>{r.protocoleAPI || '—'}</p>
            </div>
            {r.observationsAPI && (
              <div className="col-span-2">
                <p className="font-medium text-gray-500 mb-1">Observations API</p>
                <p className="text-gray-600">{r.observationsAPI}</p>
              </div>
            )}
            {r.prerequisMigration && (
              <div className="col-span-2">
                <p className="font-medium text-gray-500 mb-1">Prérequis migration</p>
                <p className="text-gray-600">{r.prerequisMigration}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
