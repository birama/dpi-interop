import { cn } from '@/lib/utils';

const MODE_STYLES: Record<string, string> = {
  CONSOMME: 'bg-teal/15 text-teal',
  ALIMENTE: 'bg-gold/15 text-amber-700',
  CREE:     'bg-navy/10 text-navy',
};

interface Props { registres: any[] }

export function RegistresTouchesTable({ registres }: Props) {
  if (!registres || registres.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border shadow-sm border-l-4 border-l-gold">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="font-bold text-navy flex items-center gap-2">Referentiels nationaux touches</div>
          <div className="text-xs text-gray-500">Registres nationaux rattaches a ce cas d'usage</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2 font-semibold">Referentiel</th>
              <th className="px-4 py-2 font-semibold">Detenteur</th>
              <th className="px-4 py-2 font-semibold">Mode</th>
              <th className="px-4 py-2 font-semibold">Champs concernes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registres.map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-semibold text-navy">{r.registre?.code || '—'}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{r.registre?.institutionNom || r.registre?.institutionCode || '—'}</td>
                <td className="px-4 py-2">
                  <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', MODE_STYLES[r.mode] || 'bg-gray-100')}>
                    {r.mode}
                  </span>
                </td>
                <td className="px-4 py-2 text-[11px] text-gray-600 font-mono">
                  {Array.isArray(r.champsConcernes) ? r.champsConcernes.join(', ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
