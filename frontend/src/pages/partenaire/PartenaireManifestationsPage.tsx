import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Mail, Calendar } from 'lucide-react';

export function PartenaireManifestationsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Mes manifestations d'intérêt</h1>
          <p className="text-sm text-gray-500">Suivi des manifestations déposées</p>
        </div>
      </div>

      <Card className="border-amber/30 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Construction className="w-5 h-5" />
            Bientôt disponible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            Le dépôt formel de manifestations d'intérêt et leur suivi seront disponibles
            avec la livraison du module PTF complet, prévue pour <b>juin 2026</b>.
          </p>
          <p>
            En attendant, vous pouvez exprimer votre intérêt sur un cas d'usage spécifique
            depuis sa fiche détaillée, ou contacter directement la Delivery Unit :
          </p>
          <p className="bg-white border border-amber-200 rounded p-3 text-center">
            <Mail className="inline w-4 h-4 mr-1 text-teal-700" />
            <a href="mailto:du@mctn.gouv.sn" className="text-teal-700 hover:underline font-medium">
              du@mctn.gouv.sn
            </a>
          </p>
          <p className="text-xs italic text-gray-500">
            Vos demandes par email seront tracées dans le système et reportées dans cet espace
            à la mise en service du module.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
