import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, CheckCircle, Send, Building2, User, FileText, Cpu } from 'lucide-react';
import { api } from '@/services/api';

type RecensementPrefill = {
  ministereTutelle?: string;
  structureNom?: string;
  typeStructure?: string;
  contactNom?: string;
  contactFonction?: string;
  contactEmail?: string;
  contactTelephone?: string;
};

// Décret n° 2026-1130 du 1er juin 2026 fixant la composition du Gouvernement
const MINISTERES = [
  'Présidence de la République',
  'Primature',
  'Ministère des Forces Armées',
  'Ministère de l\'Economie, des Finances et du Plan',
  'Ministère chargé du Budget',
  'Ministère chargé de l\'Economie, du Plan et de la Coopération',
  'Ministère de l\'Intérieur et de la Sécurité publique',
  'Ministère de l\'Intégration Africaine, des Affaires étrangères et des Sénégalais de l\'Extérieur',
  'Ministère de la Justice, Garde des Sceaux',
  'Ministère de la Famille, de l\'Action sociale et des Solidarités',
  'Ministère de l\'Enseignement supérieur, de la Recherche et de l\'Innovation',
  'Ministère de l\'Energie et du Pétrole',
  'Ministère des Mines et de la Géologie',
  'Ministère de l\'Industrie et du Commerce',
  'Ministère de l\'Hydraulique et de l\'Assainissement',
  'Ministère de l\'Education Nationale',
  'Ministère de la Santé et de l\'Hygiène Publique',
  'Ministère de l\'Urbanisme, des Collectivités Territoriales et de l\'Aménagement des Territoires',
  'Ministère des Infrastructures',
  'Ministère des Transports terrestres et aériens',
  'Ministère de la Communication et des Relations avec les Institutions',
  'Ministère des Télécommunications et du Numérique',
  'Ministère de la Microfinance et de l\'Economie Sociale et Solidaire',
  'Ministère de l\'Agriculture, de la Souveraineté Alimentaire et de l\'Elevage',
  'Ministère chargé de l\'Elevage',
  'Ministère de la Fonction Publique, du Travail et de la Réforme du Service Public',
  'Ministère de l\'Emploi et de la Formation Professionnelle et Technique',
  'Ministère de la Jeunesse et des Sports',
  'Ministère de la Culture, de l\'Artisanat et du Tourisme',
  'Ministère chargé de la Culture, des Industries créatives et du Patrimoine historique',
  'Ministère des Pêches et de l\'Economie maritime',
  'Ministère de l\'Environnement et de la Transition Ecologique',
  'Autre',
];

const TYPES_STRUCTURE = [
  { value: 'MINISTERE', label: 'Ministère' },
  { value: 'DIRECTION', label: 'Direction' },
  { value: 'AGENCE', label: 'Agence' },
  { value: 'ETABLISSEMENT_PUBLIC', label: 'Établissement public' },
  { value: 'SOCIETE_NATIONALE', label: 'Société nationale' },
  { value: 'PROJET_PROGRAMME', label: 'Projet ou programme' },
  { value: 'AUTRE', label: 'Autre' },
];

const NATURES = [
  'Application métier',
  'Plateforme ou portail',
  'Infrastructure et réseau',
  'Données et décisionnel',
  'Identité numérique',
  'Service en ligne au citoyen',
  'Équipement et matériel',
  'Renforcement de capacités',
  'Autre',
];

const STATUTS_AVANCEMENT = [
  { value: 'IDEE_CONCEPTION', label: 'Idée ou conception' },
  { value: 'ETUDE_CADRAGE', label: 'Étude et cadrage' },
  { value: 'EN_REALISATION', label: 'En cours de réalisation' },
  { value: 'EN_PRODUCTION', label: 'En production' },
  { value: 'EN_REFONTE', label: 'En refonte' },
  { value: 'SUSPENDU', label: 'Suspendu' },
];

const BUDGET_FOURCHETTES = [
  { value: 'MOINS_50_MILLIONS', label: 'Moins de 50 millions FCFA' },
  { value: 'DE_50_A_200_MILLIONS', label: '50 à 200 millions FCFA' },
  { value: 'DE_200_MILLIONS_A_1_MILLIARD', label: '200 millions à 1 milliard FCFA' },
  { value: 'PLUS_1_MILLIARD', label: 'Plus de 1 milliard FCFA' },
  { value: 'NON_CHIFFRE', label: 'Non chiffré' },
];

const SOURCES_FINANCEMENT = [
  { value: 'BUDGET_NATIONAL', label: 'Budget national' },
  { value: 'PARTENAIRE_TECHNIQUE_FINANCIER', label: 'Partenaire technique et financier' },
  { value: 'PARTENARIAT_PUBLIC_PRIVE', label: 'Partenariat public-privé' },
  { value: 'RESSOURCES_PROPRES', label: 'Ressources propres' },
  { value: 'NON_FINANCE', label: 'Non financé ou en recherche' },
  { value: 'AUTRE', label: 'Autre' },
];

const REGISTRES = [
  'NINEA',
  'RNEC (état civil)',
  'RNU',
  'NICAD (cadastre)',
  'RCCM',
  'Fichier des véhicules',
  'Registres douaniers',
  'Registres fiscaux',
  'Répertoires sociaux (CSS, IPRES)',
  'Autre',
  'Aucun',
];

const HEBERGEMENTS = [
  { value: 'CLOUD_SOUVERAIN_SENUM', label: 'Cloud souverain SENUM' },
  { value: 'DATACENTER_STRUCTURE', label: 'Datacenter de la structure' },
  { value: 'CLOUD_ETRANGER', label: 'Cloud étranger' },
  { value: 'NON_DEFINI', label: 'Non défini' },
];

const OUI_NON_PREVU = [
  { value: 'OUI', label: 'Oui' },
  { value: 'NON', label: 'Non' },
  { value: 'PREVU', label: 'Prévu' },
];

const OUI_NON_EN_COURS = [
  { value: 'OUI', label: 'Oui' },
  { value: 'NON', label: 'Non' },
  { value: 'EN_COURS', label: 'En cours' },
];

const OUI_NON_A_DETERMINER = [
  { value: 'OUI', label: 'Oui' },
  { value: 'NON', label: 'Non' },
  { value: 'A_DETERMINER', label: 'À déterminer' },
];

type FormData = {
  ministereTutelle: string;
  ministereAutre: string;
  structureNom: string;
  typeStructure: string;
  contactNom: string;
  contactFonction: string;
  contactEmail: string;
  contactTelephone: string;
  intitule: string;
  description: string;
  natures: string[];
  statutAvancement: string;
  anneeDebut: string;
  anneeFin: string;
  budgetFourchette: string;
  budgetMontant: string;
  sourceFinancement: string;
  sourceFinancementPrecision: string;
  echangeDonnees: string;
  echangeDonneesDetail: string;
  registresConcernes: string[];
  hebergement: string;
  dossierArchitecture: string;
  souhaitAccompagnement: string;
  observations: string;
};

const STORAGE_KEY = 'pins_recensement';

function loadSavedData(): Partial<FormData> {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveData(data: Partial<FormData>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* sessionStorage peut être indisponible */ }
}

const EMPTY_FORM: FormData = {
  ministereTutelle: '',
  ministereAutre: '',
  structureNom: '',
  typeStructure: '',
  contactNom: '',
  contactFonction: '',
  contactEmail: '',
  contactTelephone: '',
  intitule: '',
  description: '',
  natures: [],
  statutAvancement: '',
  anneeDebut: '',
  anneeFin: '',
  budgetFourchette: '',
  budgetMontant: '',
  sourceFinancement: '',
  sourceFinancementPrecision: '',
  echangeDonnees: '',
  echangeDonneesDetail: '',
  registresConcernes: [],
  hebergement: '',
  dossierArchitecture: '',
  souhaitAccompagnement: '',
  observations: '',
};

export function RecensementPage({ prefill, isAuthenticated }: { prefill?: RecensementPrefill; isAuthenticated?: boolean } = {}) {
  const [form, setForm] = useState<FormData>(() => {
    const saved = loadSavedData();
    const initials = prefill ? {
      ministereTutelle: prefill.ministereTutelle || '',
      ministereAutre: '',
      structureNom: prefill.structureNom || '',
      typeStructure: prefill.typeStructure || '',
      contactNom: prefill.contactNom || '',
      contactFonction: prefill.contactFonction || '',
      contactEmail: prefill.contactEmail || '',
      contactTelephone: prefill.contactTelephone || '',
    } : {};
    return { ...EMPTY_FORM, ...initials, ...saved };
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showQualification, setShowQualification] = useState(false);
  const [sessionRef, setSessionRef] = useState<string>('');
  const topRef = useRef<HTMLDivElement>(null);

  // Charge la sessionRef sauvegardée
  useEffect(() => {
    const saved = sessionStorage.getItem('pins_recensement_session');
    if (saved) setSessionRef(saved);
  }, []);

  const update = (field: keyof FormData, value: string | string[]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Sauvegarde automatique dans sessionStorage
      const toSave: Partial<FormData> = {};
      toSave[field] = value as any;
      saveData(toSave);
      return next;
    });
  };

  const toggleNature = (nature: string) => {
    setForm(prev => {
      const natures = prev.natures.includes(nature)
        ? prev.natures.filter(n => n !== nature)
        : [...prev.natures, nature];
      const next = { ...prev, natures };
      saveData({ natures });
      return next;
    });
  };

  const toggleRegistre = (registre: string) => {
    if (registre === 'Aucun') {
      setForm(prev => {
        const next = { ...prev, registresConcernes: ['Aucun'] };
        saveData({ registresConcernes: ['Aucun'] });
        return next;
      });
      return;
    }
    setForm(prev => {
      const filtered = prev.registresConcernes.filter(r => r !== 'Aucun');
      const registres = filtered.includes(registre)
        ? filtered.filter(r => r !== registre)
        : [...filtered, registre];
      const next = { ...prev, registresConcernes: registres };
      saveData({ registresConcernes: registres });
      return next;
    });
  };

  const validate = (): string | null => {
    if (!form.ministereTutelle) return 'Veuillez sélectionner le ministère de tutelle.';
    if (form.ministereTutelle === 'Autre' && !form.ministereAutre.trim()) return 'Veuillez préciser le ministère.';
    if (!form.structureNom.trim()) return 'Veuillez indiquer la structure.';
    if (!form.typeStructure) return 'Veuillez sélectionner le type de structure.';
    if (!form.contactNom.trim()) return 'Veuillez indiquer le nom et prénom du contact.';
    if (!form.contactFonction.trim()) return 'Veuillez indiquer la fonction.';
    if (!form.contactEmail.trim()) return 'L\'email professionnel est obligatoire.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) return 'L\'email n\'est pas valide.';
    if (!form.intitule.trim()) return 'Veuillez indiquer l\'intitulé du projet.';
    if (!form.description.trim()) return 'Veuillez décrire le projet.';
    if (form.natures.length === 0) return 'Veuillez sélectionner au moins une nature.';
    if (!form.statutAvancement) return 'Veuillez indiquer le statut d\'avancement.';
    if (!form.budgetFourchette) return 'Veuillez indiquer la fourchette budgétaire.';
    if (!form.sourceFinancement) return 'Veuillez indiquer la source de financement.';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) { setSubmitError(error); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    setSubmitError('');
    setSubmitting(true);

    const body = {
      ministereTutelle: form.ministereTutelle,
      ministereAutre: form.ministereTutelle === 'Autre' ? form.ministereAutre : undefined,
      structureNom: form.structureNom.trim(),
      typeStructure: form.typeStructure,
      contactNom: form.contactNom.trim(),
      contactFonction: form.contactFonction.trim(),
      contactEmail: form.contactEmail.trim(),
      contactTelephone: form.contactTelephone.trim() || undefined,
      intitule: form.intitule.trim(),
      description: form.description.trim(),
      natures: form.natures,
      statutAvancement: form.statutAvancement,
      anneeDebut: form.anneeDebut ? parseInt(form.anneeDebut) : null,
      anneeFin: form.anneeFin ? parseInt(form.anneeFin) : null,
      budgetFourchette: form.budgetFourchette,
      budgetMontant: form.budgetMontant ? parseFloat(form.budgetMontant) : null,
      sourceFinancement: form.sourceFinancement,
      sourceFinancementPrecision: form.sourceFinancement === 'PARTENAIRE_TECHNIQUE_FINANCIER' || form.sourceFinancement === 'AUTRE' ? form.sourceFinancementPrecision : undefined,
      echangeDonnees: form.echangeDonnees || null,
      echangeDonneesDetail: form.echangeDonnees === 'OUI' ? form.echangeDonneesDetail : undefined,
      registresConcernes: form.registresConcernes.includes('Aucun') ? [] : form.registresConcernes,
      hebergement: form.hebergement || null,
      dossierArchitecture: form.dossierArchitecture || null,
      souhaitAccompagnement: form.souhaitAccompagnement || null,
      observations: form.observations.trim() || undefined,
      website: '',
      sessionRef: sessionRef || undefined,
    };

    try {
      let result: { id: string; sessionRef: string };
      if (isAuthenticated) {
        // Soumission authentifiée : l'axios interceptor ajoute le token JWT
        const resp = await api.post('/public/recensement', body);
        result = resp.data;
      } else {
        // Soumission publique : fetch sans token
        const resp = await fetch('/api/public/recensement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la soumission');
        }
        result = await resp.json();
      }
      const newSessionRef = result.sessionRef as string;
      if (newSessionRef) {
        sessionStorage.setItem('pins_recensement_session', newSessionRef);
        setSessionRef(newSessionRef);
      }
      setSubmitted(true);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e: any) {
      setSubmitError(e.message || 'Erreur réseau. Veuillez réessayer.');
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewProject = () => {
    // Conserve structure et contact, efface le reste
    const preserved = {
      ministereTutelle: form.ministereTutelle,
      ministereAutre: form.ministereAutre,
      structureNom: form.structureNom,
      typeStructure: form.typeStructure,
      contactNom: form.contactNom,
      contactFonction: form.contactFonction,
      contactEmail: form.contactEmail,
      contactTelephone: form.contactTelephone,
    };
    const reset = { ...EMPTY_FORM, ...preserved };
    setForm(reset);
    saveData(preserved);
    setSubmitted(false);
    setSubmitError('');
    setShowQualification(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" ref={topRef}>
        <header className="bg-navy text-white py-4 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-gray-400">Recensement des projets numériques de l'État</p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-10 pb-10 text-center">
              <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
              <h2 className="text-xl font-bold text-navy mb-2">Projet déclaré avec succès</h2>
              <p className="text-gray-500 mb-2">
                Votre projet <strong>{form.intitule}</strong> a bien été enregistré.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Référence : la Direction de la Delivery Unit Numérique vous contactera si nécessaire à l'adresse {form.contactEmail}.
              </p>
              <Button
                onClick={handleNewProject}
                className="bg-teal hover:bg-teal-dark text-white w-full"
              >
                Déclarer un autre projet
              </Button>
              <p className="text-xs text-gray-400 mt-3">
                La structure et le contact sont déjà pré-remplis.
              </p>
            </CardContent>
          </Card>
        </div>
        <footer className="bg-navy text-white py-4 px-6 text-center text-xs text-gray-400">
          SENUM / MTN — Plateforme Nationale d'Interopérabilité PINS — Sénégal
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={topRef}>
      {/* Header */}
      <header className="bg-navy text-white py-6 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center font-bold text-lg">e</div>
            <div>
              <h1 className="text-lg font-bold text-gold">Recensement des projets numériques de l'État</h1>
              <p className="text-xs text-gray-400">Comité GouvNum — Constitution du portefeuille national</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Erreur de validation */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {submitError}
          </div>
        )}

        {/* Bloc 1 - Structure */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-teal" />
              <h2 className="font-bold text-navy">Structure déclarante</h2>
              <span className="text-xs bg-navy text-white px-2 py-0.5 rounded">Obligatoire</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ministère de tutelle <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal"
                  value={form.ministereTutelle}
                  onChange={e => update('ministereTutelle', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {MINISTERES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {form.ministereTutelle === 'Autre' && (
                  <input
                    type="text"
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Précisez le ministère..."
                    value={form.ministereAutre}
                    onChange={e => update('ministereAutre', e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direction, agence ou structure <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Direction des Systèmes d'Information"
                  value={form.structureNom}
                  onChange={e => update('structureNom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de structure <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal"
                  value={form.typeStructure}
                  onChange={e => update('typeStructure', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {TYPES_STRUCTURE.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloc 2 - Contact */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-teal" />
              <h2 className="font-bold text-navy">Contact</h2>
              <span className="text-xs bg-navy text-white px-2 py-0.5 rounded">Obligatoire</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom et prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Jean Diop"
                  value={form.contactNom}
                  onChange={e => update('contactNom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fonction <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Directeur des Systèmes d'Information"
                  value={form.contactFonction}
                  onChange={e => update('contactFonction', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email professionnel <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="prenom.nom@gouv.sn"
                  value={form.contactEmail}
                  onChange={e => update('contactEmail', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-gray-400 text-xs">(facultatif)</span>
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="+221 77 000 00 00"
                  value={form.contactTelephone}
                  onChange={e => update('contactTelephone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloc 3 - Projet */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-teal" />
              <h2 className="font-bold text-navy">Le projet</h2>
              <span className="text-xs bg-navy text-white px-2 py-0.5 rounded">Obligatoire</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intitulé du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Plateforme de gestion des bourses"
                  value={form.intitule}
                  onChange={e => update('intitule', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                  <span className={`ml-2 text-xs ${form.description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.description.length}/500
                  </span>
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={3}
                  maxLength={500}
                  placeholder="Décrivez brièvement le projet, son objectif et ses bénéficiaires..."
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nature du projet <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {NATURES.map(nature => (
                    <label key={nature} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-teal focus:ring-teal"
                        checked={form.natures.includes(nature)}
                        onChange={() => toggleNature(nature)}
                      />
                      {nature}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut d'avancement <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal"
                  value={form.statutAvancement}
                  onChange={e => update('statutAvancement', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {STATUTS_AVANCEMENT.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année de démarrage <span className="text-gray-400 text-xs">(facultatif)</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Ex: 2025"
                    min={1990}
                    max={2100}
                    value={form.anneeDebut}
                    onChange={e => update('anneeDebut', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année de fin prévue <span className="text-gray-400 text-xs">(facultatif)</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Ex: 2028"
                    min={1990}
                    max={2100}
                    value={form.anneeFin}
                    onChange={e => update('anneeFin', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget estimé <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal"
                  value={form.budgetFourchette}
                  onChange={e => update('budgetFourchette', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {BUDGET_FOURCHETTES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Montant exact en FCFA (facultatif)"
                  value={form.budgetMontant}
                  onChange={e => update('budgetMontant', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source de financement <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal"
                  value={form.sourceFinancement}
                  onChange={e => update('sourceFinancement', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {SOURCES_FINANCEMENT.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {(form.sourceFinancement === 'PARTENAIRE_TECHNIQUE_FINANCIER' || form.sourceFinancement === 'AUTRE') && (
                  <input
                    type="text"
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Précisez le partenaire ou la source..."
                    value={form.sourceFinancementPrecision}
                    onChange={e => update('sourceFinancementPrecision', e.target.value)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloc 4 - Qualification (facultatif, repliable) */}
        <Card>
          <CardContent className="pt-6">
            <button
              type="button"
              className="flex items-center justify-between w-full"
              onClick={() => setShowQualification(!showQualification)}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal" />
                <h2 className="font-bold text-navy text-left">Qualification interopérabilité et architecture</h2>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Facultatif</span>
              </div>
              {showQualification ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            <p className="text-xs text-gray-400 mt-1 ml-7">
              Ces informations alimenteront le comité d'architecture. Chaque champ rempli fait gagner un aller-retour.
            </p>

            {showQualification && (
              <div className="mt-4 space-y-4 ml-7">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Le projet échange-t-il des données avec d'autres administrations ?
                  </label>
                  <div className="flex gap-4">
                    {OUI_NON_PREVU.map(o => (
                      <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="echangeDonnees"
                          className="text-teal focus:ring-teal"
                          checked={form.echangeDonnees === o.value}
                          onChange={() => update('echangeDonnees', o.value)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  {form.echangeDonnees === 'OUI' && (
                    <input
                      type="text"
                      className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Avec quelles administrations ?"
                      value={form.echangeDonneesDetail}
                      onChange={e => update('echangeDonneesDetail', e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Le projet consomme-t-il ou alimente-t-il un registre national ?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGISTRES.map(reg => (
                      <label key={reg} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-teal focus:ring-teal"
                          checked={form.registresConcernes.includes(reg)}
                          onChange={() => toggleRegistre(reg)}
                        />
                        {reg}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hébergement prévu ou actuel
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal"
                    value={form.hebergement}
                    onChange={e => update('hebergement', e.target.value)}
                  >
                    <option value="">— Non renseigné —</option>
                    {HEBERGEMENTS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Le projet dispose-t-il d'un dossier d'architecture ?
                  </label>
                  <div className="flex gap-4">
                    {OUI_NON_EN_COURS.map(o => (
                      <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="dossierArchitecture"
                          className="text-teal focus:ring-teal"
                          checked={form.dossierArchitecture === o.value}
                          onChange={() => update('dossierArchitecture', o.value)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Souhaitez-vous un accompagnement de la Delivery Unit ou un passage en comité d'architecture ?
                  </label>
                  <div className="flex gap-4">
                    {OUI_NON_A_DETERMINER.map(o => (
                      <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="souhaitAccompagnement"
                          className="text-teal focus:ring-teal"
                          checked={form.souhaitAccompagnement === o.value}
                          onChange={() => update('souhaitAccompagnement', o.value)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observations libres
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                    maxLength={2000}
                    placeholder="Toute information complémentaire utile..."
                    value={form.observations}
                    onChange={e => update('observations', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Honeypot (invisible pour les humains) */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-navy hover:bg-navy-light text-white py-6 text-base font-semibold"
        >
          {submitting ? (
            <>Envoi en cours...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Déclarer le projet
            </>
          )}
        </Button>
        <p className="text-xs text-gray-400 text-center -mt-4">
          Temps estimé : 3 minutes. Une soumission = un projet.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-navy text-white py-4 px-6 text-center text-xs text-gray-400">
        SENUM / MTN — Plateforme Nationale d'Interopérabilité PINS — Sénégal
      </footer>
    </div>
  );
}
