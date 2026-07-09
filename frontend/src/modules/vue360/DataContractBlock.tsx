import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ChevronRight, FileText, AlertCircle, Loader2, Pencil, Clock } from 'lucide-react';

function FieldBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
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

interface ContratCourant {
  donneesEntree?: string | null;
  donneesSortie?: string | null;
  donneesLecture?: string | null;
  baseLegale?: string | null;
  dureeRetention?: string | null;
  derniereVersion: number;
  derniereModification: string | null;
  dernierAuteur: { nom: string; institution: string } | null;
  _editable: boolean;
}

const CHAMPS = [
  { key: 'donneesEntree', label: "Données d'entrée (clé d'appel)" },
  { key: 'donneesSortie', label: 'Données de sortie (réponse)' },
  { key: 'donneesLecture', label: 'Données de lecture (registre producteur)' },
  { key: 'baseLegale', label: 'Base légale' },
  { key: 'dureeRetention', label: 'Durée de rétention' },
] as const;

export function DataContractBlock({ cu }: { cu: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: contrat, isLoading: contratLoading } = useQuery<ContratCourant>({
    queryKey: ['contrat-donnees', cu.id],
    queryFn: () => api.get(`/use-cases/${cu.id}/contrat-donnees`).then(r => r.data),
    enabled: !!cu.id,
  });

  const editable = contrat?._editable ?? false;

  // Initialiser le formulaire quand les données arrivent
  useEffect(() => {
    if (contrat && editing) {
      setForm({
        donneesEntree: contrat.donneesEntree || '',
        donneesSortie: contrat.donneesSortie || '',
        donneesLecture: contrat.donneesLecture || '',
        baseLegale: contrat.baseLegale || '',
        dureeRetention: contrat.dureeRetention || '',
      });
    }
  }, [contrat, editing]);

  const { data: versions = [], isFetching: versionsLoading } = useQuery({
    queryKey: ['contrat-donnees-versions', cu.id],
    queryFn: () => api.get(`/use-cases/${cu.id}/contrat-donnees/versions`).then(r => r.data),
    enabled: showHistory && !!cu.id,
  });

  const saveMut = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api.post(`/use-cases/${cu.id}/contrat-donnees`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrat-donnees', cu.id] });
      qc.invalidateQueries({ queryKey: ['contrat-donnees-versions', cu.id] });
      qc.invalidateQueries({ queryKey: ['vue360-use-case-detail'] });
      toast({ title: 'Contrat de données mis à jour', description: 'Une nouvelle version a été créée.' });
      setEditing(false);
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Échec de la mise à jour' });
    },
  });

  const hasAnyField = contrat && (
    contrat.donneesEntree || contrat.donneesSortie || contrat.donneesLecture ||
    contrat.baseLegale || contrat.dureeRetention
  );

  // Déterminer le statut de documentation
  const nbRenseignes = contrat
    ? [contrat.donneesEntree, contrat.donneesSortie, contrat.donneesLecture, contrat.baseLegale, contrat.dureeRetention].filter(Boolean).length
    : 0;
  const allDocumented = nbRenseignes === 5;
  const partialDocumented = nbRenseignes > 0 && nbRenseignes < 5;

  if (contratLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <details className="bg-white rounded-lg border shadow-sm" open={!!hasAnyField}>
      <summary className="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
        <ChevronRight className="w-4 h-4 text-teal transition-transform" />
        <div className="font-bold text-navy">Contrat de données</div>
        {allDocumented ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-teal-50 text-teal-700 border border-teal-200">
            <FileText className="w-3 h-3" />
            Documenté
          </span>
        ) : partialDocumented ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
            <FileText className="w-3 h-3" />
            Partiel
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Non documenté
          </span>
        )}
        {contrat && contrat.derniereVersion > 0 && (
          <span className="text-[10px] text-gray-400 ml-auto">
            v{contrat.derniereVersion}
            {contrat.derniereModification && (
              <> · {new Date(contrat.derniereModification).toLocaleDateString('fr-FR')}</>
            )}
          </span>
        )}
      </summary>

      <div className="px-4 pb-4 space-y-3">
        {/* Mode édition */}
        {editing ? (
          <div className="space-y-3">
            {CHAMPS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</label>
                <textarea
                  rows={3}
                  value={form[key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2.5 text-xs focus:border-teal focus:ring-1 focus:ring-teal outline-none"
                  placeholder={label}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={() => saveMut.mutate(form)}
                disabled={saveMut.isPending}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md text-white',
                  saveMut.isPending ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal hover:bg-teal/90',
                )}
              >
                {saveMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Enregistrer (v{contrat ? contrat.derniereVersion + 1 : 1})
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode lecture */}
            {hasAnyField ? (
              <>
                <FieldBlock label="Données d'entrée (clé d'appel)" value={contrat?.donneesEntree} />
                <FieldBlock label="Données de sortie (réponse)" value={contrat?.donneesSortie} />
                <FieldBlock label="Données de lecture (registre producteur)" value={contrat?.donneesLecture} />
                <FieldBlock label="Base légale" value={contrat?.baseLegale} />
                <FieldBlock label="Durée de rétention" value={contrat?.dureeRetention} />
                {contrat?.dernierAuteur && contrat.derniereVersion > 0 && (
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3" />
                    v{contrat.derniereVersion} — modifié par {contrat.dernierAuteur.nom} ({contrat.dernierAuteur.institution})
                    {contrat.derniereModification && <> le {new Date(contrat.derniereModification).toLocaleDateString('fr-FR')}</>}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-500">Ce service n'a pas encore de contrat de données renseigné.</div>
            )}

            {/* Bouton Modifier */}
            {editable && (
              <div className="pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md text-teal hover:bg-teal/10 border border-teal/30"
                >
                  <Pencil className="w-3 h-3" />
                  {hasAnyField ? 'Modifier le contrat' : 'Renseigner le contrat'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Historique des versions */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] font-semibold text-gray-500 hover:text-teal flex items-center gap-1"
          >
            <ChevronRight className={cn('w-3 h-3 transition-transform', showHistory && 'rotate-90')} />
            Historique des versions
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-2"><Loader2 className="w-3 h-3 animate-spin text-gray-400" /></div>
              ) : versions.length === 0 ? (
                <div className="text-[10px] text-gray-400 py-1">Aucune version enregistrée</div>
              ) : (
                versions.map((v: any) => (
                  <div key={v.id} className="text-[10px] bg-gray-50 rounded p-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-navy">v{v.versionNumber}</span>
                      <span className="text-gray-400">
                        {new Date(v.createdAt).toLocaleDateString('fr-FR')} · {new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-0.5">
                      {v.auteurNom} · {v.auteurInstitution}
                    </div>
                    <div className="text-gray-400 mt-0.5">
                      {[v.donneesEntree && 'entrée', v.donneesSortie && 'sortie', v.donneesLecture && 'lecture', v.baseLegale && 'base légale', v.dureeRetention && 'rétention']
                        .filter(Boolean).join(', ') || '—'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
