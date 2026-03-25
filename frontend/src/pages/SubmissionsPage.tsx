import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submissionsApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { formatDateTime, getStatusBadgeColor, getStatusLabel } from '@/lib/utils';
import { Search, Eye, FileText, FileDown } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

export function SubmissionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isAdmin = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'VALIDATED' | 'ARCHIVED' | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', { status: statusFilter, page }],
    queryFn: () =>
      submissionsApi.getAll({
        status: statusFilter || undefined as any,
        page,
        limit: 10,
      }),
  });

  const submissions = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const filteredSubmissions = submissions.filter((s: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      s.institution?.nom?.toLowerCase().includes(searchLower) ||
      s.institution?.code?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Soumissions</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'Toutes les soumissions des institutions' : 'Vos questionnaires'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par institution..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as '' | 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'VALIDATED' | 'ARCHIVED');
                  setPage(1);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="DRAFT">Brouillon</option>
                <option value="SUBMITTED">Soumis</option>
                <option value="REVIEWED">En revue</option>
                <option value="VALIDATED">Validé</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Aucune soumission trouvée</p>
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
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Étape
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubmissions.map((submission: any) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {submission.institution?.nom}
                          </p>
                          <p className="text-sm text-gray-500">
                            {submission.institution?.code}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            submission.status
                          )}`}
                        >
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {submission.currentStep + 1}/8
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateTime(submission.submittedAt || submission.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/questionnaire/${submission.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Voir
                            </Button>
                          </Link>
                          {(submission.status === 'SUBMITTED' || submission.status === 'VALIDATED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/reports/institution/${submission.id}/word`, { responseType: 'blob' });
                                  const url = URL.createObjectURL(response.data);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `rapport-${submission.institution?.code || submission.id}.docx`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } catch {
                                  toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le rapport' });
                                }
                              }}
                            >
                              <FileDown className="w-4 h-4 mr-2" />
                              Word
                            </Button>
                          )}
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
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
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
