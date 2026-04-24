/**
 * Modal "Declarer un nouveau cas d'usage" — parcours en 3 etapes (P9)
 *   Etape 1 : typologie (parcours metier vs service technique)
 *   Etape 2 : detection de doublons apres saisie du titre
 *   Etape 3 : formulaire adapte selon la typologie choisie
 *
 * Appelle POST /api/use-cases avec stakeholders pressentis, registres,
 * typologie, et (si METIER) casUsagesTechniquesMobilises.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api, institutionsApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { Loader2, X, Plus, Trash2, ArrowLeft, ArrowRight, AlertTriangle, Check, Users, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_BADGE_STYLES, ROLE_LABELS } from './constants';

interface Props { onClose: () => void }

type Typologie = 'METIER' | 'TECHNIQUE';
type Step = 1 | 2 | 3;
type StakeholderRow = { institutionId: string; role: 'FOURNISSEUR' | 'CONSOMMATEUR' | 'PARTIE_PRENANTE' };
type RegistreRow = { registreId: string; mode: 'CONSOMME' | 'ALIMENTE' | 'CREE'; champsConcernes: string };

const STAKEHOLDER_ROLES: StakeholderRow['role'][] = ['FOURNISSEUR', 'CONSOMMATEUR', 'PARTIE_PRENANTE'];
const REGISTRE_MODES: RegistreRow['mode'][] = ['CONSOMME', 'ALIMENTE', 'CREE'];

export function DeclareUseCaseModal({ onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [typologie, setTypologie] = useState<Typologie | null>(null);
  const [form, setForm] = useState({
    titre: '',
    resumeMetier: '',
    baseLegale: '',
    institutionCibleCode: '',
    donneesEchangees: '',
    axePrioritaire: 'Finances publiques',
    impact: 'MOYEN',
    conventionLieeId: '',
  });
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([
    { institutionId: '', role: 'FOURNISSEUR' },
  ]);
  const [registres, setRegistres] = useState<RegistreRow[]>([]);
  // Comma-separated string for MultiSearchableSelect compatibility
  const [techniquesMobilisesCsv, setTechniquesMobilisesCsv] = useState<string>('');
  const techniquesMobilises = techniquesMobilisesCsv
    ? techniquesMobilisesCsv.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const [doublonsIgnored, setDoublonsIgnored] = useState(false);

  // Debounce titre pour suggestions
  const [debouncedTitre, setDebouncedTitre] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitre(form.titre), 400);
    return () => clearTimeout(t);
  }, [form.titre]);

  const { data: suggestions } = useQuery({
    queryKey: ['declare-suggestions', debouncedTitre, typologie],
    queryFn: () => api.post('/catalogue/suggestions', {
      titre: debouncedTitre,
      resumeMetier: form.resumeMetier,
      typologie,
    }).then((r: any) => r.data),
    enabled: step === 2 && debouncedTitre.length >= 5,
  });

  const { data: instsData } = useQuery({
    queryKey: ['insts-declare-cu'],
    queryFn: () => institutionsApi.getAll({ limit: 500 }),
  });
  const { data: registresData } = useQuery({
    queryKey: ['registres-declare-cu'],
    queryFn: () => api.get('/registres-nationaux').then((r: any) => r.data),
  });
  const { data: conventionsData } = useQuery({
    queryKey: ['conventions-declare'],
    queryFn: () => api.get('/conventions').then((r: any) => r.data),
    enabled: typologie === 'TECHNIQUE',
  });
  const { data: techniquesData } = useQuery({
    queryKey: ['techniques-in-pipeline'],
    queryFn: () => api.get('/use-cases/catalog', {
      params: { typologie: 'TECHNIQUE', limit: 100 },
    }).then((r: any) => r.data),
    enabled: typologie === 'METIER',
  });

  const institutions = (instsData?.data?.data || []) as any[];
  const instOptionsCode = institutions.map((i: any) => ({
    value: i.code, label: `${i.code} — ${i.nom}`, sublabel: i.ministere,
  }));
  const instOptionsId = institutions.map((i: any) => ({
    value: i.id, label: `${i.code} — ${i.nom}`, sublabel: i.ministere,
  }));
  const registresOptions = (registresData || []).map((r: any) => ({
    value: r.id, label: `${r.code} — ${r.nom}`, sublabel: r.institutionNom,
  }));
  const conventionsOptions = (conventionsData || []).map((c: any) => ({
    value: c.id,
    label: `${c.institutionA?.code} ↔ ${c.institutionB?.code}`,
    sublabel: c.objet?.substring(0, 80),
  }));
  const techniquesOptions = (techniquesData?.data || []).map((cu: any) => ({
    value: cu.id,
    label: `${cu.code} — ${cu.titre}`,
    sublabel: cu.institutionSourceCode,
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
        typologie,
        stakeholders: validStakeholders,
        registresAssocies: validRegistres,
        conventionLieeId: typologie === 'TECHNIQUE' && form.conventionLieeId ? form.conventionLieeId : undefined,
        casUsagesTechniquesMobilises: typologie === 'METIER' ? techniquesMobilises : undefined,
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

  // Validations finales etape 3
  const titreOk = form.titre.length >= 5;
  const resumeOk = form.resumeMetier.length >= 10;
  const stakeholdersOk = stakeholders.some(
    s => s.institutionId && (s.role === 'FOURNISSEUR' || s.role === 'CONSOMMATEUR')
  );
  const isValidStep3 = titreOk && resumeOk && stakeholdersOk;

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

  const suggestionsFound = (suggestions?.length || 0) > 0;
  const adoptables = (suggestions || []).filter((s: any) => s.adoptable);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-12 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-[760px] max-w-[92vw] max-h-[90vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy">Declarer un nouveau cas d'usage</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Etape {step}/3 — {step === 1 ? 'Nature du cas d\'usage' : step === 2 ? 'Eviter les doublons' : 'Formulaire'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4">
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={cn(
                  'flex-1 h-1 rounded-full',
                  s <= step ? 'bg-teal' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* ====================================================== */}
          {/* ETAPE 1 — TYPOLOGIE                                    */}
          {/* ====================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-navy">Quelle est la nature de votre cas d'usage ?</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Un <b>parcours metier</b> (ex : creation d'entreprise, demande de passeport) coordonne
                  plusieurs services techniques pour rendre un service au citoyen ou a l'entreprise.
                  Un <b>service technique</b> (ex : verification NINEA, consultation RCCM) est un
                  echange de donnees bilateral, reutilisable par plusieurs parcours metier.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTypologie('METIER')}
                  className={cn(
                    'p-4 text-left border-2 rounded-lg transition-colors',
                    typologie === 'METIER' ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-navy/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-navy" />
                    <div className="font-bold text-navy">Parcours metier</div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Service rendu a un beneficiaire final, mobilisant plusieurs administrations.
                  </p>
                  <p className="text-[10px] text-gray-500 italic mt-2">
                    Ex : Creation d'entreprise, attribution d'une bourse, demande de passeport
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTypologie('TECHNIQUE')}
                  className={cn(
                    'p-4 text-left border-2 rounded-lg transition-colors',
                    typologie === 'TECHNIQUE' ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-teal/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Cog className="w-5 h-5 text-teal" />
                    <div className="font-bold text-teal">Service technique</div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Echange de donnees bilateral entre deux systemes.
                  </p>
                  <p className="text-[10px] text-gray-500 italic mt-2">
                    Ex : Verification NINEA, consultation RCCM, affiliation CSS
                  </p>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-200">
                <button
                  type="button"
                  disabled={!typologie}
                  onClick={() => setStep(2)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                    typologie ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
                  )}
                >
                  Continuer
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* ETAPE 2 — DETECTION DOUBLONS                           */}
          {/* ====================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-navy">Donnez un titre provisoire</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Nous recherchons automatiquement les propositions et cas d'usage existants similaires
                  pour eviter les doublons.
                </p>
              </div>

              <div>
                <Label className="text-xs">Titre <span className="text-red-500">*</span></Label>
                <Input
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex : Verification NINEA pour controles fiscaux"
                  className="h-9 text-sm"
                />
                <div className="text-[10px] text-gray-400 mt-1">
                  {form.titre.length < 5 ? `Tapez au moins 5 caracteres pour lancer la recherche` : 'Suggestions mises a jour en temps reel'}
                </div>
              </div>

              <div>
                <Label className="text-xs">Resume metier (optionnel a ce stade)</Label>
                <Textarea
                  value={form.resumeMetier}
                  onChange={e => setForm({ ...form, resumeMetier: e.target.value })}
                  rows={2}
                  placeholder="En 2-3 mots-cles, pour ameliorer la detection"
                  className="text-sm"
                />
              </div>

              {/* Suggestions trouvees */}
              {suggestionsFound && !doublonsIgnored && (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <AlertTriangle className="w-4 h-4" />
                    {suggestions.length} cas d'usage ressemble{suggestions.length > 1 ? 'nt' : ''} a votre saisie
                  </div>
                  <div className="space-y-1.5">
                    {suggestions.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="p-2 bg-white rounded border border-amber-200 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-gray-600">{s.code}</span>
                          {s.adoptable ? (
                            <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/30">
                              Proposition adoptable
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border">
                              Deja en pipeline
                            </span>
                          )}
                          <span className="text-gray-500 flex-1 min-w-0 truncate">{s.titre}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {adoptables.length > 0 && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-amber-900">
                        Voulez-vous plutot adopter une proposition existante ?
                      </span>
                      <Link
                        to="/catalogue/propositions"
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded bg-teal text-white hover:bg-teal/90"
                      >
                        Voir les propositions
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDoublonsIgnored(true)}
                        className="text-[11px] text-gray-600 underline"
                      >
                        Creer quand meme un nouveau CU
                      </button>
                    </div>
                  )}
                  {adoptables.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setDoublonsIgnored(true)}
                      className="text-[11px] text-amber-900 underline"
                    >
                      J'ai pris connaissance, continuer
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Retour
                </button>
                <button
                  type="button"
                  disabled={!titreOk || (suggestionsFound && !doublonsIgnored)}
                  onClick={() => setStep(3)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                    titreOk && (!suggestionsFound || doublonsIgnored) ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
                  )}
                >
                  Continuer
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* ETAPE 3 — FORMULAIRE ADAPTE                            */}
          {/* ====================================================== */}
          {step === 3 && (
            <>
              {/* Badge typologie en tete */}
              <div className={cn(
                'flex items-center gap-2 p-2 rounded text-xs',
                typologie === 'METIER' ? 'bg-navy/5 text-navy' : 'bg-teal/5 text-teal'
              )}>
                {typologie === 'METIER' ? <Users className="w-4 h-4" /> : <Cog className="w-4 h-4" />}
                <span className="font-semibold">
                  {typologie === 'METIER' ? 'Parcours metier' : 'Service technique'}
                </span>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-[10px] underline">
                  Changer
                </button>
              </div>

              {/* Titre */}
              <div>
                <Label className="text-xs">Titre <span className="text-red-500">*</span></Label>
                <Input
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
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
                  placeholder={typologie === 'METIER'
                    ? 'Beneficiaire final, etapes du parcours, valeur ajoutee (2-3 lignes)'
                    : 'Donnee echangee, usage, beneficiaire consommateur (2-3 lignes)'}
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

              {/* Champ specifique TECHNIQUE : convention liee */}
              {typologie === 'TECHNIQUE' && (
                <div>
                  <Label className="text-xs">Convention liee <span className="text-gray-400 font-normal">(facultatif)</span></Label>
                  <SearchableSelect
                    options={conventionsOptions}
                    value={form.conventionLieeId}
                    onChange={v => setForm({ ...form, conventionLieeId: v })}
                    placeholder="Selectionner une convention existante..."
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    La convention sera reliee pour faciliter l'acces au document et le suivi juridique.
                  </div>
                </div>
              )}

              {/* Champ specifique METIER : services techniques mobilises */}
              {typologie === 'METIER' && (
                <div>
                  <Label className="text-xs">Services techniques mobilises <span className="text-gray-400 font-normal">(multi-selection)</span></Label>
                  <MultiSearchableSelect
                    options={techniquesOptions}
                    value={techniquesMobilisesCsv}
                    onChange={setTechniquesMobilisesCsv}
                    placeholder="Ajouter des cas d'usage techniques deja presents dans le pipeline..."
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    Chaque service technique selectionne sera relie a ce parcours (relation N-N).
                  </div>
                </div>
              )}

              {/* Institution cible */}
              <div>
                <Label className="text-xs">
                  Institution cible principale <span className="text-gray-400 font-normal">(facultatif)</span>
                </Label>
                <SearchableSelect
                  options={instOptionsCode}
                  value={form.institutionCibleCode}
                  onChange={v => setForm({ ...form, institutionCibleCode: v })}
                  placeholder="Selectionner l'institution cible..."
                />
              </div>

              {/* Stakeholders */}
              <div className={cn(
                'border-2 border-dashed rounded-lg p-3 space-y-2',
                stakeholdersOk ? 'border-teal/30 bg-teal-50/20' : 'border-red-400 bg-red-50/30'
              )}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-navy">
                    Parties prenantes a solliciter <span className="text-red-500">*</span>
                  </Label>
                  <button type="button" onClick={addStakeholder} className="inline-flex items-center gap-1 text-[11px] text-teal font-semibold hover:bg-teal/10 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">
                  Au moins une institution FOURNISSEUR ou CONSOMMATEUR. Consultation ouverte automatiquement (SLA 15 jours).
                </p>
                {stakeholders.map((sh, idx) => (
                  <div key={idx} className={cn('flex items-center gap-2 p-1 rounded', !sh.institutionId && 'ring-1 ring-red-300 bg-red-50/40')}>
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
                      {STAKEHOLDER_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <span className={cn('inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0', ROLE_BADGE_STYLES[sh.role])}>
                      {ROLE_LABELS[sh.role]}
                    </span>
                    <button type="button" onClick={() => removeStakeholder(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Registres */}
              <div className="border-2 border-dashed border-gold/30 rounded-lg p-3 bg-gold-50/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-navy">
                    Referentiels nationaux touches <span className="text-gray-400 font-normal">(facultatif)</span>
                  </Label>
                  <button type="button" onClick={addRegistre} className="inline-flex items-center gap-1 text-[11px] text-gold-dark font-semibold hover:bg-gold/10 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
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
                      <button type="button" onClick={() => removeRegistre(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Input
                      value={reg.champsConcernes}
                      onChange={e => updateRegistre(idx, { champsConcernes: e.target.value })}
                      placeholder="Champs concernes (virgules)"
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
                Le cas d'usage sera cree en statut <b>Declare</b>, typologie <b>{typologie === 'METIER' ? 'Parcours metier' : 'Service technique'}</b>.
                Consultation ouverte pour chaque partie prenante (SLA 15 jours).
                {typologie === 'METIER' && techniquesMobilises.length > 0 && (
                  <> {techniquesMobilises.length} service{techniquesMobilises.length > 1 ? 's' : ''} technique{techniquesMobilises.length > 1 ? 's' : ''} sera{techniquesMobilises.length > 1 ? 'ont' : ''} relie{techniquesMobilises.length > 1 ? 's' : ''}.</>
                )}
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
                  <ArrowLeft className="w-3 h-3" /> Retour
                </button>
                <div className="flex gap-2 items-center">
                  {!isValidStep3 && (
                    <div className="text-[11px] text-red-600 text-right">
                      {!resumeOk && <div>• Resume min. 10 caracteres</div>}
                      {!stakeholdersOk && <div>• Au moins 1 FOURNISSEUR/CONSOMMATEUR</div>}
                    </div>
                  )}
                  <button
                    onClick={() => createMut.mutate()}
                    disabled={!isValidStep3 || createMut.isPending}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white',
                      isValidStep3 ? 'bg-teal hover:bg-teal/90' : 'bg-gray-300 cursor-not-allowed'
                    )}
                  >
                    {createMut.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Check className="w-3 h-3" />
                    Declarer le cas d'usage
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
