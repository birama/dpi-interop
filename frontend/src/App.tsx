import { Routes, Route, Navigate } from 'react-router-dom';
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
import { NotFoundPage } from '@/pages/NotFoundPage';

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if ((user as any)?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
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
          <Route
            path="/institutions"
            element={
              <ProtectedRoute adminOnly>
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
          <Route
            path="/admin/institution/:id"
            element={
              <ProtectedRoute adminOnly>
                <InstitutionProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/conventions"
            element={
              <ProtectedRoute adminOnly>
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
          <Route path="/admin/ptf" element={<Navigate to="/admin/financements" replace />} />
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
          <Route
            path="/admin/registres-nationaux"
            element={
              <ProtectedRoute adminOnly>
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
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
