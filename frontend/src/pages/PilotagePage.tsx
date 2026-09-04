import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pilotageApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChampInline } from '@/components/ChampInline';
import { Eye, Lock } from 'lucide-react';

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
  aNotePartagee: boolean;
  dateNotePartagee: string | null;
  aNoteInterne?: boolean;         // undefined pour non-ADMIN
  dateNoteInterne?: string | null;
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const resolution = useMutation({
    mutationFn: () => pilotageApi.resoudreBlocage(item.blocage!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilotage'] });
      // Description = libellé du blocage clos, pour que la trace visuelle survive
      // à la disparition du bloc rouge et que l'utilisateur voie ce qui a été clôturé.
      toast({ title: 'Blocage levé', description: item.blocage?.libelle });
      setConfirmOpen(false);
    },
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
        onClick={() => setConfirmOpen(true)}
        className="ml-auto text-sm font-semibold px-3 py-1.5 rounded border border-teal text-teal hover:bg-teal hover:text-white whitespace-nowrap"
      >
        Lever
      </button>

      {/* Confirmation avant levée — action destructrice au sens métier : le
          blocage disparaît de l'écran, on rappelle explicitement ce qu'on clôt. */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Lever ce blocage — {item.code} ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">La levée clôt ce point de suivi et le fait disparaître du portefeuille. À faire uniquement si l'obstacle est effectivement résolu.</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', NATURE_BLOCAGE_BADGE[b.nature] || 'bg-gray-100 text-gray-700')}>{b.nature}</span>
                <span className="text-sm font-medium text-gray-900">{b.libelle}</span>
              </div>
              <div className="text-xs text-gray-600">
                <span className="text-gray-500">Personne attendue :</span> {b.personneAttendue}
                {b.entiteAttendue && <span> · {b.entiteAttendue}</span>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={resolution.isPending}
                className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => resolution.mutate()}
                disabled={resolution.isPending}
                className="text-xs px-3 py-1.5 rounded bg-teal text-white hover:bg-teal-dark disabled:opacity-50 font-semibold"
              >
                {resolution.isPending ? 'Levée en cours…' : 'Confirmer la levée'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

        {/* Notes d'instruction — deux liens séparés, deux régimes de visibilité */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link
            to={`/admin/cas-usage/${item.id}?action=note-partagee`}
            className="inline-flex items-center gap-1.5 text-xs text-teal hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            {item.aNotePartagee
              ? `Note partagée${item.dateNotePartagee ? ` (${new Date(item.dateNotePartagee).toLocaleDateString('fr-FR')})` : ''}`
              : 'Rédiger la note partagée'}
          </Link>
          {item.aNoteInterne !== undefined && (
            <Link
              to={`/admin/cas-usage/${item.id}?action=note-interne`}
              className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:underline"
            >
              <Lock className="w-3.5 h-3.5" />
              {item.aNoteInterne
                ? `Note interne DU${item.dateNoteInterne ? ` (${new Date(item.dateNoteInterne).toLocaleDateString('fr-FR')})` : ''}`
                : 'Rédiger la note interne DU'}
            </Link>
          )}
        </div>
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
