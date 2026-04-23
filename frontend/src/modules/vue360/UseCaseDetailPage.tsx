/**
 * Page detail d'un cas d'usage Vue 360°
 * Route : /admin/cas-usage/:id
 *
 * Affichage conditionnel selon visibility (METADATA / DETAILED / FULL)
 * Auto-ouverture modal via ?action=give-feedback&consultationId=XXX
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, ChevronRight } from 'lucide-react';
import { UseCaseHeader } from './UseCaseHeader';
import { StakeholdersTable } from './StakeholdersTable';
import { FeedbacksFeed } from './FeedbacksFeed';
import { TransitionsTimeline } from './TransitionsTimeline';
import { RegistresTouchesTable } from './RegistresTouchesTable';
import { FeedbackModal } from './FeedbackModal';

export function UseCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vue360-use-case-detail', id],
    queryFn: () => api.get(`/use-cases/${id}`).then(r => r.data),
    enabled: !!id,
  });

  // Auto-ouverture modal via query param
  useEffect(() => {
    if (data && searchParams.get('action') === 'give-feedback') {
      setShowFeedbackModal(true);
      // Ne pas retirer le param pour permettre le refresh
    }
  }, [data, searchParams]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Cas d'usage non trouve</div>;

  const cu = data;
  const visibility: string = cu._visibility || 'METADATA';

  // Trouver la consultation en attente de mon institution
  let myConsultationId: string | undefined = searchParams.get('consultationId') || undefined;
  let myStakeholderRole = 'PARTIE_PRENANTE';
  if (!myConsultationId && user?.institutionId) {
    for (const sh of (cu.stakeholders360 || [])) {
      if (sh.institutionId === user.institutionId && sh.actif && sh.role !== 'INITIATEUR') {
        const pending = sh.consultations?.find((c: any) => c.status === 'EN_ATTENTE');
        if (pending) {
          myConsultationId = pending.id;
          myStakeholderRole = sh.role;
          break;
        }
      }
    }
  }
  // Si on a un consultationId dans l'URL, retrouver le role
  if (myConsultationId && user?.institutionId) {
    for (const sh of (cu.stakeholders360 || [])) {
      if (sh.institutionId === user.institutionId) {
        myStakeholderRole = sh.role;
        break;
      }
    }
  }

  const openModal = () => setShowFeedbackModal(true);
  const closeModal = () => {
    setShowFeedbackModal(false);
    // Retirer le query param action
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('action');
    newParams.delete('consultationId');
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/dashboard" className="text-teal hover:underline">Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-600">Cas d'usage</span>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="font-semibold text-navy">{cu.code}</span>
      </div>

      {/* Header */}
      <UseCaseHeader
        cu={cu}
        visibility={visibility}
        myConsultationId={myConsultationId}
        onGiveFeedback={myConsultationId ? openModal : undefined}
      />

      {/* Contenu conditionnel selon visibilite */}
      {visibility !== 'METADATA' && (
        <>
          {/* Grid : Stakeholders + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <StakeholdersTable stakeholders={cu.stakeholders360 || []} />
            </div>
            <div>
              <TransitionsTimeline history={cu.statusHistory || []} />
            </div>
          </div>

          {/* Referentiels touches */}
          <RegistresTouchesTable registres={cu.registresAssocies || []} />

          {/* Fil d'avis formels */}
          <FeedbacksFeed
            stakeholders={cu.stakeholders360 || []}
            onGiveFeedback={myConsultationId ? openModal : undefined}
          />

          {/* Specs techniques (accordion) */}
          {(cu.donneesEchangees || cu.description) && (
            <details className="bg-white rounded-lg border shadow-sm">
              <summary className="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                <ChevronRight className="w-4 h-4 text-teal transition-transform" />
                <div className="font-bold text-navy">Specifications techniques</div>
                <span className="text-xs text-gray-500">· Visibles uniquement aux parties prenantes</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-700 space-y-2">
                {cu.donneesEchangees && <div><b className="text-navy">Donnees echangees :</b> {cu.donneesEchangees}</div>}
                {cu.description && <div><b className="text-navy">Description :</b> {cu.description}</div>}
                {cu.registresConcernes && <div><b className="text-navy">Registres concernes :</b> {cu.registresConcernes}</div>}
                {cu.prerequis && <div><b className="text-navy">Prerequis :</b> {cu.prerequis}</div>}
                {cu.observations && <div><b className="text-navy">Observations :</b> {cu.observations}</div>}
                {cu.notes && <div><b className="text-navy">Notes :</b> {cu.notes}</div>}
              </div>
            </details>
          )}

          {/* Conventions (si disponibles) */}
          {cu.conventions?.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="font-bold text-navy mb-2">Conventions liees</div>
              {cu.conventions.map((conv: any) => (
                <div key={conv.id} className="flex items-center justify-between py-2 border-b last:border-0 text-xs">
                  <span className="text-navy font-medium">{conv.institutionA?.code} ↔ {conv.institutionB?.code}</span>
                  <span className="text-gray-500">{conv.objet}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100">{conv.statut}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal feedback */}
      {showFeedbackModal && myConsultationId && (
        <FeedbackModal
          consultationId={myConsultationId}
          casUsageCode={cu.code}
          casUsageTitre={cu.titre}
          casUsageStatut={cu.statutVueSection}
          stakeholderRole={myStakeholderRole}
          onClose={closeModal}
          onSubmitted={() => { closeModal(); refetch(); }}
        />
      )}
    </div>
  );
}
