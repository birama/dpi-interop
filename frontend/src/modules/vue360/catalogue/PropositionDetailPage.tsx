import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, ChevronRight, Info, Building2, Database, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdoptionModal } from './AdoptionModal';
import {
  TYPOLOGIE_BADGE, MATURITE_BADGE, SOURCE_LABELS,
  ROLE_PRESSENTI_LABELS, ROLE_PRESSENTI_BADGE,
} from './constants';

export function PropositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [showAdoption, setShowAdoption] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['catalogue-detail', id],
    queryFn: () => api.get(`/catalogue/propositions/${id}`).then((r: any) => r.data),
    enabled: !!id,
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
        <Link to="/catalogue-propositions" className="text-teal hover:underline">Catalogue des propositions</Link>
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
        {p.resumeMetier && (
          <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{p.resumeMetier}</p>
        )}
        {p.baseLegale && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Base legale</span>
            <div className="mt-1">{p.baseLegale}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Pressenties */}
          {p.institutionsPressenties && p.institutionsPressenties.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal" />
                <div className="font-bold text-navy text-sm">Institutions pressenties</div>
                <span className="text-[10px] text-gray-500">
                  ({p.institutionsPressenties.length})
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {p.institutionsPressenties.map((ip: any) => (
                  <div key={ip.id} className={cn(
                    'p-3 flex items-start gap-3',
                    ip.institutionId === user?.institutionId && 'bg-teal/5'
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-navy text-sm">{ip.institution?.code}</span>
                        <span className="text-xs text-gray-500">— {ip.institution?.nom}</span>
                        <span className={cn(
                          'inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border ml-auto',
                          ROLE_PRESSENTI_BADGE[ip.rolePressenti]
                        )}>
                          {ROLE_PRESSENTI_LABELS[ip.rolePressenti]}
                        </span>
                      </div>
                      {ip.institution?.ministere && (
                        <div className="text-[10px] text-gray-500 mt-0.5">{ip.institution.ministere}</div>
                      )}
                      {ip.commentaire && (
                        <div className="text-xs text-gray-600 italic mt-1">{ip.commentaire}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registres */}
          {p.registresAssocies && p.registresAssocies.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber" />
                <div className="font-bold text-navy text-sm">Referentiels concernes</div>
                <span className="text-[10px] text-gray-500">
                  ({p.registresAssocies.length})
                </span>
              </div>
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
            </div>
          )}
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

      {/* Bouton adoption sticky */}
      {isAdoptable && user?.institutionId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-40">
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
