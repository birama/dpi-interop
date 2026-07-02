import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Layouts
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { QuestionnairePage } from '@/pages/QuestionnairePage';
import { SubmissionsPage } from '@/pages/SubmissionsPage';
import { InstitutionsPage } from '@/pages/InstitutionsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { MatricePage } from '@/pages/MatricePage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { AboutPage } from '@/pages/AboutPage';
import { MaturitePage } from '@/pages/MaturitePage';
import { CataloguePage } from '@/pages/CataloguePage';
import { InstitutionProfilePage } from '@/pages/InstitutionProfilePage';
import { ConventionsPage } from '@/pages/ConventionsPage';
import { XRoadPipelinePage } from '@/pages/XRoadPipelinePage';
import { CockpitPage } from '@/pages/CockpitPage';
import { GraphePage } from '@/pages/GraphePage';
import { RegistresNationauxPage } from '@/pages/RegistresNationauxPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { FinancementsPage } from '@/pages/FinancementsPage';
import { QualificationPage } from '@/pages/QualificationPage';
import { UtilisateursPage } from '@/pages/UtilisateursPage';
import { ImportPage } from '@/pages/ImportPage';
import { AuditPage } from '@/pages/AuditPage';
import { DemandesPage } from '@/pages/DemandesPage';
import { UseCaseDetailPage } from '@/modules/vue360/UseCaseDetailPage';
import { MesCasUsagePage } from '@/modules/vue360/MesCasUsagePage';
import { DuArbitragePage } from '@/modules/vue360/du/DuArbitragePage';
import { RegistresCouverturePage } from '@/modules/vue360/registres/RegistresCouverturePage';
import { CataloguePropositionsPage } from '@/modules/vue360/catalogue/CataloguePropositionsPage';
import { PropositionDetailPage } from '@/modules/vue360/catalogue/PropositionDetailPage';
import { ParcoursMetierPage, ServicesTechniquesPage } from '@/modules/vue360/catalogue/TypologieListPage';
import { CorrespondanceEsenegalPage } from '@/pages/CorrespondanceEsenegalPage';
import { ServicesGuichetPage } from '@/pages/ServicesGuichetPage';
import { InstitutionsCataloguePage } from '@/pages/InstitutionsCataloguePage';
import { AdoptionRequestsPage } from '@/modules/vue360/du/AdoptionRequestsPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CguAcceptancePage } from '@/pages/partenaire/CguAcceptancePage';
import { PartenaireDashboardPage } from '@/pages/partenaire/PartenaireDashboardPage';
import { PartenaireCataloguePage } from '@/pages/partenaire/PartenaireCataloguePage';
import { PartenaireCasDetailPage } from '@/pages/partenaire/PartenaireCasDetailPage';
import { PartenaireManifestationsPage } from '@/pages/partenaire/PartenaireManifestationsPage';
import { PartenaireProfilPage } from '@/pages/partenaire/PartenaireProfilPage';
import { CreatePartenaireUserPage } from '@/pages/partenaire/CreatePartenaireUserPage';
import { AdminManifestationsPage } from '@/pages/AdminManifestationsPage';
import { AdminPtfListPage } from '@/modules/admin/AdminPtfListPage';
import { AdminPtfDetailPage } from '@/modules/admin/AdminPtfDetailPage';
import { AdminPtfDomainesPage } from '@/modules/admin/AdminPtfDomainesPage';
import { AdminPtfDashboardPage } from '@/modules/admin/AdminPtfDashboardPage';
import { PartenaireTechniqueDashboardPage } from '@/pages/partenaire-tech/PartenaireTechniqueDashboardPage';
import { PartenaireTechniqueCataloguePage } from '@/pages/partenaire-tech/PartenaireTechniqueCataloguePage';
import { PartenaireTechniqueCasDetailPage } from '@/pages/partenaire-tech/PartenaireTechniqueCasDetailPage';
import { PartenaireTechniqueProfilPage } from '@/pages/partenaire-tech/PartenaireTechniqueProfilPage';
import { PartenaireTechniqueMesCasPage } from '@/pages/partenaire-tech/PartenaireTechniqueMesCasPage';
import { PartenaireTechniqueAccompagnementDetailPage } from '@/pages/partenaire-tech/PartenaireTechniqueAccompagnementDetailPage';
import { OrganisationsPage } from '@/pages/OrganisationsPage';
import { useLocation } from 'react-router-dom';

// Protected Route wrapper
type AllowedRole = 'ADMIN' | 'INSTITUTION' | 'BAILLEUR' | 'PARTENAIRE_TECHNIQUE';
function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: AllowedRole[];
}) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if ((user as any)?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // PTF Phase 1 — Acceptation CGU obligatoire pour les BAILLEUR
  if (user?.role === 'BAILLEUR' && !(user as any)?.cguAccepted) {
    return <Navigate to="/partenaire/cgu" replace />;
  }

  // PTF MVP — Cloisonnement BAILLEUR : ne peut accéder qu'à /partenaire/*
  // Toute autre route protégée renvoie sur le dashboard partenaire.
  if (user?.role === 'BAILLEUR' && !location.pathname.startsWith('/partenaire')) {
    return <Navigate to="/partenaire/dashboard" replace />;
  }

  // Inversement : un non-BAILLEUR ne peut accéder à /partenaire/* (sauf admin pour création de comptes)
  if (
    user?.role !== 'BAILLEUR' &&
    location.pathname.startsWith('/partenaire') &&
    !location.pathname.startsWith('/partenaire/cgu') // CGU est public
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // P13-CONC — Cloisonnement PARTENAIRE_TECHNIQUE : routes catalogue, écosystème, espace dédié
  const ptAllowed = ['/partenaire-tech', '/catalogue', '/registres', '/institutions', '/admin/registres-nationaux', '/admin/conventions', '/documents'];
  if (user?.role === 'PARTENAIRE_TECHNIQUE' && !ptAllowed.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/partenaire-tech/dashboard" replace />;
  }

  // Inversement : un non-PARTENAIRE_TECHNIQUE ne peut accéder à /partenaire-tech/*
  if (user?.role !== 'PARTENAIRE_TECHNIQUE' && location.pathname.startsWith('/partenaire-tech')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as AllowedRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect wrapper conservant le :id dans l'URL lors du rename
// /catalogue-propositions/:id -> /catalogue/propositions/:id
function CataloguePropositionsRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/catalogue/propositions/${id}`} replace />;
}

// /admin/institution/:id (legacy) -> /institutions/:id
function InstitutionProfileRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/institutions/${id}`} replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/about" element={<AboutPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Change password (no layout) */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* PTF Phase 1 — Acceptation CGU (hors ProtectedRoute pour éviter boucle de redirect) */}
        <Route path="/partenaire/cgu" element={<CguAcceptancePage />} />

        {/* Protected routes */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questionnaire"
            element={
              <ProtectedRoute>
                <QuestionnairePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questionnaire/:id"
            element={
              <ProtectedRoute>
                <QuestionnairePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions"
            element={
              <ProtectedRoute>
                <SubmissionsPage />
              </ProtectedRoute>
            }
          />
          {/* /institutions : consultable par toutes les institutions PINS connectees */}
          <Route
            path="/institutions"
            element={
              <ProtectedRoute>
                <InstitutionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/utilisateurs"
            element={
              <ProtectedRoute adminOnly>
                <UtilisateursPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/import"
            element={
              <ProtectedRoute adminOnly>
                <ImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matrice"
            element={
              <ProtectedRoute adminOnly>
                <MatricePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maturite"
            element={
              <ProtectedRoute adminOnly>
                <MaturitePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue"
            element={
              <ProtectedRoute>
                <CataloguePage />
              </ProtectedRoute>
            }
          />
          {/* Route canonique consultable par toutes les institutions PINS connectees.
              Le backend /api/institutions/:id est deja en authenticate (pas adminOnly). */}
          <Route
            path="/institutions/:id"
            element={
              <ProtectedRoute>
                <InstitutionProfilePage />
              </ProtectedRoute>
            }
          />
          {/* Retro-compat ancien chemin : redirige en preservant l'id */}
          <Route path="/admin/institution/:id" element={<InstitutionProfileRedirect />} />
          {/* /admin/conventions : consultation autorisee aux institutions
              (la page filtre les actions ecriture par role en interne) */}
          <Route
            path="/admin/conventions"
            element={
              <ProtectedRoute>
                <ConventionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/xroad-pipeline"
            element={
              <ProtectedRoute adminOnly>
                <XRoadPipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cockpit"
            element={
              <ProtectedRoute adminOnly>
                <CockpitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roadmap"
            element={
              <ProtectedRoute adminOnly>
                <RoadmapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/financements"
            element={
              <ProtectedRoute adminOnly>
                <FinancementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ptf"
            element={
              <ProtectedRoute adminOnly>
                <AdminPtfListPage />
              </ProtectedRoute>
            }
          />
          {/* Routes hors arborescence /admin/ptf/* pour éviter de doubler le surlignage sidebar avec "Annuaire PTF" */}
          <Route
            path="/admin/ptf-domaines"
            element={
              <ProtectedRoute adminOnly>
                <AdminPtfDomainesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ptf-dashboard"
            element={
              <ProtectedRoute adminOnly>
                <AdminPtfDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ptf/:id"
            element={
              <ProtectedRoute adminOnly>
                <AdminPtfDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qualification"
            element={
              <ProtectedRoute adminOnly>
                <QualificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/graphe"
            element={
              <ProtectedRoute adminOnly>
                <GraphePage />
              </ProtectedRoute>
            }
          />
          {/* /admin/registres-nationaux : consultation des 10 referentiels par toute institution */}
          <Route
            path="/admin/registres-nationaux"
            element={
              <ProtectedRoute>
                <RegistresNationauxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute adminOnly>
                <AuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/demandes"
            element={
              <ProtectedRoute adminOnly>
                <DemandesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/demandes"
            element={
              <ProtectedRoute>
                <DemandesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cas-usage/:id"
            element={
              <ProtectedRoute>
                <UseCaseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mes-cas-usage"
            element={
              <ProtectedRoute>
                <MesCasUsagePage />
              </ProtectedRoute>
            }
          />
          {/* Catalogue (refonte navigation) : routes canoniques */}
          <Route
            path="/catalogue/propositions"
            element={
              <ProtectedRoute>
                <CataloguePropositionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue/propositions/:id"
            element={
              <ProtectedRoute>
                <PropositionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue/parcours-metier"
            element={
              <ProtectedRoute>
                <ParcoursMetierPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue/services-techniques"
            element={
              <ProtectedRoute>
                <ServicesTechniquesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue/correspondance-esenegal"
            element={
              <ProtectedRoute>
                <CorrespondanceEsenegalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue/services-guichet"
            element={
              <ProtectedRoute>
                <ServicesGuichetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue/institutions"
            element={
              <ProtectedRoute>
                <InstitutionsCataloguePage />
              </ProtectedRoute>
            }
          />
          {/* Redirects historique — anciennes routes avec tiret preservees */}
          <Route path="/catalogue-propositions" element={<Navigate to="/catalogue/propositions" replace />} />
          <Route path="/catalogue-propositions/:id" element={<CataloguePropositionsRedirect />} />
          {/* File d'adoptions DU */}
          <Route
            path="/du/adoptions"
            element={
              <ProtectedRoute adminOnly>
                <AdoptionRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/du/arbitrage"
            element={
              <ProtectedRoute adminOnly>
                <DuArbitragePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registres/couverture"
            element={
              <ProtectedRoute>
                <RegistresCouverturePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute adminOnly>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

          {/* PTF MVP — Espace partenaire BAILLEUR */}
          <Route
            path="/partenaire"
            element={<Navigate to="/partenaire/dashboard" replace />}
          />
          <Route
            path="/partenaire/dashboard"
            element={
              <ProtectedRoute allowedRoles={['BAILLEUR']}>
                <PartenaireDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire/catalogue"
            element={
              <ProtectedRoute allowedRoles={['BAILLEUR']}>
                <PartenaireCataloguePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire/cas/:id"
            element={
              <ProtectedRoute allowedRoles={['BAILLEUR']}>
                <PartenaireCasDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire/manifestations"
            element={
              <ProtectedRoute allowedRoles={['BAILLEUR']}>
                <PartenaireManifestationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire/profil"
            element={
              <ProtectedRoute allowedRoles={['BAILLEUR']}>
                <PartenaireProfilPage />
              </ProtectedRoute>
            }
          />
          {/* PTF Phase 1 — Création compte bailleur (ADMIN only) */}
          <Route
            path="/admin/utilisateurs/bailleur/creer"
            element={
              <ProtectedRoute adminOnly>
                <CreatePartenaireUserPage />
              </ProtectedRoute>
            }
          />
          {/* P13-CONC — Partenaire Technique (AMO) */}
          <Route
            path="/partenaire-tech"
            element={<Navigate to="/partenaire-tech/dashboard" replace />}
          />
          <Route
            path="/partenaire-tech/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PARTENAIRE_TECHNIQUE']}>
                <PartenaireTechniqueDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire-tech/catalogue"
            element={
              <ProtectedRoute allowedRoles={['PARTENAIRE_TECHNIQUE']}>
                <PartenaireTechniqueCataloguePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire-tech/cas/:id"
            element={
              <ProtectedRoute allowedRoles={['PARTENAIRE_TECHNIQUE']}>
                <PartenaireTechniqueCasDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire-tech/profil"
            element={
              <ProtectedRoute allowedRoles={['PARTENAIRE_TECHNIQUE']}>
                <PartenaireTechniqueProfilPage />
              </ProtectedRoute>
            }
          />
          {/* P14-CONC — Accompagnement AMO */}
          <Route
            path="/partenaire-tech/mes-cas"
            element={
              <ProtectedRoute allowedRoles={['PARTENAIRE_TECHNIQUE']}>
                <PartenaireTechniqueMesCasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partenaire-tech/mes-cas/:accompagnementId"
            element={
              <ProtectedRoute allowedRoles={['PARTENAIRE_TECHNIQUE']}>
                <PartenaireTechniqueAccompagnementDetailPage />
              </ProtectedRoute>
            }
          />
          {/* P13-CONC — Annuaire AMO (admin only) */}
          <Route
            path="/admin/organisations"
            element={
              <ProtectedRoute adminOnly>
                <OrganisationsPage />
              </ProtectedRoute>
            }
          />
          {/* PTF MVP — Manifestations PTF (lecture seule v1) */}
          <Route
            path="/admin/manifestations"
            element={
              <ProtectedRoute adminOnly>
                <AdminManifestationsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Landing page publique — AboutPage sert d'accueil avant authentification */}
        <Route path="/" element={<AboutPage />} />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
