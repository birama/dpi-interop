import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { AVIS_FORMEL_SENS_STYLES } from './constants';
import { AvisFormelModal } from './AvisFormelModal';

const AVATAR_COLORS: Record<string, string> = {
  DGID: 'bg-navy', DGD: 'bg-teal', ANSD: 'bg-gold', DGCPT: 'bg-emerald-600',
  CDP: 'bg-amber', MFB: 'bg-teal', MJ: 'bg-red-600', DGPSN: 'bg-blue-600',
};

interface Props {
  casUsageId: string;
  casUsageCode: string;
  casUsageTitre: string;
  editable: boolean;
}

export function AvisFormelFeed({ casUsageId, casUsageCode, casUsageTitre, editable }: Props) {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const { data: avisList = [], isLoading } = useQuery<any[]>({
    queryKey: ['avis-formel', casUsageId],
    queryFn: () => api.get(`/use-cases/${casUsageId}/avis-formel`).then(r => r.data),
    enabled: !!casUsageId,
  });

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-navy">Avis formels simplifiés</div>
            <div className="text-xs text-gray-500">
              Avis institutionnels horodatés et inaltérables
            </div>
          </div>
          {editable && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-navy text-white hover:bg-navy/90"
            >
              Déposer un avis formel
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading && (
            <div className="p-6 text-center text-xs text-gray-400">Chargement...</div>
          )}
          {!isLoading && avisList.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-400">
              Aucun avis formel déposé dans le cadre du présent dispositif.
            </div>
          )}

          {avisList.map((avis: any) => {
            const style = AVIS_FORMEL_SENS_STYLES[avis.sens] || { bg: 'bg-gray-100', icon: '•', label: avis.sens };
            const avatarColor = AVATAR_COLORS[avis.institution?.code] || 'bg-gray-500';
            return (
              <div key={avis.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0', avatarColor)}>
                    {avis.institution?.code?.substring(0, 3) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{avis.auteurInstitutionNom}</span>
                      <span className="text-xs text-gray-500">· {avis.auteurNom}</span>
                      <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ml-auto', style.bg)}>
                        {style.icon} {style.label}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(avis.dateDepot).toLocaleDateString('fr-FR')} · {new Date(avis.dateDepot).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{avis.commentaire}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <AvisFormelModal
          casUsageId={casUsageId}
          casUsageCode={casUsageCode}
          casUsageTitre={casUsageTitre}
          isAdmin={user?.role === 'ADMIN'}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { setShowModal(false); }}
        />
      )}
    </>
  );
}
