import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { submissionsApi, institutionsApi, api } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Building2, FileCheck, Server, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function GaugeCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-navy">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-2 text-center">{label}</span>
    </div>
  );
}

export function CockpitPage() {
  const { data: subStats } = useQuery({ queryKey: ['sub-stats-cockpit'], queryFn: () => submissionsApi.getStats() });
  const { data: instStats } = useQuery({ queryKey: ['inst-stats-cockpit'], queryFn: () => institutionsApi.getStats() });
  const { data: convData } = useQuery({ queryKey: ['conv-cockpit'], queryFn: () => api.get('/conventions') });
  const { data: xroadData } = useQuery({ queryKey: ['xroad-cockpit'], queryFn: () => api.get('/xroad-readiness') });
  const { data: subsData } = useQuery({ queryKey: ['subs-cockpit'], queryFn: () => submissionsApi.getAll({ limit: 15 }) });

  const totalInst = instStats?.data?.total || 1;
  const stats = subStats?.data;
  const totalSubmitted = (stats?.byStatus?.SUBMITTED || 0) + (stats?.byStatus?.REVIEWED || 0) + (stats?.byStatus?.VALIDATED || 0);
  const tauxReponse = Math.round((totalSubmitted / totalInst) * 100);

  const conventions = convData?.data || [];
  const convSignees = conventions.filter((c: any) => ['SIGNEE', 'ACTIVE'].includes(c.statut)).length;
  const tauxConv = conventions.length > 0 ? Math.round((convSignees / conventions.length) * 100) : 0;

  const xroad = xroadData?.data || [];
  const withSS = xroad.filter((r: any) => r.securityServerInstall === 'TERMINE').length;
  const tauxXRoad = xroad.length > 0 ? Math.round((withSS / xroad.length) * 100) : 0;

  const subs = subsData?.data?.data || [];

  // Alertes
  const alertes: { text: string; link: string; severity: 'high' | 'medium' | 'low' }[] = [];
  if (tauxReponse < 50) alertes.push({ text: `Taux de réponse faible : ${tauxReponse}% — relancer les institutions`, link: '/institutions', severity: 'high' });
  const blocked = xroad.filter((r: any) => r.blocage);
  blocked.forEach((r: any) => alertes.push({ text: `${r.institution?.code} : ${r.blocage}`, link: '/admin/xroad-pipeline', severity: 'high' }));
  const convEnAttente = conventions.filter((c: any) => c.statut.includes('ATTENTE'));
  convEnAttente.forEach((c: any) => alertes.push({ text: `Convention ${c.institutionA?.code}↔${c.institutionB?.code} : en attente de signature`, link: '/admin/conventions', severity: 'medium' }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Cockpit DPI — Pilotage e-jokkoo</h1>
        <p className="text-gray-500 mt-1">Vue stratégique du projet d'interopérabilité</p>
      </div>

      {/* Quadrant 1 — Jauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeCircle value={tauxReponse} label="Questionnaires reçus" color="#0A6B68" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeCircle value={tauxConv} label="Conventions signées" color="#D4A820" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeCircle value={tauxXRoad} label="Security Servers" color="#2D6A4F" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeCircle value={stats?.byStatus?.VALIDATED ? Math.round((stats.byStatus.VALIDATED / totalInst) * 100) : 0} label="Validés" color="#0C1F3A" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quadrant 2 — Alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-navy flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-gold" />Actions requises</CardTitle>
          </CardHeader>
          <CardContent>
            {alertes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune alerte</p>
            ) : (
              <div className="space-y-2">
                {alertes.slice(0, 8).map((a, i) => (
                  <Link key={i} to={a.link} className={cn('block p-3 rounded-lg text-sm hover:bg-gray-50 border-l-4', a.severity === 'high' ? 'border-l-red-500 bg-red-50/50' : a.severity === 'medium' ? 'border-l-gold bg-gold-50/30' : 'border-l-gray-300')}>
                    {a.text}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quadrant 3 — Chiffres clés */}
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Chiffres clés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2"><Building2 className="w-4 h-4 text-navy" /><span className="text-sm">Institutions</span></div>
              <span className="font-bold text-navy">{totalInst}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2"><FileCheck className="w-4 h-4 text-teal" /><span className="text-sm">Questionnaires soumis</span></div>
              <span className="font-bold text-teal">{totalSubmitted}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2"><FileCheck className="w-4 h-4 text-gold" /><span className="text-sm">Conventions</span></div>
              <span className="font-bold text-gold">{convSignees}/{conventions.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2"><Server className="w-4 h-4 text-success" /><span className="text-sm">Security Servers</span></div>
              <span className="font-bold text-success">{withSS}/{xroad.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2"><Database className="w-4 h-4 text-teal" /><span className="text-sm">Flux déclarés</span></div>
              <span className="font-bold text-teal">{stats?.total || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quadrant 4 — Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Activité récente</CardTitle>
          <CardDescription>Dernières soumissions sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {subs.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-sm text-navy">{sub.institution?.code}</span>
                  <span className="text-xs text-gray-400 ml-2">{sub.institution?.nom}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                    sub.status === 'VALIDATED' ? 'bg-success/10 text-success' :
                    sub.status === 'SUBMITTED' ? 'bg-gold-50 text-gold' :
                    'bg-gray-100 text-gray-500'
                  )}>{sub.status}</span>
                  <span className="text-xs text-gray-400">{formatDate(sub.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
