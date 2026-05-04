/**
 * Vue arbitrage DU — File des desaccords + KPI pipeline + statistiques catalogue + mutualisation
 * Route : /du/arbitrage (adminOnly)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FolderOpen, TrendingUp, Network, Trophy, Calendar, Gavel, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { FEEDBACK_TYPE_STYLES, daysUntil } from '../constants';

type TypoFilter = 'ALL' | 'METIER' | 'TECHNIQUE';

export function DuArbitragePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [typoFilter, setTypoFilter] = useState<TypoFilter>('ALL');
  const [modal, setModal] = useState<{ type: 'convocation' | 'decision'; cuId: string; cuCode: string; cuTitre: string } | null>(null);
  const [form, setForm] = useState({ dateEcheance: '', motif: '', decision: 'MAINTENIR' });

  const { data, isLoading } = useQuery({
    queryKey: ['du-arbitrage'],
    queryFn: () => api.get('/du/arbitrage').then((r: any) => r.data),
  });

  // Mutation convocation
  const convocationMut = useMutation({
    mutationFn: ({ cuId, payload }: { cuId: string; payload: any }) => api.post(`/du/arbitrage/${cuId}/convocation`, payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['du-arbitrage'] });
      setModal(null);
      toast({ title: 'Convocation envoyée', description: `${res.data?.stakeholdersNotifies || 0} parties prenantes notifiées.` });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || 'Échec de la convocation' });
    },
  });

  // Mutation decision
  const decisionMut = useMutation({
    mutationFn: ({ cuId, payload }: { cuId: string; payload: any }) => api.post(`/du/arbitrage/${cuId}/decision`, payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['du-arbitrage'] });
      setModal(null);
      const decisionLabels: Record<string, string> = { MAINTENIR: 'maintenu (qualifié)', SUSPENDRE: 'suspendu', RETIRER: 'retiré' };
      toast({ title: 'Décision enregistrée', description: `Cas d'usage ${decisionLabels[res.data?.decision] || ''}.` });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: err.response?.data?.error || 'Échec de la décision' });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const {
    enRetard = [], desaccords = [], kpi = {},
    ventilationTypologie,
    catalogue,
    mutualisation,
  } = data || {};

  // KPI ventilees selon le filtre typologique
  const venti = ventilationTypologie
    ? (typoFilter === 'METIER' ? ventilationTypologie.metier : typoFilter === 'TECHNIQUE' ? ventilationTypologie.technique : null)
    : null;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Bandeau DU */}
      <div className="bg-navy text-white rounded-lg p-4 flex items-center gap-3">
        <div className="bg-gold text-navy px-2 py-1 rounded text-[10px] font-bold">VUE DU / SENUM</div>
        <div className="text-sm">Pilotage consolide du pipeline — visibilite complete sur tous les cas d'usage</div>
      </div>

      {/* Tabs typologie */}
      {ventilationTypologie && (
        <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
          {(['ALL', 'METIER', 'TECHNIQUE'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypoFilter(t)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded transition-colors',
                typoFilter === t ? 'bg-white shadow text-navy' : 'text-gray-600 hover:text-navy'
              )}
            >
              {t === 'ALL' ? 'Tous' : t === 'METIER' ? `Parcours metier (${ventilationTypologie.metier.total})` : `Services techniques (${ventilationTypologie.technique.total})`}
            </button>
          ))}
        </div>
      )}

      {/* KPI — 6 cartes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-l-4 border-gray-400"><CardContent className="p-3">
          <div className="text-[10px] uppercase text-gray-500 font-semibold flex items-center gap-1">
            <FolderOpen className="w-3 h-3" /> Propositions
          </div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {venti ? venti.propositions : (kpi.propositions ?? 0)}
          </div>
          <div className="text-[10px] text-gray-500">en catalogue</div>
        </CardContent></Card>

        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-gray-500 font-semibold">Declares</div>
          <div className="text-2xl font-bold text-navy mt-1">
            {venti ? venti.pipeline : (kpi.declares ?? 0)}
          </div>
          {typoFilter === 'ALL' && typeof kpi.declaresPipelineActif === 'number' && (
            <div className="text-[10px] text-gray-500">
              dont {kpi.declaresPipelineActif} issus du pipeline Vue 360°
            </div>
          )}
        </CardContent></Card>

        <Card className="border-l-4 border-amber"><CardContent className="p-3">
          <div className="text-[10px] uppercase text-gray-500 font-semibold">En consultation</div>
          <div className="text-2xl font-bold text-amber mt-1">{kpi.enConsultation ?? 0}</div>
          {enRetard.length > 0 && <div className="text-[10px] text-red-600">{enRetard.length} echeance(s) depassee(s)</div>}
        </CardContent></Card>

        <Card className="border-l-4 border-red-500"><CardContent className="p-3">
          <div className="text-[10px] uppercase text-gray-500 font-semibold">Desaccords</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{kpi.desaccords ?? 0}</div>
          <div className="text-[10px] text-gray-500">a arbitrer</div>
        </CardContent></Card>

        <Card className="border-l-4 border-teal"><CardContent className="p-3">
          <div className="text-[10px] uppercase text-gray-500 font-semibold">Qualifies</div>
          <div className="text-2xl font-bold text-teal mt-1">{kpi.qualifies ?? 0}</div>
        </CardContent></Card>

        <Card className="border-l-4 border-green-500"><CardContent className="p-3">
          <div className="text-[10px] uppercase text-gray-500 font-semibold">En production</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {venti ? venti.enProduction : (kpi.enProduction ?? 0)}
          </div>
        </CardContent></Card>
      </div>

      {/* Blocs Catalogue + Mutualisation (cote a cote) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Statistiques catalogue */}
        {catalogue && (
          <Card>
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" />
              <div className="font-bold text-navy">Statistiques du catalogue</div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Publiees trimestre</div>
                  <div className="text-xl font-bold text-navy mt-0.5">{catalogue.propositionsCreeesTrimestre ?? 0}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Adoptions trimestre</div>
                  <div className="text-xl font-bold text-teal mt-0.5">{catalogue.adoptionsTrimestre ?? 0}</div>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded border border-emerald-200">
                  <div className="text-[10px] uppercase text-emerald-700 font-semibold">Taux d'adoption</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">{catalogue.tauxAdoption ?? 0}%</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Archivees</div>
                  <div className="text-xl font-bold text-gray-600 mt-0.5">{catalogue.propositionsArchivees ?? 0}</div>
                </div>
              </div>

              {catalogue.topAdopteuses && catalogue.topAdopteuses.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <Trophy className="w-3 h-3" />
                    Top 3 institutions adopteuses
                  </div>
                  <div className="space-y-1">
                    {catalogue.topAdopteuses.map((inst: any, idx: number) => (
                      <div key={inst.id} className="flex items-center gap-2 text-xs p-1.5 bg-gray-50 rounded">
                        <span className="font-bold text-gray-400 w-4">#{idx + 1}</span>
                        <span className="font-semibold text-navy">{inst.code}</span>
                        <span className="text-gray-500 truncate">{inst.nom}</span>
                        <span className="ml-auto font-bold text-teal">{inst.nbAdoptions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mutualisation */}
        {mutualisation && (
          <Card>
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Network className="w-4 h-4 text-teal" />
              <div className="font-bold text-navy">Mutualisation des services techniques</div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Services techniques</div>
                  <div className="text-xl font-bold text-navy mt-0.5">{mutualisation.nbServicesTechniques ?? 0}</div>
                  <div className="text-[9px] text-gray-500">en pipeline</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold">Consommations</div>
                  <div className="text-xl font-bold text-navy mt-0.5">{mutualisation.nbConsommationsMetier ?? 0}</div>
                  <div className="text-[9px] text-gray-500">par les metier</div>
                </div>
                <div className="text-center p-2 bg-teal/10 rounded border border-teal/30">
                  <div className="text-[10px] uppercase text-teal font-semibold">Taux mutualisation</div>
                  <div className="text-xl font-bold text-teal mt-0.5">{mutualisation.tauxMutualisation ?? 0}x</div>
                  <div className="text-[9px] text-teal/80">par service</div>
                </div>
              </div>

              {mutualisation.topTechniques && mutualisation.topTechniques.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <Trophy className="w-3 h-3" />
                    Top 5 services les plus mutualises
                  </div>
                  <div className="space-y-1">
                    {mutualisation.topTechniques.map((tech: any, idx: number) => (
                      <div key={tech.id} className="flex items-center gap-2 text-xs p-1.5 bg-gray-50 rounded">
                        <span className="font-bold text-gray-400 w-4">#{idx + 1}</span>
                        <Link
                          to={`/admin/cas-usage/${tech.id}`}
                          className="font-mono font-bold text-gray-600 hover:text-teal"
                        >
                          {tech.code}
                        </Link>
                        <span className="text-gray-700 truncate">{tech.titre}</span>
                        <span className="ml-auto font-bold text-teal">{tech.nbConsommateurs} parcours</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!mutualisation.topTechniques || mutualisation.topTechniques.length === 0) && (
                <div className="text-xs text-gray-400 italic text-center py-2">
                  Aucune relation metier ↔ technique enregistree pour l'instant.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* File d'arbitrage — desaccords */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="font-bold text-navy">File d'arbitrage — desaccords en cours</div>
          <div className="text-xs text-gray-500">Cas d'usage avec reserve ou refus motive necessitant arbitrage DU</div>
        </div>
        <div className="divide-y divide-gray-100">
          {desaccords.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun desaccord en cours — pipeline fluide</div>
          ) : (
            desaccords.map((cu: any) => {
              const problematicFeedbacks: any[] = [];
              for (const sh of (cu.stakeholders360 || [])) {
                for (const co of (sh.consultations || [])) {
                  for (const fb of (co.feedbacks || [])) {
                    if (['RESERVE', 'REFUS_MOTIVE'].includes(fb.type)) {
                      problematicFeedbacks.push({ ...fb, institutionCode: sh.institution?.code, institutionNom: sh.institution?.nom });
                    }
                  }
                }
              }
              let nearestEcheance: string | null = null;
              for (const sh of (cu.stakeholders360 || [])) {
                for (const co of (sh.consultations || [])) {
                  if (co.status === 'EN_ATTENTE' && co.dateEcheance) {
                    if (!nearestEcheance || co.dateEcheance < nearestEcheance) nearestEcheance = co.dateEcheance;
                  }
                }
              }
              const days = nearestEcheance ? daysUntil(nearestEcheance) : null;

              return (
                <div key={cu.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link to={`/admin/cas-usage/${cu.id}`} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded hover:bg-gray-200">{cu.code}</Link>
                        {problematicFeedbacks.map((fb: any, i: number) => (
                          <span key={i} className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded', FEEDBACK_TYPE_STYLES[fb.type]?.bg || 'bg-red-100 text-red-700')}>
                            {fb.type === 'RESERVE' ? 'Reserve' : 'Refus'} {fb.institutionCode}
                          </span>
                        ))}
                        {days !== null && (
                          <span className={cn('text-[10px] font-bold', days <= 3 ? 'text-red-600' : 'text-amber-600')}>
                            {days <= 0 ? 'Echu' : `Echeance J+${days}`}
                          </span>
                        )}
                      </div>
                      <Link to={`/admin/cas-usage/${cu.id}`} className="font-semibold text-navy hover:underline">{cu.titre}</Link>
                      <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                        {problematicFeedbacks.map((fb: any, i: number) => (
                          <div key={i}>
                            <b>Position {fb.institutionCode} :</b> {fb.motivation?.substring(0, 120)}{fb.motivation?.length > 120 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => { setModal({ type: 'convocation', cuId: cu.id, cuCode: cu.code, cuTitre: cu.titre }); setForm({ dateEcheance: '', motif: '', decision: 'MAINTENIR' }); }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal text-white hover:bg-teal/90"
                      >
                        <Calendar className="w-3 h-3" /> Convoquer cadrage
                      </button>
                      <button
                        onClick={() => { setModal({ type: 'decision', cuId: cu.id, cuCode: cu.code, cuTitre: cu.titre }); setForm({ dateEcheance: '', motif: '', decision: 'MAINTENIR' }); }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-teal hover:bg-teal/10"
                      >
                        <Gavel className="w-3 h-3" /> Decision d'arbitrage
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* En retard */}
      {enRetard.length > 0 && (
        <Card className="border-l-4 border-red-500">
          <div className="p-4 border-b border-gray-100">
            <div className="font-bold text-navy">Consultations en retard ({enRetard.length})</div>
            <div className="text-xs text-gray-500">Echeance SLA depassee — relance recommandee</div>
          </div>
          <div className="divide-y divide-gray-100">
            {enRetard.map((cu: any) => (
              <div key={cu.id} className="p-3 flex items-center justify-between">
                <div>
                  <Link to={`/admin/cas-usage/${cu.id}`} className="text-sm font-medium text-navy hover:underline">{cu.code} — {cu.titre}</Link>
                </div>
                <Link to={`/admin/cas-usage/${cu.id}`} className="text-xs text-teal font-semibold hover:underline">Voir →</Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Convocation / Decision */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {modal.type === 'convocation' ? 'Convoquer cadrage' : 'Décision d\'arbitrage'}
              </h3>
              <button onClick={() => setModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-gray-50 rounded p-3 text-xs">
                <div className="font-semibold text-navy">{modal.cuCode}</div>
                <div className="text-gray-600 mt-0.5">{modal.cuTitre}</div>
              </div>

              {modal.type === 'convocation' && (
                <>
                  <div>
                    <Label className="text-xs">Date d'échéance</Label>
                    <Input type="date" value={form.dateEcheance} onChange={e => setForm({ ...form, dateEcheance: e.target.value })}
                      className="h-8 text-sm" min={new Date().toISOString().split('T')[0]} />
                    <p className="text-[10px] text-gray-400 mt-1">Date limite pour que les parties prenantes soumettent leur avis.</p>
                  </div>
                  <div>
                    <Label className="text-xs">Motif de la convocation</Label>
                    <Textarea value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                      rows={3} className="text-sm" placeholder="Expliquez le contexte de ce cadrage et les attentes vis-à-vis des parties prenantes (min 50 caractères)..." />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Min 50 caractères</span>
                      <span className={cn('text-[10px]', form.motif.trim().length >= 50 ? 'text-green-600' : 'text-gray-400')}>{form.motif.trim().length}/50</span>
                    </div>
                  </div>
                  <Button
                    size="sm" className="bg-teal hover:bg-teal-dark w-full"
                    disabled={!form.dateEcheance || form.motif.trim().length < 50 || convocationMut.isPending}
                    onClick={() => convocationMut.mutate({ cuId: modal.cuId, payload: { dateEcheance: form.dateEcheance, motif: form.motif } })}
                  >
                    {convocationMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Calendar className="w-3.5 h-3.5 mr-1" />}
                    Envoyer la convocation
                  </Button>
                </>
              )}

              {modal.type === 'decision' && (
                <>
                  <div>
                    <Label className="text-xs">Décision</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['MAINTENIR', 'SUSPENDRE', 'RETIRER'] as const).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForm({ ...form, decision: d })}
                          className={cn(
                            'px-3 py-2 rounded-md text-xs font-semibold border transition-colors',
                            form.decision === d
                              ? d === 'MAINTENIR' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : d === 'SUSPENDRE' ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                          )}
                        >
                          {d === 'MAINTENIR' ? 'Maintenir' : d === 'SUSPENDRE' ? 'Suspendre' : 'Retirer'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {form.decision === 'MAINTENIR' ? 'Poursuivre le pipeline (→ Qualifié). Les désaccords sont tranchés par la DU.'
                        : form.decision === 'SUSPENDRE' ? 'Mettre en pause (→ Suspendu). Reprise possible ultérieurement.'
                        : 'Clôture définitive (→ Retiré). Le cas d\'usage ne sera plus actif.'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Motivation de la décision</Label>
                    <Textarea value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                      rows={3} className="text-sm" placeholder="Justifiez la décision d'arbitrage de la Delivery Unit (min 50 caractères)..." />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Min 50 caractères</span>
                      <span className={cn('text-[10px]', form.motif.trim().length >= 50 ? 'text-green-600' : 'text-gray-400')}>{form.motif.trim().length}/50</span>
                    </div>
                  </div>
                  <Button
                    size="sm" className="bg-navy hover:bg-navy/90 w-full"
                    disabled={form.motif.trim().length < 50 || decisionMut.isPending}
                    onClick={() => decisionMut.mutate({ cuId: modal.cuId, payload: { decision: form.decision, motif: form.motif } })}
                  >
                    {decisionMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Gavel className="w-3.5 h-3.5 mr-1" />}
                    Confirmer la décision
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
