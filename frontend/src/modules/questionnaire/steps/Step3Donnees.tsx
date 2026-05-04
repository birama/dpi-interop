import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSearchableSelect } from '@/components/ui/multi-searchable-select';
import { DictionnaireDonneesSection } from '@/components/forms/DictionnaireDonneesSection';
import { StepProps } from '../lib/questionnaireTypes';

// Section 3 — Donnees a consommer + Donnees a fournir + Dictionnaire de donnees.
// Extraite de pages/QuestionnairePage.tsx (lignes 661-793).
export function Step3Donnees({ formData, setFormData, isReadOnly, institutionOptions, addArrayItem, removeArrayItem, updateArrayItem }: StepProps) {
  return (
    <div className="space-y-8">
      {/* Donnees a consommer */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg">Donnees que vous souhaitez consommer</Label>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={() => addArrayItem('donneesConsommer', { donnee: '', source: '', usage: '', priorite: 3 })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          )}
        </div>
        {formData.donneesConsommer.map((dc: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Donnee</Label>
                <Input value={dc.donnee} onChange={e => updateArrayItem('donneesConsommer', index, 'donnee', e.target.value)} disabled={isReadOnly} placeholder="Type de donnee recherchee" />
              </div>
              <div>
                <Label>Source (Institution)</Label>
                <SearchableSelect
                  options={institutionOptions}
                  value={dc.source}
                  onChange={val => updateArrayItem('donneesConsommer', index, 'source', val)}
                  disabled={isReadOnly}
                  placeholder="Rechercher une institution..."
                />
              </div>
            </div>
            <div>
              <Label>Usage prevu</Label>
              <Textarea value={dc.usage} onChange={e => updateArrayItem('donneesConsommer', index, 'usage', e.target.value)} disabled={isReadOnly} />
            </div>
            {!isReadOnly && formData.donneesConsommer.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('donneesConsommer', index)}>
                <Trash2 className="w-4 h-4 text-red-500 mr-2" /> Supprimer
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Donnees a fournir */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg">Donnees que vous pouvez fournir</Label>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={() => addArrayItem('donneesFournir', { donnee: '', destinataires: '', frequence: '', format: '' })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          )}
        </div>
        {formData.donneesFournir.map((df: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Donnee</Label>
                <Input value={df.donnee} onChange={e => updateArrayItem('donneesFournir', index, 'donnee', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Destinataires potentiels (plusieurs possibles)</Label>
                <MultiSearchableSelect
                  options={institutionOptions}
                  value={df.destinataires}
                  onChange={val => updateArrayItem('donneesFournir', index, 'destinataires', val)}
                  disabled={isReadOnly}
                  placeholder="Rechercher et selectionner..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequence de mise a jour</Label>
                <Input value={df.frequence} onChange={e => updateArrayItem('donneesFournir', index, 'frequence', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Format disponible</Label>
                <Input value={df.format} onChange={e => updateArrayItem('donneesFournir', index, 'format', e.target.value)} disabled={isReadOnly} placeholder="Ex: API REST, CSV" />
              </div>
            </div>
            {!isReadOnly && formData.donneesFournir.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('donneesFournir', index)}>
                <Trash2 className="w-4 h-4 text-red-500 mr-2" /> Supprimer
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Dictionnaire de donnees (F.4) */}
      <DictionnaireDonneesSection
        items={formData.dictionnaireDonnees}
        onChange={items => setFormData(prev => ({ ...prev, dictionnaireDonnees: items }))}
        institutionOptions={institutionOptions}
        disabled={isReadOnly}
      />
    </div>
  );
}
