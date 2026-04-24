/**
 * Configuration centralisee du menu de navigation (refonte P8+P9+Nav)
 *
 * Structure en 5 rubriques, filtrage par role, compteurs contextuels.
 *
 * Objectif : reduire la charge cognitive d'un Point Focal d'institution
 * (de ~27 entrees visibles auparavant a 14 rubriques + items une fois
 * toutes les rubriques deployees).
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ListChecks, FileText, MessageSquare,
  FolderOpen, Users as UsersIcon, Cog, Database,
  Building2, BookOpen, FileCheck, Layers,
  Gauge, Map as MapIcon, Scale, UserCheck, Network,
  Grid3X3, Wallet, Radar, Shield, BarChart3, Upload,
  Users as UsersGroup,
} from 'lucide-react';

// Re-export types pour MenuConfig utilise dans DashboardLayout
export interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Nom du compteur contextuel a afficher (badge a droite), si fourni */
  counter?: 'mesCasUsage' | 'adoptionRequestsEnAttente' | 'desaccords';
  /** Rubrique reservee a certains roles — redondant avec section.roles mais
   *  permet des exceptions fines */
  roles?: Array<'INSTITUTION' | 'ADMIN'>;
}

export interface MenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Roles autorises a voir cette rubrique */
  roles: Array<'INSTITUTION' | 'ADMIN'>;
  items: MenuItem[];
}

/** Lien mis en tete, hors rubriques */
export const MENU_TOP: MenuItem = {
  name: 'Tableau de bord',
  href: '/dashboard',
  icon: LayoutDashboard,
};

export const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'mon-espace',
    label: 'Mon espace',
    icon: UserCheck,
    roles: ['INSTITUTION', 'ADMIN'],
    items: [
      { name: 'Mes cas d\'usage', href: '/mes-cas-usage', icon: ListChecks, counter: 'mesCasUsage' },
      { name: 'Mes demandes', href: '/institution/demandes', icon: MessageSquare, roles: ['INSTITUTION'] },
      { name: 'Questionnaire', href: '/questionnaire', icon: FileText, roles: ['INSTITUTION'] },
    ],
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    icon: FolderOpen,
    roles: ['INSTITUTION', 'ADMIN'],
    items: [
      { name: 'Propositions', href: '/catalogue/propositions', icon: FolderOpen },
      { name: 'Cas d\'usage actifs', href: '/admin/cas-usage', icon: ListChecks },
      { name: 'Parcours metier', href: '/catalogue/parcours-metier', icon: UsersIcon },
      { name: 'Services techniques', href: '/catalogue/services-techniques', icon: Cog },
      { name: 'Couverture referentiels', href: '/registres/couverture', icon: Database },
    ],
  },
  {
    id: 'ecosysteme',
    label: 'Ecosysteme',
    icon: Network,
    roles: ['INSTITUTION', 'ADMIN'],
    items: [
      { name: 'Institutions', href: '/admin/institutions', icon: Building2 },
      { name: 'Registres nationaux', href: '/admin/registres-nationaux', icon: Database },
      { name: 'Conventions', href: '/admin/conventions', icon: FileCheck },
      { name: 'Documents de reference', href: '/documents', icon: BookOpen },
      { name: 'Catalogue DPI', href: '/admin/catalogue', icon: Layers },
    ],
  },
  {
    id: 'pilotage',
    label: 'Pilotage',
    icon: Gauge,
    roles: ['ADMIN'],
    items: [
      { name: 'Cockpit DPI', href: '/admin/cockpit', icon: Gauge },
      { name: 'Roadmap MVP', href: '/admin/roadmap', icon: MapIcon },
      { name: 'Arbitrage DU', href: '/du/arbitrage', icon: Scale, counter: 'desaccords' },
      { name: 'File d\'adoptions', href: '/du/adoptions', icon: FolderOpen, counter: 'adoptionRequestsEnAttente' },
      { name: 'Pipeline X-Road', href: '/admin/xroad-pipeline', icon: Network },
      { name: 'Graphe des flux', href: '/admin/graphe', icon: Grid3X3 },
      { name: 'Matrice des flux', href: '/admin/matrice', icon: Grid3X3 },
      { name: 'Financements', href: '/admin/financements', icon: Wallet },
      { name: 'Radar de maturite', href: '/admin/radar', icon: Radar },
      { name: 'Audit & Sessions', href: '/admin/audit', icon: Shield },
      { name: 'Rapports', href: '/admin/reports', icon: BarChart3 },
      { name: 'Import Word', href: '/admin/import', icon: Upload },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Shield,
    roles: ['ADMIN'],
    items: [
      { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: UsersGroup },
    ],
  },
];

/**
 * Filtre les sections visibles selon le role user.
 * Puis filtre les items dans chaque section (roles specifiques).
 */
export function visibleSections(role: 'ADMIN' | 'INSTITUTION' | undefined): MenuSection[] {
  if (!role) return [];
  return MENU_SECTIONS
    .filter(s => s.roles.includes(role))
    .map(s => ({
      ...s,
      items: s.items.filter(i => !i.roles || i.roles.includes(role)),
    }))
    .filter(s => s.items.length > 0);
}

/**
 * Trouve la section contenant un path donne (pour l'ouvrir automatiquement).
 */
export function findSectionForPath(path: string): string | null {
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      if (path === item.href || path.startsWith(item.href + '/')) {
        return section.id;
      }
    }
  }
  return null;
}
