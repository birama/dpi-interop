import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { Loader2, Users, ShieldCheck, Building2, EyeOff, Plus, Pencil, Trash2, KeyRound, X, UserPlus, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  INSTITUTION: 'bg-teal-50 text-teal-700',
};

type UserItem = {
  id: string;
  email: string;
  role: string;
  institutionId: string | null;
  institution: { id: string; code: string; nom: string } | null;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type BulkResult = {
  id?: string;
  email: string;
  password?: string;
  institutionCode: string;
  institution?: { code: string; nom: string };
  error?: string;
};

export function UtilisateursPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'INSTITUTION', institutionId: '', mustChangePassword: true });
  const [editForm, setEditForm] = useState({ email: '', role: '', institutionId: '', mustChangePassword: false });
  const [newPassword, setNewPassword] = useState('');
  const [bulkSelectedInstitutions, setBulkSelectedInstitutions] = useState('');
  const [bulkDefaultPassword, setBulkDefaultPassword] = useState('Atelier@2026');
  const [bulkEmailPattern, setBulkEmailPattern] = useState('{code}@interop.gouv.sn');

  // Queries
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, searchFilter],
    queryFn: () => api.get('/users', { params: { ...(roleFilter && { role: roleFilter }), ...(searchFilter && { search: searchFilter }) } }),
  });

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions-all-users'],
    queryFn: () => api.get('/institutions', { params: { limit: 500 } }),
  });

  // Mutations
  const createUserMut = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', role: 'INSTITUTION', institutionId: '', mustChangePassword: true });
      toast({ title: 'Utilisateur cree' });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || err.message }),
  });

  const updateUserMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      toast({ title: 'Utilisateur mis a jour' });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || err.message }),
  });

  const resetPasswordMut = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => api.post(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setResetPasswordUser(null);
      setNewPassword('');
      toast({ title: 'Mot de passe reinitialise' });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || err.message }),
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Utilisateur supprime' });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || err.message }),
  });

  const bulkCreateMut = useMutation({
    mutationFn: (data: any) => api.post('/users/bulk-create', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setBulkResults(res.data);
      toast({ title: 'Creation en lot terminee' });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || err.message }),
  });

  const users: UserItem[] = usersData?.data || [];
  const institutions = (institutionsData?.data?.data || institutionsData?.data || []) as any[];
  const institutionOptions = institutions.map((i: any) => ({ value: i.id, label: i.nom, sublabel: `${i.code} — ${i.ministere}` }));
  const institutionCodeOptions = institutions.map((i: any) => ({ value: i.code, label: i.nom, sublabel: `${i.code} — ${i.ministere}` }));

  // Stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const institutionCount = users.filter(u => u.role === 'INSTITUTION').length;
  const neverConnected = users.filter(u => !u.lastLoginAt).length;

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({ email: user.email, role: user.role, institutionId: user.institutionId || '', mustChangePassword: user.mustChangePassword });
  };

  const handleBulkCreate = () => {
    const codes = bulkSelectedInstitutions.split(',').map(c => c.trim()).filter(Boolean);
    if (codes.length === 0) return;
    const usersList = codes.map(code => ({
      email: bulkEmailPattern.replace('{code}', code.toLowerCase()),
      password: bulkDefaultPassword,
      institutionCode: code,
    }));
    bulkCreateMut.mutate({ users: usersList });
  };

  const handleExportCSV = () => {
    if (!bulkResults) return;
    const headers = ['Email', 'Mot de passe', 'Institution', 'Statut'];
    const rows = bulkResults.map(r => [
      r.email,
      r.password || '',
      r.institutionCode || r.institution?.code || '',
      r.error || 'OK',
    ]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptes-atelier-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">Gestion des utilisateurs</h1>
          <p className="text-xs text-gray-500 mt-0.5">Comptes, roles et acces a la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowBulkModal(true); setBulkResults(null); }} className="border-teal text-teal hover:bg-teal-50">
            <UserPlus className="w-3.5 h-3.5 mr-1" /> Creer comptes atelier
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-teal hover:bg-teal-dark">
            <Plus className="w-3.5 h-3.5 mr-1" /> Nouveau
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Total utilisateurs</p><p className="text-lg font-bold text-navy">{totalUsers}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Admins</p><p className="text-lg font-bold text-red-500">{adminCount}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Institutions</p><p className="text-lg font-bold text-teal">{institutionCount}</p></CardContent></Card>
        <Card className="border-l-4 border-l-gold"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Jamais connectes</p><p className="text-lg font-bold text-gold">{neverConnected}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Tous les roles</option>
          <option value="ADMIN">Admin</option>
          <option value="INSTITUTION">Institution</option>
        </select>
        <Input
          placeholder="Rechercher email, institution..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Institution</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Cree le</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Derniere connexion</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.email}</span>
                      {user.mustChangePassword && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Doit changer MDP</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600')}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {user.institution ? `${user.institution.code} - ${user.institution.nom}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-2">
                    {user.lastLoginAt ? (
                      <span className="text-xs text-gray-500">{new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Jamais connecte</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(user)} className="p-1 hover:bg-gray-100 rounded" title="Modifier">
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => { setResetPasswordUser(user); setNewPassword(''); }} className="p-1 hover:bg-gray-100 rounded" title="Reinitialiser mot de passe">
                        <KeyRound className="w-3.5 h-3.5 text-gold" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Supprimer ${user.email} ?`)) deleteUserMut.mutate(user.id); }}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun utilisateur trouve</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============ CREATE MODAL ============ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-navy">Nouvel utilisateur</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Mot de passe</Label>
                <Input value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Mot de passe" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                >
                  <option value="INSTITUTION">Institution</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {createForm.role === 'INSTITUTION' && (
                <div>
                  <Label className="text-xs">Institution</Label>
                  <SearchableSelect
                    options={institutionOptions}
                    value={createForm.institutionId}
                    onChange={val => setCreateForm(f => ({ ...f, institutionId: val }))}
                    placeholder="Selectionner une institution..."
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createForm.mustChangePassword}
                  onChange={e => setCreateForm(f => ({ ...f, mustChangePassword: e.target.checked }))}
                  id="mustChange"
                  className="rounded border-gray-300"
                />
                <label htmlFor="mustChange" className="text-xs text-gray-600">Doit changer le mot de passe a la premiere connexion</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <Button size="sm" variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
              <Button
                size="sm"
                className="bg-teal hover:bg-teal-dark"
                onClick={() => createUserMut.mutate(createForm)}
                disabled={!createForm.email || !createForm.password || createUserMut.isPending}
              >
                {createUserMut.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Creer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ EDIT MODAL ============ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-navy">Modifier l'utilisateur</h3>
              <button onClick={() => setEditingUser(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                >
                  <option value="INSTITUTION">Institution</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {editForm.role === 'INSTITUTION' && (
                <div>
                  <Label className="text-xs">Institution</Label>
                  <SearchableSelect
                    options={institutionOptions}
                    value={editForm.institutionId}
                    onChange={val => setEditForm(f => ({ ...f, institutionId: val }))}
                    placeholder="Selectionner une institution..."
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.mustChangePassword}
                  onChange={e => setEditForm(f => ({ ...f, mustChangePassword: e.target.checked }))}
                  id="editMustChange"
                  className="rounded border-gray-300"
                />
                <label htmlFor="editMustChange" className="text-xs text-gray-600">Doit changer le mot de passe</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>Annuler</Button>
              <Button
                size="sm"
                className="bg-teal hover:bg-teal-dark"
                onClick={() => updateUserMut.mutate({ id: editingUser.id, data: editForm })}
                disabled={updateUserMut.isPending}
              >
                {updateUserMut.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ RESET PASSWORD MODAL ============ */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-navy">Reinitialiser le mot de passe</h3>
              <button onClick={() => setResetPasswordUser(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500">Utilisateur : <strong>{resetPasswordUser.email}</strong></p>
              <div>
                <Label className="text-xs">Nouveau mot de passe</Label>
                <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="h-8 text-sm" />
              </div>
              <p className="text-[10px] text-gray-400">L'utilisateur devra changer ce mot de passe a la prochaine connexion.</p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <Button size="sm" variant="outline" onClick={() => setResetPasswordUser(null)}>Annuler</Button>
              <Button
                size="sm"
                className="bg-gold hover:bg-gold/90 text-white"
                onClick={() => resetPasswordMut.mutate({ id: resetPasswordUser.id, newPassword })}
                disabled={!newPassword || resetPasswordMut.isPending}
              >
                {resetPasswordMut.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Reinitialiser
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ BULK CREATE MODAL ============ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-navy">Creation de comptes en lot (atelier)</h3>
              <button onClick={() => { setShowBulkModal(false); setBulkResults(null); }}><X className="w-4 h-4" /></button>
            </div>

            {!bulkResults ? (
              <>
                <div className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs">Institutions a inclure</Label>
                    <MultiSearchableSelect
                      options={institutionCodeOptions}
                      value={bulkSelectedInstitutions}
                      onChange={setBulkSelectedInstitutions}
                      placeholder="Rechercher et selectionner des institutions..."
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{bulkSelectedInstitutions ? bulkSelectedInstitutions.split(',').filter(Boolean).length : 0} institution(s) selectionnee(s)</p>
                  </div>
                  <div>
                    <Label className="text-xs">Pattern email</Label>
                    <Input value={bulkEmailPattern} onChange={e => setBulkEmailPattern(e.target.value)} className="h-8 text-sm" />
                    <p className="text-[10px] text-gray-400 mt-0.5">{'{code}'} sera remplace par le code institution en minuscules</p>
                  </div>
                  <div>
                    <Label className="text-xs">Mot de passe par defaut</Label>
                    <Input value={bulkDefaultPassword} onChange={e => setBulkDefaultPassword(e.target.value)} className="h-8 text-sm" />
                  </div>

                  {bulkSelectedInstitutions && (
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Apercu :</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {bulkSelectedInstitutions.split(',').filter(Boolean).slice(0, 5).map(code => (
                          <p key={code} className="text-xs text-gray-500">
                            {bulkEmailPattern.replace('{code}', code.trim().toLowerCase())} / {code.trim()}
                          </p>
                        ))}
                        {bulkSelectedInstitutions.split(',').filter(Boolean).length > 5 && (
                          <p className="text-xs text-gray-400">... et {bulkSelectedInstitutions.split(',').filter(Boolean).length - 5} autre(s)</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t">
                  <Button size="sm" variant="outline" onClick={() => setShowBulkModal(false)}>Annuler</Button>
                  <Button
                    size="sm"
                    className="bg-teal hover:bg-teal-dark"
                    onClick={handleBulkCreate}
                    disabled={!bulkSelectedInstitutions || bulkCreateMut.isPending}
                  >
                    {bulkCreateMut.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Creer les comptes
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-navy">
                      Resultats : {bulkResults.filter(r => !r.error).length} succes, {bulkResults.filter(r => r.error).length} erreur(s)
                    </p>
                  </div>
                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left px-3 py-2">Email</th>
                          <th className="text-left px-3 py-2">Mot de passe</th>
                          <th className="text-left px-3 py-2">Institution</th>
                          <th className="text-left px-3 py-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResults.map((r, i) => (
                          <tr key={i} className={cn('border-b', r.error && 'bg-red-50')}>
                            <td className="px-3 py-1.5">{r.email}</td>
                            <td className="px-3 py-1.5 font-mono">{r.password || '-'}</td>
                            <td className="px-3 py-1.5">{r.institutionCode || r.institution?.code || '-'}</td>
                            <td className="px-3 py-1.5">
                              {r.error ? (
                                <span className="flex items-center gap-1 text-red-600"><AlertCircle className="w-3 h-3" />{r.error}</span>
                              ) : (
                                <span className="text-teal font-medium">OK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t">
                  <Button size="sm" variant="outline" onClick={() => { setShowBulkModal(false); setBulkResults(null); }}>Fermer</Button>
                  <Button size="sm" className="bg-navy hover:bg-navy/90" onClick={handleExportCSV}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Exporter CSV
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
