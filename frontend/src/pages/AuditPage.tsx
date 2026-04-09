import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Loader2, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuditLog = {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  resourceLabel?: string;
  details?: any;
  createdAt: string;
};

type UserSession = {
  id: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  userInstitution?: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: string;
  lastActivityAt: string;
  isActive: boolean;
};

type AuditStats = {
  totalLogins24h: number;
  activeSessionsNow: number;
  failedLogins24h: number;
  modifications24h: number;
};

const ACTION_EMOJIS: Record<string, string> = {
  LOGIN_SUCCESS: '\u{1F7E2}',
  LOGIN_FAILED: '\u{1F534}',
  CREATE: '\u2795',
  UPDATE: '\u270F\uFE0F',
  DELETE: '\u{1F5D1}\uFE0F',
  IMPORT_QUESTIONNAIRE: '\u{1F4E5}',
  EXPORT_WORD: '\u{1F4C4}',
  SUBMISSION_SUBMITTED: '\u{1F4E8}',
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Connexion r\u00e9ussie',
  LOGIN_FAILED: 'Connexion \u00e9chou\u00e9e',
  CREATE: 'Cr\u00e9ation',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  IMPORT_QUESTIONNAIRE: 'Import questionnaire',
  EXPORT_WORD: 'Export Word',
  SUBMISSION_SUBMITTED: 'Soumission',
};

const ACTION_OPTIONS = [
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'CREATE', 'UPDATE', 'DELETE',
  'IMPORT_QUESTIONNAIRE', 'EXPORT_WORD', 'SUBMISSION_SUBMITTED',
];

const RESOURCE_OPTIONS = ['auth', 'submission', 'institution', 'questionnaire', 'user', 'convention'];

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '\u00e0 l\'instant';
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function AuditPage() {
  const [tab, setTab] = useState<'sessions' | 'logs' | 'stats'>('sessions');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Tab 1: Active sessions ---
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['audit-sessions'],
    queryFn: () => api.get('/audit/sessions/active').then(r => r.data as UserSession[]),
    refetchInterval: 30000,
    enabled: tab === 'sessions',
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/audit/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-sessions'] });
      toast({ title: 'Session d\u00e9connect\u00e9e' });
    },
  });

  // --- Tab 2: Logs ---
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
      return api.get(`/audit/logs?${params}`).then(r => r.data as { data: AuditLog[]; total: number; page: number; totalPages: number });
    },
    enabled: tab === 'logs',
  });

  // --- Tab 3: Stats ---
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => api.get('/audit/stats').then(r => r.data as AuditStats),
    enabled: tab === 'stats',
  });

  const tabs = [
    { key: 'sessions' as const, label: 'Utilisateurs en ligne' },
    { key: 'logs' as const, label: "Journal d'activit\u00e9" },
    { key: 'stats' as const, label: 'Statistiques' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-teal-600" />
        <h1 className="text-xl font-bold text-navy">Audit & Sessions</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Sessions */}
      {tab === 'sessions' && (
        <div className="space-y-3">
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-navy">
                  {sessions?.length ?? 0} session(s) active(s)
                </span>
                <span className="text-xs text-gray-500 ml-2">(rafra\u00eechissement auto 30s)</span>
              </div>
            </CardContent>
          </Card>

          {loadingSessions ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="p-2">Email</th>
                    <th className="p-2">R\u00f4le</th>
                    <th className="p-2">Institution</th>
                    <th className="p-2">Connect\u00e9 depuis</th>
                    <th className="p-2">Derni\u00e8re activit\u00e9</th>
                    <th className="p-2">IP</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions?.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 font-medium text-navy">{s.userEmail || s.userId}</td>
                      <td className="p-2">{s.userRole || '-'}</td>
                      <td className="p-2">{s.userInstitution || '-'}</td>
                      <td className="p-2">{formatDateTime(s.loginAt)}</td>
                      <td className="p-2">{formatTimeAgo(s.lastActivityAt)}</td>
                      <td className="p-2 font-mono">{s.ipAddress || '-'}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => disconnectMutation.mutate(s.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          <LogOut className="w-3 h-3 mr-1" /> D\u00e9connecter
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!sessions || sessions.length === 0) && (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-400">Aucune session active</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Logs */}
      {tab === 'logs' && (
        <div className="space-y-3">
          {/* Filters */}
          <Card>
            <CardContent className="p-3 flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Action</label>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={filterAction}
                  onChange={e => { setFilterAction(e.target.value); setLogsPage(1); }}
                >
                  <option value="">Toutes</option>
                  {ACTION_OPTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ressource</label>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={filterResource}
                  onChange={e => { setFilterResource(e.target.value); setLogsPage(1); }}
                >
                  <option value="">Toutes</option>
                  {RESOURCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Du</label>
                <Input
                  type="date"
                  className="h-7 text-xs w-36"
                  value={filterDateFrom}
                  onChange={e => { setFilterDateFrom(e.target.value); setLogsPage(1); }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Au</label>
                <Input
                  type="date"
                  className="h-7 text-xs w-36"
                  value={filterDateTo}
                  onChange={e => { setFilterDateTo(e.target.value); setLogsPage(1); }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {logsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="space-y-1">
              {logsQuery.data?.data.map(log => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 border-l-2 border-gray-200">
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {ACTION_EMOJIS[log.action] || '\u{1F4CB}'}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                    <span className="mx-1 text-xs text-gray-300">\u2014</span>
                    <span className="text-xs font-medium text-navy">{log.userEmail || 'Syst\u00e8me'}</span>
                    <span className="mx-1 text-xs text-gray-400">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    {log.resourceLabel && (
                      <span className="text-xs text-teal-700">
                        sur <span className="font-medium">{log.resourceLabel}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {logsQuery.data?.data.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune entr\u00e9e</div>
              )}

              {/* Pagination */}
              {logsQuery.data && logsQuery.data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={logsPage <= 1}
                    onClick={() => setLogsPage(p => p - 1)}
                  >
                    Pr\u00e9c\u00e9dent
                  </Button>
                  <span className="text-xs text-gray-500">
                    Page {logsQuery.data.page} / {logsQuery.data.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={logsPage >= logsQuery.data.totalPages}
                    onClick={() => setLogsPage(p => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Stats */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loadingStats ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-teal-700">{stats?.totalLogins24h ?? 0}</div>
                    <div className="text-xs text-gray-500">Connexions 24h</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-teal-700">{stats?.activeSessionsNow ?? 0}</div>
                    <div className="text-xs text-gray-500">Sessions actives</div>
                  </CardContent>
                </Card>
                <Card className="border-red-200">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats?.failedLogins24h ?? 0}</div>
                    <div className="text-xs text-gray-500">\u00c9checs 24h</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-teal-700">{stats?.modifications24h ?? 0}</div>
                    <div className="text-xs text-gray-500">Modifications 24h</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
