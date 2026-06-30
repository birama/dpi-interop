import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import {
  Loader2, ArrowLeft, Coins, Users, Database, GitMerge, FileText,
  Building2, Calendar, Send, Eye,
} from 'lucide-react';
import { ManifestationForm } from '@/modules/partenaire/ManifestationForm';

const STATUT_BADGES: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
  EN_VALIDATION: { label: 'En validation DU', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  PUBLIE: { label: 'Publiée', cls: 'bg-teal/15 text-teal-800 border-teal/40' },
  REJETE: { label: 'Refusée', cls: 'bg-red-100 text-red-700 border-red-300' },
  RETIRE: { label: 'Retirée', cls: 'bg-gray-100 text-gray-500 border-gray-300' },
};

export function PartenaireCasDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data: cas, isLoading, error } = useQuery({
    queryKey: ['partenaire-cas', id],
    queryFn: () => api.get(`/partenaire/cas/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  // Manifestations du PTF sur ce cas (toutes statuts)
  const { data: manifsResp, isLoading: loadingManifs } = useQuery({
    queryKey: ['partenaire-manifestation-cas', id],
    queryFn: () => api.get(`/partenaire/manifestations?casUsageId=${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  if (error || !cas) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500">
          Ce cas n'est pas disponible dans votre périmètre partenaire.
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/partenaire/catalogue')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour au catalogue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stakeholders = cas.stakeholders360 || [];
  const registres = cas.registresAssocies || [];
  const relTech = cas.relationsMetier || [];
  const relMet = cas.relationsTechnique || [];

  const manifs: any[] = manifsResp?.data || [];
  // Une manifestation "active" = DRAFT/EN_VALIDATION/PUBLIE. Si REJETE/RETIRE, le PTF peut en redéposer une.
  const manifActive = manifs.find((m) => ['DRAFT', 'EN_VALIDATION', 'PUBLIE'].includes(m.statut));
  const manifsHistoriques = manifs.filter((m) => m !== manifActive);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {cas.code}
            </span>
            <Badge className="bg-gold/15 text-gold border border-gold/30 text-[10px]">
              <Coins className="w-2.5 h-2.5 mr-1" />À financer
            </Badge>
            {cas.domaine && (
              <Badge variant="outline" className="bg-teal/5 text-teal-700 border-teal/20 text-[10px]">
                {cas.domaine.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {cas.statutVueSection?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-navy">{cas.titre}</h1>
          {cas.resumeMetier && (
            <p className="text-sm text-gray-600 mt-1 max-w-3xl">{cas.resumeMetier}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/partenaire/catalogue')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
          {!manifActive && !showForm && (
            <Button size="sm" className="bg-gold hover:bg-gold/90 text-white" onClick={() => setShowForm(true)}>
              <Send className="w-4 h-4 mr-1" /> Manifester un intérêt
            </Button>
          )}
        </div>
      </div>

      {/* Bandeau manifestation existante */}
      {!showForm && manifActive && (
        <ManifestationBanner manifestation={manifActive} loading={loadingManifs} />
      )}

      {/* Formulaire manifestation */}
      {showForm && id && (
        <ManifestationForm
          casUsageId={id}
          casCode={cas.code}
          casTitre={cas.titre}
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Historique des manifestations refusées / retirées (réouverture possible) */}
      {!showForm && manifsHistoriques.length > 0 && (
        <Card className="bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-navy text-sm">
              Historique de vos manifestations sur ce cas ({manifsHistoriques.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {manifsHistoriques.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                <div>
                  <Badge className={`${STATUT_BADGES[m.statut]?.cls} text-[10px] mr-2`} variant="outline">
                    {STATUT_BADGES[m.statut]?.label || m.statut}
                  </Badge>
                  {m.type === 'FINANCEMENT' ? 'Financement' : 'Intérêt'} —&nbsp;
                  {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <Link to={`/partenaire/manifestations`} className="text-teal-700 hover:underline">
                  Voir
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section 1 — Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Typologie" value={cas.typologie === 'METIER' ? 'Parcours métier' : 'Service technique'} />
          <Field label="Domaine" value={cas.domaine?.replace(/_/g, ' ').toLowerCase() || '—'} />
          <Field label="Statut" value={cas.statutVueSection?.replace(/_/g, ' ')} />
          <Field label="Implémentation" value={cas.statutImpl?.replace(/_/g, ' ')} />
          <Field label="Impact" value={cas.impact} />
          <Field label="Complexité" value={cas.complexite} />
          {cas.institutionSourceCode && <Field label="Institution propriétaire" value={cas.institutionSourceCode} />}
          {cas.institutionCibleCode && <Field label="Institution cible" value={cas.institutionCibleCode} />}
        </CardContent>
      </Card>

      {/* Section 2 — Description fonctionnelle */}
      {(cas.description || cas.baseLegale || cas.donneesEchangees) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-lg">Description fonctionnelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {cas.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-gray-800 whitespace-pre-line">{cas.description}</p>
              </div>
            )}
            {cas.donneesEchangees && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Données échangées</p>
                <p className="text-gray-800">{cas.donneesEchangees}</p>
              </div>
            )}
            {cas.baseLegale && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Base légale</p>
                <p className="text-gray-800">{cas.baseLegale}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 3 — Parties prenantes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            Parties prenantes ({stakeholders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune partie prenante déclarée</p>
          ) : (
            <div className="space-y-2">
              {stakeholders.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-navy">
                      <Building2 className="inline w-4 h-4 mr-1 text-gray-400" />
                      {s.institution?.code} — {s.institution?.nom}
                    </p>
                    {s.institution?.ministere && (
                      <p className="text-xs text-gray-500 ml-5">{s.institution.ministere}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">{s.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Registres mobilisés */}
      {registres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-700" />
              Registres nationaux mobilisés ({registres.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registres.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 text-sm">
                  <div>
                    <p className="font-medium text-navy">{r.registre?.code} — {r.registre?.nom}</p>
                    <p className="text-xs text-gray-500">{r.registre?.domaine}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{r.mode}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5 — Services techniques mobilisés */}
      {(relTech.length > 0 || relMet.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-lg flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-teal-700" />
              {cas.typologie === 'METIER' ? 'Services techniques mobilisés' : 'Parcours métier servis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {relTech.map((r: any) => (
                <p key={r.id} className="text-sm text-gray-800">
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                    {r.casUsageTechnique?.code}
                  </span>
                  {r.casUsageTechnique?.titre}
                </p>
              ))}
              {relMet.map((r: any) => (
                <p key={r.id} className="text-sm text-gray-800">
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                    {r.casUsageMetier?.code}
                  </span>
                  {r.casUsageMetier?.titre}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-xs text-gray-500 space-y-1">
          {cas.dateIdentification && (
            <p><Calendar className="inline w-3 h-3 mr-1" />Identifié le {new Date(cas.dateIdentification).toLocaleDateString('fr-FR')}</p>
          )}
          {cas.updatedAt && (
            <p><Calendar className="inline w-3 h-3 mr-1" />Mis à jour le {new Date(cas.updatedAt).toLocaleDateString('fr-FR')}</p>
          )}
          <p className="italic mt-2">
            Vue partenaire — les avis administrations, arbitrages internes et manifestations
            d'autres partenaires ne sont pas affichés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ManifestationBanner({ manifestation, loading }: { manifestation: any; loading: boolean }) {
  if (loading) return null;
  const badge = STATUT_BADGES[manifestation.statut] || { label: manifestation.statut, cls: 'bg-gray-100' };
  return (
    <Card className="border-teal/40 bg-teal/5">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`${badge.cls} text-[11px]`}>
                {badge.label}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                {manifestation.type === 'FINANCEMENT' ? 'Financement' : 'Intérêt'}
              </Badge>
              {manifestation.type === 'FINANCEMENT' && manifestation.montantEstime != null && (
                <Badge variant="outline" className="text-[11px] bg-gold/10 text-gold border-gold/30">
                  <Coins className="w-3 h-3 mr-1" />
                  {Number(manifestation.montantEstime).toLocaleString('fr-FR')} {manifestation.devise}
                </Badge>
              )}
            </div>
            <p className="text-sm text-navy font-medium">
              Vous avez déjà une manifestation en cours sur ce cas d'usage.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Déposée le {new Date(manifestation.createdAt).toLocaleDateString('fr-FR')}
              {manifestation.updatedAt !== manifestation.createdAt && (
                <> · mise à jour le {new Date(manifestation.updatedAt).toLocaleDateString('fr-FR')}</>
              )}
            </p>
          </div>
          <Link to="/partenaire/manifestations">
            <Button variant="outline" size="sm" className="border-teal/40 text-teal-800 hover:bg-teal/10">
              <Eye className="w-4 h-4 mr-1" /> Voir ma manifestation
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}
