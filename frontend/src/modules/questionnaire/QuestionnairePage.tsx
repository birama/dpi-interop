import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { StepperVisuel } from '@/components/forms/StepperVisuel';
import { SaveIndicator } from '@/components/forms/SaveIndicator';
import { useParams } from 'react-router-dom';

import { STEPS, StepProps } from './lib/questionnaireTypes';
import { useQuestionnaireData } from './hooks/useQuestionnaireData';

import { Step1Infos } from './steps/Step1Infos';
import { Step2Systemes } from './steps/Step2Systemes';
import { Step3Donnees } from './steps/Step3Donnees';
import { Step4Flux } from './steps/Step4Flux';
import { Step5Interop } from './steps/Step5Interop';
import { Step6Principes } from './steps/Step6Principes';
import { Step7Maturite } from './steps/Step7Maturite';
import { Step8Attentes } from './steps/Step8Attentes';

// Orchestrateur leger du module questionnaire (V1 — Lot 1).
// Conserve fonctionnellement le comportement du monolithe :
// stepper visuel + 8 steps + footer Precedent/Sauvegarder/Suivant/Soumettre.
// La couche dashboard modulaire arrivera en V2 (Lot 2).
export function QuestionnairePage() {
  const { id } = useParams();
  const { user } = useAuthStore();

  const {
    submission,
    isLoading,
    institutionOptions,
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isReadOnly,
    saveStatus,
    updateMutation,
    submitMutation,
    handleSave,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
  } = useQuestionnaireData(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  // Props mutualisees passees a chaque Step
  const stepProps: StepProps = {
    formData,
    setFormData,
    isReadOnly,
    institutionOptions,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    submissionInstitution: submission?.institution,
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      handleSave(nextStep);
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    handleSave();
    submitMutation.mutate();
  };

  // Map step id -> composant. Switch evite a l'orchestrateur de connaitre
  // le contenu metier de chaque section.
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step1Infos {...stepProps} />;
      case 1: return <Step2Systemes {...stepProps} />;
      case 2: return <Step3Donnees {...stepProps} />;
      case 3: return <Step4Flux {...stepProps} />;
      case 4: return <Step5Interop {...stepProps} />;
      case 5: return <Step6Principes {...stepProps} />;
      case 6: return <Step7Maturite {...stepProps} />;
      case 7: return <Step8Attentes {...stepProps} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Questionnaire d'Interoperabilite</h1>
          <p className="text-gray-500 mt-1">{user?.institution?.nom || 'Votre institution'}</p>
        </div>
        {!isReadOnly && <SaveIndicator status={saveStatus} />}
      </div>

      {/* Stepper visuel */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <StepperVisuel
            steps={STEPS as any}
            currentStep={currentStep}
            onStepClick={step => setCurrentStep(step)}
          />
        </CardContent>
      </Card>

      {/* Contenu de l'etape courante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Precedent
        </Button>

        <div className="flex space-x-3">
          {!isReadOnly && (
            <Button variant="outline" onClick={() => handleSave()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Sauvegarder
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Suivant <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            !isReadOnly && (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Soumettre
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
