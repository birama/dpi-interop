import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { institutionsApi, notificationsApi } from '@/services/api';
import { Search, Building2, Plus, FileText, Eye, Mail, RefreshCw, Send } from 'lucide-react';

export function InstitutionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const inviteMutation = useMutation({
    mutationFn: (institutionId: string) => notificationsApi.invite(institutionId),
    onSuccess: (res) => {
      toast({ title: 'Invitation envoyée', description: `Email envoyé à ${res.data.email}` });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.response?.data?.error || 'Impossible d\'envoyer l\'invitation', variant: 'destructive' });
    },
  });

  const relanceMutation = useMutation({
    mutationFn: (institutionId: string) => notificationsApi.relance(institutionId),
    onSuccess: (res) => {
      toast({ title: 'Relance envoyée', description: `Email envoyé à ${res.data.email}` });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.response?.data?.error || 'Impossible d\'envoyer la relance', variant: 'destructive' });
    },
  });

  const inviteAllMutation = useMutation({
    mutationFn: () => notificationsApi.inviteAll(),
    onSuccess: (res) => {
      toast({ title: 'Invitations envoyées', description: `${res.data.sent}/${res.data.total} emails envoyés` });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.response?.data?.error || 'Impossible d\'envoyer les invitations', variant: 'destructive' });
    },
  });

  const handleInviteAll = () => {
    if (window.confirm('Envoyer une invitation à toutes les institutions qui n\'ont pas encore soumis de questionnaire ?')) {
      inviteAllMutation.mutate();
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['institutions', { search, page }],
    queryFn: () =>
      institutionsApi.getAll({
        search: search || undefined,
        page,
        limit: 10,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['institutions-stats'],
    queryFn: () => institutionsApi.getStats(),
  });

  const institutions = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const statsData = stats?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Institutions</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin
              ? 'Gestion des administrations sectorielles'
              : 'Annuaire des administrations PINS'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              className="border-teal text-teal hover:bg-teal hover:text-white"
              onClick={handleInviteAll}
              disabled={inviteAllMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {inviteAllMutation.isPending ? 'Envoi en cours...' : 'Inviter toutes les institutions'}
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle institution
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total institutions</p>
                  <p className="text-2xl font-bold">{statsData.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Ministères</p>
                  <p className="text-2xl font-bold">{Object.keys(statsData.byMinistere || {}).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, code ou ministère..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Aucune institution trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Institution
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Ministère
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Responsable
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                      Soumissions
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                      Utilisateurs
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {institutions.map((institution: any) => (
                    <tr key={institution.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{institution.nom}</p>
                          <p className="text-sm text-gray-500">{institution.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {institution.ministere}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {institution.responsableNom}
                          </p>
                          <p className="text-sm text-gray-500">
                            {institution.responsableEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {institution._count?.submissions || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {institution._count?.users || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Envoyer une invitation"
                                onClick={() => inviteMutation.mutate(institution.id)}
                                disabled={inviteMutation.isPending && inviteMutation.variables === institution.id}
                              >
                                <Mail className="w-4 h-4 text-teal" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Envoyer une relance"
                                onClick={() => relanceMutation.mutate(institution.id)}
                                disabled={relanceMutation.isPending && relanceMutation.variables === institution.id}
                              >
                                <RefreshCw className={`w-4 h-4 text-gold ${relanceMutation.isPending && relanceMutation.variables === institution.id ? 'animate-spin' : ''}`} />
                              </Button>
                            </>
                          )}
                          <Link to={`/institutions/${institution.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Profil
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
