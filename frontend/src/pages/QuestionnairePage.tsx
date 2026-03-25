import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { submissionsApi, institutionsApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Save, Send, Loader2, Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { InfrastructureSection } from '@/components/forms/InfrastructureSection';
import { NiveauxInteropSection } from '@/components/forms/NiveauxInteropSection';
import { DictionnaireDonneesSection } from '@/components/forms/DictionnaireDonneesSection';
import { ConformiteSection } from '@/components/forms/ConformiteSection';
import { StepperVisuel } from '@/components/forms/StepperVisuel';
import { SaveIndicator } from '@/components/forms/SaveIndicator';

const STEPS = [
  { id: 0, title: 'Informations', shortTitle: 'Infos', description: 'Identification et gouvernance des données' },
  { id: 1, title: 'Systèmes', shortTitle: 'SI', description: 'Applications, registres et infrastructure' },
  { id: 2, title: 'Données', shortTitle: 'Données', description: 'Besoins en données et dictionnaire' },
  { id: 3, title: 'Flux', shortTitle: 'Flux', description: 'Flux existants et cas d\'usage' },
  { id: 4, title: 'Interopérabilité', shortTitle: 'Interop', description: 'Diagnostic des 5 niveaux d\'interopérabilité' },
  { id: 5, title: 'Conformité', shortTitle: 'Principes', description: 'Conformité aux principes et préparation au décret' },
  { id: 6, title: 'Maturité', shortTitle: 'Maturité', description: 'Contraintes et auto-évaluation' },
  { id: 7, title: 'Attentes', shortTitle: 'Attentes', description: 'Attentes et contributions' },
];

export function QuestionnairePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isInitialLoad = useRef(true);
  const hasUnsavedChanges = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    // Section A - Gouvernance
    dataOwnerNom: '',
    dataOwnerFonction: '',
    dataOwnerEmail: '',
    dataOwnerTelephone: '',
    dataStewardNom: '',
    dataStewardProfil: '',
    dataStewardFonction: '',
    dataStewardEmail: '',
    dataStewardTelephone: '',
    // Section B
    applications: [{ nom: '', description: '', editeur: '', anneeInstallation: '' }],
    registres: [{ nom: '', description: '', volumetrie: '' }],
    infrastructureItems: [] as any[],
    // Framework interop
    niveauxInterop: [] as any[],
    dictionnaireDonnees: [] as any[],
    conformitePrincipes: [] as any[],
    preparationDecret: [] as any[],
    // Section C
    donneesConsommer: [{ donnee: '', source: '', usage: '', priorite: 3 }],
    donneesFournir: [{ donnee: '', destinataires: '', frequence: '', format: '' }],
    fluxExistants: [{ source: '', destination: '', donnee: '', mode: '', frequence: '' }],
    casUsage: [{ titre: '', description: '', acteurs: '', priorite: 3 }],
    infrastructure: { serveurs: '', sgbd: [], reseau: '', securite: '' },
    // Section D
    contraintesJuridiques: '',
    contraintesTechniques: '',
    maturiteInfra: 3,
    maturiteDonnees: 3,
    maturiteCompetences: 3,
    maturiteGouvernance: 3,
    // Section E
    forces: '',
    faiblesses: '',
    // Section F
    attentes: '',
    contributions: '',
  });

  // Fetch existing submission
  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionsApi.getOne(id!),
    enabled: !!id,
  });

  // Fetch institutions for dropdowns
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions-all'],
    queryFn: () => institutionsApi.getAll({ limit: 500 }),
  });
  const institutions = institutionsData?.data?.data || [];

  // Transform institutions to options format for SearchableSelect
  const institutionOptions = institutions.map((inst: any) => ({
    value: inst.code,
    label: inst.code,
    sublabel: inst.nom,
  }));

  // Create submission mutation
  const createMutation = useMutation({
    mutationFn: () => submissionsApi.create(user!.institutionId!),
    onSuccess: (data) => {
      navigate(`/questionnaire/${data.data.id}`, { replace: true });
      toast({ title: 'Questionnaire créé', description: 'Vous pouvez commencer à le remplir' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer le questionnaire' });
    },
  });

  // Update submission mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => submissionsApi.update(id!, data),
    onMutate: () => {
      setSaveStatus('saving');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      setSaveStatus('saved');
      hasUnsavedChanges.current = false;
    },
    onError: () => {
      setSaveStatus('error');
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder' });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => submissionsApi.updateStatus(id!, 'SUBMITTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      toast({ title: 'Soumis', description: 'Votre questionnaire a été soumis avec succès' });
      navigate('/submissions');
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de soumettre' });
    },
  });

  // Load existing data - only set currentStep on initial load
  useEffect(() => {
    if (submission?.data) {
      const s = submission.data;
      // Only set currentStep on initial load, not on subsequent refetches
      if (isInitialLoad.current) {
        setCurrentStep(s.currentStep || 0);
        isInitialLoad.current = false;
      }
      setFormData({
        dataOwnerNom: s.dataOwnerNom || '',
        dataOwnerFonction: s.dataOwnerFonction || '',
        dataOwnerEmail: s.dataOwnerEmail || '',
        dataOwnerTelephone: s.dataOwnerTelephone || '',
        dataStewardNom: s.dataStewardNom || '',
        dataStewardProfil: s.dataStewardProfil || '',
        dataStewardFonction: s.dataStewardFonction || '',
        dataStewardEmail: s.dataStewardEmail || '',
        dataStewardTelephone: s.dataStewardTelephone || '',
        applications: (s.applications?.length ?? 0) > 0 ? s.applications : formData.applications,
        registres: (s.registres?.length ?? 0) > 0 ? s.registres : formData.registres,
        infrastructureItems: s.infrastructureItems || [],
        niveauxInterop: s.niveauxInterop || [],
        dictionnaireDonnees: s.dictionnaireDonnees || [],
        conformitePrincipes: s.conformitePrincipes || [],
        preparationDecret: s.preparationDecret || [],
        donneesConsommer: (s.donneesConsommer?.length ?? 0) > 0 ? s.donneesConsommer : formData.donneesConsommer,
        donneesFournir: (s.donneesFournir?.length ?? 0) > 0 ? s.donneesFournir : formData.donneesFournir,
        fluxExistants: (s.fluxExistants?.length ?? 0) > 0 ? s.fluxExistants : formData.fluxExistants,
        casUsage: (s.casUsage?.length ?? 0) > 0 ? s.casUsage : formData.casUsage,
        infrastructure: s.infrastructure || formData.infrastructure,
        contraintesJuridiques: s.contraintesJuridiques || '',
        contraintesTechniques: s.contraintesTechniques || '',
        maturiteInfra: s.maturiteInfra || 3,
        maturiteDonnees: s.maturiteDonnees || 3,
        maturiteCompetences: s.maturiteCompetences || 3,
        maturiteGouvernance: s.maturiteGouvernance || 3,
        forces: s.forces || '',
        faiblesses: s.faiblesses || '',
        attentes: s.attentes || '',
        contributions: s.contributions || '',
      });
    }
  }, [submission]);

  const isReadOnly = submission?.data?.status !== 'DRAFT';

  // Create new if no id
  useEffect(() => {
    if (!id && user?.institutionId) {
      createMutation.mutate();
    }
  }, [id, user?.institutionId]);

  // Auto-save every 60 seconds (silencieux)
  useEffect(() => {
    if (!id || isReadOnly) return;

    autoSaveTimer.current = setInterval(() => {
      if (!updateMutation.isPending) {
        handleSave();
      }
    }, 60000);

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [id, formData, currentStep, isReadOnly]);

  // Clean data before sending to API - filter out empty items
  const cleanFormData = (data: any) => {
    const clean = { ...data };

    // Filter applications - only keep items with nom filled
    clean.applications = data.applications
      .filter((app: any) => app.nom?.trim())
      .map((app: any) => ({
        ...app,
        anneeInstallation: app.anneeInstallation ? parseInt(app.anneeInstallation) : undefined,
      }));

    // Filter registres - only keep items with nom filled
    clean.registres = data.registres.filter((r: any) => r.nom?.trim());

    // Filter donneesConsommer - only keep items with donnee and source filled
    clean.donneesConsommer = data.donneesConsommer.filter(
      (d: any) => d.donnee?.trim() && d.source?.trim()
    );

    // Filter donneesFournir - only keep items with donnee filled
    clean.donneesFournir = data.donneesFournir.filter((d: any) => d.donnee?.trim());

    // Filter fluxExistants - only keep items with source and destination filled
    clean.fluxExistants = data.fluxExistants.filter(
      (f: any) => f.source?.trim() && f.destination?.trim()
    );

    // Filter casUsage - only keep items with titre and description filled
    clean.casUsage = data.casUsage.filter(
      (c: any) => c.titre?.trim() && c.description?.trim()
    );

    return clean;
  };

  const handleSave = (stepOverride?: number) => {
    const cleanedData = cleanFormData(formData);
    const stepToSave = stepOverride !== undefined ? stepOverride : currentStep;

    // Separate sub-entities from main form data
    const { infrastructureItems, niveauxInterop, dictionnaireDonnees, conformitePrincipes, preparationDecret, ...mainData } = cleanedData;
    updateMutation.mutate({ ...mainData, currentStep: stepToSave });

    if (!id) return;

    // Save infrastructure items
    if (infrastructureItems?.length > 0) {
      submissionsApi.updateInfrastructureItems(id, infrastructureItems.map((item: any) => ({
        domain: item.domain, element: item.element, disponibilite: item.disponibilite,
        qualifications: item.qualifications || '', observations: item.observations || '',
      }))).catch(() => {});
    }

    // Save niveaux interop
    if (niveauxInterop?.length > 0) {
      const filled = niveauxInterop.filter((n: any) => n.reponse);
      if (filled.length > 0) submissionsApi.updateNiveauxInterop(id, filled).catch(() => {});
    }

    // Save dictionnaire
    if (dictionnaireDonnees?.length > 0) {
      const filled = dictionnaireDonnees.filter((d: any) => d.nomChamp?.trim());
      submissionsApi.updateDictionnaire(id, filled).catch(() => {});
    }

    // Save conformité principes
    if (conformitePrincipes?.length > 0) {
      submissionsApi.updateConformitePrincipes(id, conformitePrincipes).catch(() => {});
    }

    // Save préparation décret
    if (preparationDecret?.length > 0) {
      const filled = preparationDecret.filter((d: any) => d.reponse);
      if (filled.length > 0) submissionsApi.updatePreparationDecret(id, filled).catch(() => {});
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      // Save with the NEW step value and advance
      handleSave(nextStep);
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    handleSave();
    submitMutation.mutate();
  };

  const addArrayItem = (field: string, template: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...prev[field], template],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const updateArrayItem = (field: string, index: number, key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) =>
        i === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  if (isLoading || createMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Questionnaire d'Interopérabilité</h1>
          <p className="text-gray-500 mt-1">
            {user?.institution?.nom || 'Votre institution'}
          </p>
        </div>
        {!isReadOnly && <SaveIndicator status={saveStatus} />}
      </div>

      {/* Stepper visuel */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <StepperVisuel
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Institution Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Infos institution */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Informations de l'institution</h3>
                <dl className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Code</dt>
                    <dd className="font-medium">{submission?.data?.institution?.code}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Nom</dt>
                    <dd className="font-medium">{submission?.data?.institution?.nom}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ministère</dt>
                    <dd className="font-medium">{submission?.data?.institution?.ministere}</dd>
                  </div>
                </dl>
              </div>

              {/* Data Owner */}
              <div className="border border-teal-100 rounded-lg p-5 bg-teal-50/30">
                <h3 className="font-semibold text-navy mb-1">Data Owner (Responsable des données)</h3>
                <p className="text-xs text-gray-500 italic mb-4">
                  Le Data Owner est le décideur institutionnel qui a autorité sur les données de son domaine et valide les règles de partage.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom et prénom</Label>
                    <Input
                      value={formData.dataOwnerNom}
                      onChange={(e) => setFormData({ ...formData, dataOwnerNom: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Ex: Mamadou DIALLO"
                    />
                  </div>
                  <div>
                    <Label>Fonction</Label>
                    <Input
                      value={formData.dataOwnerFonction}
                      onChange={(e) => setFormData({ ...formData, dataOwnerFonction: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Ex: Directeur Général"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.dataOwnerEmail}
                      onChange={(e) => setFormData({ ...formData, dataOwnerEmail: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="email@institution.sn"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.dataOwnerTelephone}
                      onChange={(e) => setFormData({ ...formData, dataOwnerTelephone: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              {/* Data Steward */}
              <div className="border border-gold/30 rounded-lg p-5 bg-gold-50/30">
                <h3 className="font-semibold text-navy mb-1">Data Steward (Correspondant opérationnel interopérabilité)</h3>
                <p className="text-xs text-gray-500 italic mb-4">
                  Le Data Steward est le correspondant technique responsable de la qualité des données et de la mise à disposition via e-jokkoo.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom et prénom</Label>
                    <Input
                      value={formData.dataStewardNom}
                      onChange={(e) => setFormData({ ...formData, dataStewardNom: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Ex: Fatou NDIAYE"
                    />
                  </div>
                  <div>
                    <Label>Profil technique</Label>
                    <Input
                      value={formData.dataStewardProfil}
                      onChange={(e) => setFormData({ ...formData, dataStewardProfil: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Ex: Ingénieur SI"
                    />
                  </div>
                  <div>
                    <Label>Fonction</Label>
                    <Input
                      value={formData.dataStewardFonction}
                      onChange={(e) => setFormData({ ...formData, dataStewardFonction: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Ex: Chef de division SI"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.dataStewardEmail}
                      onChange={(e) => setFormData({ ...formData, dataStewardEmail: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="email@institution.sn"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.dataStewardTelephone}
                      onChange={(e) => setFormData({ ...formData, dataStewardTelephone: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Vérifiez les informations ci-dessus. Si les données institution sont incorrectes, contactez l'administrateur SENUM.
              </p>
            </div>
          )}

          {/* Step 1: Applications & Registres */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Applications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Applications en production</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('applications', { nom: '', description: '', editeur: '', anneeInstallation: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                {formData.applications.map((app: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">Application {index + 1}</span>
                      {!isReadOnly && formData.applications.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('applications', index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={app.nom}
                          onChange={(e) => updateArrayItem('applications', index, 'nom', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Ex: SIGTAS"
                        />
                      </div>
                      <div>
                        <Label>Éditeur</Label>
                        <Input
                          value={app.editeur}
                          onChange={(e) => updateArrayItem('applications', index, 'editeur', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Ex: Crown Agents"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={app.description}
                        onChange={(e) => updateArrayItem('applications', index, 'description', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Description de l'application"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Registres */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Registres / Bases de référence</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('registres', { nom: '', description: '', volumetrie: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                {formData.registres.map((reg: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">Registre {index + 1}</span>
                      {!isReadOnly && formData.registres.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('registres', index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={reg.nom}
                          onChange={(e) => updateArrayItem('registres', index, 'nom', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Volumétrie</Label>
                        <Input
                          value={reg.volumetrie}
                          onChange={(e) => updateArrayItem('registres', index, 'volumetrie', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Ex: 2.5M enregistrements"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={reg.description}
                        onChange={(e) => updateArrayItem('registres', index, 'description', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    {/* E.6 — Indicateurs qualité */}
                    <details className="border-t pt-3 mt-2">
                      <summary className="text-xs font-medium text-teal cursor-pointer hover:text-teal-dark">Indicateurs de qualité</summary>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <Label className="text-xs">Complétude (%)</Label>
                          <Input type="number" min={0} max={100} value={reg.tauxCompletude || ''} onChange={(e) => updateArrayItem('registres', index, 'tauxCompletude', e.target.value ? parseInt(e.target.value) : null)} disabled={isReadOnly} placeholder="0-100" className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Doublons estimés (%)</Label>
                          <Input type="number" min={0} max={100} value={reg.tauxDoublons || ''} onChange={(e) => updateArrayItem('registres', index, 'tauxDoublons', e.target.value ? parseInt(e.target.value) : null)} disabled={isReadOnly} placeholder="0-100" className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Fréquence audit</Label>
                          <select value={reg.frequenceAudit || ''} onChange={(e) => updateArrayItem('registres', index, 'frequenceAudit', e.target.value)} disabled={isReadOnly} className="w-full h-8 px-2 text-sm border rounded-md">
                            <option value="">—</option><option value="Jamais">Jamais</option><option value="Annuel">Annuel</option><option value="Semestriel">Semestriel</option><option value="Trimestriel">Trimestriel</option><option value="Mensuel">Mensuel</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" checked={reg.planQualiteExiste || false} onChange={(e) => updateArrayItem('registres', index, 'planQualiteExiste', e.target.checked)} disabled={isReadOnly} className="rounded border-gray-300" />
                          <span>Plan d'assurance qualité formalisé</span>
                        </label>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
              {/* Infrastructure technique B.3 */}
              <InfrastructureSection
                items={formData.infrastructureItems}
                onChange={(items) => setFormData({ ...formData, infrastructureItems: items })}
                disabled={isReadOnly}
              />
            </div>
          )}

          {/* Step 2: Data needs */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Données à consommer */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Données que vous souhaitez consommer</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('donneesConsommer', { donnee: '', source: '', usage: '', priorite: 3 })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                {formData.donneesConsommer.map((dc: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Donnée</Label>
                        <Input
                          value={dc.donnee}
                          onChange={(e) => updateArrayItem('donneesConsommer', index, 'donnee', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Type de donnée recherchée"
                        />
                      </div>
                      <div>
                        <Label>Source (Institution)</Label>
                        <SearchableSelect
                          options={institutionOptions}
                          value={dc.source}
                          onChange={(val) => updateArrayItem('donneesConsommer', index, 'source', val)}
                          disabled={isReadOnly}
                          placeholder="Rechercher une institution..."
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Usage prévu</Label>
                      <Textarea
                        value={dc.usage}
                        onChange={(e) => updateArrayItem('donneesConsommer', index, 'usage', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    {!isReadOnly && formData.donneesConsommer.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeArrayItem('donneesConsommer', index)}>
                        <Trash2 className="w-4 h-4 text-red-500 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Données à fournir */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Données que vous pouvez fournir</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('donneesFournir', { donnee: '', destinataires: '', frequence: '', format: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                {formData.donneesFournir.map((df: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Donnée</Label>
                        <Input
                          value={df.donnee}
                          onChange={(e) => updateArrayItem('donneesFournir', index, 'donnee', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Destinataires potentiels (plusieurs possibles)</Label>
                        <MultiSearchableSelect
                          options={institutionOptions}
                          value={df.destinataires}
                          onChange={(val) => updateArrayItem('donneesFournir', index, 'destinataires', val)}
                          disabled={isReadOnly}
                          placeholder="Rechercher et sélectionner..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fréquence de mise à jour</Label>
                        <Input
                          value={df.frequence}
                          onChange={(e) => updateArrayItem('donneesFournir', index, 'frequence', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Format disponible</Label>
                        <Input
                          value={df.format}
                          onChange={(e) => updateArrayItem('donneesFournir', index, 'format', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Ex: API REST, CSV"
                        />
                      </div>
                    </div>
                    {!isReadOnly && formData.donneesFournir.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeArrayItem('donneesFournir', index)}>
                        <Trash2 className="w-4 h-4 text-red-500 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Dictionnaire de données (F.4) */}
              <DictionnaireDonneesSection
                items={formData.dictionnaireDonnees}
                onChange={(items) => setFormData({ ...formData, dictionnaireDonnees: items })}
                institutionOptions={institutionOptions}
                disabled={isReadOnly}
              />
            </div>
          )}

          {/* Step 3: Flux & Use Cases */}
          {currentStep === 3 && (
            <div className="space-y-8">
              {/* Flux existants */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Flux de données existants</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('fluxExistants', { source: '', destination: '', donnee: '', mode: '', frequence: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                {formData.fluxExistants.map((flux: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Institution Source</Label>
                        <SearchableSelect
                          options={institutionOptions}
                          value={flux.source}
                          onChange={(val) => updateArrayItem('fluxExistants', index, 'source', val)}
                          disabled={isReadOnly}
                          placeholder="Rechercher source..."
                        />
                      </div>
                      <div>
                        <Label>Institution Destination</Label>
                        <SearchableSelect
                          options={institutionOptions}
                          value={flux.destination}
                          onChange={(val) => updateArrayItem('fluxExistants', index, 'destination', val)}
                          disabled={isReadOnly}
                          placeholder="Rechercher destination..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Données échangées</Label>
                        <Input
                          value={flux.donnee}
                          onChange={(e) => updateArrayItem('fluxExistants', index, 'donnee', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Ex: NINEA, NIN"
                        />
                      </div>
                      <div>
                        <Label>Mode d'échange</Label>
                        <select
                          value={flux.mode}
                          onChange={(e) => updateArrayItem('fluxExistants', index, 'mode', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="API REST">API REST</option>
                          <option value="X-Road">X-Road</option>
                          <option value="Fichier (CSV/Excel)">Fichier (CSV/Excel)</option>
                          <option value="Web Service SOAP">Web Service SOAP</option>
                          <option value="Email">Email</option>
                          <option value="Manuel">Manuel</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <Label>Fréquence</Label>
                        <select
                          value={flux.frequence}
                          onChange={(e) => updateArrayItem('fluxExistants', index, 'frequence', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Temps réel">Temps réel</option>
                          <option value="Quotidien">Quotidien</option>
                          <option value="Hebdomadaire">Hebdomadaire</option>
                          <option value="Mensuel">Mensuel</option>
                          <option value="Trimestriel">Trimestriel</option>
                          <option value="Annuel">Annuel</option>
                          <option value="À la demande">À la demande</option>
                        </select>
                      </div>
                    </div>
                    {!isReadOnly && formData.fluxExistants.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeArrayItem('fluxExistants', index)}>
                        <Trash2 className="w-4 h-4 text-red-500 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Cas d'usage */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Cas d'usage prioritaires</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('casUsage', { titre: '', description: '', acteurs: '', priorite: 3 })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                {formData.casUsage.map((cu: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                    <div>
                      <Label>Titre</Label>
                      <Input
                        value={cu.titre}
                        onChange={(e) => updateArrayItem('casUsage', index, 'titre', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Ex: Liaison NINEA-RCCM"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={cu.description}
                        onChange={(e) => updateArrayItem('casUsage', index, 'description', e.target.value)}
                        disabled={isReadOnly}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Acteurs impliqués</Label>
                      <Input
                        value={cu.acteurs}
                        onChange={(e) => updateArrayItem('casUsage', index, 'acteurs', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Ex: DGID, APIX, Tribunaux"
                      />
                    </div>
                    {!isReadOnly && formData.casUsage.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeArrayItem('casUsage', index)}>
                        <Trash2 className="w-4 h-4 text-red-500 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Interopérabilité (F.1) */}
          {currentStep === 4 && (
            <NiveauxInteropSection
              items={formData.niveauxInterop}
              onChange={(items) => setFormData({ ...formData, niveauxInterop: items })}
              disabled={isReadOnly}
            />
          )}

          {/* Step 5: Conformité & Décret (F.3 + F.5) */}
          {currentStep === 5 && (
            <ConformiteSection
              principes={formData.conformitePrincipes}
              decret={formData.preparationDecret}
              onPrincipesChange={(items) => setFormData({ ...formData, conformitePrincipes: items })}
              onDecretChange={(items) => setFormData({ ...formData, preparationDecret: items })}
              disabled={isReadOnly}
            />
          )}

          {/* Step 6: Maturity */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <Label>Contraintes juridiques</Label>
                <Textarea
                  value={formData.contraintesJuridiques}
                  onChange={(e) => setFormData({ ...formData, contraintesJuridiques: e.target.value })}
                  disabled={isReadOnly}
                  rows={3}
                  placeholder="Décrivez les contraintes juridiques (secret, RGPD, etc.)"
                />
              </div>
              <div>
                <Label>Contraintes techniques</Label>
                <Textarea
                  value={formData.contraintesTechniques}
                  onChange={(e) => setFormData({ ...formData, contraintesTechniques: e.target.value })}
                  disabled={isReadOnly}
                  rows={3}
                  placeholder="Décrivez les contraintes techniques"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Maturité Infrastructure (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.maturiteInfra}
                    onChange={(e) => setFormData({ ...formData, maturiteInfra: parseInt(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Maturité Données (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.maturiteDonnees}
                    onChange={(e) => setFormData({ ...formData, maturiteDonnees: parseInt(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Maturité Compétences (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.maturiteCompetences}
                    onChange={(e) => setFormData({ ...formData, maturiteCompetences: parseInt(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Maturité Gouvernance (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.maturiteGouvernance}
                    onChange={(e) => setFormData({ ...formData, maturiteGouvernance: parseInt(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
              <div>
                <Label>Forces</Label>
                <Textarea
                  value={formData.forces}
                  onChange={(e) => setFormData({ ...formData, forces: e.target.value })}
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
              <div>
                <Label>Faiblesses</Label>
                <Textarea
                  value={formData.faiblesses}
                  onChange={(e) => setFormData({ ...formData, faiblesses: e.target.value })}
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 7: Expectations */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <Label>Vos attentes vis-à-vis de la plateforme d'interopérabilité</Label>
                <Textarea
                  value={formData.attentes}
                  onChange={(e) => setFormData({ ...formData, attentes: e.target.value })}
                  disabled={isReadOnly}
                  rows={4}
                  placeholder="Décrivez ce que vous attendez de la plateforme"
                />
              </div>
              <div>
                <Label>Vos contributions potentielles</Label>
                <Textarea
                  value={formData.contributions}
                  onChange={(e) => setFormData({ ...formData, contributions: e.target.value })}
                  disabled={isReadOnly}
                  rows={4}
                  placeholder="Comment pouvez-vous contribuer au projet ?"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        <div className="flex space-x-3">
          {!isReadOnly && (
            <Button variant="outline" onClick={() => handleSave()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            !isReadOnly && (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Soumettre
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
