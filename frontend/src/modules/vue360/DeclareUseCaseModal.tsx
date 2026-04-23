/**
 * Modal "Declarer un nouveau cas d'usage"
 * Appelle POST /api/use-cases avec stakeholders pressentis
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
import { Loader2, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_BADGE_STYLES, ROLE_LABELS } from './constants';

interface Props { onClose: () => void }

type StakeholderRow = { institutionId: string; role: 'FOURNISSEUR' | 'CONSOMMATEUR' | 'PARTIE_PRENANTE' };
type RegistreRow = { registreId: string; mode: 'CONSOMME' | 'ALIMENTE' | 'CREE'; champsConcernes: string };

const STAKEHOLDER_ROLES: StakeholderRow['role'][] = ['FOURNISSEUR', 'CONSOMMATEUR', 'PARTIE_PRENANTE'];
const REGISTRE_MODES: RegistreRow['mode'][] = ['CONSOMME', 'ALIMENTE', 'CREE'];

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

  // Stakeholders additionnels (en plus de l'INITIATEUR auto = institution courante)
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([
    { institutionId: '', role: 'FOURNISSEUR' },
  ]);

  // Registres nationaux rattaches (facultatif)
  const [registres, setRegistres] = useState<RegistreRow[]>([]);

  const { data: instsData } = useQuery({
    queryKey: ['insts-declare-cu'],
    queryFn: () => institutionsApi.getAll({ limit: 500 }),
  });

  const { data: registresData } = useQuery({
    queryKey: ['registres-declare-cu'],
    queryFn: () => api.get('/registres-nationaux').then(r => r.data),
  });
  const registresOptions = (registresData || []).map((r: any) => ({
    value: r.id,
    label: `${r.code} — ${r.nom}`,
    sublabel: r.institutionNom,
  }));
  const institutions = (instsData?.data?.data || []) as any[];
  const instOptionsCode = institutions.map((i: any) => ({
    value: i.code,
    label: `${i.code} — ${i.nom}`,
    sublabel: i.ministere,
  }));
  const instOptionsId = institutions.map((i: any) => ({
    value: i.id,
    label: `${i.code} — ${i.nom}`,
    sublabel: i.ministere,
  }));

  const createMut = useMutation({
    mutationFn: () => {
      const validStakeholders = stakeholders.filter(s => s.institutionId && s.role);
      const validRegistres = registres
        .filter(r => r.registreId && r.mode)
        .map(r => ({
          registreId: r.registreId,
          mode: r.mode,
          champsConcernes: r.champsConcernes
            ? r.champsConcernes.split(',').map(c => c.trim()).filter(Boolean)
            : null,
        }));
      return api.post('/use-cases', {
        ...form,
        stakeholders: validStakeholders,
        registresAssocies: validRegistres,
      });
    },
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

  const addStakeholder = () => setStakeholders([...stakeholders, { institutionId: '', role: 'FOURNISSEUR' }]);
  const removeStakeholder = (idx: number) => setStakeholders(stakeholders.filter((_, i) => i !== idx));
  const updateStakeholder = (idx: number, patch: Partial<StakeholderRow>) => {
    setStakeholders(stakeholders.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const addRegistre = () => setRegistres([...registres, { registreId: '', mode: 'CONSOMME', champsConcernes: '' }]);
  const removeRegistre = (idx: number) => setRegistres(registres.filter((_, i) => i !== idx));
  const updateRegistre = (idx: number, patch: Partial<RegistreRow>) => {
    setRegistres(registres.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[720px] max-w-[92vw] max-h-[90vh] overflow-y-auto">
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
          {/* Titre */}
          <div>
            <Label className="text-xs">Titre <span className="text-red-500">*</span></Label>
            <Input
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Verification NINEA pour controles fiscaux"
              className="h-9 text-sm"
            />
          </div>

          {/* Resume */}
          <div>
            <Label className="text-xs">Resume metier <span className="text-red-500">*</span></Label>
            <Textarea
              value={form.resumeMetier}
              onChange={e => setForm({ ...form, resumeMetier: e.target.value })}
              rows={3}
              placeholder="Objectif, usage, beneficiaires (2-3 lignes)"
              className="text-sm"
            />
          </div>

          {/* Base legale */}
          <div>
            <Label className="text-xs">Base legale</Label>
            <Input
              value={form.baseLegale}
              onChange={e => setForm({ ...form, baseLegale: e.target.value })}
              placeholder="Ex : Code Général des Impôts, article 23"
              className="h-9 text-sm"
            />
          </div>

          {/* Institution cible (metadata) */}
          <div>
            <Label className="text-xs">Institution cible principale (facultatif — pour l'affichage fluxe)</Label>
            <SearchableSelect
              options={instOptionsCode}
              value={form.institutionCibleCode}
              onChange={v => setForm({ ...form, institutionCibleCode: v })}
              placeholder="Selectionner l'institution cible du flux..."
            />
          </div>

          {/* Stakeholders pressentis — CLEE METIER */}
          <div className="border-2 border-dashed border-teal/30 rounded-lg p-3 bg-teal-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-navy">Parties prenantes a solliciter</Label>
              <button
                type="button"
                onClick={addStakeholder}
                className="inline-flex items-center gap-1 text-[11px] text-teal font-semibold hover:bg-teal/10 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            <p className="text-[10px] text-gray-500">Une consultation sera ouverte automatiquement pour chaque fournisseur et consommateur designe. Pas besoin d'ajouter votre institution : elle est deja inscrite comme initiatrice.</p>

            {stakeholders.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-2">Aucune partie prenante designee — le cas d'usage sera porte par votre seule institution</p>
            )}

            {stakeholders.map((sh, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    options={instOptionsId}
                    value={sh.institutionId}
                    onChange={v => updateStakeholder(idx, { institutionId: v })}
                    placeholder="Selectionner l'institution..."
                  />
                </div>
                <select
                  value={sh.role}
                  onChange={e => updateStakeholder(idx, { role: e.target.value as StakeholderRow['role'] })}
                  className="h-9 px-2 text-xs border rounded-md bg-white"
                >
                  {STAKEHOLDER_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <span className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0', ROLE_BADGE_STYLES[sh.role])}>
                  {ROLE_LABELS[sh.role]}
                </span>
                <button
                  type="button"
                  onClick={() => removeStakeholder(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  aria-label="Retirer cette partie prenante"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Registres nationaux rattaches (facultatif) */}
          <div className="border-2 border-dashed border-gold/30 rounded-lg p-3 bg-gold-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-navy">Referentiels nationaux touches <span className="text-gray-400 font-normal">(facultatif)</span></Label>
              <button
                type="button"
                onClick={addRegistre}
                className="inline-flex items-center gap-1 text-[11px] text-gold-dark font-semibold hover:bg-gold/10 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            <p className="text-[10px] text-gray-500">Les registres rattaches permettent la detection de doublons et alimentent le radar sectoriel des autres institutions.</p>

            {registres.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-1">Aucun registre rattache</p>
            )}

            {registres.map((reg, idx) => (
              <div key={idx} className="space-y-1.5 border-b last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={registresOptions}
                      value={reg.registreId}
                      onChange={v => updateRegistre(idx, { registreId: v })}
                      placeholder="Selectionner un referentiel national..."
                    />
                  </div>
                  <select
                    value={reg.mode}
                    onChange={e => updateRegistre(idx, { mode: e.target.value as RegistreRow['mode'] })}
                    className="h-9 px-2 text-xs border rounded-md bg-white"
                  >
                    {REGISTRE_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRegistre(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    aria-label="Retirer ce referentiel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={reg.champsConcernes}
                  onChange={e => updateRegistre(idx, { champsConcernes: e.target.value })}
                  placeholder="Champs concernes (virgules) ex: ninea, raisonSociale, statutFiscal"
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>

          {/* Donnees */}
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

          {/* Axe + impact */}
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
            Le cas d'usage sera cree en statut <b>Declare</b>. Une consultation sera automatiquement ouverte pour chaque fournisseur et consommateur designe (SLA 15 jours).
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={!isValid || createMut.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                isValid ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
              )}
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
