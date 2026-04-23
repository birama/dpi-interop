import { cn } from '@/lib/utils';
import { FEEDBACK_TYPE_STYLES } from './constants';
import { useAuthStore } from '@/store/auth';

interface Props {
  stakeholders: any[];
  onGiveFeedback?: () => void;
}

// Couleurs avatar par institution
const AVATAR_COLORS: Record<string, string> = {
  DGID: 'bg-navy', DGD: 'bg-teal', ANSD: 'bg-gold', DGCPT: 'bg-emerald-600',
  CDP: 'bg-amber', MFB: 'bg-teal', MJ: 'bg-red-600', DGPSN: 'bg-blue-600',
};

export function FeedbacksFeed({ stakeholders, onGiveFeedback }: Props) {
  const { user } = useAuthStore();

  // Collecter tous les feedbacks et les regrouper (originaux + amendements)
  const allFeedbacks: any[] = [];
  const amendementsByParent = new Map<string, any[]>();

  for (const sh of stakeholders) {
    for (const fb of (sh.feedbacks || [])) {
      if (fb.amendeDe) {
        const list = amendementsByParent.get(fb.amendeDe) || [];
        list.push({ ...fb, institution: sh.institution, role: sh.role });
        amendementsByParent.set(fb.amendeDe, list);
      } else {
        allFeedbacks.push({ ...fb, institution: sh.institution, role: sh.role });
      }
    }
  }

  // Trier par date (plus recent en bas)
  allFeedbacks.sort((a, b) => new Date(a.dateAvis).getTime() - new Date(b.dateAvis).getTime());

  // Trouver si mon institution a une consultation en attente
  const myPending = stakeholders.find(
    (sh: any) => sh.institutionId === user?.institutionId && sh.role !== 'INITIATEUR' &&
    sh.consultations?.some((c: any) => c.status === 'EN_ATTENTE')
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="font-bold text-navy">Fil d'avis formels</div>
        <div className="text-xs text-gray-500">Chaque contribution est un avis institutionnel signe, horodate et inalterable</div>
      </div>
      <div className="divide-y divide-gray-100">
        {allFeedbacks.length === 0 && !myPending && (
          <div className="p-6 text-center text-xs text-gray-400">Aucun avis formel enregistre</div>
        )}

        {allFeedbacks.map((fb: any) => {
          const style = FEEDBACK_TYPE_STYLES[fb.type] || { bg: 'bg-gray-100 text-gray-600', icon: '•' };
          const avatarColor = AVATAR_COLORS[fb.institution?.code] || 'bg-gray-500';
          const amendments = amendementsByParent.get(fb.id) || [];

          return (
            <div key={fb.id}>
              {/* Avis original */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0', avatarColor)}>
                    {fb.institution?.code?.substring(0, 3) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{fb.auteurNom}</span>
                      <span className="text-xs text-gray-500">· {fb.auteurInstitutionNom} · {fb.role?.replace('_', ' ')}</span>
                      <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ml-auto', style.bg)}>
                        {fb.type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(fb.dateAvis).toLocaleDateString('fr-FR')} · {new Date(fb.dateAvis).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{fb.motivation}</p>
                    {fb.piecesJointes && Array.isArray(fb.piecesJointes) && fb.piecesJointes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {fb.piecesJointes.map((pj: any, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {pj.filename || `Piece ${i + 1}`} {pj.size && `· ${Math.round(pj.size / 1024)} Ko`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amendements (indentes) */}
              {amendments.map((amend: any) => {
                const aStyle = FEEDBACK_TYPE_STYLES[amend.type] || { bg: 'bg-gray-100', icon: '•' };
                return (
                  <div key={amend.id} className="px-4 pb-4 ml-12 border-l-2 border-gray-200">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-navy text-xs">{amend.auteurNom}</span>
                        <span className="text-[10px] text-gray-500">· Amendement</span>
                        <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', aStyle.bg)}>
                          {amend.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-auto">
                          {new Date(amend.dateAvis).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{amend.motivation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Bloc "mon avis attendu" si en attente */}
        {myPending && (
          <div className="p-4 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
                {myPending.institution?.code?.substring(0, 3) || '?'}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 italic">
                  {myPending.institution?.code} n'a pas encore repondu — votre avis est attendu.
                </div>
                {onGiveFeedback && (
                  <button onClick={onGiveFeedback} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-amber text-white hover:bg-amber/90 mt-2">
                    Donner mon avis maintenant
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
