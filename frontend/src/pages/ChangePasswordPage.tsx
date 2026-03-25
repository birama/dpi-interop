import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/services/api';
import { Loader2, ShieldCheck } from 'lucide-react';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setAuth, token } = useAuthStore();

  const validate = (): boolean => {
    const errs: string[] = [];
    if (newPassword.length < 8) errs.push('Le mot de passe doit contenir au moins 8 caractères');
    if (!/[A-Z]/.test(newPassword)) errs.push('Le mot de passe doit contenir une majuscule');
    if (!/[0-9]/.test(newPassword)) errs.push('Le mot de passe doit contenir un chiffre');
    if (!/[^a-zA-Z0-9]/.test(newPassword)) errs.push('Le mot de passe doit contenir un caractère spécial');
    if (newPassword !== confirmPassword) errs.push('Les mots de passe ne correspondent pas');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      // Update auth state to remove mustChangePassword
      if (token && user) {
        setAuth(token, { ...user, mustChangePassword: false } as any);
      }
      toast({ title: 'Mot de passe modifié', description: 'Vous pouvez maintenant accéder à l\'application' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de modifier le mot de passe',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold text-white mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gold">Changement de mot de passe</h1>
          <p className="text-gray-300 mt-2">
            Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre première connexion.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Confirmer le nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {errors.length > 0 && (
                <div className="text-sm text-red-500 space-y-1">
                  {errors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>Le mot de passe doit contenir :</p>
                <ul className="list-disc list-inside">
                  <li>Au moins 8 caractères</li>
                  <li>Une lettre majuscule</li>
                  <li>Un chiffre</li>
                  <li>Un caractère spécial (@, #, $, etc.)</li>
                </ul>
              </div>

              <Button type="submit" className="w-full bg-teal hover:bg-teal-dark" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Modification...</>
                ) : (
                  'Modifier le mot de passe'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
