import { NiveauxInteropSection } from '@/components/forms/NiveauxInteropSection';
import { StepProps } from '../lib/questionnaireTypes';

// Section 5 — Diagnostic des 5 niveaux EIF (politique, juridique, organisationnel,
// semantique, technique). Wrapper minimal autour de NiveauxInteropSection.
// Extraite de pages/QuestionnairePage.tsx (lignes 950-957).
export function Step5Interop({ formData, setFormData, isReadOnly }: StepProps) {
  return (
    <NiveauxInteropSection
      items={formData.niveauxInterop}
      onChange={items => setFormData(prev => ({ ...prev, niveauxInterop: items }))}
      disabled={isReadOnly}
    />
  );
}
