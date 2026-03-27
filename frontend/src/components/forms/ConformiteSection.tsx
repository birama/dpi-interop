import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PrincipeItem {
  principeNumero: number;
  categorie: string;
  score: number;
  commentaire: string;
}

interface DecretItem {
  chapitre: string;
  question: string;
  reponse: string;
  details: string;
}

interface ConformiteSectionProps {
  principes: PrincipeItem[];
  decret: DecretItem[];
  onPrincipesChange: (items: PrincipeItem[]) => void;
  onDecretChange: (items: DecretItem[]) => void;
  disabled?: boolean;
}

const PRINCIPES = [
  { num: 1, cat: 'A', label: 'Subsidiarité', desc: 'Les décisions sont prises au niveau le plus approprié' },
  { num: 2, cat: 'A', label: 'Proportionnalité', desc: 'Les mesures sont proportionnées aux objectifs' },
  { num: 3, cat: 'A', label: 'Centré sur l\'utilisateur', desc: 'Les services sont conçus du point de vue du citoyen' },
  { num: 4, cat: 'B', label: 'Inclusion et accessibilité', desc: 'Les services numériques sont accessibles à tous' },
  { num: 5, cat: 'B', label: 'Multilinguisme', desc: 'Les services sont disponibles en plusieurs langues' },
  { num: 6, cat: 'B', label: 'Simplicité administrative', desc: 'Réduire la charge administrative pour les usagers' },
  { num: 7, cat: 'B', label: 'Transparence', desc: 'Les processus administratifs sont transparents et traçables' },
  { num: 8, cat: 'B', label: 'Préservation de l\'information', desc: 'Les données sont archivées et conservées' },
  { num: 9, cat: 'C', label: 'Ouverture', desc: 'Utilisation de standards ouverts et logiciels libres quand possible' },
  { num: 10, cat: 'C', label: 'Réutilisabilité', desc: 'Les solutions et données sont réutilisables entre administrations' },
  { num: 11, cat: 'C', label: 'Neutralité technologique', desc: 'Pas de verrouillage par un fournisseur' },
  { num: 12, cat: 'C', label: 'Sécurité et vie privée', desc: 'Protection des données et conformité CDP' },
  { num: 13, cat: 'D', label: 'Efficacité et efficience', desc: 'Évaluation coûts/bénéfices des solutions' },
];

const CAT_LABELS: Record<string, string> = {
  'A': 'Principes politiques et stratégiques',
  'B': 'Principes fondamentaux',
  'C': 'Principes de confiance et sécurité',
  'D': 'Principes d\'innovation',
};

const DECRET_QUESTIONS = [
  { chapitre: 'CHAPITRE_2', question: 'Êtes-vous prêt à partager vos données de référence via PINS ?', options: ['Prêt', 'En préparation', 'Non prêt'] },
  { chapitre: 'CHAPITRE_2', question: 'Respectez-vous les exigences de sécurité pour l\'échange de données ?', options: ['Oui', 'Partiellement', 'Non'] },
  { chapitre: 'CHAPITRE_2', question: 'Avez-vous identifié vos services consommateurs et fournisseurs ?', options: ['Oui', 'En cours', 'Non'] },
  { chapitre: 'CHAPITRE_3', question: 'Pouvez-vous désigner un représentant au Comité National d\'Interopérabilité (CNI) ?', options: ['Oui', 'À confirmer'] },
  { chapitre: 'CHAPITRE_3', question: 'Pouvez-vous participer au comité technique d\'interopérabilité ?', options: ['Oui', 'À confirmer'] },
  { chapitre: 'CHAPITRE_4', question: 'Estimez votre délai de mise en conformité', options: ['< 6 mois', '6-12 mois', '12-18 mois', '> 18 mois'] },
  { chapitre: 'CHAPITRE_4', question: 'Avez-vous besoin d\'un accompagnement technique ?', options: ['Oui', 'Non'] },
];

const SCORE_LABELS = ['', 'Non commencé', 'Conscient', 'En cours', 'Largement implémenté', 'Pleinement conforme'];

function getPrincipe(items: PrincipeItem[], num: number, cat: string): PrincipeItem {
  return items.find((i) => i.principeNumero === num) || { principeNumero: num, categorie: cat, score: 1, commentaire: '' };
}

function getDecret(items: DecretItem[], chapitre: string, question: string): DecretItem {
  return items.find((i) => i.chapitre === chapitre && i.question === question) || { chapitre, question, reponse: '', details: '' };
}

export function ConformiteSection({ principes, decret, onPrincipesChange, onDecretChange, disabled }: ConformiteSectionProps) {
  const updatePrincipe = (num: number, cat: string, field: string, value: any) => {
    const idx = principes.findIndex((p) => p.principeNumero === num);
    const item = { ...getPrincipe(principes, num, cat), [field]: value };
    if (idx >= 0) {
      const newItems = [...principes];
      newItems[idx] = item;
      onPrincipesChange(newItems);
    } else {
      onPrincipesChange([...principes, item]);
    }
  };

  const updateDecret = (chapitre: string, question: string, field: string, value: string) => {
    const idx = decret.findIndex((d) => d.chapitre === chapitre && d.question === question);
    const item = { ...getDecret(decret, chapitre, question), [field]: value };
    if (idx >= 0) {
      const newItems = [...decret];
      newItems[idx] = item;
      onDecretChange(newItems);
    } else {
      onDecretChange([...decret, item]);
    }
  };

  // Score moyen
  const filledPrincipes = principes.filter((p) => p.score > 0);
  const avgScore = filledPrincipes.length > 0
    ? (filledPrincipes.reduce((sum, p) => sum + p.score, 0) / filledPrincipes.length).toFixed(1)
    : '—';

  // Readiness score décret
  const positiveDecret = decret.filter((d) => ['Prêt', 'Oui', '< 6 mois'].includes(d.reponse)).length;
  const readiness = DECRET_QUESTIONS.length > 0 ? Math.round((positiveDecret / DECRET_QUESTIONS.length) * 100) : 0;
  const readinessColor = readiness > 70 ? 'text-success' : readiness > 40 ? 'text-gold' : 'text-red-500';

  // Group principes by category
  const categories = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-8">
      {/* 13 PRINCIPES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-navy">Conformité aux 13 principes d'interopérabilité</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal">{avgScore}<span className="text-sm text-gray-400">/5</span></div>
            <div className="text-xs text-gray-500">Score moyen</div>
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat} className="space-y-2">
            <h4 className="text-sm font-semibold text-navy bg-gray-100 px-3 py-2 rounded">
              Catégorie {cat} — {CAT_LABELS[cat]}
            </h4>
            {PRINCIPES.filter((p) => p.cat === cat).map((principe) => {
              const item = getPrincipe(principes, principe.num, principe.cat);
              return (
                <div key={principe.num} className="flex items-start space-x-4 px-3 py-2 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">
                      <span className="text-teal mr-1">{principe.num}.</span> {principe.label}
                    </p>
                    <p className="text-xs text-gray-400">{principe.desc}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={item.score}
                      onChange={(e) => updatePrincipe(principe.num, principe.cat, 'score', parseInt(e.target.value))}
                      disabled={disabled}
                      className="w-48 h-8 px-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100"
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <option key={s} value={s}>{s} — {SCORE_LABELS[s]}</option>
                      ))}
                    </select>
                    <Input
                      value={item.commentaire}
                      onChange={(e) => updatePrincipe(principe.num, principe.cat, 'commentaire', e.target.value)}
                      disabled={disabled}
                      placeholder="Commentaire..."
                      className="h-8 text-xs w-40"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* PRÉPARATION DÉCRET */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-navy">Préparation au décret sur l'interopérabilité</h3>
          <div className="text-center">
            <div className={cn('text-2xl font-bold', readinessColor)}>{readiness}%</div>
            <div className="text-xs text-gray-500">Readiness</div>
          </div>
        </div>

        <div className="space-y-3">
          {DECRET_QUESTIONS.map((dq, i) => {
            const item = getDecret(decret, dq.chapitre, dq.question);
            const chapLabel = dq.chapitre.replace('_', ' ');
            return (
              <div key={i} className={cn('px-4 py-3 border rounded-lg', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-teal bg-teal-50 px-2 py-0.5 rounded">{chapLabel}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">{dq.question}</p>
                <div className="flex items-center space-x-3">
                  <select
                    value={item.reponse}
                    onChange={(e) => updateDecret(dq.chapitre, dq.question, 'reponse', e.target.value)}
                    disabled={disabled}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100"
                  >
                    <option value="">— Sélectionner —</option>
                    {dq.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <Input
                    value={item.details}
                    onChange={(e) => updateDecret(dq.chapitre, dq.question, 'details', e.target.value)}
                    disabled={disabled}
                    placeholder="Précisions..."
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
