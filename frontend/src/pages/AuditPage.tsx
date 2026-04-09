import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Loader2, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_EMOJIS: Record<string, string> = {
  LOGIN_SUCCESS: '🟢', LOGIN_FAILED: '🔴', BRUTE_FORCE_SUSPECTED: '🚨',
  CREATE: '➕', UPDATE: '✏️', DELETE: '🗑️',
  IMPORT_QUESTIONNAIRE: '📥', EXPORT_WORD: '📄', EXPORT_COMPILATION: '📦',
  SUBMISSION_SUBMITTED: '📨', FINANCEMENT_PROPOSED: '💰',
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Connexion réussie', LOGIN_FAILED: 'Connexion échouée', BRUTE_FORCE_SUSPECTED: 'Tentative brute force',
  CREATE: 'Création', UPDATE: 'Modification', DELETE: 'Suppression',
  IMPORT_QUESTIONNAIRE: 'Import questionnaire', EXPORT_WORD: 'Export Word', EXPORT_COMPILATION: 'Export compilation',
  SUBMISSION_SUBMITTED: 'Soumission',
};

const ACTION_OPTIONS = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'BRUTE_FORCE_SUSPECTED', 'CREATE', 'UPDATE', 'DELETE', 'IMPORT_QUESTIONNAIRE', 'EXPORT_WORD', 'EXPORT_COMPILATION'];
const RESOURCE_OPTIONS = ['auth', 'submission', 'convention', 'cas-usage-mvp', 'user', 'institution', 'financement', 'building-block', 'registre-national', 'ptf', 'programme', 'expertise', 'report'];

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AuditPage() {
  const [tab, setTab] = useState<'sessions' | 'logs' | 'stats'>('sessions');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['audit-sessions'],
    queryFn: () => api.get('/audit/sessions/active').then(r => r.data),
    refetchInterval: 30000,
    enabled: tab === 'sessions',
  });

  const disconnectMut = useMutation({
    mutationFn: (id: string) => api.delete(`/audit/sessions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['audit-sessions'] }); toast({ title: 'Session déconnectée' }); },
  });

  const [logsPage, setLogsPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const logsQuery = useQuery({
    queryKey: ['audit-logs', logsPage, filterAction, filterResource, filterDateFrom, filterDateTo],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(logsPage), limit: '30' });
      if (filterAction) params.set('action', filterAction);
      if (filterResource) params.set('resource', filterResource);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      return api.get(`/audit/logs?${params}`).then(r => r.data);
    },
    enabled: tab === 'logs',
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => api.get('/audit/stats').then(r => r.data),
    enabled: tab === 'stats',
  });

  const sessionCount = (sessions as any[])?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-teal" />
        <h1 className="text-xl font-bold text-navy">Audit & Sessions</h1>
      </div>

      <div className="flex gap-1 border-b">
        {[
          { key: 'sessions' as const, label: 'Utilisateurs en ligne' },
          { key: 'logs' as const, label: 'Journal d\'activité' },
          { key: 'stats' as const, label: 'Statistiques' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === t.key ? 'border-teal text-teal' : 'border-transparent text-gray-500 hover:text-gray-700')}>{t.label}</button>
        ))}
      </div>

      {/* TAB 1: Sessions */}
      {tab === 'sessions' && (
        <div className="space-y-3">
          <Card className="border-teal/30 bg-teal-50/30">
            <CardContent className="p-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" />
              <span className="text-sm font-medium text-navy">{sessionCount} session{sessionCount > 1 ? 's' : ''} active{sessionCount > 1 ? 's' : ''}</span>
              <span className="text-[10px] text-gray-400 ml-2">(rafraîchissement auto 30s)</span>
            </CardContent>
          </Card>

          {loadingSessions ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>
          ) : (
            <Card><CardContent className="pt-4">
              <table className="w-full text-xs">
                <thead><tr className="border-b text-gray-500">
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Rôle</th>
                  <th className="p-2 text-left">Institution</th>
                  <th className="p-2 text-left">Connecté depuis</th>
                  <th className="p-2 text-left">Dernière activité</th>
                  <th className="p-2 text-left">IP</th>
                  <th className="p-2 text-right">Action</th>
                </tr></thead>
                <tbody>
                  {(sessions as any[])?.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium text-navy">{s.user?.email || s.userId?.substring(0, 8)}</td>
                      <td className="p-2"><span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', s.user?.role === 'ADMIN' ? 'bg-navy/10 text-navy' : 'bg-teal-50 text-teal')}>{s.user?.role || '—'}</span></td>
                      <td className="p-2">{s.user?.institution?.code || '—'}</td>
                      <td className="p-2 text-gray-500">{formatTimeAgo(s.loginAt)}</td>
                      <td className="p-2">
                        {(() => {
                          const mins = Math.floor((Date.now() - new Date(s.lastActivityAt).getTime()) / 60000);
                          return <span className={cn('font-medium', mins < 5 ? 'text-success' : mins < 30 ? 'text-gold' : 'text-gray-400')}>{formatTimeAgo(s.lastActivityAt)}</span>;
                        })()}
                      </td>
                      <td className="p-2 font-mono text-gray-400">{s.ipAddress || '—'}</td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-red-500 border-red-200 hover:bg-red-50" onClick={() => disconnectMut.mutate(s.id)} disabled={disconnectMut.isPending}>
                          <LogOut className="w-3 h-3 mr-1" /> Déconnecter
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {sessionCount === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-400">Aucune session active</td></tr>}
                </tbody>
              </table>
            </CardContent></Card>
          )}
        </div>
      )}

      {/* TAB 2: Logs */}
      {tab === 'logs' && (
        <div className="space-y-3">
          <Card><CardContent className="p-3 flex flex-wrap gap-2 items-end">
            <div><label className="text-[10px] text-gray-500 block mb-1">Action</label><select className="border rounded px-2 py-1 text-xs h-7" value={filterAction} onChange={e => { setFilterAction(e.target.value); setLogsPage(1); }}><option value="">Toutes</option>{ACTION_OPTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}</select></div>
            <div><label className="text-[10px] text-gray-500 block mb-1">Ressource</label><select className="border rounded px-2 py-1 text-xs h-7" value={filterResource} onChange={e => { setFilterResource(e.target.value); setLogsPage(1); }}><option value="">Toutes</option>{RESOURCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="text-[10px] text-gray-500 block mb-1">Du</label><Input type="date" className="h-7 text-xs w-36" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setLogsPage(1); }} /></div>
            <div><label className="text-[10px] text-gray-500 block mb-1">Au</label><Input type="date" className="h-7 text-xs w-36" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setLogsPage(1); }} /></div>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { window.open('/api/audit/logs/export', '_blank'); }}>Export CSV</Button>
          </CardContent></Card>

          {logsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>
          ) : (
            <div className="space-y-1">
              {(logsQuery.data?.data || []).map((log: any) => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 border-l-2 border-gray-200">
                  <span className="text-base flex-shrink-0">{ACTION_EMOJIS[log.action] || '📋'}</span>
                  <div className="min-w-0 text-xs">
                    <span className="text-gray-400">{formatDateTime(log.createdAt)}</span>
                    <span className="mx-1 text-gray-300">—</span>
                    <span className="font-medium text-navy">{log.userEmail || 'Système'}</span>
                    <span className="mx-1 text-gray-400">{ACTION_LABELS[log.action] || log.action}</span>
                    {log.resourceLabel && <span className="text-teal">sur <span className="font-medium">{log.resourceLabel}</span></span>}
                    {log.resource && <span className="text-[10px] text-gray-300 ml-1">({log.resource})</span>}
                  </div>
                </div>
              ))}
              {(logsQuery.data?.data || []).length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Aucune entrée</div>}

              {logsQuery.data?.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={logsPage <= 1} onClick={() => setLogsPage(p => p - 1)}>Précédent</Button>
                  <span className="text-xs text-gray-500">Page {logsQuery.data.page} / {logsQuery.data.totalPages}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={logsPage >= logsQuery.data.totalPages} onClick={() => setLogsPage(p => p + 1)}>Suivant</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Stats */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loadingStats ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div> : (
            <div className="grid grid-cols-4 gap-3">
              <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Connexions 24h</p><p className="text-lg font-bold text-teal">{stats?.totalLogins24h ?? 0}</p></CardContent></Card>
              <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Sessions actives</p><p className="text-lg font-bold text-success">{stats?.activeSessionsNow ?? 0}</p></CardContent></Card>
              <Card className="border-l-4 border-l-red-500"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Échecs 24h</p><p className="text-lg font-bold text-red-500">{stats?.failedLogins24h ?? 0}</p></CardContent></Card>
              <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Modifications 24h</p><p className="text-lg font-bold text-navy">{stats?.modifications24h ?? 0}</p></CardContent></Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
