import { ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function FieldBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  // Remplacer les sauts de ligne par des <br /> et préserver les espaces
  const lines = value.split('\n').filter(Boolean);
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded p-2.5 border border-gray-100 max-h-48 overflow-y-auto">
        {lines.map((line, i) => (
          <p key={i} className={cn(i > 0 && 'mt-1')}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export function DataContractBlock({ cu }: { cu: any }) {
  const hasEntree = !!cu.donneesEntree;
  const hasSortie = !!cu.donneesSortie;
  const hasLecture = !!cu.donneesLecture;
  const hasAny = hasEntree || hasSortie || hasLecture;

  if (!hasAny) {
    return (
      <details className="bg-white rounded-lg border shadow-sm border-amber-200">
        <summary className="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
          <ChevronRight className="w-4 h-4 text-amber-500 transition-transform" />
          <div className="font-bold text-navy">Contrat de données</div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Non documenté
          </span>
        </summary>
        <div className="px-4 pb-4 text-xs text-gray-500">
          Ce service n'a pas encore de contrat de données renseigné (entrée, sortie, lecture).
        </div>
      </details>
    );
  }

  const allDocumented = hasEntree && hasSortie && hasLecture;

  return (
    <details className="bg-white rounded-lg border shadow-sm" open>
      <summary className="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
        <ChevronRight className="w-4 h-4 text-teal transition-transform" />
        <div className="font-bold text-navy">Contrat de données</div>
        {allDocumented ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-teal-50 text-teal-700 border border-teal-200">
            <FileText className="w-3 h-3" />
            Documenté
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
            <FileText className="w-3 h-3" />
            Partiel
          </span>
        )}
      </summary>
      <div className="px-4 pb-4 space-y-3">
        <FieldBlock label="Données d'entrée (clé d'appel)" value={cu.donneesEntree} />
        <FieldBlock label="Données de sortie (réponse)" value={cu.donneesSortie} />
        <FieldBlock label="Données de lecture (registre producteur)" value={cu.donneesLecture} />
      </div>
    </details>
  );
}
