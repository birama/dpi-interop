import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pilotageApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STATUTS_IMPL = ['IDENTIFIE', 'PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION', 'SUSPENDU'] as const;
const NATURES_BLOCAGE = ['JURIDIQUE', 'TECHNIQUE', 'ORGANISATIONNEL', 'DONNEES', 'CONTRACTUEL', 'ARBITRAGE'] as const;

const STATUT_IMPL_BADGE: Record<string, string> = {
  IDENTIFIE: 'bg-gray-100 text-gray-800',
  PRIORISE: 'bg-navy/20 text-navy',
  EN_PREPARATION: 'bg-blue-100 text-blue-800',
  EN_DEVELOPPEMENT: 'bg-amber-100 text-amber-800',
  EN_TEST: 'bg-teal-100 text-teal',
  EN_PRODUCTION: 'bg-green-100 text-green-800',
  SUSPENDU: 'bg-red-100 text-red-700',
};

const STATUT_VUE_BADGE: Record<string, string> = {
  PROPOSE: 'bg-gray-100 text-gray-700',
  DECLARE: 'bg-gray-100 text-gray-800',
  EN_CONSULTATION: 'bg-blue-100 text-blue-800',
  VALIDATION_CONJOINTE: 'bg-purple-100 text-purple-800',
  QUALIFIE: 'bg-teal-100 text-teal',
  PRIORISE: 'bg-navy/20 text-navy',
  FINANCEMENT_OK: 'bg-gold/25 text-gold',
  CONVENTIONNE: 'bg-amber-100 text-amber-800',
  EN_PRODUCTION_360: 'bg-green-100 text-green-800',
  SUSPENDU_360: 'bg-red-100 text-red-700',
  RETIRE: 'bg-gray-200 text-gray-600',
  ARCHIVE: 'bg-gray-200 text-gray-600',
  FUSIONNE: 'bg-gray-200 text-gray-600',
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

// Champ en édition directe : sauvegarde au blur, avec retour visuel immédiat
// (bordure verte 1s si succès, rouge + message inline si échec).
// - onSave doit retourner une Promise (mutateAsync) pour que le composant sache
//   quand basculer sur « saved » ou « error ».
// - Le local state est resynchronisé depuis `valeur` uniquement quand le champ
//   n'a pas le focus (invalidation TanStack Query → refetch → nouvelle prop).
function ChampInline({ label, valeur, onSave, type = 'text', large = false, multiline = false, placeholder = '—' }: {
  label: string;
  valeur: string;
  onSave: (v: string) => Promise<unknown>;
  type?: 'text' | 'date';
  large?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(valeur);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = multiline ? textareaRef.current : inputRef.current;
    if (document.activeElement !== el) setLocal(valeur);
  }, [valeur, multiline]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const save = async () => {
    const el = multiline ? textareaRef.current : inputRef.current;
    const v = el?.value ?? '';
    if (v.trim() === valeur.trim()) { setStatus('idle'); setErrorMsg(null); return; }
    setStatus('saving');
    setErrorMsg(null);
    try {
      await onSave(v);
      setStatus('saved');
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setStatus('idle'), 1200);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Échec de l\'enregistrement';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const borderCls =
    status === 'saved' ? 'border-green-500 ring-2 ring-green-200' :
    status === 'error' ? 'border-red-500 ring-2 ring-red-200' :
    status === 'saving' ? 'border-teal ring-2 ring-teal/20' :
    'border-gray-300 focus:border-teal';

  const baseCls = cn(
    'px-2 py-1.5 text-sm border rounded bg-white focus:outline-none transition-colors',
    borderCls,
    large ? 'w-full' : 'w-56'
  );

  return (
    <label className="flex flex-col gap-0.5 min-w-0">
      {label && <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</span>}
      {multiline ? (
        <textarea
          ref={textareaRef}
          rows={2}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) (e.target as HTMLTextAreaElement).blur(); }}
          placeholder={placeholder}
          className={cn(baseCls, 'resize-y min-h-[2.75rem] leading-snug')}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder={placeholder}
          title={local || undefined}
          className={baseCls}
        />
      )}
      {status === 'error' && errorMsg && (
        <span className="text-xs text-red-600 mt-0.5 leading-snug" role="alert">{errorMsg}</span>
      )}
      {status === 'saved' && (
        <span className="text-xs text-green-700 mt-0.5" role="status">Enregistré</span>
      )}
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
      className={cn('w-52 px-2 py-1.5 text-sm font-semibold rounded border border-gray-300 focus:outline-none focus:border-teal', STATUT_IMPL_BADGE[item.statutImpl])}
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
          className="text-sm font-medium px-3 py-1.5 rounded border border-dashed border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 self-start"
        >
          + Signaler un blocage
        </button>
        <ModalCreationBlocage item={item} open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const b = item.blocage;
  return (
    <div className="rounded-lg border border-gray-300 bg-red-50/30 p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide whitespace-nowrap', NATURE_BLOCAGE_BADGE[b.nature] || 'bg-gray-100 text-gray-700')}>{b.nature}</span>
        <span className="text-sm font-medium text-gray-900 truncate" title={b.libelle}>{b.libelle}</span>
      </div>
      <div className="text-sm text-gray-700 whitespace-nowrap">
        <span className="text-gray-500 font-medium">Personne :</span> {b.personneAttendue}
        {b.entiteAttendue && <span className="text-gray-500"> · {b.entiteAttendue}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Échéance</span>
        <ChampInline
          label=""
          type="date"
          valeur={b.echeance ? b.echeance.slice(0, 10) : ''}
          onSave={(v) => majEcheance.mutateAsync(v)}
        />
      </div>
      {item.echeanceDepassee && <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Échéance dépassée</span>}
      <button
        onClick={() => resolution.mutate()}
        className="ml-auto text-sm font-semibold px-3 py-1.5 rounded border border-teal text-teal hover:bg-teal hover:text-white whitespace-nowrap"
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
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-base font-bold text-navy whitespace-nowrap">{item.code}</span>
            {item.phaseMVP && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.phaseMVP}</span>}
          </div>
          <h2 className="text-base text-gray-900 mt-1 leading-snug">{item.titre}</h2>
        </div>
        <div className="text-right shrink-0">
          {item.statutInchange30j && !item.echeanceDepassee && <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Inchangé &gt; 30 j</div>}
          {item.echeanceDepassee && <div className="text-xs font-bold text-red-600 uppercase tracking-wide">Échéance dépassée</div>}
        </div>
      </div>

      {/* Corps */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Statuts côte à côte */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Implémentation</span>
            <SelectStatutImpl item={item} />
            {item.joursDansStatut === null ? (
              <span className="text-sm text-gray-400 italic whitespace-nowrap">aucun changement enregistré</span>
            ) : (
              <span className={cn('text-sm whitespace-nowrap', item.statutInchange30j ? 'font-semibold text-amber-700' : 'text-gray-600')}>
                {item.joursDansStatut === 0 ? 'aujourd\'hui' : `${item.joursDansStatut} jour${item.joursDansStatut > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Gouvernance</span>
            <span className={cn('px-2 py-0.5 rounded text-sm font-semibold whitespace-nowrap', STATUT_VUE_BADGE[item.statutVueSection] || 'bg-gray-100 text-gray-700')}>
              {item.statutVueSection}
            </span>
          </div>
          <div className="text-sm text-gray-700 whitespace-nowrap flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Administrations</span>
            <span>{admTexte}</span>
          </div>
        </div>

        {/* Qualification — édition directe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          <ChampInline label="Identifiant pivot" valeur={item.identifiantPivot ?? ''} onSave={(v) => pivot.mutateAsync(v)} />
          <ChampInline label="Service X-Road" valeur={item.serviceXroad ?? ''} onSave={(v) => serviceXroad.mutateAsync(v)} />
          <div className="md:col-span-2">
            <ChampInline label="Base légale" valeur={item.baseLegale ?? ''} onSave={(v) => baseLegale.mutateAsync(v)} multiline large />
          </div>
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">Portefeuille suivi</h1>
        <p className="text-sm text-gray-600 mt-1">
          {items.length} cas d'usage pilotes — édition directe dans les cartes. Deux alertes seulement : échéance dépassée, statut inchangé depuis plus de 30 jours.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {tri.map((item) => <CartePilotage key={item.id} item={item} />)}
        {tri.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Aucun cas d'usage marqué « pilote ». Le portefeuille est amorcé via l'API (pilote=true).
          </div>
        )}
      </div>
    </div>
  );
}
