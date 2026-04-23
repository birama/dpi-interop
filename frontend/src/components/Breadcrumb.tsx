import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/admin/cockpit': 'Cockpit DPI',
  '/admin/roadmap': 'Roadmap MVP',
  '/admin/qualification': 'Qualification',
  '/admin/financements': 'Financements',
  '/admin/graphe': 'Graphe flux',
  '/matrice': 'Matrice flux',
  '/admin/conventions': 'Conventions',
  '/admin/xroad-pipeline': 'Pipeline X-Road',
  '/admin/registres-nationaux': 'Registres nationaux',
  '/catalogue': 'Catalogue DPI',
  '/admin/institutions': 'Institutions',
  '/institutions': 'Institutions',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/import': 'Import Word',
  '/admin/audit': 'Audit & Sessions',
  '/admin/demandes': 'Demandes',
  '/admin/documents': 'Documents',
  '/documents': 'Documents',
  '/questionnaire': 'Questionnaire',
  '/submissions': 'Soumissions',
  '/reports': 'Rapports',
  '/maturite': 'Radar maturité',
  '/institution/demandes': 'Mes demandes',
  '/du/arbitrage': 'File d\'arbitrage DU',
  '/registres/couverture': 'Couverture referentiels',
  '/mes-cas-usage': 'Mes cas d\'usage',
};

export function Breadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  // Skip breadcrumb on dashboard
  if (path === '/dashboard' || path === '/') return null;

  // Build breadcrumb items
  const items: { label: string; href?: string }[] = [{ label: 'Accueil', href: '/dashboard' }];

  // Check for exact match first
  const exactLabel = ROUTE_LABELS[path];
  if (exactLabel) {
    items.push({ label: exactLabel });
  } else {
    // Handle dynamic routes like /admin/cas-usage/:id or /admin/institution/:id
    const segments = path.split('/').filter(Boolean);
    let built = '';
    for (const seg of segments) {
      built += `/${seg}`;
      const label = ROUTE_LABELS[built];
      if (label) {
        items.push({ label, href: built });
      }
    }
    // If we have a dynamic last segment (UUID), label it
    if (path.startsWith('/admin/cas-usage/')) {
      items.push({ label: 'Roadmap MVP', href: '/admin/roadmap' });
      items.push({ label: 'Fiche 360°' });
    } else if (path.startsWith('/admin/institution/')) {
      items.push({ label: 'Institutions', href: '/institutions' });
      items.push({ label: 'Profil institution' });
    } else if (items.length === 1) {
      // Fallback: just show the last segment
      items.push({ label: segments[segments.length - 1] || '' });
    }
  }

  if (items.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="w-3 h-3" />}
          {idx === 0 && <Home className="w-3 h-3" />}
          {item.href && idx < items.length - 1 ? (
            <Link to={item.href} className="hover:text-teal transition-colors">{item.label}</Link>
          ) : (
            <span className={idx === items.length - 1 ? 'text-navy font-medium' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
