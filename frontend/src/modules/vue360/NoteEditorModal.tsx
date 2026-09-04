import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, X, FilePlus, Eye, Lock } from 'lucide-react';
import { MarkdownPreview } from '@/components/MarkdownPreview';

type Kind = 'partagee' | 'interne';

const SKELETON_PARTAGEE = `## Circuit actuel (AS-IS)

## Registres concernés

## Parties prenantes

## Applications existantes

## Circuit cible (TO-BE)
`;

const SKELETON_INTERNE = `## Points durs et risques

## Positions à tenir

## Prochaine action
`;

const CONFIG: Record<Kind, { title: string; endpoint: string; body: (v: string | null) => any; skeleton: string; ribbon: string; ribbonClass: string; borderClass: string; icon: typeof Eye }> = {
  partagee: {
    title: 'Note d\'instruction — partagée',
    endpoint: 'note-partagee',
    body: (v) => ({ notePartagee: v }),
    skeleton: SKELETON_PARTAGEE,
    ribbon: 'Visible par les parties prenantes',
    ribbonClass: 'bg-teal/10 text-teal border-teal/40',
    borderClass: 'border-teal',
    icon: Eye,
  },
  interne: {
    title: 'Note d\'instruction — interne',
    endpoint: 'note-interne',
    body: (v) => ({ noteInterne: v }),
    skeleton: SKELETON_INTERNE,
    ribbon: 'Interne Delivery Unit',
    ribbonClass: 'bg-amber-100 text-amber-800 border-amber-400',
    borderClass: 'border-amber-500',
    icon: Lock,
  },
};

type Props = {
  kind: Kind;
  casUsageId: string;
  casUsageCode: string;
  casUsageTitre: string;
  initialValue: string | null;
  initialDate: string | null;
  editable: boolean;
  onClose: () => void;
};

export function NoteEditorModal({ kind, casUsageId, casUsageCode, casUsageTitre, initialValue, initialDate, editable, onClose }: Props) {
  const cfg = CONFIG[kind];
  const RibbonIcon = cfg.icon;
  const [value, setValue] = useState(initialValue || '');
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !dirty) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, onClose]);

  const saveMut = useMutation({
    mutationFn: () => api.patch(`/use-cases/${casUsageId}/${cfg.endpoint}`, cfg.body(value)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail', casUsageId] });
      qc.invalidateQueries({ queryKey: ['pilotage'] });
      setDirty(false);
      toast({ title: `${cfg.title} enregistrée` });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Impossible d\'enregistrer' }),
  });

  const insertSkeleton = () => { setValue(cfg.skeleton); setDirty(true); };
  const handleChange = (v: string) => { setValue(v); setDirty(v !== (initialValue || '')); };
  const handleClose = () => {
    if (dirty && !window.confirm('Vos modifications ne sont pas enregistrées. Fermer quand même ?')) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-navy/60 z-50 flex flex-col p-6">
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col flex-1 overflow-hidden border-t-4 ${cfg.borderClass}`}>
        {/* Bandeau de mode : lisible, jamais en petit texte */}
        <div className={`px-5 py-2 border-b flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${cfg.ribbonClass}`}>
          <RibbonIcon className="w-4 h-4" />
          {cfg.ribbon}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b bg-gray-50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-teal">{casUsageCode}</span>
              <span className="text-sm font-bold text-navy truncate">{casUsageTitre}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {cfg.title} · {initialDate ? `dernière mise à jour ${new Date(initialDate).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'jamais renseignée'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {editable && !value && (
              <button type="button" onClick={insertSkeleton} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-teal text-teal hover:bg-teal hover:text-white">
                <FilePlus className="w-3.5 h-3.5" /> Insérer la trame
              </button>
            )}
            {editable && (
              <button type="button" onClick={() => saveMut.mutate()} disabled={!dirty || saveMut.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-teal text-white hover:bg-teal-dark disabled:opacity-50">
                {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </button>
            )}
            <button type="button" onClick={handleClose} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100" title="Fermer (Echap)">
              <X className="w-3.5 h-3.5" /> Fermer
            </button>
          </div>
        </div>

        {/* Split source | preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
          <div className="border-r flex flex-col min-h-0">
            <div className="px-4 py-2 text-[10px] uppercase tracking-wide font-semibold text-gray-500 border-b bg-white">Source markdown{!editable && ' (lecture seule)'}</div>
            <textarea
              value={value}
              onChange={e => handleChange(e.target.value)}
              readOnly={!editable}
              placeholder={editable ? 'Rédigez la note. ## titres, ** gras, - listes, | tableaux |.' : ''}
              className="flex-1 w-full p-4 text-sm font-mono text-gray-800 focus:outline-none resize-none"
            />
          </div>
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-2 text-[10px] uppercase tracking-wide font-semibold text-gray-500 border-b bg-white">Prévisualisation</div>
            <div className="flex-1 overflow-y-auto p-5">
              {value ? <MarkdownPreview source={value} variant="full" /> : <p className="text-sm text-gray-400 italic">Aucune note. Cliquez sur « Insérer la trame » pour partir du modèle.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
