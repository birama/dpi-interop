import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StepProps } from '../lib/questionnaireTypes';

// Section 7 — Contraintes + 4 axes de maturite + Forces / Faiblesses.
// Extraite de pages/QuestionnairePage.tsx (lignes 970-1058).
export function Step7Maturite({ formData, setFormData, isReadOnly }: StepProps) {
  const set = <K extends keyof typeof formData>(field: K, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div>
        <Label>Contraintes juridiques</Label>
        <Textarea value={formData.contraintesJuridiques} onChange={e => set('contraintesJuridiques', e.target.value)} disabled={isReadOnly} rows={3} placeholder="Decrivez les contraintes juridiques (secret, RGPD, etc.)" />
      </div>
      <div>
        <Label>Contraintes techniques</Label>
        <Textarea value={formData.contraintesTechniques} onChange={e => set('contraintesTechniques', e.target.value)} disabled={isReadOnly} rows={3} placeholder="Decrivez les contraintes techniques" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Maturite Infrastructure (1-5)</Label>
          <Input type="number" min={1} max={5} value={formData.maturiteInfra} onChange={e => set('maturiteInfra', parseInt(e.target.value))} disabled={isReadOnly} />
        </div>
        <div>
          <Label>Maturite Donnees (1-5)</Label>
          <Input type="number" min={1} max={5} value={formData.maturiteDonnees} onChange={e => set('maturiteDonnees', parseInt(e.target.value))} disabled={isReadOnly} />
        </div>
        <div>
          <Label>Maturite Competences (1-5)</Label>
          <Input type="number" min={1} max={5} value={formData.maturiteCompetences} onChange={e => set('maturiteCompetences', parseInt(e.target.value))} disabled={isReadOnly} />
        </div>
        <div>
          <Label>Maturite Gouvernance (1-5)</Label>
          <Input type="number" min={1} max={5} value={formData.maturiteGouvernance} onChange={e => set('maturiteGouvernance', parseInt(e.target.value))} disabled={isReadOnly} />
        </div>
      </div>
      <div>
        <Label>Forces</Label>
        <Textarea value={formData.forces} onChange={e => set('forces', e.target.value)} disabled={isReadOnly} rows={3} />
      </div>
      <div>
        <Label>Faiblesses</Label>
        <Textarea value={formData.faiblesses} onChange={e => set('faiblesses', e.target.value)} disabled={isReadOnly} rows={3} />
      </div>
    </div>
  );
}
