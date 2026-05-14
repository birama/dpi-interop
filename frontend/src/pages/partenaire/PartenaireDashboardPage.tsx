import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Construction } from 'lucide-react';

// Dashboard partenaire — stub Phase 1.
// Le contenu réel (portefeuille filtré, manifestations) sera développé en Phase 5.
export function PartenaireDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-teal" />
        <div>
          <h1 className="text-2xl font-bold text-navy">Espace Partenaire</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <Card className="border-amber/30 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Construction className="w-5 h-5" />
            Module en cours de développement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            Votre compte Partenaire Technique et Financier est créé et fonctionnel.
            Les CGU ont été acceptées.
          </p>
          <p>
            Les fonctionnalités complètes de votre espace (portefeuille national filtré,
            manifestations d'intérêt, propositions de cas) seront disponibles
            à partir de juin 2026.
          </p>
          <p className="text-xs italic text-gray-500">
            Contact : Delivery Unit MCTN — du@mctn.gouv.sn
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
