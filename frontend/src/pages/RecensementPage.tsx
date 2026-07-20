import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, CheckCircle, Send, Building2, User, FileText, Cpu, Plus, Trash2 } from 'lucide-react';
import { api } from '@/services/api';

type RecensementPrefill = {
  ministereTutelle?: string; structureNom?: string; typeStructure?: string;
  contactNom?: string; contactFonction?: string; contactEmail?: string; contactTelephone?: string;
};

// Décret n° 2026-1130 du 1er juin 2026 fixant la composition du Gouvernement
const MINISTERES = [
  'Présidence de la République', 'Primature', 'Ministère des Forces Armées',
  'Ministère de l\'Economie, des Finances et du Plan', 'Ministère chargé du Budget',
  'Ministère chargé de l\'Economie, du Plan et de la Coopération',
  'Ministère de l\'Intérieur et de la Sécurité publique',
  'Ministère de l\'Intégration Africaine, des Affaires étrangères et des Sénégalais de l\'Extérieur',
  'Ministère de la Justice, Garde des Sceaux', 'Ministère de la Famille, de l\'Action sociale et des Solidarités',
  'Ministère de l\'Enseignement supérieur, de la Recherche et de l\'Innovation',
  'Ministère de l\'Energie et du Pétrole', 'Ministère des Mines et de la Géologie',
  'Ministère de l\'Industrie et du Commerce', 'Ministère de l\'Hydraulique et de l\'Assainissement',
  'Ministère de l\'Education Nationale', 'Ministère de la Santé et de l\'Hygiène Publique',
  'Ministère de l\'Urbanisme, des Collectivités Territoriales et de l\'Aménagement des Territoires',
  'Ministère des Infrastructures', 'Ministère des Transports terrestres et aériens',
  'Ministère de la Communication et des Relations avec les Institutions',
  'Ministère des Télécommunications et du Numérique',
  'Ministère de la Microfinance et de l\'Economie Sociale et Solidaire',
  'Ministère de l\'Agriculture, de la Souveraineté Alimentaire et de l\'Elevage',
  'Ministère chargé de l\'Elevage', 'Ministère de la Fonction Publique, du Travail et de la Réforme du Service Public',
  'Ministère de l\'Emploi et de la Formation Professionnelle et Technique',
  'Ministère de la Jeunesse et des Sports', 'Ministère de la Culture, de l\'Artisanat et du Tourisme',
  'Ministère chargé de la Culture, des Industries créatives et du Patrimoine historique',
  'Ministère des Pêches et de l\'Economie maritime', 'Ministère de l\'Environnement et de la Transition Ecologique', 'Autre',
];

const TYPES_STRUCTURE = [
  { value: 'MINISTERE', label: 'Ministère' }, { value: 'DIRECTION', label: 'Direction' },
  { value: 'AGENCE', label: 'Agence' }, { value: 'ETABLISSEMENT_PUBLIC', label: 'Établissement public' },
  { value: 'SOCIETE_NATIONALE', label: 'Société nationale' },
  { value: 'PROJET_PROGRAMME', label: 'Projet ou programme' }, { value: 'AUTRE', label: 'Autre' },
];

const NATURES = [
  'Application métier', 'Plateforme ou portail', 'Infrastructure et réseau',
  'Données et décisionnel', 'Identité numérique', 'Service en ligne au citoyen',
  'Équipement et matériel', 'Renforcement de capacités', 'Autre',
];

const STATUTS_AVANCEMENT = [
  { value: 'IDEE_CONCEPTION', label: 'Idée ou conception' }, { value: 'ETUDE_CADRAGE', label: 'Étude et cadrage' },
  { value: 'EN_REALISATION', label: 'En cours de réalisation' }, { value: 'EN_PRODUCTION', label: 'En production' },
  { value: 'EN_REFONTE', label: 'En refonte' }, { value: 'SUSPENDU', label: 'Suspendu' },
];

const BUDGET_FOURCHETTES = [
  { value: 'MOINS_50_MILLIONS', label: 'Moins de 50 millions FCFA' },
  { value: 'DE_50_A_200_MILLIONS', label: '50 à 200 millions FCFA' },
  { value: 'DE_200_MILLIONS_A_1_MILLIARD', label: '200 millions à 1 milliard FCFA' },
  { value: 'PLUS_1_MILLIARD', label: 'Plus de 1 milliard FCFA' }, { value: 'NON_CHIFFRE', label: 'Non chiffré' },
];

const SOURCES_FINANCEMENT = [
  { value: 'BUDGET_NATIONAL', label: 'Budget national' },
  { value: 'PARTENAIRE_TECHNIQUE_FINANCIER', label: 'Partenaire technique et financier' },
  { value: 'PARTENARIAT_PUBLIC_PRIVE', label: 'Partenariat public-privé' },
  { value: 'RESSOURCES_PROPRES', label: 'Ressources propres' },
  { value: 'NON_FINANCE', label: 'Non financé ou en recherche' }, { value: 'AUTRE', label: 'Autre' },
];

const REGISTRES = ['NINEA', 'RNEC (état civil)', 'RNU', 'NICAD (cadastre)', 'RCCM', 'Fichier des véhicules',
  'Registres douaniers', 'Registres fiscaux', 'Répertoires sociaux (CSS, IPRES)', 'Autre', 'Aucun'];

const HEBERGEMENTS = [
  { value: 'CLOUD_SOUVERAIN_SENUM', label: 'Cloud souverain SENUM' },
  { value: 'DATACENTER_STRUCTURE', label: 'Datacenter de la structure' },
  { value: 'CLOUD_ETRANGER', label: 'Cloud étranger' }, { value: 'NON_DEFINI', label: 'Non défini' },
];

const OUI_NON_PREVU = [{ value: 'OUI', label: 'Oui' }, { value: 'NON', label: 'Non' }, { value: 'PREVU', label: 'Prévu' }];
const OUI_NON_EN_COURS = [{ value: 'OUI', label: 'Oui' }, { value: 'NON', label: 'Non' }, { value: 'EN_COURS', label: 'En cours' }];
const OUI_NON_A_DETERMINER = [{ value: 'OUI', label: 'Oui' }, { value: 'NON', label: 'Non' }, { value: 'A_DETERMINER', label: 'À déterminer' }];

// --- Types ---
type ProjetData = {
  intitule: string; description: string; natures: string[]; natureAutre: string;
  statutAvancement: string; anneeDebut: string; anneeFin: string;
  budgetFourchette: string; budgetMontant: string;
  sourceFinancement: string; sourceFinancementPrecision: string;
  echangeDonnees: string; echangeDonneesDetail: string; registresConcernes: string[];
  hebergement: string; dossierArchitecture: string; souhaitAccompagnement: string; observations: string;
};

type StructureContactData = {
  ministereTutelle: string; ministereAutre: string; structureNom: string; typeStructure: string;
  contactNom: string; contactFonction: string; contactEmail: string; contactTelephone: string;
};

const EMPTY_PROJET: ProjetData = {
  intitule: '', description: '', natures: [], natureAutre: '',
  statutAvancement: '', anneeDebut: '', anneeFin: '',
  budgetFourchette: '', budgetMontant: '',
  sourceFinancement: '', sourceFinancementPrecision: '',
  echangeDonnees: '', echangeDonneesDetail: '', registresConcernes: [],
  hebergement: '', dossierArchitecture: '', souhaitAccompagnement: '', observations: '',
};

const EMPTY_SC: StructureContactData = {
  ministereTutelle: '', ministereAutre: '', structureNom: '', typeStructure: '',
  contactNom: '', contactFonction: '', contactEmail: '', contactTelephone: '',
};

const STORAGE_KEY = 'pins_recensement';
function loadSavedData(): Partial<StructureContactData> {
  try { const s = sessionStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; }
}
function saveData(data: Partial<StructureContactData>) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ok */ }
}

// --- Sub-component: one project block ---
function ProjetBlock({
  p, index, total, onChange, onRemove, showQualif,
}: {
  p: ProjetData; index: number; total: number; onChange: (p: ProjetData) => void; onRemove: () => void; showQualif: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const uid = (f: string) => `${f}_${index}`;

  const update = (field: keyof ProjetData, value: string | string[]) => {
    onChange({ ...p, [field]: value });
  };

  const toggleNature = (nature: string) => {
    const natures = p.natures.includes(nature) ? p.natures.filter(n => n !== nature) : [...p.natures, nature];
    update('natures', natures);
    if (nature !== 'Autre') update('natureAutre', '');
  };

  const toggleRegistre = (reg: string) => {
    if (reg === 'Aucun') { update('registresConcernes', ['Aucun']); return; }
    const filtered = p.registresConcernes.filter(r => r !== 'Aucun');
    update('registresConcernes', filtered.includes(reg) ? filtered.filter(r => r !== reg) : [...filtered, reg]);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header bar */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-teal bg-teal-50 px-2 py-0.5 rounded">Projet {index + 1}/{total}</span>
          {collapsed && p.intitule && (
            <span className="text-sm text-gray-600 truncate">— {p.intitule}</span>
          )}
          {collapsed && !p.intitule && (
            <span className="text-sm text-gray-400">— Nouveau projet</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {total > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 text-gray-400 hover:text-red-500" title="Retirer ce projet">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Body (collapsible) */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intitulé du projet <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: Plateforme de gestion des bourses" value={p.intitule}
              onChange={e => update('intitule', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
              <span className={`ml-2 text-xs ${p.description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{p.description.length}/500</span>
            </label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" rows={3} maxLength={500}
              placeholder="Décrivez brièvement le projet..." value={p.description}
              onChange={e => update('description', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nature du projet <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NATURES.map(nature => (
                <label key={nature} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-teal focus:ring-teal"
                    checked={p.natures.includes(nature)} onChange={() => toggleNature(nature)} />
                  {nature}
                </label>
              ))}
            </div>
            {p.natures.includes('Autre') && (
              <input type="text" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Précisez la nature du projet..." value={p.natureAutre}
                onChange={e => update('natureAutre', e.target.value)} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut d'avancement <span className="text-red-500">*</span></label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={p.statutAvancement} onChange={e => update('statutAvancement', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {STATUTS_AVANCEMENT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année de démarrage</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Ex: 2025" min={1990} max={2100} value={p.anneeDebut}
                onChange={e => update('anneeDebut', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année de fin prévue</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Ex: 2028" min={1990} max={2100} value={p.anneeFin}
                onChange={e => update('anneeFin', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget estimé <span className="text-red-500">*</span></label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={p.budgetFourchette} onChange={e => update('budgetFourchette', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {BUDGET_FOURCHETTES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <input type="number" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Montant exact en FCFA (facultatif)" value={p.budgetMontant}
              onChange={e => update('budgetMontant', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source de financement <span className="text-red-500">*</span></label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={p.sourceFinancement} onChange={e => update('sourceFinancement', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {SOURCES_FINANCEMENT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {(p.sourceFinancement === 'PARTENAIRE_TECHNIQUE_FINANCIER' || p.sourceFinancement === 'AUTRE') && (
              <input type="text" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Précisez le partenaire ou la source..." value={p.sourceFinancementPrecision}
                onChange={e => update('sourceFinancementPrecision', e.target.value)} />
            )}
          </div>

          {/* Qualification (facultatif, repliable) */}
          <div className="border-t pt-3">
            <button type="button" className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy"
              onClick={() => update('echangeDonnees', showQualif ? '' : (p.echangeDonnees || ''))}>
              <Cpu className="w-4 h-4" />
              Qualification interopérabilité (facultatif)
              {p.echangeDonnees || p.hebergement || p.dossierArchitecture ? (
                <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">Rempli</span>
              ) : null}
            </button>
            {(showQualif || p.echangeDonnees || p.hebergement) && (
              <div className="mt-3 space-y-3 pl-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Échange de données avec d'autres administrations ?</label>
                  <div className="flex gap-4">
                    {OUI_NON_PREVU.map(o => (
                      <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name={uid('echangeDonnees')} className="text-teal focus:ring-teal"
                          checked={p.echangeDonnees === o.value} onChange={() => update('echangeDonnees', o.value)} />{o.label}
                      </label>
                    ))}
                  </div>
                  {p.echangeDonnees === 'OUI' && (
                    <input type="text" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Avec quelles administrations ?" value={p.echangeDonneesDetail}
                      onChange={e => update('echangeDonneesDetail', e.target.value)} />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Registres nationaux concernés</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {REGISTRES.map(reg => (
                      <label key={reg} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-teal focus:ring-teal"
                          checked={p.registresConcernes.includes(reg)} onChange={() => toggleRegistre(reg)} />{reg}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hébergement</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={p.hebergement} onChange={e => update('hebergement', e.target.value)}>
                    <option value="">— Non renseigné —</option>
                    {HEBERGEMENTS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dossier d'architecture ?</label>
                  <div className="flex gap-4">
                    {OUI_NON_EN_COURS.map(o => (
                      <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name={uid('dossierArchitecture')} className="text-teal focus:ring-teal"
                          checked={p.dossierArchitecture === o.value} onChange={() => update('dossierArchitecture', o.value)} />{o.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Souhait accompagnement DU ?</label>
                  <div className="flex gap-4">
                    {OUI_NON_A_DETERMINER.map(o => (
                      <label key={o.value} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" name={uid('souhaitAccompagnement')} className="text-teal focus:ring-teal"
                          checked={p.souhaitAccompagnement === o.value} onChange={() => update('souhaitAccompagnement', o.value)} />{o.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Observations</label>
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" rows={2} maxLength={2000}
                    placeholder="Toute information complémentaire..." value={p.observations}
                    onChange={e => update('observations', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main page component ---
export function RecensementPage({ prefill, isAuthenticated }: { prefill?: RecensementPrefill; isAuthenticated?: boolean } = {}) {
  const [sc, setSc] = useState<StructureContactData>(() => {
    const saved = loadSavedData();
    const initials = prefill ? {
      ministereTutelle: prefill.ministereTutelle || '',
      structureNom: prefill.structureNom || '',
      contactNom: prefill.contactNom || '',
      contactFonction: prefill.contactFonction || '',
      contactEmail: prefill.contactEmail || '',
      contactTelephone: prefill.contactTelephone || '',
    } : {};
    return { ...EMPTY_SC, ...initials, ...saved };
  });
  const [projets, setProjets] = useState<ProjetData[]>([{ ...EMPTY_PROJET }]);
  const [submitted, setSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showQualif, setShowQualif] = useState(false);
  const [sessionRef, setSessionRef] = useState('');
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const s = sessionStorage.getItem('pins_recensement_session'); if (s) setSessionRef(s); }, []);

  const updateSc = (field: keyof StructureContactData, value: string) => {
    setSc(prev => { const next = { ...prev, [field]: value }; saveData({ [field]: value } as any); return next; });
  };

  const updateProjet = (index: number, projet: ProjetData) => {
    setProjets(prev => prev.map((p, i) => i === index ? projet : p));
  };

  const addProjet = () => setProjets(prev => [...prev, { ...EMPTY_PROJET }]);
  const removeProjet = (index: number) => setProjets(prev => prev.filter((_, i) => i !== index));

  const validateSc = (): string | null => {
    if (!sc.ministereTutelle) return 'Veuillez sélectionner le ministère de tutelle.';
    if (sc.ministereTutelle === 'Autre' && !sc.ministereAutre.trim()) return 'Veuillez préciser le ministère.';
    if (!sc.structureNom.trim()) return 'Veuillez indiquer la structure.';
    if (!sc.typeStructure) return 'Veuillez sélectionner le type de structure.';
    if (!sc.contactNom.trim()) return 'Veuillez indiquer le nom et prénom du contact.';
    if (!sc.contactFonction.trim()) return 'Veuillez indiquer la fonction.';
    if (!sc.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sc.contactEmail)) return 'L\'email professionnel est requis et doit être valide.';
    return null;
  };

  const validateProjet = (p: ProjetData): string | null => {
    if (!p.intitule.trim()) return 'Chaque projet doit avoir un intitulé.';
    if (!p.description.trim()) return 'Chaque projet doit avoir une description.';
    if (p.natures.length === 0) return 'Chaque projet doit avoir au moins une nature.';
    if (!p.statutAvancement) return 'Chaque projet doit avoir un statut d\'avancement.';
    if (!p.budgetFourchette) return 'Chaque projet doit avoir une fourchette budgétaire.';
    if (!p.sourceFinancement) return 'Chaque projet doit avoir une source de financement.';
    return null;
  };

  const handleSubmit = async () => {
    const scErr = validateSc(); if (scErr) { setSubmitError(scErr); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    for (let i = 0; i < projets.length; i++) {
      const pErr = validateProjet(projets[i]); if (pErr) { setSubmitError(`Projet ${i + 1} : ${pErr}`); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    setSubmitError(''); setSubmitting(true);

    const buildNatures = (p: ProjetData) => {
      const nats = p.natures.filter(n => n !== 'Autre');
      if (p.natures.includes('Autre') && p.natureAutre.trim()) nats.push(p.natureAutre.trim());
      return nats;
    };

    const buildProjet = (p: ProjetData) => ({
      intitule: p.intitule.trim(), description: p.description.trim(),
      natures: buildNatures(p), statutAvancement: p.statutAvancement,
      anneeDebut: p.anneeDebut ? parseInt(p.anneeDebut) : null,
      anneeFin: p.anneeFin ? parseInt(p.anneeFin) : null,
      budgetFourchette: p.budgetFourchette,
      budgetMontant: p.budgetMontant ? parseFloat(p.budgetMontant) : null,
      sourceFinancement: p.sourceFinancement,
      sourceFinancementPrecision: (p.sourceFinancement === 'PARTENAIRE_TECHNIQUE_FINANCIER' || p.sourceFinancement === 'AUTRE') ? p.sourceFinancementPrecision : undefined,
      echangeDonnees: p.echangeDonnees || null,
      echangeDonneesDetail: p.echangeDonnees === 'OUI' ? p.echangeDonneesDetail : undefined,
      registresConcernes: p.registresConcernes.includes('Aucun') ? [] : p.registresConcernes,
      hebergement: p.hebergement || null,
      dossierArchitecture: p.dossierArchitecture || null,
      souhaitAccompagnement: p.souhaitAccompagnement || null,
      observations: p.observations.trim() || undefined,
    });

    const body: any = {
      ministereTutelle: sc.ministereTutelle,
      ministereAutre: sc.ministereTutelle === 'Autre' ? sc.ministereAutre : undefined,
      structureNom: sc.structureNom.trim(), typeStructure: sc.typeStructure,
      contactNom: sc.contactNom.trim(), contactFonction: sc.contactFonction.trim(),
      contactEmail: sc.contactEmail.trim(),
      contactTelephone: sc.contactTelephone.trim() || undefined,
      website: '', sessionRef: sessionRef || undefined,
    };

    if (projets.length === 1) {
      // Mode unitaire (rétrocompatible)
      Object.assign(body, buildProjet(projets[0]));
    } else {
      // Mode multi-projets
      body.projets = projets.map(buildProjet);
    }

    try {
      let result: { id?: string; ids?: string[]; count?: number; sessionRef: string };
      if (isAuthenticated) {
        const resp = await api.post('/public/recensement', body);
        result = resp.data;
      } else {
        const resp = await fetch('/api/public/recensement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || 'Erreur lors de la soumission'); }
        result = await resp.json();
      }
      const newSessionRef = result.sessionRef;
      if (newSessionRef) { sessionStorage.setItem('pins_recensement_session', newSessionRef); setSessionRef(newSessionRef); }
      setSubmitCount(projets.length);
      setSubmitted(true);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e: any) {
      setSubmitError(e.message || 'Erreur réseau. Veuillez réessayer.');
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally { setSubmitting(false); }
  };

  const handleNewProject = () => {
    const preserved = { ministereTutelle: sc.ministereTutelle, ministereAutre: sc.ministereAutre, structureNom: sc.structureNom, typeStructure: sc.typeStructure, contactNom: sc.contactNom, contactFonction: sc.contactFonction, contactEmail: sc.contactEmail, contactTelephone: sc.contactTelephone };
    setSc({ ...EMPTY_SC, ...preserved }); saveData(preserved);
    setProjets([{ ...EMPTY_PROJET }]);
    setSubmitted(false); setSubmitError(''); setShowQualif(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" ref={topRef}>
        <header className="bg-navy text-white py-4 px-6"><div className="max-w-2xl mx-auto text-center"><p className="text-sm text-gray-400">Recensement des projets numériques de l'État</p></div></header>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-10 pb-10 text-center">
              <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
              <h2 className="text-xl font-bold text-navy mb-2">
                {submitCount > 1 ? `${submitCount} projets déclarés` : 'Projet déclaré avec succès'}
              </h2>
              <p className="text-gray-500 mb-2">pour <strong>{sc.structureNom}</strong></p>
              <p className="text-sm text-gray-400 mb-8">Contact : {sc.contactEmail}</p>
              <Button onClick={handleNewProject} className="bg-teal hover:bg-teal-dark text-white w-full">Déclarer un autre projet</Button>
              <p className="text-xs text-gray-400 mt-3">La structure et le contact sont déjà pré-remplis.</p>
            </CardContent>
          </Card>
        </div>
        <footer className="bg-navy text-white py-4 px-6 text-center text-xs text-gray-400">SENUM / MTN — Plateforme Nationale d'Interopérabilité PINS — Sénégal</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={topRef}>
      <header className="bg-navy text-white py-6 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center font-bold text-lg">e</div>
            <div><h1 className="text-lg font-bold text-gold">Recensement des projets numériques de l'État</h1><p className="text-xs text-gray-400">Comité GouvNum — Constitution du portefeuille national</p></div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {submitError && (<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{submitError}</div>)}

        {/* Bloc 1 - Structure */}
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-teal" /><h2 className="font-bold text-navy">Structure déclarante</h2><span className="text-xs bg-navy text-white px-2 py-0.5 rounded">Obligatoire</span></div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ministère de tutelle <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={sc.ministereTutelle} onChange={e => updateSc('ministereTutelle', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {MINISTERES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {sc.ministereTutelle === 'Autre' && <input type="text" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Précisez le ministère..." value={sc.ministereAutre} onChange={e => updateSc('ministereAutre', e.target.value)} />}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Direction, agence ou structure <span className="text-red-500">*</span></label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Direction des Systèmes d'Information" value={sc.structureNom} onChange={e => updateSc('structureNom', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type de structure <span className="text-red-500">*</span></label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={sc.typeStructure} onChange={e => updateSc('typeStructure', e.target.value)}><option value="">— Sélectionner —</option>{TYPES_STRUCTURE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          </div>
        </CardContent></Card>

        {/* Bloc 2 - Contact */}
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-teal" /><h2 className="font-bold text-navy">Contact</h2><span className="text-xs bg-navy text-white px-2 py-0.5 rounded">Obligatoire</span></div>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom et prénom <span className="text-red-500">*</span></label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Jean Diop" value={sc.contactNom} onChange={e => updateSc('contactNom', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fonction <span className="text-red-500">*</span></label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Directeur des Systèmes d'Information" value={sc.contactFonction} onChange={e => updateSc('contactFonction', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel <span className="text-red-500">*</span></label><input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="prenom.nom@gouv.sn" value={sc.contactEmail} onChange={e => updateSc('contactEmail', e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone <span className="text-gray-400 text-xs">(facultatif)</span></label><input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="+221 77 000 00 00" value={sc.contactTelephone} onChange={e => updateSc('contactTelephone', e.target.value)} /></div>
          </div>
        </CardContent></Card>

        {/* Bloc 3 - Projets (répétable) */}
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-teal" /><h2 className="font-bold text-navy">Projet{projets.length > 1 ? 's' : ''} ({projets.length})</h2><span className="text-xs bg-navy text-white px-2 py-0.5 rounded">Obligatoire</span></div>

          <div className="space-y-4">
            {projets.map((p, i) => (
              <ProjetBlock key={i} p={p} index={i} total={projets.length}
                onChange={(proj) => updateProjet(i, proj)}
                onRemove={() => removeProjet(i)}
                showQualif={showQualif} />
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="mt-4 w-full border-dashed border-2 text-gray-500 hover:text-teal hover:border-teal"
            onClick={addProjet} disabled={projets.length >= 20}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter un autre projet à cette déclaration
          </Button>
          {projets.length > 1 && <p className="text-xs text-gray-400 mt-1 text-center">{projets.length} projets dans cette déclaration. Chaque bloc peut être replié.</p>}
        </CardContent></Card>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-navy hover:bg-navy-light text-white py-6 text-base font-semibold">
          {submitting ? 'Envoi en cours...' : <><Send className="w-4 h-4 mr-2" />Déclarer {projets.length > 1 ? `les ${projets.length} projets` : 'le projet'}</>}
        </Button>
        <p className="text-xs text-gray-400 text-center -mt-4">Temps estimé : {projets.length * 3} minutes. Une soumission = {projets.length > 1 ? `${projets.length} projets` : 'un projet'}.</p>
      </div>

      <footer className="bg-navy text-white py-4 px-6 text-center text-xs text-gray-400">SENUM / MTN — Plateforme Nationale d'Interopérabilité PINS — Sénégal</footer>
    </div>
  );
}
