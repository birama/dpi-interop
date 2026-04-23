/**
 * Modal "Declarer un nouveau cas d'usage"
 * Appelle POST /api/use-cases (stakeholder INITIATEUR + statusHistory auto)
 */

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, institutionsApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2, X } from 'lucide-react';

interface Props { onClose: () => void }

export function DeclareUseCaseModal({ onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titre: '',
    resumeMetier: '',
    baseLegale: '',
    institutionCibleCode: '',
    donneesEchangees: '',
    axePrioritaire: 'Finances publiques',
    impact: 'MOYEN',
  });

  const { data: instsData } = useQuery({
    queryKey: ['insts-declare-cu'],
    queryFn: () => institutionsApi.getAll({ limit: 500 }),
  });
  const instOptions = (instsData?.data?.data || []).map((i: any) => ({
    value: i.code,
    label: `${i.code} — ${i.nom}`,
    sublabel: i.ministere,
  }));

  const createMut = useMutation({
    mutationFn: () => api.post('/use-cases', form),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['vue360-outgoing'] });
      qc.invalidateQueries({ queryKey: ['vue360-involved'] });
      qc.invalidateQueries({ queryKey: ['du-arbitrage'] });
      toast({ title: 'Cas d\'usage cree', description: `${r.data.code} — ${r.data.titre}` });
      onClose();
      navigate(`/admin/cas-usage/${r.data.id}`);
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || 'Echec de la creation' });
    },
  });

  const isValid = form.titre.length >= 5 && form.resumeMetier.length >= 10;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[640px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy">Declarer un nouveau cas d'usage</h3>
            <p className="text-xs text-gray-500 mt-0.5">Votre institution sera inscrite comme initiatrice.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <Label className="text-xs">Titre <span className="text-red-500">*</span></Label>
            <Input
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Verification NINEA pour controles fiscaux"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Resume metier <span className="text-red-500">*</span></Label>
            <Textarea
              value={form.resumeMetier}
              onChange={e => setForm({ ...form, resumeMetier: e.target.value })}
              rows={3}
              placeholder="Objectif, usage, bénéficiaires (2-3 lignes)"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Base legale</Label>
            <Input
              value={form.baseLegale}
              onChange={e => setForm({ ...form, baseLegale: e.target.value })}
              placeholder="Ex : Code Général des Impôts, article 23"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Institution cible (fournisseur pressenti)</Label>
            <SearchableSelect
              options={instOptions}
              value={form.institutionCibleCode}
              onChange={v => setForm({ ...form, institutionCibleCode: v })}
              placeholder="Sélectionner l'institution détentrice des données..."
            />
          </div>

          <div>
            <Label className="text-xs">Donnees echangees</Label>
            <Textarea
              value={form.donneesEchangees}
              onChange={e => setForm({ ...form, donneesEchangees: e.target.value })}
              rows={2}
              placeholder="Ex : NINEA, raison sociale, statut fiscal"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Axe prioritaire</Label>
              <select
                value={form.axePrioritaire}
                onChange={e => setForm({ ...form, axePrioritaire: e.target.value })}
                className="w-full h-9 px-2 text-sm border rounded-md"
              >
                <option value="Finances publiques">Finances publiques</option>
                <option value="Protection sociale">Protection sociale</option>
                <option value="Climat des affaires">Climat des affaires</option>
                <option value="Services citoyens">Services citoyens</option>
                <option value="Transversal">Transversal</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Impact estime</Label>
              <select
                value={form.impact}
                onChange={e => setForm({ ...form, impact: e.target.value })}
                className="w-full h-9 px-2 text-sm border rounded-md"
              >
                <option value="FAIBLE">Faible</option>
                <option value="MOYEN">Moyen</option>
                <option value="ELEVE">Eleve</option>
                <option value="CRITIQUE">Critique</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-teal-50 rounded-lg text-[11px] text-gray-600">
            Le cas d'usage sera cree en statut <b>Declare</b>. Vous pourrez ensuite designer les parties prenantes et ouvrir la phase de consultation depuis la fiche.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={!isValid || createMut.isPending}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white ${isValid ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              {createMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Declarer le cas d'usage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
