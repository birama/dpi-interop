import { cn } from '@/lib/utils';
import { ROLE_BADGE_STYLES, ROLE_LABELS, FEEDBACK_TYPE_STYLES } from './constants';

interface Props { stakeholders: any[] }

export function StakeholdersTable({ stakeholders }: Props) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="font-bold text-navy">Parties prenantes</div>
        <div className="text-xs text-gray-500">Statut de consultation des administrations impliquees</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2 font-semibold">Institution</th>
              <th className="px-4 py-2 font-semibold">Role</th>
              <th className="px-4 py-2 font-semibold">Statut avis</th>
              <th className="px-4 py-2 font-semibold">Auteur</th>
              <th className="px-4 py-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stakeholders.map((sh: any) => {
              const lastCo = sh.consultations?.[0];
              const lastFb = lastCo?.feedbacks?.[0] || sh.feedbacks?.[0];
              const isWaiting = lastCo?.status === 'EN_ATTENTE';
              const fbStyle = lastFb ? FEEDBACK_TYPE_STYLES[lastFb.type] : null;

              return (
                <tr key={sh.id} className={cn(isWaiting && 'bg-amber-50/50')}>
                  <td className="px-4 py-2">
                    <div className="font-semibold text-navy">{sh.institution?.code}</div>
                    <div className="text-[10px] text-gray-400">{sh.institution?.nom}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border', ROLE_BADGE_STYLES[sh.role])}>
                      {ROLE_LABELS[sh.role]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {sh.role === 'INITIATEUR' ? (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-teal/15 text-teal">Initiateur</span>
                    ) : lastFb ? (
                      <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', fbStyle?.bg)}>
                        {fbStyle?.icon} {lastFb.type.replace('_', ' ')}
                      </span>
                    ) : isWaiting ? (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-amber/15 text-amber">En attente</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {lastFb ? <span>{lastFb.auteurNom}</span> : sh.role === 'INITIATEUR' ? <span className="text-gray-500">Declarant</span> : <span className="italic text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {lastFb ? (
                      <span className="text-gray-500">{new Date(lastFb.dateAvis).toLocaleDateString('fr-FR')}</span>
                    ) : isWaiting && lastCo?.dateEcheance ? (
                      <span className="text-red-600 font-semibold">Echeance {new Date(lastCo.dateEcheance).toLocaleDateString('fr-FR')}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
