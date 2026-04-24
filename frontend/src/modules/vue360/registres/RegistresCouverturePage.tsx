/**
 * Vue couverture par referentiel
 * Route : /registres/couverture (accessible a toutes les institutions)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { Loader2, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOING_BUSINESS_CODES = ['NINEA', 'RCCM'];
// Casier judiciaire n'a pas de code standardise dans nos registres,
// on le detecte par nom partiel
const isCasierJudiciaire = (r: any) => r.nom?.toLowerCase().includes('casier') || r.code === 'CASIER';
const isDoingBusiness = (r: any) => DOING_BUSINESS_CODES.includes(r.code) || isCasierJudiciaire(r);

const EXPOSITION_BADGE: Record<string, { label: string; style: string }> = {
  true: { label: 'API disponible', style: 'bg-teal/10 text-teal' },
  false: { label: 'Non expose', style: 'bg-red-100 text-red-700' },
};

export function RegistresCouverturePage() {
  const [selectedRegistre, setSelectedRegistre] = useState<string | null>(null);

  const { data: registres, isLoading } = useQuery({
    queryKey: ['registres-couverture'],
    queryFn: () => api.get('/registres/couverture').then(r => r.data),
  });

  // Drawer: cas d'usage d'un registre
  const { data: drawerData, isLoading: drawerLoading } = useQuery({
    queryKey: ['registre-cas-usages', selectedRegistre],
    queryFn: () => api.get(`/registres/${selectedRegistre}/cas-usages`).then(r => r.data),
    enabled: !!selectedRegistre,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const items = registres || [];
  const doingBusinessItems = items.filter(isDoingBusiness);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-navy to-teal text-white rounded-lg p-4">
        <div className="font-bold text-base mb-0.5">Couverture par referentiel</div>
        <div className="text-sm text-white/80">Cartographie des cas d'usage rattaches a chaque registre national.</div>
      </div>

      {/* Bandeau triptyque Doing Business */}
      {doingBusinessItems.length > 0 && (
        <Card className="border-l-4 border-gold">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-gold" />
              <div className="font-bold text-navy">Triptyque Doing Business</div>
            </div>
            <div className="text-xs text-gray-600">
              {doingBusinessItems.map((r: any) => `${r.code} (${r.detenteurCode})`).join(' · ')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grille des referentiels */}
      {items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-400">Aucun referentiel national enregistre</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((reg: any) => {
            const db = isDoingBusiness(reg);
            const borderColor = db ? (reg.compteurs.total > 0 ? 'border-t-teal' : 'border-t-amber') : (reg.compteurs.total > 0 ? 'border-t-teal' : 'border-t-gray-300');
            const expoBadge = EXPOSITION_BADGE[String(reg.disposeAPI)] || EXPOSITION_BADGE.false;

            return (
              <Card key={reg.id} className={cn('border-t-4 cursor-pointer hover:shadow-md transition-shadow', borderColor)} onClick={() => setSelectedRegistre(reg.id)}>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-navy text-lg">{reg.code}</div>
                    <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', expoBadge.style)}>{expoBadge.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{reg.nom}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{reg.detenteurCode}</span>
                    <span className="text-[10px] text-gray-500">detenteur</span>
                    {db && <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-gold/15 text-amber-700 ml-auto">Doing Business</span>}
                  </div>
                </div>

                {/* Compteurs */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="p-3 text-center">
                    <div className="text-[10px] uppercase text-gray-500 font-semibold">Consomme</div>
                    <div className={cn('text-2xl font-bold mt-1', reg.compteurs.consomme > 0 ? 'text-teal' : 'text-gray-300')}>{reg.compteurs.consomme}</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-[10px] uppercase text-gray-500 font-semibold">Alimente</div>
                    <div className={cn('text-2xl font-bold mt-1', reg.compteurs.alimente > 0 ? 'text-gold' : 'text-gray-300')}>{reg.compteurs.alimente}</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-[10px] uppercase text-gray-500 font-semibold">Cree</div>
                    <div className={cn('text-2xl font-bold mt-1', reg.compteurs.cree > 0 ? 'text-amber' : 'text-gray-300')}>{reg.compteurs.cree}</div>
                  </div>
                </div>

                {/* Consommateurs + alertes */}
                <div className="p-3">
                  {/* Double compteur typologique (P9) */}
                  {reg.doubleCompteur && (reg.doubleCompteur.nbServicesTechniques > 0 || reg.doubleCompteur.nbParcoursMetier > 0) && (
                    <div className="mb-2 p-2 bg-teal/5 rounded border border-teal/20 text-[11px] text-teal-900">
                      Consomme par <b>{reg.doubleCompteur.nbServicesTechniques}</b> service{reg.doubleCompteur.nbServicesTechniques > 1 ? 's' : ''} technique{reg.doubleCompteur.nbServicesTechniques > 1 ? 's' : ''} qui sert{reg.doubleCompteur.nbServicesTechniques > 1 ? 'ent' : ''} <b>{reg.doubleCompteur.nbParcoursMetier}</b> parcours metier.
                    </div>
                  )}
                  {reg.consommateurs?.length > 0 ? (
                    <>
                      <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Consommateurs</div>
                      <div className="flex flex-wrap gap-1">
                        {reg.consommateurs.slice(0, 6).map((c: string) => (
                          <span key={c} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                        {reg.consommateurs.length > 6 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">+{reg.consommateurs.length - 6}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-gray-400 italic">Aucun consommateur identifie</div>
                  )}

                  {/* Alerte doublons */}
                  {reg.doublonsPotentiels > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 bg-amber-50 -mx-3 -mb-3 px-3 py-2 rounded-b-lg text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      {reg.doublonsPotentiels} doublon(s) potentiel(s) detecte(s)
                    </div>
                  )}

                  {/* Alerte pas de CU */}
                  {reg.compteurs.total === 0 && db && (
                    <div className="mt-3 pt-3 border-t border-gray-100 bg-amber-50 -mx-3 -mb-3 px-3 py-2 rounded-b-lg text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      Candidat prioritaire MVP 2.0+
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer lateral — cas d'usage d'un registre */}
      {selectedRegistre && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedRegistre(null)} />
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-navy text-white p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold">{drawerData?.registre?.code || 'Registre'}</h3>
                <p className="text-xs text-white/70">{drawerData?.registre?.nom}</p>
              </div>
              <button onClick={() => setSelectedRegistre(null)}><X className="w-5 h-5" /></button>
            </div>

            {drawerLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-teal mx-auto" /></div>
            ) : (
              <div className="p-5 space-y-4">
                {(['CONSOMME', 'ALIMENTE', 'CREE'] as const).map(mode => {
                  const links = drawerData?.casUsages?.[mode] || [];
                  if (links.length === 0) return null;

                  const modeLabels: Record<string, string> = { CONSOMME: 'Consommateurs', ALIMENTE: 'Alimentent', CREE: 'Creent' };
                  const modeColors: Record<string, string> = { CONSOMME: 'border-l-teal', ALIMENTE: 'border-l-gold', CREE: 'border-l-amber' };

                  return (
                    <div key={mode}>
                      <h4 className="text-xs font-bold text-navy uppercase mb-2">{modeLabels[mode]} ({links.length})</h4>
                      <div className="space-y-1">
                        {links.map((link: any) => (
                          <Card key={link.id} className={cn('border-l-4', modeColors[mode])}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-mono text-teal">{link.casUsage?.code}</span>
                                  <span className="text-xs text-navy font-medium ml-2">{link.casUsage?.titre}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{link.casUsage?.institutionSourceCode}</span>
                              </div>
                              {link.champsConcernes && Array.isArray(link.champsConcernes) && (
                                <div className="text-[10px] font-mono text-gray-500 mt-1">{link.champsConcernes.join(', ')}</div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {Object.values(drawerData?.casUsages || {}).every((arr: any) => arr.length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm">Aucun cas d'usage associe a ce referentiel</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
