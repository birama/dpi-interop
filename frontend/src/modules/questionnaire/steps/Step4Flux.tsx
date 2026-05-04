import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { StepProps } from '../lib/questionnaireTypes';

// Section 4 — Flux de donnees existants + Cas d'usage prioritaires.
// Extraite de pages/QuestionnairePage.tsx (lignes 796-948).
export function Step4Flux({ formData, isReadOnly, institutionOptions, addArrayItem, removeArrayItem, updateArrayItem }: StepProps) {
  return (
    <div className="space-y-8">
      {/* Flux existants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg">Flux de donnees existants</Label>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={() => addArrayItem('fluxExistants', { source: '', destination: '', donnee: '', mode: '', frequence: '' })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          )}
        </div>
        {formData.fluxExistants.map((flux: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Institution Source</Label>
                <SearchableSelect options={institutionOptions} value={flux.source} onChange={val => updateArrayItem('fluxExistants', index, 'source', val)} disabled={isReadOnly} placeholder="Rechercher source..." />
              </div>
              <div>
                <Label>Institution Destination</Label>
                <SearchableSelect options={institutionOptions} value={flux.destination} onChange={val => updateArrayItem('fluxExistants', index, 'destination', val)} disabled={isReadOnly} placeholder="Rechercher destination..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Donnees echangees</Label>
                <Input value={flux.donnee} onChange={e => updateArrayItem('fluxExistants', index, 'donnee', e.target.value)} disabled={isReadOnly} placeholder="Ex: NINEA, NIN" />
              </div>
              <div>
                <Label>Mode d'echange</Label>
                <select value={flux.mode} onChange={e => updateArrayItem('fluxExistants', index, 'mode', e.target.value)} disabled={isReadOnly} className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-gray-100">
                  <option value="">-- Selectionner --</option>
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
                <Label>Frequence</Label>
                <select value={flux.frequence} onChange={e => updateArrayItem('fluxExistants', index, 'frequence', e.target.value)} disabled={isReadOnly} className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-gray-100">
                  <option value="">-- Selectionner --</option>
                  <option value="Temps reel">Temps reel</option>
                  <option value="Quotidien">Quotidien</option>
                  <option value="Hebdomadaire">Hebdomadaire</option>
                  <option value="Mensuel">Mensuel</option>
                  <option value="Trimestriel">Trimestriel</option>
                  <option value="Annuel">Annuel</option>
                  <option value="A la demande">A la demande</option>
                </select>
              </div>
            </div>
            {!isReadOnly && formData.fluxExistants.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('fluxExistants', index)}>
                <Trash2 className="w-4 h-4 text-red-500 mr-2" /> Supprimer
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
            <Button variant="outline" size="sm" onClick={() => addArrayItem('casUsage', { titre: '', description: '', acteurs: '', priorite: 3 })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          )}
        </div>
        {formData.casUsage.map((cu: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
            <div>
              <Label>Titre</Label>
              <Input value={cu.titre} onChange={e => updateArrayItem('casUsage', index, 'titre', e.target.value)} disabled={isReadOnly} placeholder="Ex: Liaison NINEA-RCCM" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={cu.description} onChange={e => updateArrayItem('casUsage', index, 'description', e.target.value)} disabled={isReadOnly} rows={3} />
            </div>
            <div>
              <Label>Acteurs impliques</Label>
              <Input value={cu.acteurs} onChange={e => updateArrayItem('casUsage', index, 'acteurs', e.target.value)} disabled={isReadOnly} placeholder="Ex: DGID, APIX, Tribunaux" />
            </div>
            {!isReadOnly && formData.casUsage.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('casUsage', index)}>
                <Trash2 className="w-4 h-4 text-red-500 mr-2" /> Supprimer
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
