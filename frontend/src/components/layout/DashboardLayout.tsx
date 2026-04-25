import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeft,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/CommandPalette';
import { Breadcrumb } from '@/components/Breadcrumb';
import { NotificationsBell } from '@/modules/vue360/notifications/NotificationsBell';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MENU_SECTIONS, MENU_TOP, findSectionForPath, type MenuItem } from '@/config/menuConfig';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrage des rubriques selon le role
  const visibleSections = MENU_SECTIONS
    .filter(s => user?.role && s.roles.includes(user.role as 'ADMIN' | 'INSTITUTION'))
    .map(s => ({
      ...s,
      items: s.items.filter(i => !i.roles || (user?.role && i.roles.includes(user.role as 'ADMIN' | 'INSTITUTION'))),
    }))
    .filter(s => s.items.length > 0);

  // Pattern accordeon : une seule rubrique ouverte a la fois.
  // null = toutes fermees (etat valide quand user clique pour fermer la rubrique active).
  const activeSectionId = findSectionForPath(location.pathname);
  const [activeRubrique, setActiveRubrique] = useState<string | null>(activeSectionId);

  // Au changement de route : ouvre automatiquement la rubrique de la nouvelle URL,
  // ferme toutes les autres. Ne touche pas a l'etat si l'user a delibere ferme la rubrique.
  useEffect(() => {
    if (activeSectionId) {
      setActiveRubrique(activeSectionId);
    }
  }, [activeSectionId]);

  const toggleSection = (id: string) => {
    setActiveRubrique(prev => prev === id ? null : id);
  };

  // Compteurs contextuels (R6) — chargement paresseux
  const { data: involvedData } = useQuery({
    queryKey: ['menu-counter-mes-cas-usage'],
    queryFn: () => api.get('/me/use-cases/involved').then((r: any) => r.data),
    enabled: !!user?.institutionId,
    staleTime: 60000,
  });
  const { data: duData } = useQuery({
    queryKey: ['menu-counter-du'],
    queryFn: () => api.get('/du/arbitrage').then((r: any) => r.data),
    enabled: user?.role === 'ADMIN',
    staleTime: 60000,
  });
  const { data: adoptionRequestsData } = useQuery({
    queryKey: ['menu-counter-adoption-requests'],
    queryFn: () => api.get('/catalogue/adoption-requests', { params: { status: 'EN_ATTENTE' } }).then((r: any) => r.data),
    enabled: user?.role === 'ADMIN',
    staleTime: 60000,
  });

  const counters: Record<string, { value: number; color: 'amber' | 'red' | 'teal' }> = {
    mesCasUsage: { value: (involvedData?.length || 0), color: 'teal' },
    desaccords: { value: (duData?.desaccords?.length || 0), color: 'amber' },
    adoptionRequestsEnAttente: { value: (adoptionRequestsData?.length || 0), color: 'red' },
  };

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Command Palette */}
      <CommandPalette />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - FIXED, charte SENUM/MCTN navy */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-navy flex flex-col transition-all duration-300 ease-in-out',
          sidebarWidth,
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-navy-light flex-shrink-0">
          <Link to="/dashboard" className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-gold text-sm whitespace-nowrap">PINS</span>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">Interoperabilite</span>
              </div>
            )}
          </Link>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-navy-light text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Desktop toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1 rounded-md hover:bg-navy-light text-gray-400 hover:text-gray-200"
            title={sidebarCollapsed ? 'Deplier le menu' : 'Replier le menu'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation — 5 rubriques collapsibles + Tableau de bord en tete */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {/* Lien tableau de bord en tete */}
          {(() => {
            const isActive = location.pathname === MENU_TOP.href;
            const Icon = MENU_TOP.icon;
            return (
              <Link
                to={MENU_TOP.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? MENU_TOP.name : undefined}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-2',
                  isActive ? 'bg-teal text-white' : 'text-gray-300 hover:bg-navy-light hover:text-white',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', !sidebarCollapsed && 'mr-3', isActive ? 'text-white' : 'text-gray-400')} />
                {!sidebarCollapsed && MENU_TOP.name}
              </Link>
            );
          })()}

          {/* Rubriques collapsibles — accordeon : une seule ouverte a la fois */}
          {visibleSections.map(section => {
            const isOpen = activeRubrique === section.id;
            const SectionIcon = section.icon;
            // En mode collapse, on ne rend pas les entetes de section — juste la liste avec separateur
            if (sidebarCollapsed) {
              return (
                <div key={section.id}>
                  <div className="border-t border-navy-light my-2 mx-2" />
                  {section.items.map((item: MenuItem) => {
                    const isActive = location.pathname === item.href
                      || (item.href !== '/dashboard' && location.pathname.startsWith(item.href + '/'));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={item.name}
                        className={cn(
                          'flex items-center justify-center px-2 py-2 text-sm font-medium rounded-lg transition-colors',
                          isActive ? 'bg-teal text-white' : 'text-gray-300 hover:bg-navy-light hover:text-white'
                        )}
                      >
                        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
                      </Link>
                    );
                  })}
                </div>
              );
            }
            return (
              <div key={section.id} className="mt-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200"
                >
                  <span className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5" />
                    {section.label}
                  </span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen ? 'rotate-0' : '-rotate-90')} />
                </button>
                {isOpen && (
                  <div className="space-y-0.5">
                    {section.items.map((item: MenuItem) => {
                      const isActive = location.pathname === item.href
                        || (item.href !== '/dashboard' && location.pathname.startsWith(item.href + '/'));
                      const Icon = item.icon;
                      const counter = item.counter ? counters[item.counter] : null;
                      const showCounter = counter && counter.value > 0;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-3 pl-5 py-1.5 text-xs font-medium rounded-md transition-colors',
                            isActive ? 'bg-teal text-white' : 'text-gray-300 hover:bg-navy-light hover:text-white'
                          )}
                        >
                          <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
                          <span className="flex-1 min-w-0 truncate">{item.name}</span>
                          {showCounter && (
                            <span className={cn(
                              'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                              counter.color === 'red' && 'bg-red-500 text-white',
                              counter.color === 'amber' && 'bg-amber-500 text-white',
                              counter.color === 'teal' && 'bg-teal/70 text-white'
                            )}>
                              {counter.value > 99 ? '99+' : counter.value}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-navy-light flex-shrink-0">
          <div className={cn('flex items-center', sidebarCollapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-teal-dark flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-teal-50" />
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">{user?.role === 'ADMIN' ? 'Administrateur' : 'Institution'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content - decale a droite selon la largeur du sidebar */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Top bar - sticky */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search bar trigger */}
            <button
              onClick={() => {
                // Trigger Ctrl+K programmatically
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 border rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors w-64"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Rechercher...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border rounded">Ctrl+K</kbd>
            </button>
          </div>

          {/* Right side: notifications + user */}
          <div className="flex items-center gap-1">
            <NotificationsBell />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-4 h-4 text-teal" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500">
                      {user?.institution?.nom || (user?.role === 'ADMIN' ? 'SENUM' : '')}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Deconnexion
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Breadcrumb />
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-500">
          SENUM / MCTN — Plateforme Nationale d'Interoperabilite PINS — Senegal
        </footer>
      </div>
    </div>
  );
}
