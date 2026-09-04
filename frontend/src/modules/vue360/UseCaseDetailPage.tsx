/**
 * Page detail d'un cas d'usage Vue 360°
 * Route : /admin/cas-usage/:id
 *
 * Affichage conditionnel selon visibility (METADATA / DETAILED / FULL)
 * Auto-ouverture modal via ?action=give-feedback&consultationId=XXX
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, pilotageApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ChevronRight, Star, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseCaseHeader } from './UseCaseHeader';
import { StakeholdersTable } from './StakeholdersTable';
import { FeedbacksFeed } from './FeedbacksFeed';
import { TransitionsTimeline } from './TransitionsTimeline';
import { RegistresTouchesTable } from './RegistresTouchesTable';
import { FeedbackModal } from './FeedbackModal';
import { RelationsBlock } from './RelationsBlock';
import { ManifestationsPtfBlock } from './ManifestationsPtfBlock';
import { ProjetsNationauxBlock } from './ProjetsNationauxBlock';
import { DataContractBlock } from './DataContractBlock';
import { LiaisonsGuichetBlock } from './LiaisonsGuichetBlock';
import { AvisFormelFeed } from './AvisFormelFeed';
import { NoteEditorModal } from './NoteEditorModal';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { FileText, Eye, Lock } from 'lucide-react';

const STATUT_IMPL_LABELS: Record<string, string> = {
  IDENTIFIE: 'Identifié',
  PRIORISE: 'Priorisé',
  EN_PREPARATION: 'En préparation',
  EN_DEVELOPPEMENT: 'En développement',
  EN_TEST: 'En test',
  EN_PRODUCTION: 'En production',
  SUSPENDU: 'Suspendu',
};

export function UseCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showNotePartageeModal, setShowNotePartageeModal] = useState(false);
  const [showNoteInterneModal, setShowNoteInterneModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vue360-use-case-detail', id],
    queryFn: () => api.get(`/use-cases/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const togglePiloteMut = useMutation({
    mutationFn: (pilote: boolean) => pilotageApi.updateCasUsage(id!, { pilote }),
    onSuccess: (_res, pilote) => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', id] });
      qc.invalidateQueries({ queryKey: ['pilotage'] });
      toast({ title: pilote ? 'Ajouté au portefeuille suivi' : 'Retiré du portefeuille suivi' });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de modifier le portefeuille' }),
  });

  // Auto-ouverture modal via query param
  useEffect(() => {
    if (!data) return;
    const action = searchParams.get('action');
    if (action === 'give-feedback') setShowFeedbackModal(true);
    else if (action === 'note-partagee') setShowNotePartageeModal(true);
    else if (action === 'note-interne') setShowNoteInterneModal(true);
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

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Breadcrumb + toggle portefeuille (ADMIN) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-teal hover:underline">Dashboard</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">Cas d'usage</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-navy">{cu.code}</span>
        </div>
        {isAdmin && (
          cu.pilote ? (
            <button
              type="button"
              onClick={() => togglePiloteMut.mutate(false)}
              disabled={togglePiloteMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gold text-gold hover:bg-gold hover:text-white disabled:opacity-50"
              title="Retirer ce cas du portefeuille suivi"
            >
              <StarOff className="w-3.5 h-3.5" /> Retirer du portefeuille suivi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => togglePiloteMut.mutate(true)}
              disabled={togglePiloteMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-teal text-teal hover:bg-teal hover:text-white disabled:opacity-50"
              title="Ajouter ce cas au portefeuille suivi (/pilotage)"
            >
              <Star className="w-3.5 h-3.5" /> Ajouter au portefeuille suivi
            </button>
          )
        )}
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
          {/* Bloc Pilotage — ADMIN only (personneAttendue nominative) */}
          {isAdmin && (cu.pilote || cu.identifiantPivot || cu.baseLegale || cu.serviceXroad || (cu.blocages && cu.blocages.length > 0)) && (
            <div className={cn('bg-white rounded-lg border shadow-sm p-4', cu.pilote && 'border-teal/40')}>
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-navy text-sm">Pilotage</div>
                {cu.pilote && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal/10 text-teal">DANS LE PORTEFEUILLE SUIVI</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Statut implémentation</p>
                  <p className="text-sm font-semibold text-navy mt-0.5">{STATUT_IMPL_LABELS[cu.statutImpl] || cu.statutImpl || <span className="italic text-gray-400 font-normal">non renseigné</span>}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Jours dans le statut</p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {cu.dateStatutImpl
                      ? (() => {
                          const j = Math.floor((Date.now() - new Date(cu.dateStatutImpl).getTime()) / 86400000);
                          return j === 0 ? "aujourd'hui" : `${j} jour${j > 1 ? 's' : ''}`;
                        })()
                      : <span className="italic text-gray-400">aucun changement enregistré</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Identifiant pivot</p>
                  <p className="text-sm text-gray-700 mt-0.5 break-words">{cu.identifiantPivot || <span className="italic text-gray-400">non renseigné</span>}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Service X-Road</p>
                  <p className="text-sm text-gray-700 mt-0.5 break-words font-mono">{cu.serviceXroad || <span className="italic text-gray-400 font-sans">non renseigné</span>}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Base légale</p>
                  <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{cu.baseLegale || <span className="italic text-gray-400">non renseignée</span>}</p>
                </div>
              </div>
              {cu.blocages && cu.blocages.length > 0 && (
                <div className="mt-3 rounded border border-red-200 bg-red-50/50 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700">Blocage · {cu.blocages[0].nature}</span>
                    <span className="text-sm text-gray-900 font-medium">{cu.blocages[0].libelle}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="text-gray-500">Personne attendue :</span> {cu.blocages[0].personneAttendue}
                    {cu.blocages[0].entiteAttendue && <span> · {cu.blocages[0].entiteAttendue}</span>}
                    {cu.blocages[0].echeance && <span> · Échéance : {new Date(cu.blocages[0].echeance).toLocaleDateString('fr-FR')}</span>}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-2 border-t">
                <Link to="/pilotage" className="text-xs text-teal hover:underline">Éditer ces champs sur /pilotage →</Link>
              </div>
            </div>
          )}

          {/* Note d'instruction — PARTAGÉE : visible en DETAILED+, éditable ADMIN */}
          <div className="bg-white rounded-lg border-t-4 border-teal border shadow-sm">
            <div className="px-4 py-2 border-b bg-teal/5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal">
              <Eye className="w-3.5 h-3.5" />
              Visible par les parties prenantes
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-teal flex-shrink-0" />
                  <div className="font-bold text-navy text-sm">Note d'instruction — partagée</div>
                  <span className="text-[11px] text-gray-500">
                    · {cu.dateNotePartagee ? `mise à jour le ${new Date(cu.dateNotePartagee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}` : 'jamais renseignée'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotePartageeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-teal text-teal hover:bg-teal hover:text-white flex-shrink-0"
                >
                  {cu.notePartagee ? 'Ouvrir en plein écran' : (isAdmin ? 'Rédiger la note' : 'Ouvrir')}
                </button>
              </div>
              {cu.notePartagee && (
                <div className="relative mt-3 max-h-40 overflow-hidden">
                  <MarkdownPreview source={cu.notePartagee} variant="preview" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Note d'instruction — INTERNE DU : ADMIN only, identité visuelle amber */}
          {isAdmin && (
            <div className="bg-amber-50/30 rounded-lg border-t-4 border-amber-500 border border-amber-200 shadow-sm">
              <div className="px-4 py-2 border-b border-amber-200 bg-amber-100/60 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                <Lock className="w-3.5 h-3.5" />
                Interne Delivery Unit
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <div className="font-bold text-navy text-sm">Note d'instruction — interne</div>
                    <span className="text-[11px] text-gray-500">
                      · {cu.dateNoteInterne ? `mise à jour le ${new Date(cu.dateNoteInterne).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}` : 'jamais renseignée'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoteInterneModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-amber-600 text-amber-800 hover:bg-amber-500 hover:text-white flex-shrink-0"
                  >
                    {cu.noteInterne ? 'Ouvrir en plein écran' : 'Rédiger la note'}
                  </button>
                </div>
                {cu.noteInterne && (
                  <div className="relative mt-3 max-h-40 overflow-hidden">
                    <MarkdownPreview source={cu.noteInterne} variant="preview" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-amber-50 to-transparent" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid : Stakeholders + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <StakeholdersTable
                casUsageId={cu.id}
                stakeholders={cu.stakeholders360 || []}
                onChanged={() => refetch()}
              />
            </div>
            <div>
              <TransitionsTimeline history={cu.statusHistory || []} />
            </div>
          </div>

          {/* Relations metier <-> technique (P9) */}
          <RelationsBlock cu={cu} />

          {/* Referentiels touches */}
          <RegistresTouchesTable registres={cu.registresAssocies || []} />

          {/* Manifestations PTF sur ce cas (admin only) */}
          {user?.role === 'ADMIN' && cu.id && (
            <ManifestationsPtfBlock casUsageId={cu.id} />
          )}

          {/* Projets New Deal Technologique associés */}
          {cu.id && <ProjetsNationauxBlock casUsageId={cu.id} />}

          {/* Service guichet correspondant (e-sénégal / TELEDAC) */}
          {cu.id && <LiaisonsGuichetBlock casUsageId={cu.id} />}

          {/* Fil d'avis formels */}
          <FeedbacksFeed
            stakeholders={cu.stakeholders360 || []}
            casUsage={{ id: cu.id, code: cu.code, titre: cu.titre, statutVueSection: cu.statutVueSection }}
            onGiveFeedback={myConsultationId ? openModal : undefined}
            onAmended={() => refetch()}
          />

          {/* Contrat de données (entrée / sortie / lecture) */}
          <DataContractBlock cu={cu} />

          {/* Avis formels simplifiés (append-only) */}
          <AvisFormelFeed
            casUsageId={cu.id}
            casUsageCode={cu.code}
            casUsageTitre={cu.titre}
            editable={['FULL', 'DETAILED'].includes(visibility)}
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

      {/* Modal note partagée */}
      {showNotePartageeModal && (
        <NoteEditorModal
          kind="partagee"
          casUsageId={cu.id}
          casUsageCode={cu.code}
          casUsageTitre={cu.titre}
          initialValue={cu.notePartagee || null}
          initialDate={cu.dateNotePartagee || null}
          editable={isAdmin}
          onClose={() => setShowNotePartageeModal(false)}
        />
      )}

      {/* Modal note interne (ADMIN only) */}
      {showNoteInterneModal && isAdmin && (
        <NoteEditorModal
          kind="interne"
          casUsageId={cu.id}
          casUsageCode={cu.code}
          casUsageTitre={cu.titre}
          initialValue={cu.noteInterne || null}
          initialDate={cu.dateNoteInterne || null}
          editable={true}
          onClose={() => setShowNoteInterneModal(false)}
        />
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
