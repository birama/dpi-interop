import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ChevronRight, Info, Building2, Database, BookOpen, CheckCircle2, MessageSquare, XCircle, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdoptionModal } from './AdoptionModal';
import {
  TYPOLOGIE_BADGE, MATURITE_BADGE, SOURCE_LABELS,
  ROLE_PRESSENTI_LABELS, ROLE_PRESSENTI_BADGE,
} from './constants';

type AdminAction = 'qualifier-rapide' | 'demander-complement' | 'rejeter' | 'prioriser-rapide';

const ADMIN_ACTIONS: Record<AdminAction, { label: string; description: string; needsInstitution: boolean; needsMotif: boolean; warning?: string; endpoint: (id: string) => string; method: 'POST' | 'PATCH'; payloadKey: 'motif' | 'commentaire'; successLabel: string }> = {
  'qualifier-rapide': {
    label: 'Qualifier',
    description: 'Adopter cette proposition et la faire passer en QUALIFIE (transitions automatiques).',
    needsInstitution: true,
    needsMotif: true,
    endpoint: id => `/catalogue/propositions/${id}/qualifier-rapide`,
    method: 'POST',
    payloadKey: 'motif',
    successLabel: 'Proposition qualifiée',
  },
  'demander-complement': {
    label: 'Demander complément',
    description: 'Notifier les institutions pressenties d\'une demande de complément d\'information.',
    needsInstitution: false,
    needsMotif: true,
    endpoint: id => `/catalogue/propositions/${id}/demander-complement`,
    method: 'PATCH',
    payloadKey: 'commentaire',
    successLabel: 'Complément demandé',
  },
  'rejeter': {
    label: 'Rejeter',
    description: 'Archiver cette proposition (sortie définitive du catalogue, notification aux pressenties).',
    needsInstitution: false,
    needsMotif: true,
    endpoint: id => `/catalogue/propositions/${id}/archive`,
    method: 'POST',
    payloadKey: 'motif',
    successLabel: 'Proposition rejetée',
  },
  'prioriser-rapide': {
    label: 'Prioriser',
    description: 'Adopter + transition jusqu\'à PRIORISE en une seule opération.',
    needsInstitution: true,
    needsMotif: true,
    warning: 'Action exceptionnelle réservée aux cas de démonstration ou aux raccourcis DU. Une proposition doit normalement passer par les étapes DECLARE → EN_CONSULTATION → QUALIFIE avant PRIORISE.',
    endpoint: id => `/catalogue/propositions/${id}/prioriser-rapide`,
    method: 'POST',
    payloadKey: 'motif',
    successLabel: 'Proposition priorisée',
  },
};

export function PropositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAdoption, setShowAdoption] = useState(false);
  const [adminAction, setAdminAction] = useState<AdminAction | null>(null);
  const [actionMotif, setActionMotif] = useState('');
  const [actionInstitutionId, setActionInstitutionId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['catalogue-detail', id],
    queryFn: () => api.get(`/catalogue/propositions/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!adminAction || !id) throw new Error('action invalide');
      const config = ADMIN_ACTIONS[adminAction];
      const payload: any = { [config.payloadKey]: actionMotif };
      if (config.needsInstitution) payload.institutionChefId = actionInstitutionId;
      return config.method === 'POST'
        ? api.post(config.endpoint(id), payload)
        : api.patch(config.endpoint(id), payload);
    },
    onSuccess: () => {
      const config = ADMIN_ACTIONS[adminAction!];
      toast({ title: config.successLabel });
      queryClient.invalidateQueries({ queryKey: ['catalogue-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['catalogue-propositions'] });
      setAdminAction(null);
      setActionMotif('');
      setActionInstitutionId('');
      if (adminAction === 'rejeter' || adminAction === 'qualifier-rapide' || adminAction === 'prioriser-rapide') {
        setTimeout(() => navigate('/catalogue/propositions'), 800);
      }
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || 'Action impossible' });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Proposition non trouvee</div>;

  const p = data;
  const typoBadge = TYPOLOGIE_BADGE[p.typologie] || TYPOLOGIE_BADGE.TECHNIQUE;
  const matBadge = p.niveauMaturite ? MATURITE_BADGE[p.niveauMaturite] : null;
  const sourceLabel = p.sourceProposition ? SOURCE_LABELS[p.sourceProposition] : null;
  const isPressentie = p.institutionsPressenties?.some((ip: any) => ip.institutionId === user?.institutionId);
  const isAdmin = user?.role === 'ADMIN';
  const isAdoptable = p.statutVueSection === 'PROPOSE';

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/catalogue/propositions" className="text-teal hover:underline">Catalogue des propositions</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="font-semibold text-navy">{p.code}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {p.code}
          </span>
          <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', typoBadge.bg)}>
            {typoBadge.label}
          </span>
          {matBadge && (
            <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', matBadge.bg)}>
              {matBadge.label}
            </span>
          )}
          {p.statutVueSection !== 'PROPOSE' && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
              {p.statutVueSection}
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">{p.titre}</h1>
        <div className="mt-3">
          {p.resumeMetier ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.resumeMetier}</p>
          ) : (
            <p className="text-xs italic text-gray-400">Aucun resume metier renseigne pour cette proposition.</p>
          )}
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Base legale</span>
          <div className="mt-1">
            {p.baseLegale || <span className="italic text-gray-400">Non renseignee</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Pressenties — affichees toujours, avec fallback sur stakeholders existants */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal" />
              <div className="font-bold text-navy text-sm">
                {(p.institutionsPressenties && p.institutionsPressenties.length > 0)
                  ? 'Institutions pressenties'
                  : 'Institutions concernees'}
              </div>
              <span className="text-[10px] text-gray-500">
                ({(p.institutionsPressenties?.length || p.stakeholders360?.length || 0)})
              </span>
            </div>
            {(p.institutionsPressenties && p.institutionsPressenties.length > 0) ? (
              <div className="divide-y divide-gray-100">
                {p.institutionsPressenties.map((ip: any) => {
                  const isMyInst = ip.institutionId === user?.institutionId;
                  // Visibilite des roles : DU + pressenties voient les roles, public voit codes seuls
                  const showRoles = isAdmin || isPressentie;
                  return (
                    <div key={ip.id} className={cn('p-3 flex items-start gap-3', isMyInst && 'bg-teal/5')}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-navy text-sm">{ip.institution?.code}</span>
                          <span className="text-xs text-gray-500">— {ip.institution?.nom}</span>
                          {showRoles && (
                            <span className={cn(
                              'inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border ml-auto',
                              ROLE_PRESSENTI_BADGE[ip.rolePressenti]
                            )}>
                              {ROLE_PRESSENTI_LABELS[ip.rolePressenti]}
                            </span>
                          )}
                        </div>
                        {ip.institution?.ministere && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{ip.institution.ministere}</div>
                        )}
                        {showRoles && ip.commentaire && (
                          <div className="text-xs text-gray-600 italic mt-1">{ip.commentaire}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (p.stakeholders360 && p.stakeholders360.length > 0) ? (
              <>
                <div className="px-4 pt-3 text-[11px] text-gray-500 italic">
                  Cette proposition issue du catalogue historique n'a pas encore de pressenties dedie. Institutions
                  identifiees dans le seed initial :
                </div>
                <div className="divide-y divide-gray-100">
                  {p.stakeholders360.map((s: any) => (
                    <div key={s.id} className="p-3 flex items-center gap-3">
                      <span className="font-semibold text-navy text-sm">{s.institution?.code}</span>
                      <span className="text-xs text-gray-500 flex-1">— {s.institution?.nom}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 italic">
                Aucune institution pressentie ni concernee identifiee.
              </div>
            )}
          </div>

          {/* Registres — toujours rendus avec placeholder si vide */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber" />
              <div className="font-bold text-navy text-sm">Referentiels concernes</div>
              <span className="text-[10px] text-gray-500">
                ({p.registresAssocies?.length || 0})
              </span>
            </div>
            {p.registresAssocies && p.registresAssocies.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {p.registresAssocies.map((ra: any) => (
                  <div key={ra.id} className="p-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{ra.registre?.code}</span>
                      <span className="text-xs text-gray-500">— {ra.registre?.nom}</span>
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-amber/10 text-amber-700 ml-auto">
                        {ra.mode}
                      </span>
                    </div>
                    {ra.champsConcernes && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        <span className="uppercase tracking-wider">Champs :</span> {ra.champsConcernes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 italic">
                Aucun referentiel national rattache a cette proposition.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Source */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="font-bold text-navy text-sm flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              Source de la proposition
            </div>
            {sourceLabel ? (
              <div className="text-xs text-gray-700 font-semibold">{sourceLabel}</div>
            ) : (
              <div className="text-xs text-gray-400 italic">Non precisee</div>
            )}
            {/* sourceDetail : visible DU ou pressentie, masque cote API */}
            {p.sourceDetail && (isAdmin || isPressentie) ? (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap">
                {p.sourceDetail}
              </div>
            ) : !isAdmin && !isPressentie ? (
              <div className="mt-2 flex gap-1.5 text-[11px] text-gray-400 italic">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Details de source reserves aux institutions pressenties et a la Delivery Unit.</span>
              </div>
            ) : null}
          </div>

          {/* Infos techniques */}
          <div className="bg-white rounded-lg border shadow-sm p-4 space-y-2 text-xs text-gray-600">
            <div className="font-bold text-navy text-sm mb-1">Informations</div>
            <div><span className="text-gray-400">Creee le :</span> {new Date(p.createdAt).toLocaleDateString('fr-FR')}</div>
            {p.phaseMVP && <div><span className="text-gray-400">Phase MVP :</span> {p.phaseMVP.code}</div>}
            {p.axePrioritaire && <div><span className="text-gray-400">Axe :</span> {p.axePrioritaire}</div>}
            <div><span className="text-gray-400">Impact :</span> {p.impact}</div>
          </div>
        </div>
      </div>

      {/* Barre d'actions admin (DU only, proposition active) */}
      {isAdmin && isAdoptable && (
        <div className="bg-gold-50 border border-gold/30 rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-sm font-bold text-navy">Actions Delivery Unit</span>
            <span className="text-[10px] text-gray-500">Réservé administrateurs MTN</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAdminAction('qualifier-rapide')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal text-white hover:bg-teal/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Qualifier
            </button>
            <button
              onClick={() => setAdminAction('demander-complement')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-navy text-white hover:bg-navy/90"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Demander complément
            </button>
            <button
              onClick={() => setAdminAction('rejeter')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              <XCircle className="w-3.5 h-3.5" /> Rejeter
            </button>
            <button
              onClick={() => setAdminAction('prioriser-rapide')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-gold text-white hover:bg-gold/90"
            >
              <Zap className="w-3.5 h-3.5" /> Prioriser
            </button>
          </div>
        </div>
      )}

      {/* Modale d'action admin */}
      {adminAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAdminAction(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-navy">{ADMIN_ACTIONS[adminAction].label} — {p.code}</h2>
            <p className="text-sm text-gray-600">{ADMIN_ACTIONS[adminAction].description}</p>

            {ADMIN_ACTIONS[adminAction].warning && (
              <div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{ADMIN_ACTIONS[adminAction].warning}</span>
              </div>
            )}

            {ADMIN_ACTIONS[adminAction].needsInstitution && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Institution cheffe de file *</label>
                <select
                  value={actionInstitutionId}
                  onChange={e => setActionInstitutionId(e.target.value)}
                  className="w-full text-sm border rounded-md px-2 py-1.5"
                >
                  <option value="">— Sélectionner —</option>
                  {p.institutionsPressenties?.map((ip: any) => (
                    <option key={ip.institutionId} value={ip.institutionId}>
                      {ip.institution?.code} — {ip.institution?.nom}
                    </option>
                  ))}
                </select>
                {(!p.institutionsPressenties || p.institutionsPressenties.length === 0) && (
                  <p className="text-[11px] text-gray-500 italic mt-1">Aucune institution pressentie sur cette proposition. Action impossible.</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                {ADMIN_ACTIONS[adminAction].payloadKey === 'motif' ? 'Motif' : 'Commentaire'} * (min 50 caractères)
              </label>
              <textarea
                value={actionMotif}
                onChange={e => setActionMotif(e.target.value)}
                rows={4}
                className="w-full text-sm border rounded-md px-2 py-1.5 resize-y"
                placeholder="Saisir un motif détaillé..."
              />
              <p className="text-[11px] text-gray-500 mt-1">{actionMotif.length} / 50 caractères minimum</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setAdminAction(null); setActionMotif(''); setActionInstitutionId(''); }}
                className="text-sm px-4 py-1.5 rounded-md border hover:bg-gray-50"
                disabled={actionMutation.isPending}
              >
                Annuler
              </button>
              <button
                onClick={() => actionMutation.mutate()}
                disabled={
                  actionMutation.isPending ||
                  actionMotif.length < 50 ||
                  (ADMIN_ACTIONS[adminAction].needsInstitution && !actionInstitutionId)
                }
                className="text-sm px-4 py-1.5 rounded-md bg-teal text-white hover:bg-teal/90 disabled:opacity-50"
              >
                {actionMutation.isPending ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton adoption sticky — aligne sur la zone main, ne couvre PAS la sidebar */}
      {isAdoptable && user?.institutionId && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 shadow-lg p-3 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold text-navy">
                {isPressentie
                  ? 'Votre institution est pressentie sur cette proposition'
                  : 'Votre institution n\'est pas pressentie — l\'adoption necessitera validation DU'}
              </div>
              <div className="text-gray-500">Lisez attentivement avant de vous engager.</div>
            </div>
            <button
              onClick={() => setShowAdoption(true)}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-md text-white',
                isPressentie ? 'bg-teal hover:bg-teal/90' : 'bg-navy hover:bg-navy/90'
              )}
            >
              {isPressentie ? 'Adopter cette proposition' : 'Signaler notre interet'}
            </button>
          </div>
        </div>
      )}

      {showAdoption && (
        <AdoptionModal proposition={p} onClose={() => setShowAdoption(false)} />
      )}
    </div>
  );
}
