import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';

// Page d'acceptation des CGU pour les comptes BAILLEUR.
// Accessible uniquement à un user authentifié avec role=BAILLEUR et cguAccepted=false.
// Texte provisoire (validation DAJ à venir).
export function CguAcceptancePage() {
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, setAuth, logout } = useAuthStore();

  if (!user || user.role !== 'BAILLEUR') {
    return <div className="p-8 text-center text-gray-500">Page réservée aux Partenaires Techniques et Financiers.</div>;
  }

  const handleAccept = async () => {
    if (!accepted) return;
    setIsLoading(true);
    try {
      await api.post('/partenaire/cgu/accept');
      // Mettre à jour le store local — le token JWT est encore valide, on flag cguAccepted côté client
      if (token && user) {
        setAuth(token, { ...user, cguAccepted: true } as any);
      }
      toast({ title: 'CGU acceptées', description: 'Bienvenue sur votre espace partenaire PINS' });
      navigate('/partenaire');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible d\'enregistrer l\'acceptation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold text-white mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gold">Conditions Générales d'Utilisation</h1>
          <p className="text-gray-300 mt-2">Module Partenaires Techniques et Financiers — PINS</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Engagements du Partenaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none mb-6 max-h-80 overflow-y-auto border border-gray-200 rounded p-4 bg-gray-50">
              <p className="font-medium">
                En utilisant le module Partenaires Techniques et Financiers de la Plateforme Nationale
                d'Interopérabilité du Sénégal (PINS), je m'engage à :
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Utiliser les données accessibles dans le strict cadre de la coordination des appuis
                  techniques et financiers au Sénégal en matière d'interopérabilité.</li>
                <li>Ne pas extraire, copier, diffuser ou réutiliser les données hors de ce cadre sans
                  autorisation expresse du Ministère de la Communication, des Télécommunications et du
                  Numérique (MCTN).</li>
                <li>Respecter la confidentialité des informations accessibles, notamment celles
                  signalées comme à diffusion restreinte.</li>
                <li>Informer le MCTN de tout changement affectant l'identité ou les fonctions du point
                  focal désigné de mon institution.</li>
                <li>Respecter les principes de souveraineté des données publiques sénégalaises et les
                  lois nationales relatives à la protection des données personnelles.</li>
                <li>Signaler à la Delivery Unit MCTN toute anomalie ou tout usage abusif constaté sur
                  la plateforme.</li>
              </ul>
              <p className="text-xs italic text-gray-500 mt-4">
                Version provisoire (v0.1) — Texte définitif en cours de validation par la Direction
                des Affaires Juridiques.
              </p>
            </div>

            <label className="flex items-center space-x-2 text-sm font-medium text-navy">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                disabled={isLoading}
                className="rounded border-gray-300"
              />
              <span>J'ai lu et j'accepte les Conditions Générales d'Utilisation</span>
            </label>

            <div className="mt-6 flex justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { logout(); navigate('/login', { replace: true }); }}
                disabled={isLoading}
                className="text-gray-500"
              >
                Refuser et se déconnecter
              </Button>
              <Button
                type="button"
                onClick={handleAccept}
                disabled={!accepted || isLoading}
                className="bg-teal hover:bg-teal-dark"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
                ) : (
                  'Valider et accéder à mon espace'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
