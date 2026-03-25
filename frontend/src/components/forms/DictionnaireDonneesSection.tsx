import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface DictItem {
  nomChamp: string;
  definition: string;
  formatTechnique: string;
  taille: string;
  referentielOrigine: string;
  nomenclature: string;
  identifiantPivot: boolean;
  frequenceMAJ: string;
  sensibilite: string;
  observations: string;
}

interface DictionnaireDonneesSectionProps {
  items: DictItem[];
  onChange: (items: DictItem[]) => void;
  institutionOptions: { value: string; label: string; sublabel?: string }[];
  disabled?: boolean;
}

const EMPTY_ITEM: DictItem = {
  nomChamp: '', definition: '', formatTechnique: '', taille: '',
  referentielOrigine: '', nomenclature: '', identifiantPivot: false,
  frequenceMAJ: '', sensibilite: '', observations: '',
};

const FORMATS = ['Texte', 'Numérique', 'Date', 'Booléen', 'Code', 'Montant', 'Autre'];
const FREQUENCES = ['Temps réel', 'Quotidien', 'Hebdomadaire', 'Mensuel', 'Annuel', 'Ponctuel'];
const SENSIBILITES = ['Public', 'Usage interne', 'Confidentiel', 'Secret'];

export function DictionnaireDonneesSection({ items, onChange, institutionOptions, disabled }: DictionnaireDonneesSectionProps) {
  const addItem = () => onChange([...items, { ...EMPTY_ITEM }]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-navy">Dictionnaire de données</h3>
          <p className="text-sm text-gray-500">Décrivez les données clés de votre institution pour le référentiel national.</p>
        </div>
        {!disabled && (
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" /> Ajouter une donnée
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
          <p>Aucune donnée déclarée</p>
          {!disabled && (
            <Button variant="outline" size="sm" className="mt-3" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter votre première donnée
            </Button>
          )}
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-teal">Donnée {index + 1}</span>
            {!disabled && items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nom du champ / donnée</Label>
              <Input value={item.nomChamp} onChange={(e) => updateItem(index, 'nomChamp', e.target.value)} disabled={disabled} placeholder="Ex: NINEA" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Format technique</Label>
              <select value={item.formatTechnique} onChange={(e) => updateItem(index, 'formatTechnique', e.target.value)} disabled={disabled} className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100">
                <option value="">—</option>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Définition</Label>
            <Textarea value={item.definition} onChange={(e) => updateItem(index, 'definition', e.target.value)} disabled={disabled} placeholder="Description en 2-3 phrases" rows={2} className="text-sm" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Taille / longueur</Label>
              <Input value={item.taille} onChange={(e) => updateItem(index, 'taille', e.target.value)} disabled={disabled} placeholder="Ex: 13 chiffres" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Référentiel d'origine</Label>
              <SearchableSelect
                options={institutionOptions}
                value={item.referentielOrigine}
                onChange={(val) => updateItem(index, 'referentielOrigine', val)}
                disabled={disabled}
                placeholder="Source de vérité..."
              />
            </div>
            <div>
              <Label className="text-xs">Nomenclature</Label>
              <Input value={item.nomenclature} onChange={(e) => updateItem(index, 'nomenclature', e.target.value)} disabled={disabled} placeholder="Ex: ISO 3166" className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Fréquence MAJ</Label>
              <select value={item.frequenceMAJ} onChange={(e) => updateItem(index, 'frequenceMAJ', e.target.value)} disabled={disabled} className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100">
                <option value="">—</option>
                {FREQUENCES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Sensibilité</Label>
              <select value={item.sensibilite} onChange={(e) => updateItem(index, 'sensibilite', e.target.value)} disabled={disabled} className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100">
                <option value="">—</option>
                {SENSIBILITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-sm pb-1">
                <input type="checkbox" checked={item.identifiantPivot} onChange={(e) => updateItem(index, 'identifiantPivot', e.target.checked)} disabled={disabled} className="rounded border-gray-300 text-teal focus:ring-teal" />
                <span>Identifiant pivot</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
