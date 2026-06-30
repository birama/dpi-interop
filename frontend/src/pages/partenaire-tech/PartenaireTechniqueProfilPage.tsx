import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, Building2 } from 'lucide-react';

export function PartenaireTechniqueProfilPage() {
  const { user } = useAuthStore();

  const { data: org, isLoading } = useQuery({
    queryKey: ['partenaire-tech-profil'],
    queryFn: () => api.get('/partenaire-tech/profil').then(r => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Mon profil</h1>
          <p className="text-sm text-gray-500">Informations de l'organisation partenaire technique</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-base">Organisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Code</span>
            <span className="font-mono text-navy font-bold">{org?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nom</span>
            <span>{org?.nom}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <Badge variant="outline">{org?.type?.replace(/_/g, ' ')}</Badge>
          </div>
          {org?.secteurAccompagnement && (
            <div className="flex justify-between">
              <span className="text-gray-500">Secteur</span>
              <span>{org.secteurAccompagnement}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Statut</span>
            <Badge className={org?.statut === 'ACTIF' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}>
              {org?.statut}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Compte</span>
            <span className="text-gray-500">{user?.email}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
