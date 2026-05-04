import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { InfrastructureSection } from '@/components/forms/InfrastructureSection';
import { StepProps } from '../lib/questionnaireTypes';

// Section 2 — Applications + Registres internes + Infrastructure technique.
// Extraite de pages/QuestionnairePage.tsx (lignes 510-658).
export function Step2Systemes({ formData, setFormData, isReadOnly, addArrayItem, removeArrayItem, updateArrayItem }: StepProps) {
  return (
    <div className="space-y-8">
      {/* Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg">Applications en production</Label>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={() => addArrayItem('applications', { nom: '', description: '', editeur: '', anneeInstallation: '' })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
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
                <Input value={app.nom} onChange={e => updateArrayItem('applications', index, 'nom', e.target.value)} disabled={isReadOnly} placeholder="Ex: SIGTAS" />
              </div>
              <div>
                <Label>Editeur</Label>
                <Input value={app.editeur} onChange={e => updateArrayItem('applications', index, 'editeur', e.target.value)} disabled={isReadOnly} placeholder="Ex: Crown Agents" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={app.description} onChange={e => updateArrayItem('applications', index, 'description', e.target.value)} disabled={isReadOnly} placeholder="Description de l'application" />
            </div>
          </div>
        ))}
      </div>

      {/* Registres */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg">Registres / Bases de reference</Label>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={() => addArrayItem('registres', { nom: '', description: '', volumetrie: '' })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
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
                <Input value={reg.nom} onChange={e => updateArrayItem('registres', index, 'nom', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Volumetrie</Label>
                <Input value={reg.volumetrie} onChange={e => updateArrayItem('registres', index, 'volumetrie', e.target.value)} disabled={isReadOnly} placeholder="Ex: 2.5M enregistrements" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={reg.description} onChange={e => updateArrayItem('registres', index, 'description', e.target.value)} disabled={isReadOnly} />
            </div>
            {/* E.6 — Indicateurs qualite (depliable) */}
            <details className="border-t pt-3 mt-2">
              <summary className="text-xs font-medium text-teal cursor-pointer hover:text-teal-dark">Indicateurs de qualite</summary>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <Label className="text-xs">Completude (%)</Label>
                  <Input type="number" min={0} max={100} value={reg.tauxCompletude || ''} onChange={e => updateArrayItem('registres', index, 'tauxCompletude', e.target.value ? parseInt(e.target.value) : null)} disabled={isReadOnly} placeholder="0-100" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Doublons estimes (%)</Label>
                  <Input type="number" min={0} max={100} value={reg.tauxDoublons || ''} onChange={e => updateArrayItem('registres', index, 'tauxDoublons', e.target.value ? parseInt(e.target.value) : null)} disabled={isReadOnly} placeholder="0-100" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Frequence audit</Label>
                  <select value={reg.frequenceAudit || ''} onChange={e => updateArrayItem('registres', index, 'frequenceAudit', e.target.value)} disabled={isReadOnly} className="w-full h-8 px-2 text-sm border rounded-md">
                    <option value="">—</option>
                    <option value="Jamais">Jamais</option>
                    <option value="Annuel">Annuel</option>
                    <option value="Semestriel">Semestriel</option>
                    <option value="Trimestriel">Trimestriel</option>
                    <option value="Mensuel">Mensuel</option>
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={reg.planQualiteExiste || false} onChange={e => updateArrayItem('registres', index, 'planQualiteExiste', e.target.checked)} disabled={isReadOnly} className="rounded border-gray-300" />
                  <span>Plan d'assurance qualite formalise</span>
                </label>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Infrastructure technique B.3 */}
      <InfrastructureSection
        items={formData.infrastructureItems}
        onChange={items => setFormData(prev => ({ ...prev, infrastructureItems: items }))}
        disabled={isReadOnly}
      />
    </div>
  );
}
