/**
 * Cloche de notifications — header DashboardLayout
 * Polling : 60s + refetch on window focus
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Bell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '../constants';

const TYPE_ICON: Record<string, string> = {
  CONSULTATION_OUVERTE: '📩',
  AVIS_RECU: '💬',
  RELANCE: '⏰',
  TRANSITION: '🔄',
  ARBITRAGE: '⚖',
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['me-notifications'],
    queryFn: () => api.get('/me/notifications', { params: { limit: 10 } }).then(r => r.data),
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me-notifications'] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => api.patch('/me/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me-notifications'] }),
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleClick = async (n: any) => {
    if (!n.lu) markReadMut.mutate(n.id);
    setOpen(false);
    if (n.lienUrl) navigate(n.lienUrl);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
        className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-navy text-sm">Notifications</div>
            {unreadCount > 0 && <span className="text-[10px] text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>}
          </div>

          {/* Liste */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Aucune notification</div>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.id}
                  role="menuitem"
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full px-4 py-3 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    !n.lu && 'bg-teal-50/40'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className={cn('text-sm truncate flex-1', !n.lu ? 'font-semibold text-navy' : 'text-gray-700')}>{n.titre}</div>
                        {!n.lu && <span className="w-2 h-2 rounded-full bg-teal flex-shrink-0 mt-1.5" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(n.dateCreation)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => markAllReadMut.mutate()}
                disabled={markAllReadMut.isPending}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-teal font-semibold hover:bg-teal/5 py-1.5 rounded"
              >
                <Check className="w-3 h-3" />
                Tout marquer comme lu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
