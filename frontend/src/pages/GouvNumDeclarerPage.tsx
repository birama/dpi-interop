import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';
import { RecensementPage } from '@/pages/RecensementPage';
import { Spinner } from '@/components/ui/spinner';

type PrefillData = {
  ministereTutelle?: string;
  structureNom?: string;
  typeStructure?: string;
  contactNom?: string;
  contactFonction?: string;
  contactEmail?: string;
  contactTelephone?: string;
};

export function GouvNumDeclarerPage() {
  const { user } = useAuthStore();
  const institutionId = user?.institutionId;

  const { data: institution, isLoading } = useQuery({
    queryKey: ['institution', institutionId],
    queryFn: async () => {
      if (!institutionId) return null;
      const { data } = await api.get(`/institutions/${institutionId}`);
      return data as {
        id: string; code: string; nom: string; ministere: string;
        responsableNom: string; responsableFonction: string;
        responsableEmail: string; responsableTel: string;
      };
    },
    enabled: !!institutionId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const prefill: PrefillData = institution ? {
    ministereTutelle: institution.ministere || undefined,
    structureNom: institution.nom || undefined,
    typeStructure: undefined, // on ne peut pas le déduire du profil
    contactNom: institution.responsableNom || undefined,
    contactFonction: institution.responsableFonction || undefined,
    contactEmail: user?.email || institution.responsableEmail || undefined,
    contactTelephone: institution.responsableTel || undefined,
  } : {};

  return <RecensementPage prefill={prefill} isAuthenticated={true} />;
}
