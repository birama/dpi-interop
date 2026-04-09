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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Cockpit DPI', href: '/admin/cockpit', icon: Gauge, adminOnly: true },
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Questionnaire', href: '/questionnaire', icon: FileText },
  { name: 'Soumissions', href: '/submissions', icon: ClipboardList },
  { name: 'Catalogue DPI', href: '/catalogue', icon: BookOpen },
  { name: 'Mes demandes', href: '/institution/demandes', icon: MessageSquare, institutionOnly: true },
  { name: 'Institutions', href: '/institutions', icon: Building2, adminOnly: true },
  { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users, adminOnly: true },
  { name: 'Import Word', href: '/admin/import', icon: Upload, adminOnly: true },
  { name: 'Roadmap MVP', href: '/admin/roadmap', icon: MapIcon, adminOnly: true },
  { name: 'Financements', href: '/admin/financements', icon: Wallet, adminOnly: true },
  { name: 'Graphe flux', href: '/admin/graphe', icon: Network, adminOnly: true },
  { name: 'Matrice flux', href: '/matrice', icon: Grid3X3, adminOnly: true },
  { name: 'Qualification', href: '/admin/qualification', icon: ClipboardCheck, adminOnly: true },
  { name: 'Registres', href: '/admin/registres-nationaux', icon: Database, adminOnly: true },
  { name: 'Radar maturité', href: '/maturite', icon: Radar, adminOnly: true },
  { name: 'Conventions', href: '/admin/conventions', icon: FileCheck, adminOnly: true },
  { name: 'Pipeline X-Road', href: '/admin/xroad-pipeline', icon: GitBranch, adminOnly: true },
  { name: 'Rapports', href: '/reports', icon: BarChart3, adminOnly: true },
  { name: 'Demandes', href: '/admin/demandes', icon: MessageSquare, adminOnly: true },
  { name: 'Audit', href: '/admin/audit', icon: Shield, adminOnly: true },
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

  const filteredNavigation = navigation.filter(
    (item: any) => {
      if (item.adminOnly && user?.role !== 'ADMIN') return false;
      if (item.institutionOnly && user?.role === 'ADMIN') return false;
      return true;
    }
  );

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <div className="min-h-screen bg-gray-50">
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
              <span className="text-white font-bold text-sm">e</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-gold text-sm whitespace-nowrap">PINS</span>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">Interopérabilité</span>
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
            title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
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

      {/* Main content - décalé à droite selon la largeur du sidebar */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Top bar - sticky */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

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
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-gray-200 text-center text-sm text-gray-500">
          SENUM / MCTN — Plateforme Nationale d'Interopérabilité PINS — Sénégal
        </footer>
      </div>
    </div>
  );
}
