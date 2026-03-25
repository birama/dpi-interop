import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal text-white mb-4">
            <span className="text-3xl font-bold">e</span>
          </div>
          <h1 className="text-2xl font-bold text-gold">e-jokkoo</h1>
          <p className="text-gray-300 mt-1">Plateforme Nationale d'Interopérabilité</p>
          <p className="text-gray-400 text-sm mt-2">Questionnaire de collecte des besoins</p>
        </div>

        <Outlet />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Ministère de la Communication, des Télécommunications et du Numérique</p>
          <p className="mt-1 text-gray-500">SENUM — République du Sénégal</p>
        </div>
      </div>
    </div>
  );
}
