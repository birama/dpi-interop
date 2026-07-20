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
  Grid3X3, Wallet, Radar, Shield, BarChart3, Upload, Inbox, Briefcase, Tags,
  Users as UsersGroup,
  Globe,
  ClipboardList,
  QrCode as QrCodeIcon,
} from 'lucide-react';

// Rôles autorisés pour la section GouvNum.
// À tenir en sync avec RECENSEMENT_ADMIN_ROLES dans backend/src/modules/recensement/service.ts
// À tenir en sync avec RECENSEMENT_ADMIN_ROLES (backend/recensement/service.ts)
const GOUVNUM_ROLES: Array<'INSTITUTION' | 'ADMIN' | 'PARTENAIRE_TECHNIQUE'> = ['ADMIN', 'INSTITUTION'];

// Re-export types pour MenuConfig utilise dans DashboardLayout
export interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Nom du compteur contextuel a afficher (badge a droite), si fourni */
  counter?: 'mesCasUsage' | 'adoptionRequestsEnAttente' | 'desaccords' | 'manifestationsEnValidation';
  /** Rubrique reservee a certains roles — redondant avec section.roles mais
   *  permet des exceptions fines */
  roles?: Array<'INSTITUTION' | 'ADMIN' | 'PARTENAIRE_TECHNIQUE'>;
}

export interface MenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Roles autorises a voir cette rubrique */
  roles: Array<'INSTITUTION' | 'ADMIN' | 'PARTENAIRE_TECHNIQUE'>;
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
      { name: 'Mes soumissions', href: '/submissions', icon: FileCheck, roles: ['INSTITUTION'] },
    ],
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    icon: FolderOpen,
    roles: ['INSTITUTION', 'ADMIN', 'PARTENAIRE_TECHNIQUE'],
    items: [
      { name: 'Propositions', href: '/catalogue/propositions', icon: FolderOpen },
      // "Cas d'usage actifs" = page Kanban /admin/qualification, reservee a la DU.
      // Les Point Focal d'institution voient leurs cas d'usage via "Mon espace > Mes cas d'usage"
      // et naviguent les CU actifs via les vues typologiques ci-dessous.
      { name: 'Cas d\'usage actifs', href: '/admin/qualification', icon: ListChecks, roles: ['ADMIN'] },
      { name: 'Parcours metier', href: '/catalogue/parcours-metier', icon: UsersIcon },
      { name: 'Services techniques', href: '/catalogue/services-techniques', icon: Cog },
      { name: 'Couverture referentiels', href: '/registres/couverture', icon: Database },
      { name: 'Guichet ↔ PINS', href: '/catalogue/guichet', icon: Globe },
      { name: 'Institutions', href: '/catalogue/institutions', icon: Building2 },
    ],
  },
  {
    id: 'ecosysteme',
    label: 'Ecosysteme',
    icon: Network,
    roles: ['INSTITUTION', 'ADMIN', 'PARTENAIRE_TECHNIQUE'],
    items: [
      { name: 'Institutions', href: '/institutions', icon: Building2 },
      { name: 'Registres nationaux', href: '/admin/registres-nationaux', icon: Database },
      { name: 'Conventions', href: '/admin/conventions', icon: FileCheck },
      { name: 'Documents de reference', href: '/documents', icon: BookOpen },
      { name: 'Catalogue DPI', href: '/catalogue', icon: Layers },
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
      { name: 'Matrice des flux', href: '/matrice', icon: Grid3X3 },
      { name: 'Radar de maturite', href: '/maturite', icon: Radar },
      { name: 'Soumissions', href: '/submissions', icon: FileCheck },
      { name: 'Audit & Sessions', href: '/admin/audit', icon: Shield },
      { name: 'Rapports', href: '/reports', icon: BarChart3 },
      { name: 'Import Word', href: '/admin/import', icon: Upload },
    ],
  },
  {
    // GouvNum — Gouvernance numerique (recensement, comite architecture, portefeuille projets).
    // RBAC aligne sur RECENSEMENT_ADMIN_ROLES (backend/recensement/service.ts).
    // Ajouter un role dans GOUVNUM_ROLES suffit pour elargir l'acces.
    id: 'gouvnum',
    label: 'GouvNum',
    icon: ClipboardList,
    roles: GOUVNUM_ROLES,
    items: [
      { name: 'Déclarer un projet', href: '/gouvnum/declarer', icon: FileText },
      { name: 'Nos projets déclarés', href: '/admin/recensement', icon: ClipboardList },
      { name: 'QR code du formulaire', href: '/admin/gouvnum/qr-code', icon: QrCodeIcon, roles: ['ADMIN'] },
    ],
  },
  {
    // Rubrique parente PTF — atelier 19/05/2026 puis Phase 5+6 (juin 2026).
    // Du plus structurant (annuaire) au plus prospectif (tableau de bord agrégé).
    id: 'partenaires-ptf',
    label: 'Partenaires PTF',
    icon: Briefcase,
    roles: ['ADMIN'],
    items: [
      { name: 'Annuaire PTF', href: '/admin/ptf', icon: Building2 },
      { name: 'Annuaire AMO', href: '/admin/organisations', icon: UsersGroup },
      { name: 'Manifestations', href: '/admin/manifestations', icon: Inbox, counter: 'manifestationsEnValidation' },
      { name: 'Financements', href: '/admin/financements', icon: Wallet },
      { name: 'Domaines d\'interet', href: '/admin/ptf-domaines', icon: Tags },
      { name: 'Tableau de bord PTF', href: '/admin/ptf-dashboard', icon: BarChart3 },
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
  {
    // P13-CONC — Espace Partenaire Technique (AMO)
    id: 'espace-amo',
    label: 'Mon espace',
    icon: UserCheck,
    roles: ['PARTENAIRE_TECHNIQUE'],
    items: [
      { name: 'Tableau de bord', href: '/partenaire-tech/dashboard', icon: LayoutDashboard },
      { name: 'Mes cas accompagnés', href: '/partenaire-tech/mes-cas', icon: ListChecks },
      { name: 'Mon profil', href: '/partenaire-tech/profil', icon: UserCheck },
    ],
  },
];

/**
 * Filtre les sections visibles selon le role user.
 * Puis filtre les items dans chaque section (roles specifiques).
 */
export function visibleSections(role: 'ADMIN' | 'INSTITUTION' | 'PARTENAIRE_TECHNIQUE' | undefined): MenuSection[] {
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
 * Prend en compte le role pour eviter de retourner une rubrique ou l'item
 * est filtre (ex: /submissions pour ADMIN ne doit pas retourner "mon-espace"
 * car "Mes soumissions" y est masque pour ADMIN).
 */
export function findSectionForPath(path: string, role?: 'ADMIN' | 'INSTITUTION' | 'PARTENAIRE_TECHNIQUE'): string | null {
  for (const section of MENU_SECTIONS) {
    if (role && !section.roles.includes(role)) continue;
    for (const item of section.items) {
      if (role && item.roles && !item.roles.includes(role)) continue;
      if (path === item.href || path.startsWith(item.href + '/')) {
        return section.id;
      }
    }
  }
  return null;
}
