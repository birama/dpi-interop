import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STATUT_CU: Record<string, string> = { IDENTIFIE: 'bg-gray-100 text-gray-600', PRIORISE: 'bg-gold-50 text-gold', EN_PREPARATION: 'bg-blue-100 text-blue-600', EN_TEST: 'bg-teal-50 text-teal', EN_PRODUCTION: 'bg-success/10 text-success' };
const JALON_COLORS: Record<string, { bg: string; label: string }> = { TERMINE: { bg: 'bg-success', label: 'OK' }, EN_COURS: { bg: 'bg-gold', label: '...' }, NON_DEMARRE: { bg: 'bg-gray-300', label: '' }, BLOQUE: { bg: 'bg-red-500', label: '!' } };
const JALONS = ['serveurDedie', 'connectiviteReseau', 'certificatsSSL', 'securityServerInstall', 'premierServicePublie', 'premierEchangeReussi'];
const JALON_LABELS = ['Serveur', 'Réseau', 'SSL', 'Security Server', '1er service', '1er échange'];

export function InstitutionDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['institution-dashboard'],
    queryFn: () => api.get('/institution/dashboard').then(r => r.data),
    enabled: !!user?.institutionId,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Aucune institution liée à votre compte</div>;

  const { institution, submission, conventions, casUsages, readiness, actions, stats } = data;
  const mat = stats?.maturiteMoyenne || 0;

  return (
    <div className="space-y-4">
      {/* Section 1: En-tête */}
      <Card className="border-l-4 border-l-teal">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-navy">{institution?.nom}</h1>
              <p className="text-xs text-gray-500">{institution?.ministere}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <div><span className="text-gray-500">Data Owner:</span> <span className={submission?.dataOwnerNom ? 'text-navy font-medium' : 'text-orange-500'}>{submission?.dataOwnerNom || 'Non désigné'}</span></div>
                <div><span className="text-gray-500">Data Steward:</span> <span className={submission?.dataStewardNom ? 'text-navy font-medium' : 'text-orange-500'}>{submission?.dataStewardNom || 'Non désigné'}</span></div>
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-teal flex items-center justify-center">
                <span className="text-lg font-bold text-teal">{mat}</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Maturité /5</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Flux de données</p><p className="text-lg font-bold text-navy">{stats.nbFlux}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Cas d'usage MVP</p><p className="text-lg font-bold text-teal">{stats.nbCasUsages}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Conventions</p><p className="text-lg font-bold text-gold">{stats.nbConventions}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Questionnaire</p><p className="text-lg font-bold text-success">{submission?.status || 'Non commencé'}</p></CardContent></Card>
      </div>

      {/* Actions requises */}
      {actions?.length > 0 && (
        <Card className="border-l-4 border-l-orange-400">
          <CardContent className="p-3">
            <h3 className="text-sm font-bold text-navy mb-2">Actions requises</h3>
            <div className="space-y-1">
              {actions.map((a: any, i: number) => (
                <div key={i} className="flex items-center space-x-2 text-xs">
                  <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0', a.type === 'warning' ? 'text-orange-500' : a.type === 'action' ? 'text-red-500' : 'text-blue-500')} />
                  <span className="text-gray-700">{a.message}</span>
                  {a.link && <Button size="sm" variant="ghost" className="h-5 text-[10px] text-teal" onClick={() => navigate(a.link)}>→</Button>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2: Flux de données */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-3">
            <h3 className="text-sm font-bold text-navy mb-2">Données que je consomme</h3>
            {(submission?.donneesConsommer || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucune donnée déclarée</p>
            ) : (
              <div className="space-y-1.5">
                {submission.donneesConsommer.map((dc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div><span className="px-1.5 py-0.5 rounded bg-navy/10 text-navy text-[10px] font-medium">{dc.source}</span> <span className="text-gray-600 ml-1">{dc.donnee}</span></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <h3 className="text-sm font-bold text-navy mb-2">Données que je fournis</h3>
            {(submission?.donneesFournir || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucune donnée déclarée</p>
            ) : (
              <div className="space-y-1.5">
                {submission.donneesFournir.map((df: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div><span className="text-gray-600">{df.donnee}</span> <span className="text-[10px] text-gray-400">→ {df.destinataires || '?'}</span></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Conventions */}
      <Card>
        <CardContent className="p-3">
          <h3 className="text-sm font-bold text-navy mb-2">Mes conventions d'échange ({conventions?.length || 0})</h3>
          {conventions?.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucune convention formalisée. Contactez la DU pour initier une convention.</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {conventions.map((c: any) => {
                  const partner = c.institutionAId === institution.id ? c.institutionB : c.institutionA;
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-1.5 font-medium text-navy">{partner?.code}</td>
                      <td className="py-1.5 text-gray-600">{c.objet}</td>
                      <td className="py-1.5 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', c.statut === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-gold-50 text-gold')}>{c.statut}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Cas d'usage */}
      <Card>
        <CardContent className="p-3">
          <h3 className="text-sm font-bold text-navy mb-2">Cas d'usage MVP me concernant ({casUsages?.length || 0})</h3>
          {casUsages?.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun cas d'usage identifié</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="border-b text-gray-500"><th className="p-1 text-left">Code</th><th className="p-1 text-left">Titre</th><th className="p-1 text-left">Flux</th><th className="p-1 text-center">Phase</th><th className="p-1 text-center">Statut</th></tr></thead>
              <tbody>
                {casUsages.map((cu: any) => (
                  <tr key={cu.id} className="border-b last:border-0">
                    <td className="p-1 font-mono text-teal">{cu.code}</td>
                    <td className="p-1 text-navy max-w-[200px] truncate">{cu.titre}</td>
                    <td className="p-1 text-gray-500">{cu.institutionSourceCode} → {cu.institutionCibleCode}</td>
                    <td className="p-1 text-center text-[10px]">{cu.phaseMVP?.code || '—'}</td>
                    <td className="p-1 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', STATUT_CU[cu.statutImpl] || 'bg-gray-100')}>{cu.statutImpl}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Readiness X-Road */}
      <Card>
        <CardContent className="p-3">
          <h3 className="text-sm font-bold text-navy mb-2">Mon readiness PINS / X-Road</h3>
          {!readiness ? (
            <p className="text-xs text-gray-400 italic">Votre institution n'est pas encore dans le pipeline PINS. Contactez la DU.</p>
          ) : (
            <div className="flex items-center justify-between">
              {JALONS.map((j, i) => {
                const status = (readiness as any)[j] || 'NON_DEMARRE';
                const config = JALON_COLORS[status] || JALON_COLORS.NON_DEMARRE;
                return (
                  <div key={j} className="flex items-center">
                    <div className="text-center">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mx-auto text-white text-[10px] font-bold', config.bg)}>{config.label || (i + 1)}</div>
                      <p className="text-[9px] text-gray-500 mt-1">{JALON_LABELS[i]}</p>
                    </div>
                    {i < JALONS.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
