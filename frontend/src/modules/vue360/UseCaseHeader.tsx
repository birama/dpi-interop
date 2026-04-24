import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { VUE360_STATUT_COLORS, ROLE_BADGE_STYLES, ROLE_LABELS, daysUntil } from './constants';
import { AutoSaisineModal } from './AutoSaisineModal';

interface Props {
  cu: any;
  visibility: string;
  myConsultationId?: string;
  onGiveFeedback?: () => void;
}

export function UseCaseHeader({ cu, visibility, myConsultationId, onGiveFeedback }: Props) {
  const { user } = useAuthStore();
  const [showAutoSaisine, setShowAutoSaisine] = useState(false);
  const sc = VUE360_STATUT_COLORS[cu.statutVueSection] || VUE360_STATUT_COLORS.DECLARE;

  // Trouver le role de mon institution
  const myStakeholders = cu.stakeholders360?.filter(
    (s: any) => s.institutionId === user?.institutionId && s.actif
  ) || [];
  const myRoles = myStakeholders.map((s: any) => s.role);

  // A-t-on deja ete evince (anti-reinscription) ?
  const myEvicted = cu.stakeholders360?.some(
    (s: any) => s.institutionId === user?.institutionId && !s.actif && s.evictionParDU
  );

  // Trouver l'echeance de ma consultation en attente
  let myEcheance: string | null = null;
  for (const sh of myStakeholders) {
    const pendingCo = sh.consultations?.find((c: any) => c.status === 'EN_ATTENTE');
    if (pendingCo) { myEcheance = pendingCo.dateEcheance; break; }
  }
  const daysLeft = myEcheance ? daysUntil(myEcheance) : null;

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{cu.code}</span>
              <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', sc.chip)}>{sc.label}</span>
              {cu.phaseMVP && <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal">{cu.phaseMVP.code}</span>}
              {myRoles.map((role: string) => (
                <span key={role} className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border', ROLE_BADGE_STYLES[role])}>
                  Mon role : {ROLE_LABELS[role]}
                </span>
              ))}
              {daysLeft !== null && (
                <span className={cn('text-[11px] font-bold ml-auto', daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-gray-500')}>
                  {daysLeft <= 0 ? 'Echeance depassee !' : `Echeance : J+${daysLeft}`}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy">{cu.titre}</h1>
            {cu.resumeMetier && <p className="text-sm text-gray-600 mt-2">{cu.resumeMetier}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
              <div><span className="text-gray-400">Initiateur :</span> <b className="text-navy">{cu.institutionSource?.code || cu.institutionSourceCode}</b> {cu.institutionSource?.nom && <span className="text-gray-400">— {cu.institutionSource.nom}</span>}</div>
              {cu.dateIdentification && <div><span className="text-gray-400">Declare le :</span> {new Date(cu.dateIdentification || cu.createdAt).toLocaleDateString('fr-FR')}</div>}
              {cu.baseLegale && <div><span className="text-gray-400">Base legale :</span> {cu.baseLegale}</div>}
            </div>
          </div>
          {/* Actions */}
          {visibility !== 'METADATA' && (
            <div className="flex flex-col gap-2 shrink-0">
              {myConsultationId && onGiveFeedback && (
                <button onClick={onGiveFeedback} className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md', daysLeft !== null && daysLeft <= 3 ? 'bg-amber text-white hover:bg-amber/90' : 'bg-teal text-white hover:bg-teal/90')}>
                  Donner mon avis
                </button>
              )}
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-teal hover:bg-teal/10">
                ← Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Bandeau METADATA */}
        {visibility === 'METADATA' && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700 flex flex-wrap items-center gap-2">
            <span className="flex-1 min-w-0">
              Informations detaillees reservees aux parties prenantes formellement designees.
              {user?.institutionId && !myEvicted && <span className="ml-1">Vos donnees ou processus sont concernes ?</span>}
              {myEvicted && <span className="ml-1 font-semibold">Votre institution a ete evincee de ce cas d'usage par la Delivery Unit — reinscription impossible.</span>}
            </span>
            {user?.institutionId && !myEvicted && (
              <button
                onClick={() => setShowAutoSaisine(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal text-white hover:bg-teal/90"
              >
                Me porter partie prenante
              </button>
            )}
          </div>
        )}
      </div>

      {showAutoSaisine && (
        <AutoSaisineModal
          cuId={cu.id}
          cuCode={cu.code}
          cuTitre={cu.titre}
          onClose={() => setShowAutoSaisine(false)}
        />
      )}
    </>
  );
}
