import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StepProps } from '../lib/questionnaireTypes';

// Section 8 — Attentes vis-a-vis de la plateforme + Contributions potentielles.
// Extraite de pages/QuestionnairePage.tsx (lignes 1060-1083).
export function Step8Attentes({ formData, setFormData, isReadOnly }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Vos attentes vis-a-vis de la plateforme d'interoperabilite</Label>
        <Textarea
          value={formData.attentes}
          onChange={e => setFormData(prev => ({ ...prev, attentes: e.target.value }))}
          disabled={isReadOnly}
          rows={4}
          placeholder="Decrivez ce que vous attendez de la plateforme"
        />
      </div>
      <div>
        <Label>Vos contributions potentielles</Label>
        <Textarea
          value={formData.contributions}
          onChange={e => setFormData(prev => ({ ...prev, contributions: e.target.value }))}
          disabled={isReadOnly}
          rows={4}
          placeholder="Comment pouvez-vous contribuer au projet ?"
        />
      </div>
    </div>
  );
}
