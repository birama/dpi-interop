import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  FileText,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeft,
  Grid3X3,
  ClipboardList,
  Radar,
  BookOpen,
  Gauge,
  FileCheck,
  GitBranch,
  Network,
  Database,
  Map as MapIcon,
  Wallet,
  ClipboardCheck,
  Users,
  Upload,
  Shield,
  MessageSquare,
  Search,
  Scale,
  Layers,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/CommandPalette';
import { Breadcrumb } from '@/components/Breadcrumb';

type NavGroup = {
  label: string;
  items: { name: string; href: string; icon: any; adminOnly?: boolean; institutionOnly?: boolean }[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Pilotage',
    items: [
      { name: 'Cockpit DPI', href: '/admin/cockpit', icon: Gauge, adminOnly: true },
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Interoperabilite',
    items: [
      { name: 'Qualification', href: '/admin/qualification', icon: ClipboardCheck, adminOnly: true },
      { name: 'Roadmap MVP', href: '/admin/roadmap', icon: MapIcon, adminOnly: true },
      { name: 'Pipeline X-Road', href: '/admin/xroad-pipeline', icon: GitBranch, adminOnly: true },
      { name: 'Graphe flux', href: '/admin/graphe', icon: Network, adminOnly: true },
      { name: 'Matrice flux', href: '/matrice', icon: Grid3X3, adminOnly: true },
    ],
  },
  {
    label: 'Gouvernance',
    items: [
      { name: 'Conventions', href: '/admin/conventions', icon: FileCheck, adminOnly: true },
      { name: 'Registres', href: '/admin/registres-nationaux', icon: Database, adminOnly: true },
      { name: 'Couverture referentiels', href: '/registres/couverture', icon: Layers },
      { name: 'Catalogue DPI', href: '/catalogue', icon: BookOpen },
      { name: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { name: 'Institutions', href: '/institutions', icon: Building2, adminOnly: true },
      { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users, adminOnly: true },
      { name: 'Financements', href: '/admin/financements', icon: Wallet, adminOnly: true },
    ],
  },
  {
    label: 'Arbitrage DU',
    items: [
      { name: 'File d\'arbitrage', href: '/du/arbitrage', icon: Scale, adminOnly: true },
    ],
  },
  {
    label: 'Outils',
    items: [
      { name: 'Import Word', href: '/admin/import', icon: Upload, adminOnly: true },
      { name: 'Rapports', href: '/reports', icon: BarChart3, adminOnly: true },
      { name: 'Radar maturite', href: '/maturite', icon: Radar, adminOnly: true },
      { name: 'Audit & Sessions', href: '/admin/audit', icon: Shield, adminOnly: true },
      { name: 'Demandes', href: '/admin/demandes', icon: MessageSquare, adminOnly: true },
    ],
  },
  {
    label: 'Mon espace',
    items: [
      { name: 'Mes cas d\'usage', href: '/mes-cas-usage', icon: ListChecks },
      { name: 'Questionnaire', href: '/questionnaire', icon: FileText, institutionOnly: true },
      { name: 'Soumissions', href: '/submissions', icon: ClipboardList, institutionOnly: true },
      { name: 'Mes demandes', href: '/institution/demandes', icon: MessageSquare, institutionOnly: true },
    ],
  },
];

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

  const filteredGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.adminOnly && user?.role !== 'ADMIN') return false;
        if (item.institutionOnly && user?.role === 'ADMIN') return false;
        return true;
      }),
    }))
    .filter(group => group.items.length > 0);

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

        {/* Navigation with groups */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {filteredGroups.map((group, gi) => (
            <div key={group.label}>
              {!sidebarCollapsed && gi > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{group.label}</p>
                </div>
              )}
              {sidebarCollapsed && gi > 0 && <div className="border-t border-navy-light my-2 mx-2" />}
              {group.items.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-teal text-white'
                        : 'text-gray-300 hover:bg-navy-light hover:text-white',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        !sidebarCollapsed && 'mr-3',
                        isActive ? 'text-white' : 'text-gray-400'
                      )}
                    />
                    {!sidebarCollapsed && item.name}
                  </Link>
                );
              })}
            </div>
          ))}
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
