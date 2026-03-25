import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NiveauItem {
  niveau: string;
  question: string;
  reponse: string;
  details: string;
}

interface NiveauxInteropSectionProps {
  items: NiveauItem[];
  onChange: (items: NiveauItem[]) => void;
  disabled?: boolean;
}

const NIVEAUX = [
  {
    key: 'POLITIQUE',
    label: 'Niveau Politique',
    color: '#0C1F3A',
    questions: [
      'Votre direction générale a-t-elle formellement validé la participation au projet d\'interopérabilité ?',
      'Un budget dédié à l\'interopérabilité est-il prévu ?',
      'L\'interopérabilité est-elle inscrite dans votre plan stratégique ?',
    ],
  },
  {
    key: 'JURIDIQUE',
    label: 'Niveau Juridique',
    color: '#C55A18',
    questions: [
      'Votre institution a-t-elle signé des conventions d\'échange de données avec d\'autres administrations ?',
      'Existe-t-il des textes réglementaires limitant le partage de certaines données ?',
      'Votre institution est-elle en conformité avec la Commission des Données Personnelles (CDP) ?',
      'Avez-vous connaissance du projet de décret sur l\'interopérabilité ?',
    ],
  },
  {
    key: 'ORGANISATIONNEL',
    label: 'Niveau Organisationnel',
    color: '#0A6B68',
    questions: [
      'Un point focal interopérabilité est-il officiellement désigné ?',
      'Les processus métier impactés par l\'échange de données sont-ils documentés ?',
      'Existe-t-il un comité interne de gouvernance des données ?',
      'Votre institution participe-t-elle à des groupes de travail interministériels sur les données ?',
    ],
  },
  {
    key: 'SEMANTIQUE',
    label: 'Niveau Sémantique',
    color: '#D4A820',
    questions: [
      'Votre institution utilise-t-elle des référentiels de données partagés (NINEA, NNI, code localité, etc.) ?',
      'Disposez-vous d\'un dictionnaire de données interne documenté ?',
      'Les formats de vos données sont-ils alignés sur des standards ouverts (ISO, OASIS, etc.) ?',
    ],
  },
  {
    key: 'TECHNIQUE',
    label: 'Niveau Technique',
    color: '#2D6A4F',
    questions: [
      'Vos systèmes exposent-ils des API (REST, SOAP) ?',
      'Votre infrastructure est-elle compatible avec l\'installation d\'un Security Server X-Road ?',
      'Disposez-vous de certificats SSL/TLS valides ?',
      'Votre SI est-il accessible via l\'intranet gouvernemental ?',
    ],
  },
];

const REPONSE_OPTIONS = ['Oui', 'Non', 'En cours', 'Partiellement'];

function getItem(items: NiveauItem[], niveau: string, question: string): NiveauItem {
  return items.find((i) => i.niveau === niveau && i.question === question) || {
    niveau, question, reponse: '', details: '',
  };
}

function updateItem(items: NiveauItem[], niveau: string, question: string, field: string, value: string): NiveauItem[] {
  const idx = items.findIndex((i) => i.niveau === niveau && i.question === question);
  const item = { ...getItem(items, niveau, question), [field]: value };
  if (idx >= 0) {
    const newItems = [...items];
    newItems[idx] = item;
    return newItems;
  }
  return [...items, item];
}

function getScore(items: NiveauItem[], niveau: string, questions: string[]): { yes: number; total: number } {
  const yes = questions.filter((q) => {
    const item = items.find((i) => i.niveau === niveau && i.question === q);
    return item?.reponse === 'Oui';
  }).length;
  return { yes, total: questions.length };
}

export function NiveauxInteropSection({ items, onChange, disabled }: NiveauxInteropSectionProps) {
  const [openNiveaux, setOpenNiveaux] = useState<Record<string, boolean>>(
    Object.fromEntries(NIVEAUX.map((n) => [n.key, true]))
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-navy">Diagnostic des 5 niveaux d'interopérabilité</h3>
      <p className="text-sm text-gray-500">
        Évaluez votre institution sur chaque niveau du Cadre National d'Interopérabilité.
      </p>

      {NIVEAUX.map((niveau) => {
        const score = getScore(items, niveau.key, niveau.questions);
        return (
          <div key={niveau.key} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenNiveaux((prev) => ({ ...prev, [niveau.key]: !prev[niveau.key] }))}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-white font-semibold text-sm"
              style={{ backgroundColor: niveau.color }}
            >
              <span>{niveau.label}</span>
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                  {score.yes}/{score.total}
                </span>
                {openNiveaux[niveau.key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>

            {openNiveaux[niveau.key] && (
              <div className="divide-y">
                {niveau.questions.map((question, qi) => {
                  const item = getItem(items, niveau.key, question);
                  return (
                    <div key={qi} className={cn('px-4 py-3 space-y-2', qi % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <p className="text-sm font-medium text-gray-700">{question}</p>
                      <div className="flex items-center space-x-3">
                        <select
                          value={item.reponse}
                          onChange={(e) => onChange(updateItem(items, niveau.key, question, 'reponse', e.target.value))}
                          disabled={disabled}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-gray-100"
                        >
                          <option value="">— Sélectionner —</option>
                          {REPONSE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <Input
                          value={item.details}
                          onChange={(e) => onChange(updateItem(items, niveau.key, question, 'details', e.target.value))}
                          disabled={disabled}
                          placeholder="Précisions..."
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
