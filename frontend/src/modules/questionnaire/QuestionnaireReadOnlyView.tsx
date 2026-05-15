import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Circle,
  Server,
  Database,
  GitMerge,
  FileText,
  ShieldCheck,
  Target,
  Building2,
  Calendar,
} from 'lucide-react';

interface Props {
  submission: any;
  canEdit: boolean;
  isAdmin: boolean;
  onEdit: () => void;
}

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  REVIEWED: 'Relu',
  VALIDATED: 'Validé',
  ARCHIVED: 'Archivé',
};

const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  REVIEWED: 'bg-amber-100 text-amber-800',
  VALIDATED: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-slate-100 text-slate-800',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function ReadText({ value, placeholder = 'Non renseigné' }: { value?: string | null; placeholder?: string }) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return <span className="text-gray-400 italic">{placeholder}</span>;
  }
  return <span className="text-navy-900 font-medium">{value}</span>;
}

function ReadLongText({ value, placeholder = 'Non renseigné' }: { value?: string | null; placeholder?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!value || (typeof value === 'string' && !value.trim())) {
    return <p className="text-gray-400 italic text-sm">{placeholder}</p>;
  }
  const isLong = value.length > 300;
  const display = !isLong || expanded ? value : value.slice(0, 280) + '…';
  return (
    <div>
      <p className="whitespace-pre-line text-gray-800 text-sm leading-relaxed">{display}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-teal-700 hover:text-teal-900 hover:underline mt-1"
        >
          {expanded ? 'Réduire' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

function ReadBoolean({ value }: { value?: string | boolean | null }) {
  if (value === 'OUI' || value === true) {
    return (
      <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Oui
      </span>
    );
  }
  if (value === 'NON' || value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
        <XCircle className="w-4 h-4" /> Non
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-400 italic">
      <Circle className="w-4 h-4" /> Non renseigné
    </span>
  );
}

function MaturiteBar({ value, label }: { value: number; label: string }) {
  const pct = (value / 5) * 100;
  const color = value <= 2 ? 'bg-amber-500' : value <= 3 ? 'bg-yellow-500' : 'bg-teal-600';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-navy-900">{value}/5</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-sm text-gray-600 md:col-span-1">{label}</div>
      <div className="md:col-span-2 text-sm">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left"
      >
        <CardHeader className="hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-teal-700">{icon}</div>
              <div>
                <CardTitle className="text-navy-900 text-lg">{title}</CardTitle>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {open ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </CardHeader>
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function EmptyTable({ label }: { label: string }) {
  return (
    <p className="text-sm text-gray-400 italic py-4 text-center">{label}</p>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone = 'navy',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: 'navy' | 'teal' | 'gold' | 'amber';
}) {
  const toneClasses: Record<string, string> = {
    navy: 'bg-slate-50 text-navy-900 border-slate-200',
    teal: 'bg-teal-50 text-teal-900 border-teal-200',
    gold: 'bg-amber-50 text-amber-900 border-amber-200',
    amber: 'bg-orange-50 text-orange-900 border-orange-200',
  };
  return (
    <div className={`border rounded-lg p-3 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2 mb-1 text-xs uppercase tracking-wide opacity-70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export function QuestionnaireReadOnlyView({ submission, canEdit, isAdmin, onEdit }: Props) {
  const navigate = useNavigate();
  const [showAdminWarning, setShowAdminWarning] = useState(false);

  const stats = useMemo(() => {
    const s = submission || {};
    const nbApps = (s.applications || []).length;
    const nbReg = (s.registres || []).length;
    const nbFlux = (s.fluxExistants || []).length;
    const nbCas = (s.casUsage || []).length;
    const nbDC = (s.donneesConsommer || []).length;
    const nbDF = (s.donneesFournir || []).length;
    const nbInfra = (s.infrastructureItems || []).length;

    // Complétion approximative : nb de sections renseignées / 8
    const sectionsRemplies = [
      !!s.dataOwnerNom,
      nbApps > 0 || nbReg > 0 || nbInfra > 0,
      nbDC > 0 || nbDF > 0,
      nbFlux > 0 || nbCas > 0,
      (s.niveauxInterop || []).length > 0,
      (s.conformitePrincipes || []).length > 0,
      !!s.contraintesJuridiques || !!s.contraintesTechniques,
      !!s.forces || !!s.faiblesses || !!s.attentes,
    ].filter(Boolean).length;
    const completion = Math.round((sectionsRemplies / 8) * 100);

    // Réponses OUI sur niveauxInterop + conformitePrincipes + preparationDecret
    const niveaux = s.niveauxInterop || [];
    const ouiNiveaux = niveaux.filter((n: any) => n.reponse === 'OUI').length;
    const prep = s.preparationDecret || [];
    const ouiPrep = prep.filter((p: any) => p.reponse === 'OUI').length;
    const ouiTotal = ouiNiveaux + ouiPrep;
    const totalQuestions = niveaux.length + prep.length;

    return { nbApps, nbReg, nbFlux, nbCas, nbDC, nbDF, nbInfra, completion, ouiTotal, totalQuestions };
  }, [submission]);

  if (!submission) {
    return (
      <div className="text-center py-12 text-gray-500">Questionnaire introuvable</div>
    );
  }

  const inst = submission.institution || {};
  const status = submission.status || 'DRAFT';

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h1 className="text-2xl font-bold text-navy-900">
              {inst.code || '—'} <span className="text-gray-500 font-normal">— {inst.nom || 'Institution inconnue'}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
            <Badge className={SUBMISSION_STATUS_COLORS[status] || 'bg-gray-100'}>
              {SUBMISSION_STATUS_LABELS[status] || status}
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Mise à jour : {formatDate(submission.updatedAt)}
            </span>
            {submission.submittedAt && (
              <span className="text-gray-500">Soumis le {formatDate(submission.submittedAt)}</span>
            )}
          </div>
          {inst.ministere && (
            <p className="text-xs text-gray-500 mt-1">{inst.ministere}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                if (isAdmin) {
                  setShowAdminWarning(true);
                } else {
                  onEdit();
                }
              }}
            >
              <Pencil className="w-4 h-4 mr-1" />
              {isAdmin ? 'Éditer (admin)' : 'Éditer'}
            </Button>
          )}
        </div>
      </div>

      {/* ===== KPI GRID ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Target className="w-3 h-3" />} label="Complétion" value={`${stats.completion}%`} tone="navy" />
        <KpiCard icon={<Server className="w-3 h-3" />} label="Applications" value={stats.nbApps} tone="teal" />
        <KpiCard icon={<Database className="w-3 h-3" />} label="Registres" value={stats.nbReg} tone="gold" />
        <KpiCard icon={<GitMerge className="w-3 h-3" />} label="Flux & cas d'usage" value={stats.nbFlux + stats.nbCas} tone="amber" />
      </div>

      {/* ===== AVERTISSEMENT ADMIN ===== */}
      {showAdminWarning && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Édition en mode administrateur</p>
                <p className="text-sm text-amber-800 mt-1">
                  Vous allez modifier le questionnaire de <strong>{inst.nom || inst.code}</strong>.
                  Vos modifications seront tracées dans le journal d'audit.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAdminWarning(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={() => { setShowAdminWarning(false); onEdit(); }}>
                Confirmer l'édition
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 1 — GOUVERNANCE DONNÉES ===== */}
      <SectionCard
        icon={<ShieldCheck className="w-5 h-5" />}
        title="1. Gouvernance des données"
        subtitle="Data Owner et Data Steward"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Data Owner</h4>
            <FieldRow label="Nom"><ReadText value={submission.dataOwnerNom} /></FieldRow>
            <FieldRow label="Fonction"><ReadText value={submission.dataOwnerFonction} /></FieldRow>
            <FieldRow label="Email"><ReadText value={submission.dataOwnerEmail} /></FieldRow>
            <FieldRow label="Téléphone"><ReadText value={submission.dataOwnerTelephone} /></FieldRow>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Data Steward</h4>
            <FieldRow label="Nom"><ReadText value={submission.dataStewardNom} /></FieldRow>
            <FieldRow label="Profil"><ReadText value={submission.dataStewardProfil} /></FieldRow>
            <FieldRow label="Fonction"><ReadText value={submission.dataStewardFonction} /></FieldRow>
            <FieldRow label="Email"><ReadText value={submission.dataStewardEmail} /></FieldRow>
            <FieldRow label="Téléphone"><ReadText value={submission.dataStewardTelephone} /></FieldRow>
          </div>
        </div>
      </SectionCard>

      {/* ===== SECTION 2 — SYSTÈMES (Apps + Registres + Infra) ===== */}
      <SectionCard
        icon={<Server className="w-5 h-5" />}
        title="2. Systèmes d'information"
        subtitle={`${stats.nbApps} application(s), ${stats.nbReg} registre(s), ${stats.nbInfra} item(s) d'infrastructure`}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Applications</h4>
            {stats.nbApps === 0 ? (
              <EmptyTable label="Aucune application déclarée" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="text-left py-2 px-3">Nom</th>
                      <th className="text-left py-2 px-3">Éditeur</th>
                      <th className="text-left py-2 px-3">Année</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submission.applications.map((app: any) => (
                      <tr key={app.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{app.nom}</td>
                        <td className="py-2 px-3 text-gray-700">{app.editeur || '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{app.anneeInstallation || '—'}</td>
                        <td className="py-2 px-3 text-gray-600 max-w-md truncate">{app.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Registres</h4>
            {stats.nbReg === 0 ? (
              <EmptyTable label="Aucun registre déclaré" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="text-left py-2 px-3">Nom</th>
                      <th className="text-left py-2 px-3">Volumétrie</th>
                      <th className="text-left py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submission.registres.map((r: any) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{r.nom}</td>
                        <td className="py-2 px-3 text-gray-700">{r.volumetrie || '—'}</td>
                        <td className="py-2 px-3 text-gray-600 max-w-md truncate">{r.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {stats.nbInfra > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-navy-900 mb-2">Infrastructure ({stats.nbInfra} items)</h4>
              <p className="text-xs text-gray-500">Détail consultable en mode édition.</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ===== SECTION 3 — DONNÉES ===== */}
      <SectionCard
        icon={<Database className="w-5 h-5" />}
        title="3. Besoins en données"
        subtitle={`${stats.nbDC} donnée(s) à consommer, ${stats.nbDF} à fournir`}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Données à consommer</h4>
            {stats.nbDC === 0 ? (
              <EmptyTable label="Aucune donnée à consommer déclarée" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="text-left py-2 px-3">Donnée</th>
                      <th className="text-left py-2 px-3">Source</th>
                      <th className="text-left py-2 px-3">Usage</th>
                      <th className="text-left py-2 px-3">Priorité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submission.donneesConsommer.map((d: any) => (
                      <tr key={d.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{d.donnee}</td>
                        <td className="py-2 px-3 text-gray-700">{d.source}</td>
                        <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{d.usage || '—'}</td>
                        <td className="py-2 px-3"><Badge variant="outline">{d.priorite ?? '—'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Données à fournir</h4>
            {stats.nbDF === 0 ? (
              <EmptyTable label="Aucune donnée à fournir déclarée" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="text-left py-2 px-3">Donnée</th>
                      <th className="text-left py-2 px-3">Destinataires</th>
                      <th className="text-left py-2 px-3">Fréquence</th>
                      <th className="text-left py-2 px-3">Format</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submission.donneesFournir.map((d: any) => (
                      <tr key={d.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{d.donnee}</td>
                        <td className="py-2 px-3 text-gray-700">{d.destinataires || '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{d.frequence || '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{d.format || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ===== SECTION 4 — FLUX & CAS D'USAGE ===== */}
      <SectionCard
        icon={<GitMerge className="w-5 h-5" />}
        title="4. Flux et cas d'usage"
        subtitle={`${stats.nbFlux} flux existant(s), ${stats.nbCas} cas d'usage`}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Flux existants</h4>
            {stats.nbFlux === 0 ? (
              <EmptyTable label="Aucun flux déclaré" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="text-left py-2 px-3">Source</th>
                      <th className="text-left py-2 px-3">Destination</th>
                      <th className="text-left py-2 px-3">Donnée</th>
                      <th className="text-left py-2 px-3">Mode</th>
                      <th className="text-left py-2 px-3">Fréquence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submission.fluxExistants.map((f: any) => (
                      <tr key={f.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{f.source}</td>
                        <td className="py-2 px-3 font-medium">{f.destination}</td>
                        <td className="py-2 px-3 text-gray-700">{f.donnee || '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{f.mode || '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{f.frequence || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-2">Cas d'usage</h4>
            {stats.nbCas === 0 ? (
              <EmptyTable label="Aucun cas d'usage déclaré" />
            ) : (
              <div className="space-y-2">
                {submission.casUsage.map((c: any) => (
                  <div key={c.id} className="border border-gray-200 rounded p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <h5 className="font-semibold text-navy-900">{c.titre}</h5>
                      <Badge variant="outline">Priorité {c.priorite ?? '—'}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{c.description}</p>
                    {c.acteurs && <p className="text-xs text-gray-500 mt-1">Acteurs : {c.acteurs}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ===== SECTION 5 — NIVEAUX INTEROP ===== */}
      <SectionCard
        icon={<GitMerge className="w-5 h-5" />}
        title="5. Niveaux d'interopérabilité"
        subtitle={`${(submission.niveauxInterop || []).length} question(s) renseignée(s)`}
        defaultOpen={false}
      >
        {(submission.niveauxInterop || []).length === 0 ? (
          <EmptyTable label="Diagnostic interopérabilité non commencé" />
        ) : (
          <div className="space-y-1">
            {submission.niveauxInterop.map((n: any, idx: number) => (
              <div key={n.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 py-2 border-b border-gray-100 text-sm last:border-b-0">
                <Badge variant="outline" className="md:col-span-2">{n.niveau}</Badge>
                <div className="md:col-span-7 text-gray-800">{n.question}</div>
                <div className="md:col-span-3"><ReadBoolean value={n.reponse} /></div>
                {n.details && (
                  <div className="md:col-span-12 text-xs text-gray-500 italic pl-2">↳ {n.details}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ===== SECTION 6 — CONFORMITÉ PRINCIPES ===== */}
      <SectionCard
        icon={<ShieldCheck className="w-5 h-5" />}
        title="6. Conformité aux 13 principes"
        subtitle={`${(submission.conformitePrincipes || []).length} principe(s) évalué(s)`}
        defaultOpen={false}
      >
        {(submission.conformitePrincipes || []).length === 0 ? (
          <EmptyTable label="Auto-évaluation des 13 principes non commencée" />
        ) : (
          <div className="space-y-1">
            {submission.conformitePrincipes
              .sort((a: any, b: any) => (a.principeNumero || 0) - (b.principeNumero || 0))
              .map((p: any, idx: number) => (
                <div key={p.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 py-2 border-b border-gray-100 text-sm last:border-b-0">
                  <Badge variant="outline" className="md:col-span-2">Principe {p.principeNumero}</Badge>
                  <div className="md:col-span-2 text-gray-500 text-xs">{p.categorie}</div>
                  <div className="md:col-span-2">
                    <Badge className="bg-teal-100 text-teal-900">{p.score}/5</Badge>
                  </div>
                  <div className="md:col-span-6 text-gray-700 text-xs italic">{p.commentaire || '—'}</div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      {/* ===== SECTION 7 — MATURITÉ & CONTRAINTES ===== */}
      <SectionCard
        icon={<Target className="w-5 h-5" />}
        title="7. Maturité et contraintes"
        subtitle="Auto-évaluation 4 domaines"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <MaturiteBar label="Infrastructure" value={submission.maturiteInfra ?? 0} />
            <MaturiteBar label="Données" value={submission.maturiteDonnees ?? 0} />
            <MaturiteBar label="Compétences" value={submission.maturiteCompetences ?? 0} />
            <MaturiteBar label="Gouvernance" value={submission.maturiteGouvernance ?? 0} />
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-navy-900 mb-1">Contraintes juridiques</h4>
              <ReadLongText value={submission.contraintesJuridiques} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-900 mb-1">Contraintes techniques</h4>
              <ReadLongText value={submission.contraintesTechniques} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ===== SECTION 8 — ATTENTES ===== */}
      <SectionCard
        icon={<FileText className="w-5 h-5" />}
        title="8. Forces, faiblesses, attentes"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-teal-700 mb-1">Forces</h4>
            <ReadLongText value={submission.forces} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-700 mb-1">Faiblesses</h4>
            <ReadLongText value={submission.faiblesses} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-1">Attentes</h4>
            <ReadLongText value={submission.attentes} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 mb-1">Contributions envisagées</h4>
            <ReadLongText value={submission.contributions} />
          </div>
        </div>
      </SectionCard>

      {/* ===== FOOTER ===== */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        {canEdit && (
          <Button onClick={() => isAdmin ? setShowAdminWarning(true) : onEdit()}>
            <Pencil className="w-4 h-4 mr-2" />
            {isAdmin ? 'Éditer (mode admin)' : 'Éditer le questionnaire'}
          </Button>
        )}
      </div>
    </div>
  );
}
