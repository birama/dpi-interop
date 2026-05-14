import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { Briefcase, UserPlus, Copy } from 'lucide-react';

// Page admin de création de compte BAILLEUR rattaché à un PTF.
// PTF Phase 1 — RBAC.
export function CreatePartenaireUserPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', ptfId: '', nomComplet: '', fonction: '' });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const { data: ptfData, isLoading: loadingPtfs } = useQuery({
    queryKey: ['ptf-list'],
    queryFn: () => api.get('/ptf').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/users/bailleur', form),
    onSuccess: (res: any) => {
      setTempPassword(res.data.temporaryPassword);
      setCreatedEmail(res.data.user.email);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Compte créé', description: 'Transmettre le mot de passe via canal sécurisé' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.response?.data?.error || 'Impossible de créer le compte',
      });
    },
  });

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast({ title: 'Copié', description: 'Mot de passe copié dans le presse-papiers' });
    }
  };

  const resetForm = () => {
    setForm({ email: '', ptfId: '', nomComplet: '', fonction: '' });
    setTempPassword(null);
    setCreatedEmail(null);
  };

  const ptfs = ptfData || [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-teal" />
        <div>
          <h1 className="text-2xl font-bold text-navy">Créer un compte Partenaire Technique et Financier</h1>
          <p className="text-sm text-gray-500">Création d'un accès rôle BAILLEUR rattaché à un PTF</p>
        </div>
      </div>

      {!tempPassword ? (
        <Card>
          <CardHeader><CardTitle className="text-navy text-lg">Informations du compte</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>PTF de rattachement *</Label>
              <select
                value={form.ptfId}
                onChange={e => setForm({ ...form, ptfId: e.target.value })}
                disabled={loadingPtfs}
                className="w-full h-10 border rounded-md px-3 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {ptfs.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.acronyme} — {p.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Email du point focal *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="prenom.nom@ptf.org"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom complet</Label>
                <Input
                  value={form.nomComplet}
                  onChange={e => setForm({ ...form, nomComplet: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <Label>Fonction</Label>
                <Input
                  value={form.fonction}
                  onChange={e => setForm({ ...form, fonction: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
              Le compte sera créé avec un mot de passe temporaire. Le point focal devra le changer
              à sa première connexion et accepter les CGU PTF.
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.email || !form.ptfId || createMutation.isPending}
              className="bg-teal hover:bg-teal-dark"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Création...' : 'Créer le compte'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success/30 bg-success/5">
          <CardHeader>
            <CardTitle className="text-success text-lg flex items-center gap-2">
              Compte créé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-mono font-medium">{createdEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Mot de passe temporaire</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-lg bg-white border rounded px-3 py-1.5 font-mono">{tempPassword}</code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" /> Copier
                </Button>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-900">
              ⚠️ Transmettre ce mot de passe au point focal via un canal sécurisé
              (SMS, Signal, échange oral). Ne PAS l'envoyer par email.
              Cette information ne sera plus affichée après cette page.
            </div>
            <Button onClick={resetForm} variant="outline">Créer un autre compte</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
