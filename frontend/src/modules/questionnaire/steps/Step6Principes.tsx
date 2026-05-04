import { ConformiteSection } from '@/components/forms/ConformiteSection';
import { StepProps } from '../lib/questionnaireTypes';

// Section 6 — Conformite aux 13 principes EIF + Preparation au decret.
// Extraite de pages/QuestionnairePage.tsx (lignes 959-968).
export function Step6Principes({ formData, setFormData, isReadOnly }: StepProps) {
  return (
    <ConformiteSection
      principes={formData.conformitePrincipes}
      decret={formData.preparationDecret}
      onPrincipesChange={items => setFormData(prev => ({ ...prev, conformitePrincipes: items }))}
      onDecretChange={items => setFormData(prev => ({ ...prev, preparationDecret: items }))}
      disabled={isReadOnly}
    />
  );
}
