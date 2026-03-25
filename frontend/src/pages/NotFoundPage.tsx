import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-teal-100 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-teal-100 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold text-teal">404</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page non trouvée
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          Vérifiez l'URL ou retournez à l'accueil.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Page précédente
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-gray-500">
          Si vous pensez qu'il s'agit d'une erreur, contactez{' '}
          <a href="mailto:support@senum.sn" className="text-teal hover:underline">
            support@senum.sn
          </a>
        </p>
      </div>
    </div>
  );
}

export default NotFoundPage;
