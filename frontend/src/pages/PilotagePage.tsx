import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pilotageApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const NATURE_BLOCAGE_BADGE: Record<string, string> = {
  JURIDIQUE: 'bg-purple-50 text-purple-700',
  TECHNIQUE: 'bg-blue-50 text-blue-700',
  ORGANISATIONNEL: 'bg-gray-100 text-gray-700',
  DONNEES: 'bg-teal-50 text-teal',
  CONTRACTUEL: 'bg-amber-50 text-amber-700',
  ARBITRAGE: 'bg-red-50 text-red-600',
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
  administrations: { source: string[]; cible: string[] };
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

// Champ en édition directe : sauvegarde au blur (lecture DOM via ref, pas la
// closure d'état, qui peut être stale si le blur suit la frappe dans le même tick).
function ChampInline({ label, valeur, onSave, type = 'text', large = false }: {
  label: string;
  valeur: string;
  onSave: (v: string) => void;
  type?: 'text' | 'date';
  large?: boolean;
}) {
  const [local, setLocal] = useState(valeur);
  const ref = useRef<HTMLInputElement>(null);
  const save = () => {
    const v = ref.current?.value ?? '';
    if (v.trim() !== valeur.trim()) onSave(v);
  };
  return (
    <label className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <input
        ref={ref}
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        placeholder="—"
        className={cn(
          'px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:border-teal focus:outline-none',
          large ? 'w-full' : 'w-44'
        )}
      />
    </label>
  );
}

function SelectStatutImpl({ item }: { item: PortefeuilleItem }) {
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
      className={cn('w-44 px-1.5 py-1 text-xs rounded border border-gray-200 focus:outline-none', STATUT_IMPL_BADGE[item.statutImpl])}
    >
      {STATUTS_IMPL.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function ModalCreationBlocage({ item, open, onClose }: { item: PortefeuilleItem; open: boolean; onClose: () => void }) {
  const [nature, setNature] = useState<string>('TECHNIQUE');
  const [libelle, setLibelle] = useState('');
  const [personne, setPersonne] = useState('');
  const [entite, setEntite] = useState('');
  const [echeance, setEcheance] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => pilotageApi.creerBlocage(item.id, {
      nature, libelle, personneAttendue: personne, entiteAttendue: entite || null,
      echeance: echeance || null, commentaire: commentaire || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilotage'] });
      setLibelle(''); setPersonne(''); setEntite(''); setEcheance(''); setCommentaire('');
      toast({ title: 'Blocage ouvert' });
      onClose();
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Blocage refusé', description: e?.response?.data?.error || 'Impossible de créer le blocage' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">Signaler un blocage — {item.code}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-gray-400">Nature</span>
              <select value={nature} onChange={(e) => setNature(e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white">
                {NATURES_BLOCAGE.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-gray-400">Échéance</span>
              <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
            </label>
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Libellé</span>
            <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ce qui bloque, en une phrase" className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-gray-400">Personne attendue *</span>
              <input value={personne} onChange={(e) => setPersonne(e.target.value)} placeholder="Nom + fonction" className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-gray-400">Entité attendue</span>
              <input value={entite} onChange={(e) => setEntite(e.target.value)} placeholder="Direction, agence…" className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
            </label>
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Commentaire</span>
            <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Contexte, pièce jointe, référence…" className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!libelle.trim() || !personne.trim()}
              className="text-xs px-3 py-1.5 rounded bg-red-600 text-white disabled:opacity-40 hover:bg-red-700"
            >
              Ouvrir le blocage
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BlocBlocage({ item }: { item: PortefeuilleItem }) {
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const resolution = useMutation({
    mutationFn: () => pilotageApi.resoudreBlocage(item.blocage!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); toast({ title: 'Blocage levé' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de lever le blocage' }),
  });
  const majEcheance = useMutation({
    mutationFn: (echeance: string) => pilotageApi.updateBlocage(item.blocage!.id, { echeance: echeance || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de modifier l\'échéance' }),
  });

  if (!item.blocage) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs px-2 py-1 rounded border border-dashed border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-600 self-start"
        >
          + Signaler un blocage
        </button>
        <ModalCreationBlocage item={item} open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const b = item.blocage;
  return (
    <div className="rounded border border-gray-200 bg-white p-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap', NATURE_BLOCAGE_BADGE[b.nature] || 'bg-gray-100 text-gray-700')}>{b.nature}</span>
        <span className="text-xs text-gray-800 truncate" title={b.libelle}>{b.libelle}</span>
      </div>
      <div className="text-xs text-gray-600 whitespace-nowrap">
        <span className="text-gray-400">Personne :</span> {b.personneAttendue}
        {b.entiteAttendue && <span className="text-gray-400"> · {b.entiteAttendue}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-gray-400">Échéance</span>
        <ChampInline
          label=""
          type="date"
          valeur={b.echeance ? b.echeance.slice(0, 10) : ''}
          onSave={(v) => majEcheance.mutate(v)}
        />
      </div>
      {item.echeanceDepassee && <span className="text-[10px] font-semibold text-red-600">Échéance dépassée</span>}
      <button
        onClick={() => resolution.mutate()}
        className="ml-auto text-xs px-2.5 py-1 rounded border border-teal text-teal hover:bg-teal hover:text-white whitespace-nowrap"
      >
        Lever
      </button>
    </div>
  );
}

function useMajChamp(item: PortefeuilleItem, champ: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (v: string) => pilotageApi.updateCasUsage(item.id, { [champ]: v.trim() || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pilotage'] }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible de modifier le champ' }),
  });
}

function CartePilotage({ item }: { item: PortefeuilleItem }) {
  const pivot = useMajChamp(item, 'identifiantPivot');
  const baseLegale = useMajChamp(item, 'baseLegale');
  const serviceXroad = useMajChamp(item, 'serviceXroad');

  const adm = item.administrations || { source: [], cible: [] };
  const admTexte = adm.source.length || adm.cible.length
    ? `${adm.source.join(', ') || '—'} → ${adm.cible.join(', ') || '—'}`
    : '—';

  // NB : pas de cn() ici — tailwind-merge supprime border-l-<couleur> en présence de border-l-4.
  const bordureAlerte = item.echeanceDepassee ? 'border-l-red-500' : item.statutInchange30j ? 'border-l-amber-500' : 'border-l-transparent';
  return (
    <div className={`rounded-lg border bg-white shadow-sm border-l-4 ${bordureAlerte} border-gray-200`}>
      {/* En-tête */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-navy whitespace-nowrap">{item.code}</span>
            {item.phaseMVP && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.phaseMVP}</span>}
          </div>
          <h2 className="text-sm text-gray-800 mt-0.5">{item.titre}</h2>
        </div>
        <div className="text-right shrink-0">
          {item.statutInchange30j && !item.echeanceDepassee && <div className="text-[10px] font-semibold text-amber-700">Inchangé depuis &gt; 30 j</div>}
          {item.echeanceDepassee && <div className="text-[10px] font-semibold text-red-600">Échéance dépassée</div>}
        </div>
      </div>

      {/* Corps */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Statuts côte à côte */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Implémentation</span>
            <SelectStatutImpl item={item} />
            <span className={cn('text-xs whitespace-nowrap', item.statutInchange30j ? 'font-semibold text-amber-700' : 'text-gray-500')}>
              {item.joursDansStatut === null ? '— j' : `${item.joursDansStatut} j`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Gouvernance</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap', STATUT_VUE_BADGE[item.statutVueSection] || 'bg-gray-100 text-gray-600')}>
              {item.statutVueSection}
            </span>
          </div>
          <div className="text-xs text-gray-600 whitespace-nowrap">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Administrations</span>{' '}
            {admTexte}
          </div>
        </div>

        {/* Qualification — édition directe */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <ChampInline key={`p-${item.identifiantPivot ?? ''}`} label="Identifiant pivot" valeur={item.identifiantPivot ?? ''} onSave={(v) => pivot.mutate(v)} />
          <ChampInline key={`b-${item.baseLegale ?? ''}`} label="Base légale" valeur={item.baseLegale ?? ''} onSave={(v) => baseLegale.mutate(v)} large />
          <ChampInline key={`x-${item.serviceXroad ?? ''}`} label="Service X-Road" valeur={item.serviceXroad ?? ''} onSave={(v) => serviceXroad.mutate(v)} />
        </div>

        {/* Blocage */}
        <BlocBlocage item={item} />
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
  // Cartes en alerte en haut, puis ancienneté dans le statut décroissante
  const tri = [...items].sort((a, b) => {
    const alerteA = a.echeanceDepassee || a.statutInchange30j;
    const alerteB = b.echeanceDepassee || b.statutInchange30j;
    if (alerteA !== alerteB) return alerteA ? -1 : 1;
    return (b.joursDansStatut ?? -1) - (a.joursDansStatut ?? -1);
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-navy">Portefeuille suivi</h1>
        <p className="text-xs text-gray-500 mt-1">
          {items.length} cas d'usage pilotes — édition directe dans les cartes. Deux alertes seulement : échéance dépassée, statut inchangé depuis plus de 30 jours.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {tri.map((item) => <CartePilotage key={item.id} item={item} />)}
        {tri.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
            Aucun cas d'usage marqué « pilote ». Le portefeuille est amorcé via l'API (pilote=true).
          </div>
        )}
      </div>
    </div>
  );
}
