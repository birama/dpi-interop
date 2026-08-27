import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pilotageApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STATUTS_IMPL = ['IDENTIFIE', 'PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION', 'SUSPENDU'] as const;
const NATURES_BLOCAGE = ['JURIDIQUE', 'TECHNIQUE', 'ORGANISATIONNEL', 'DONNEES', 'CONTRACTUEL', 'ARBITRAGE'] as const;

const STATUT_IMPL_BADGE: Record<string, string> = {
  IDENTIFIE: 'bg-gray-100 text-gray-700',
  PRIORISE: 'bg-navy/10 text-navy',
  EN_PREPARATION: 'bg-blue-50 text-blue-700',
  EN_DEVELOPPEMENT: 'bg-amber-50 text-amber-700',
  EN_TEST: 'bg-teal-50 text-teal',
  EN_PRODUCTION: 'bg-green-50 text-green-700',
  SUSPENDU: 'bg-red-50 text-red-600',
};

const STATUT_VUE_BADGE: Record<string, string> = {
  PROPOSE: 'bg-gray-100 text-gray-600',
  DECLARE: 'bg-gray-100 text-gray-700',
  EN_CONSULTATION: 'bg-blue-50 text-blue-700',
  VALIDATION_CONJOINTE: 'bg-purple-50 text-purple-700',
  QUALIFIE: 'bg-teal-50 text-teal',
  PRIORISE: 'bg-navy/10 text-navy',
  FINANCEMENT_OK: 'bg-gold/10 text-gold',
  CONVENTIONNE: 'bg-amber-50 text-amber-700',
  EN_PRODUCTION_360: 'bg-green-50 text-green-700',
  SUSPENDU_360: 'bg-red-50 text-red-600',
  RETIRE: 'bg-gray-200 text-gray-500',
  ARCHIVE: 'bg-gray-200 text-gray-500',
  FUSIONNE: 'bg-gray-200 text-gray-500',
};

interface Blocage {
  id: string;
  nature: string;
  libelle: string;
  entiteAttendue: string | null;
  personneAttendue: string;
  echeance: string | null;
  dateResolution: string | null;
  dateOuverture: string;
  commentaire: string | null;
}

interface PortefeuilleItem {
  id: string;
  code: string;
  titre: string;
  institutionSourceCode: string | null;
  institutionCibleCode: string | null;
  autresInstitutions: string | null;
  statutImpl: string;
  statutVueSection: string;
  identifiantPivot: string | null;
  baseLegale: string | null;
  serviceXroad: string | null;
  phaseMVP: string | null;
  joursDansStatut: number | null;
  blocage: Blocage | null;
  echeanceDepassee: boolean;
  statutInchange30j: boolean;
}

function administrations(item: PortefeuilleItem): string {
  const parties = [item.institutionSourceCode, item.institutionCibleCode].filter(Boolean);
  return parties.join(' → ') || '—';
}

function CellPivot({ item }: { item: PortefeuilleItem }) {
  const [valeur, setValeur] = useState(item.identifiantPivot ?? '');
  const ref = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: (identifiantPivot: string) => pilotageApi.updateCasUsage(item.id, { identifiantPivot: identifiantPivot.trim() || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de modifier le pivot' }),
  });
  // Lit le DOM au blur : la closure d'état peut être stale si blur suit input dans le même tick
  const save = () => {
    const v = ref.current?.value ?? '';
    if ((v.trim() || null) !== item.identifiantPivot) mutation.mutate(v);
  };
  return (
    <input
      ref={ref}
      value={valeur}
      onChange={(e) => setValeur(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      placeholder="—"
      className="w-36 px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:border-teal focus:outline-none"
    />
  );
}

function CellStatutImpl({ item }: { item: PortefeuilleItem }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: (statutImpl: string) => pilotageApi.updateCasUsage(item.id, { statutImpl }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Statut refusé', description: e?.response?.data?.error || 'Impossible de changer le statut' }),
  });
  return (
    <select
      value={item.statutImpl}
      onChange={(e) => mutation.mutate(e.target.value)}
      className={cn('w-40 px-1.5 py-1 text-xs rounded border border-gray-200 focus:outline-none', STATUT_IMPL_BADGE[item.statutImpl])}
    >
      {STATUTS_IMPL.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function CellEcheance({ item }: { item: PortefeuilleItem }) {
  const ref = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [valeur, setValeur] = useState(item.blocage?.echeance ? item.blocage.echeance.slice(0, 10) : '');
  const mutation = useMutation({
    mutationFn: (echeance: string) => pilotageApi.updateBlocage(item.blocage!.id, { echeance: echeance || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de modifier l\'échéance' }),
  });
  if (!item.blocage) return <span className="text-gray-300">—</span>;
  const save = () => {
    const v = ref.current?.value ?? '';
    const actuel = item.blocage?.echeance ? item.blocage.echeance.slice(0, 10) : '';
    if (v !== actuel) mutation.mutate(v);
  };
  return (
    <input
      ref={ref}
      type="date"
      value={valeur}
      onChange={(e) => setValeur(e.target.value)}
      onBlur={save}
      className={cn('px-1.5 py-1 text-xs border border-gray-200 rounded bg-white', item.echeanceDepassee && 'border-red-300 text-red-600')}
    />
  );
}

function CellBlocage({ item }: { item: PortefeuilleItem }) {
  const [ouvert, setOuvert] = useState(false);
  const [nature, setNature] = useState<string>('TECHNIQUE');
  const [libelle, setLibelle] = useState('');
  const [personne, setPersonne] = useState('');
  const [echeance, setEcheance] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const creation = useMutation({
    mutationFn: () => pilotageApi.creerBlocage(item.id, { nature, libelle, personneAttendue: personne, echeance: echeance || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); setOuvert(false); setLibelle(''); setPersonne(''); setEcheance(''); toast({ title: 'Blocage ouvert' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Blocage refusé', description: e?.response?.data?.error || 'Impossible de créer le blocage' }),
  });
  const resolution = useMutation({
    mutationFn: () => pilotageApi.resoudreBlocage(item.blocage!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); toast({ title: 'Blocage résolu' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de résoudre le blocage' }),
  });

  if (item.blocage) {
    return (
      <div className="flex items-center gap-1.5 min-w-56">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 whitespace-nowrap">{item.blocage.nature}</span>
        <span className="text-xs text-gray-700 truncate max-w-40" title={item.blocage.libelle}>{item.blocage.libelle}</span>
        <button
          onClick={() => resolution.mutate()}
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-teal text-teal hover:bg-teal hover:text-white whitespace-nowrap"
        >
          Résoudre
        </button>
      </div>
    );
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="text-xs px-2 py-1 rounded border border-dashed border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-600">
        + Blocage
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-64 bg-red-50/50 border border-red-100 rounded p-1.5">
      <div className="flex gap-1">
        <select value={nature} onChange={(e) => setNature(e.target.value)} className="px-1 py-0.5 text-[11px] rounded border border-gray-200 bg-white">
          {NATURES_BLOCAGE.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} className="px-1 py-0.5 text-[11px] rounded border border-gray-200 bg-white w-32" />
      </div>
      <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Libellé du blocage" className="px-1.5 py-0.5 text-[11px] rounded border border-gray-200 bg-white" />
      <input value={personne} onChange={(e) => setPersonne(e.target.value)} placeholder="Personne attendue (obligatoire)" className="px-1.5 py-0.5 text-[11px] rounded border border-gray-200 bg-white" />
      <div className="flex gap-1">
        <button
          onClick={() => creation.mutate()}
          disabled={!libelle.trim() || !personne.trim()}
          className="text-[11px] px-2 py-0.5 rounded bg-red-600 text-white disabled:opacity-40"
        >
          Ouvrir
        </button>
        <button onClick={() => setOuvert(false)} className="text-[11px] px-2 py-0.5 rounded border border-gray-300 text-gray-500">Annuler</button>
      </div>
    </div>
  );
}

export function PilotagePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pilotage'],
    queryFn: () => pilotageApi.getPortefeuille().then((r: any) => r.data as PortefeuilleItem[]),
    retry: 1,
  });

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Chargement du portefeuille…</div>;
  if (isError) {
    return (
      <div className="p-6 text-sm text-red-600">
        Impossible de charger le portefeuille.{' '}
        <button className="underline" onClick={() => refetch()}>Réessayer</button>
      </div>
    );
  }

  const items = data ?? [];
  // Tri : lignes en alerte en haut, puis ancienneté dans le statut décroissante (null en dernier)
  const tri = [...items].sort((a, b) => {
    const alerteA = a.echeanceDepassee || a.statutInchange30j;
    const alerteB = b.echeanceDepassee || b.statutInchange30j;
    if (alerteA !== alerteB) return alerteA ? -1 : 1;
    const ja = a.joursDansStatut ?? -1;
    const jb = b.joursDansStatut ?? -1;
    return jb - ja;
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-navy">Portefeuille suivi</h1>
        <p className="text-xs text-gray-500 mt-1">
          {items.length} cas d'usage pilotes — édition directe dans les cellules. Deux alertes seulement : échéance dépassée, statut inchangé depuis plus de 30 jours.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <th className="px-2 py-2 font-medium">Code</th>
              <th className="px-2 py-2 font-medium">Intitulé</th>
              <th className="px-2 py-2 font-medium">Administrations</th>
              <th className="px-2 py-2 font-medium">Implémentation</th>
              <th className="px-2 py-2 font-medium">Gouvernance</th>
              <th className="px-2 py-2 font-medium text-right">Jours</th>
              <th className="px-2 py-2 font-medium">Identifiant pivot</th>
              <th className="px-2 py-2 font-medium">Blocage courant</th>
              <th className="px-2 py-2 font-medium">Personne attendue</th>
              <th className="px-2 py-2 font-medium">Échéance</th>
            </tr>
          </thead>
          <tbody>
            {tri.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  'border-b border-gray-100 hover:bg-gray-50/60',
                  item.echeanceDepassee && 'bg-red-50/70 hover:bg-red-50',
                  !item.echeanceDepassee && item.statutInchange30j && 'bg-amber-50/70 hover:bg-amber-50'
                )}
              >
                <td className="px-2 py-2 font-semibold text-navy whitespace-nowrap">{item.code}</td>
                <td className="px-2 py-2 text-gray-800 max-w-64">
                  <div className="truncate" title={item.titre}>{item.titre}</div>
                  {item.phaseMVP && <div className="text-[10px] text-gray-400">{item.phaseMVP}</div>}
                </td>
                <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{administrations(item)}</td>
                <td className="px-2 py-2"><CellStatutImpl item={item} /></td>
                <td className="px-2 py-2">
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap', STATUT_VUE_BADGE[item.statutVueSection] || 'bg-gray-100 text-gray-600')}>
                    {item.statutVueSection}
                  </span>
                </td>
                <td className={cn('px-2 py-2 text-right whitespace-nowrap', item.statutInchange30j ? 'font-semibold text-amber-700' : 'text-gray-600')}>
                  {item.joursDansStatut === null ? '—' : item.joursDansStatut}
                </td>
                <td className="px-2 py-2"><CellPivot item={item} /></td>
                <td className="px-2 py-2"><CellBlocage item={item} /></td>
                <td className="px-2 py-2 text-gray-700 whitespace-nowrap max-w-40">
                  <div className="truncate" title={item.blocage?.personneAttendue || ''}>{item.blocage?.personneAttendue || '—'}</div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {item.blocage ? (
                    <CellEcheance item={item} />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {tri.length === 0 && (
              <tr>
                <td colSpan={10} className="px-2 py-8 text-center text-gray-400">
                  Aucun cas d'usage marqué « pilote ». Le portefeuille est amorcé via l'API (pilote=true).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
