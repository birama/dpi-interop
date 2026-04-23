import { cn } from '@/lib/utils';
import { VUE360_STATUT_COLORS } from './constants';

interface Props { history: any[] }

export function TransitionsTimeline({ history }: Props) {
  // Tri chronologique inverse (plus recent en haut)
  const sorted = [...history].sort((a, b) => new Date(b.dateTransition).getTime() - new Date(a.dateTransition).getTime());

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="font-bold text-navy">Historique</div>
        <div className="text-xs text-gray-500">Transitions inalterables</div>
      </div>
      <ol className="p-4 space-y-3 text-xs">
        {sorted.map((h: any, i: number) => {
          const dotColor = i === 0 ? 'bg-amber ring-4 ring-amber/20' : 'bg-gray-400';
          return (
            <li key={h.id} className="relative pl-5">
              <span className={cn('absolute left-0 top-1 w-2 h-2 rounded-full', dotColor)} />
              <div className="font-semibold text-navy">{VUE360_STATUT_COLORS[h.statusTo]?.label || h.statusTo}</div>
              <div className="text-gray-500">
                {new Date(h.dateTransition).toLocaleDateString('fr-FR')} · {h.auteurNom} · {h.auteurInstitution}
              </div>
              {h.motif && <div className="text-gray-400 mt-0.5 italic">{h.motif}</div>}
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="text-gray-400 italic text-center py-4">Aucune transition enregistree</li>
        )}
      </ol>
    </div>
  );
}
