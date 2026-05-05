import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionsApi, institutionsApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { INITIAL_FORM_DATA, QuestionnaireFormData, SaveStatus } from '../lib/questionnaireTypes';

// Hook centralise pour le module questionnaire :
// - Charge la submission existante (ou cree un brouillon a la volee)
// - Expose formData / setFormData
// - Mutation update silencieuse
// - Mutation submit
// - Auto-save toutes les 60s SI dirty (Lot 7.2 — auto-save intelligent)
// - currentStep partage entre l'orchestrateur et le hook pour la sauvegarde
export function useQuestionnaireData(submissionIdParam?: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isDirty = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormDataRaw] = useState<QuestionnaireFormData>(INITIAL_FORM_DATA);

  // Wrapper qui marque dirty automatiquement
  const setFormData = useCallback(
    (updater: (prev: QuestionnaireFormData) => QuestionnaireFormData) => {
      setFormDataRaw(prev => {
        const next = updater(prev);
        isDirty.current = true;
        if (saveStatus === 'saved') setSaveStatus('unsaved');
        return next;
      });
    },
    [saveStatus]
  );

  // Charge la submission si :id present
  const submissionQuery = useQuery({
    queryKey: ['submission', submissionIdParam],
    queryFn: () => submissionsApi.getOne(submissionIdParam!),
    enabled: !!submissionIdParam,
  });

  // Liste des institutions pour les dropdowns
  const institutionsQuery = useQuery({
    queryKey: ['institutions-all'],
    queryFn: () => institutionsApi.getAll({ limit: 500 }),
  });
  const institutions = institutionsQuery.data?.data?.data || [];
  const institutionOptions = institutions.map((inst: any) => ({
    value: inst.code,
    label: `${inst.code} — ${inst.nom}`,
    sublabel: inst.ministere,
  }));

  // Creation d'un brouillon si aucun id et institution connue
  const createMutation = useMutation({
    mutationFn: () => submissionsApi.create(user!.institutionId!),
    onSuccess: data => {
      navigate(`/questionnaire/${data.data.id}`, { replace: true });
      toast({ title: 'Questionnaire cree', description: 'Vous pouvez commencer a le remplir' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de creer le questionnaire' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => submissionsApi.update(submissionIdParam!, data),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionIdParam] });
      setSaveStatus('saved');
      isDirty.current = false;
    },
    onError: () => {
      setSaveStatus('error');
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submissionsApi.updateStatus(submissionIdParam!, 'SUBMITTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionIdParam] });
      toast({ title: 'Soumis', description: 'Votre questionnaire a ete soumis avec succes' });
      navigate('/submissions');
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de soumettre' });
    },
  });

  // Charge les donnees depuis l'API a chaque reponse (admin consultant un questionnaire
  // tiers, rechargement apres mutation, etc.). Le stepper empeche toute interaction
  // utilisateur pendant isLoading, donc pas de risque de conflit de navigation.
  useEffect(() => {
    if (!submissionQuery.data?.data) return;
    const s = submissionQuery.data.data;
    setCurrentStep(s.currentStep || 0);
    setFormDataRaw(prev => ({
      ...prev,
      dataOwnerNom: s.dataOwnerNom || '',
      dataOwnerFonction: s.dataOwnerFonction || '',
      dataOwnerEmail: s.dataOwnerEmail || '',
      dataOwnerTelephone: s.dataOwnerTelephone || '',
      dataStewardNom: s.dataStewardNom || '',
      dataStewardProfil: s.dataStewardProfil || '',
      dataStewardFonction: s.dataStewardFonction || '',
      dataStewardEmail: s.dataStewardEmail || '',
      dataStewardTelephone: s.dataStewardTelephone || '',
      applications: (s.applications?.length ?? 0) > 0 ? s.applications : prev.applications,
      registres: (s.registres?.length ?? 0) > 0 ? s.registres : prev.registres,
      infrastructureItems: s.infrastructureItems || [],
      niveauxInterop: s.niveauxInterop || [],
      dictionnaireDonnees: s.dictionnaireDonnees || [],
      conformitePrincipes: s.conformitePrincipes || [],
      preparationDecret: s.preparationDecret || [],
      donneesConsommer: (s.donneesConsommer?.length ?? 0) > 0 ? s.donneesConsommer : prev.donneesConsommer,
      donneesFournir: (s.donneesFournir?.length ?? 0) > 0 ? s.donneesFournir : prev.donneesFournir,
      fluxExistants: (s.fluxExistants?.length ?? 0) > 0 ? s.fluxExistants : prev.fluxExistants,
      casUsage: (s.casUsage?.length ?? 0) > 0 ? s.casUsage : prev.casUsage,
      infrastructure: s.infrastructure || prev.infrastructure,
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
    } as QuestionnaireFormData));
    isDirty.current = false;
  }, [submissionQuery.data]);

  // Cree un brouillon si pas d'id et user a une institution
  useEffect(() => {
    if (!submissionIdParam && user?.institutionId && !createMutation.isPending && !createMutation.isSuccess) {
      createMutation.mutate();
    }
  }, [submissionIdParam, user?.institutionId]);

  const isReadOnly = submissionQuery.data?.data?.status !== 'DRAFT';

  // Nettoie le formData avant POST : filtre les items vides
  const cleanFormData = useCallback((data: QuestionnaireFormData) => {
    const clean: any = { ...data };
    clean.applications = data.applications
      .filter((app: any) => app.nom?.trim())
      .map((app: any) => ({
        ...app,
        anneeInstallation: app.anneeInstallation ? parseInt(app.anneeInstallation as any) : undefined,
      }));
    clean.registres = data.registres.filter((r: any) => r.nom?.trim());
    clean.donneesConsommer = data.donneesConsommer.filter((d: any) => d.donnee?.trim() && d.source?.trim());
    clean.donneesFournir = data.donneesFournir.filter((d: any) => d.donnee?.trim());
    clean.fluxExistants = data.fluxExistants.filter((f: any) => f.source?.trim() && f.destination?.trim());
    clean.casUsage = data.casUsage.filter((c: any) => c.titre?.trim() && c.description?.trim());
    return clean;
  }, []);

  const handleSave = useCallback(
    (stepOverride?: number) => {
      if (!submissionIdParam) return;
      const cleaned = cleanFormData(formData);
      const stepToSave = stepOverride !== undefined ? stepOverride : currentStep;

      const { infrastructureItems, niveauxInterop, dictionnaireDonnees, conformitePrincipes, preparationDecret, ...mainData } = cleaned;
      updateMutation.mutate({ ...mainData, currentStep: stepToSave });

      if (infrastructureItems?.length > 0) {
        submissionsApi
          .updateInfrastructureItems(
            submissionIdParam,
            infrastructureItems.map((item: any) => ({
              domain: item.domain,
              element: item.element,
              disponibilite: item.disponibilite,
              qualifications: item.qualifications || '',
              observations: item.observations || '',
            }))
          )
          .catch(() => {});
      }
      if (niveauxInterop?.length > 0) {
        const filled = niveauxInterop.filter((n: any) => n.reponse);
        if (filled.length > 0) submissionsApi.updateNiveauxInterop(submissionIdParam, filled).catch(() => {});
      }
      if (dictionnaireDonnees?.length > 0) {
        const filled = dictionnaireDonnees.filter((d: any) => d.nomChamp?.trim());
        submissionsApi.updateDictionnaire(submissionIdParam, filled).catch(() => {});
      }
      if (conformitePrincipes?.length > 0) {
        submissionsApi.updateConformitePrincipes(submissionIdParam, conformitePrincipes).catch(() => {});
      }
      if (preparationDecret?.length > 0) {
        const filled = preparationDecret.filter((d: any) => d.reponse);
        if (filled.length > 0) submissionsApi.updatePreparationDecret(submissionIdParam, filled).catch(() => {});
      }
    },
    [submissionIdParam, formData, currentStep, cleanFormData, updateMutation]
  );

  // Auto-save 60s — Lot 7.2 : ne tire QUE si dirty.
  useEffect(() => {
    if (!submissionIdParam || isReadOnly) return;
    autoSaveTimer.current = setInterval(() => {
      if (isDirty.current && !updateMutation.isPending) {
        handleSave();
      }
    }, 60000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [submissionIdParam, isReadOnly, handleSave, updateMutation.isPending]);

  // Helpers tableau partages avec les Steps
  const addArrayItem = useCallback(
    (field: keyof QuestionnaireFormData, template: any) => {
      setFormData(prev => ({ ...prev, [field]: [...(prev[field] as any[]), template] }));
    },
    [setFormData]
  );

  const removeArrayItem = useCallback(
    (field: keyof QuestionnaireFormData, index: number) => {
      setFormData(prev => ({ ...prev, [field]: (prev[field] as any[]).filter((_: any, i: number) => i !== index) }));
    },
    [setFormData]
  );

  const updateArrayItem = useCallback(
    (field: keyof QuestionnaireFormData, index: number, key: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field] as any[]).map((item: any, i: number) => (i === index ? { ...item, [key]: value } : item)),
      }));
    },
    [setFormData]
  );

  return {
    // Data
    submission: submissionQuery.data?.data,
    isLoading: submissionQuery.isLoading || createMutation.isPending,
    institutionOptions,
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isReadOnly,
    saveStatus,
    isDirty,

    // Mutations
    updateMutation,
    submitMutation,

    // Actions
    handleSave,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
  };
}
