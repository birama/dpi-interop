import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Users, Briefcase, Globe, Link2, LayoutList, Table2 } from 'lucide-react';
import { ServicesGuichetPage } from './ServicesGuichetPage';
import { CorrespondanceEsenegalPage } from './CorrespondanceEsenegalPage';

export function GuichetPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const [tab, setTab] = useState<'demarches' | 'grille'>('demarches');

  // KPIs globaux (source unique : correspondance-esenegal)
  const { data: kpiData } = useQuery({
    queryKey: ['guichet-kpis'],
    queryFn: () => api.get('/catalogue/correspondance-esenegal').then((r) => r.data?.kpis),
    staleTime: 60_000,
  });

  const kpis = kpiData || {};
  const exposeTotal = (kpis?.liaisonsExposeEnLigne ?? 0) + (kpis?.liaisonsExposeNonUtilise ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Guichet unique ↔ PINS</h1>
          <p className="text-sm text-gray-600 mt-1">
            Rapprochement des démarches e-sénégal avec le catalogue d'interopérabilité.
            {isAdmin && ' Revue, liaison, validation et export.'}
          </p>
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-teal/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-teal-700 font-semibold">Services citoyens</div>
                <div className="text-3xl font-bold text-teal-800 mt-1">{kpis?.liaisonsCitoyen ?? '—'}</div>
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
              </div>
              <Briefcase className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-300">
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
                <div className="text-xs uppercase text-gray-600 font-semibold">Sans liaison</div>
                <div className="text-3xl font-bold text-gray-700 mt-1">{kpis?.casUsageSansLiaison ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1">sur {kpis?.casUsageTotal ?? 0} cas</div>
              </div>
              <Link2 className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('demarches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'demarches' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Par démarche
        </button>
        <button
          onClick={() => setTab('grille')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'grille' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Table2 className="w-4 h-4" />
          Grille de correspondance
        </button>
      </div>

      {/* Contenu */}
      {tab === 'demarches' ? <ServicesGuichetPage embedded /> : <CorrespondanceEsenegalPage embedded />}
    </div>
  );
}

export default GuichetPage;
