import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casUsageDetailApi, casUsageMvpApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowRight, CheckCircle, Circle, Clock, AlertTriangle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const STATUT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  IDENTIFIE: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Identifie' },
  PRIORISE: { bg: 'bg-gold-50', text: 'text-gold-dark', label: 'Priorise' },
  EN_PREPARATION: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En preparation' },
  EN_DEVELOPPEMENT: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'En developpement' },
  EN_TEST: { bg: 'bg-teal-50', text: 'text-teal', label: 'En test' },
  EN_PRODUCTION: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'En production' },
  SUSPENDU: { bg: 'bg-red-50', text: 'text-red-500', label: 'Suspendu' },
};

const IMPACT_COLORS: Record<string, string> = { CRITIQUE: 'bg-red-100 text-red-700', ELEVE: 'bg-orange-100 text-orange-700', MOYEN: 'bg-gray-100 text-gray-600', FAIBLE: 'bg-gray-50 text-gray-400' };
const FIN_COLORS: Record<string, string> = { IDENTIFIE: 'bg-gray-100 text-gray-500', DEMANDE: 'bg-gold-50 text-gold', EN_NEGOCIATION: 'bg-orange-100 text-orange-600', ACCORDE: 'bg-teal-50 text-teal', EN_COURS: 'bg-emerald-50 text-emerald-700', CLOTURE: 'bg-navy/10 text-navy', REFUSE: 'bg-red-50 text-red-500' };

const JALON_KEYS = ['serveurDedie', 'connectiviteReseau', 'certificatsSSL', 'securityServerInstall', 'premierServicePublie', 'premierEchangeReussi'];
const JALON_LABELS = ['Serveur', 'Reseau', 'SSL', 'Security Server', '1er service', '1er echange'];
const JALON_STATUS: Record<string, { icon: any; color: string }> = {
  TERMINE: { icon: CheckCircle, color: 'text-success' },
  EN_COURS: { icon: Clock, color: 'text-gold' },
  BLOQUE: { icon: AlertTriangle, color: 'text-red-500' },
  NON_DEMARRE: { icon: Circle, color: 'text-gray-300' },
};

function XRoadGauge({ readiness, label }: { readiness: any; label: string }) {
  if (!readiness) return <p className="text-xs text-gray-400 italic">Pas dans le pipeline X-Road</p>;
  const completed = JALON_KEYS.filter(k => readiness[k] === 'TERMINE').length;
  return (
    <div>
      <p className="text-xs font-medium text-navy mb-2">{label} — {readiness.institution?.code}</p>
      <div className="flex items-center gap-1">
        {JALON_KEYS.map((k, i) => {
          const status = readiness[k] || 'NON_DEMARRE';
          const config = JALON_STATUS[status] || JALON_STATUS.NON_DEMARRE;
          const Icon = config.icon;
          return (
            <div key={k} className="flex flex-col items-center" title={`${JALON_LABELS[i]}: ${status}`}>
              <Icon className={cn('w-5 h-5', config.color)} />
              <span className="text-[8px] text-gray-400 mt-0.5">{JALON_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{completed}/6 jalons termines</p>
    </div>
  );
}

export function CasUsage360Page() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editNotes, setEditNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [newStatut, setNewStatut] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cas-usage-360', id],
    queryFn: () => casUsageDetailApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });

  const updateNotesMut = useMutation({
    mutationFn: () => casUsageDetailApi.updateNotes(id!, notesValue),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cas-usage-360', id] }); setEditNotes(false); toast({ title: 'Notes mises a jour' }); },
  });

  const updateStatutMut = useMutation({
    mutationFn: (statut: string) => casUsageMvpApi.update(id!, { statutImpl: statut }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cas-usage-360', id] }); toast({ title: 'Statut mis a jour' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Cas d'usage non trouve</div>;

  const cu = data;
  const sc = STATUT_COLORS[cu.statutImpl] || STATUT_COLORS.IDENTIFIE;

  // Timeline from audit logs + dates
  const timelineEvents: { date: string; label: string; detail?: string }[] = [];
  if (cu.createdAt) timelineEvents.push({ date: cu.createdAt, label: 'Cree / identifie' });
  if (cu.dateIdentification) timelineEvents.push({ date: cu.dateIdentification, label: 'Date identification' });
  if (cu.dateLancement) timelineEvents.push({ date: cu.dateLancement, label: 'Lancement developpement' });
  if (cu.dateMiseEnProd) timelineEvents.push({ date: cu.dateMiseEnProd, label: 'Mise en production' });
  cu.auditLogs?.forEach((log: any) => {
    if (log.action === 'UPDATE' && log.resourceLabel?.includes('statut')) {
      timelineEvents.push({ date: log.createdAt, label: `Changement statut`, detail: log.resourceLabel });
    }
  });
  timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold font-mono text-teal">{cu.code}</span>
              {cu.ancienCode && cu.ancienCode !== cu.code && (
                <span className="text-xs text-gray-400">(ex: {cu.ancienCode})</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-navy">{cu.titre}</h1>
            {cu.description && <p className="text-sm text-gray-500 mt-1">{cu.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', sc.bg, sc.text)}>{sc.label}</span>
            {cu.phaseMVP && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-navy/10 text-navy">{cu.phaseMVP.code}</span>}
            <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', IMPACT_COLORS[cu.impact])}>{cu.impact}</span>
            {cu.axePrioritaire && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold-50 text-gold">{cu.axePrioritaire}</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <select
            value={newStatut || cu.statutImpl}
            onChange={e => { setNewStatut(e.target.value); updateStatutMut.mutate(e.target.value); }}
            className="px-3 py-1.5 text-xs border rounded-lg"
          >
            {Object.entries(STATUT_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <Link to="/admin/roadmap">
            <Button variant="outline" size="sm" className="text-xs">Roadmap MVP</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FLUX DE DONNEES */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-navy">Flux de donnees</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="font-bold text-navy text-sm">{cu.institutionSource?.code || cu.institutionSourceCode || '—'}</p>
                <p className="text-[10px] text-gray-400">{cu.institutionSource?.nom || ''}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-teal flex-shrink-0" />
              <div className="text-center">
                <p className="font-bold text-navy text-sm">{cu.institutionCible?.code || cu.institutionCibleCode || '—'}</p>
                <p className="text-[10px] text-gray-400">{cu.institutionCible?.nom || ''}</p>
              </div>
            </div>
            {cu.donneesEchangees && (
              <div><p className="text-[10px] text-gray-500 font-medium">Donnees echangees</p><p className="text-xs text-navy">{cu.donneesEchangees}</p></div>
            )}
            {cu.registresConcernes && (
              <div><p className="text-[10px] text-gray-500 font-medium">Registres concernes</p><p className="text-xs text-navy">{cu.registresConcernes}</p></div>
            )}
          </CardContent>
        </Card>

        {/* FINANCEMENT */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-navy">Financement</CardTitle></CardHeader>
          <CardContent>
            {cu.financements?.length > 0 ? (
              <div className="space-y-2">
                {cu.financements.map((fin: any) => (
                  <div key={fin.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-navy">{fin.programme?.ptf?.acronyme || '—'} / {fin.programme?.code}</p>
                      <p className="text-[10px] text-gray-400">{fin.programme?.nom}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', FIN_COLORS[fin.statut])}>{fin.statut}</span>
                      {fin.montantAlloue && <p className="text-xs font-bold text-navy mt-0.5">{(fin.montantAlloue / 1000000).toFixed(1)}M FCFA</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">Non finance — orphelin</span>
                <Link to="/admin/financements" className="block mt-2 text-[10px] text-teal hover:underline">Proposer a un PTF</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CONVENTIONS */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-navy">Conventions</CardTitle></CardHeader>
          <CardContent>
            {cu.conventions?.length > 0 ? (
              <div className="space-y-2">
                {cu.conventions.map((conv: any) => (
                  <div key={conv.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-navy">{conv.institutionA?.code} &#8596; {conv.institutionB?.code}</p>
                      <p className="text-[10px] text-gray-400">{conv.objet}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded text-[10px]', conv.statut === 'ACTIVE' || conv.statut === 'SIGNEE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>{conv.statut}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                {cu.conventionRequise ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">Convention requise — non signee</span>
                ) : (
                  <span className="text-xs text-gray-400">Convention non requise</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIPELINE X-ROAD */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-navy">Pipeline technique X-Road</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <XRoadGauge readiness={cu.xroadSource} label="Source" />
            <div className="border-t pt-3">
              <XRoadGauge readiness={cu.xroadCible} label="Destination" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TIMELINE */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-navy">Timeline / Historique</CardTitle></CardHeader>
        <CardContent>
          {timelineEvents.length > 0 ? (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {timelineEvents.map((evt, i) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-teal border-2 border-white" />
                  <p className="text-[10px] text-gray-400">{new Date(evt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs font-medium text-navy">{evt.label}</p>
                  {evt.detail && <p className="text-[10px] text-gray-500">{evt.detail}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Aucun evenement enregistre</p>
          )}
        </CardContent>
      </Card>

      {/* NOTES */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-navy">Notes / Observations</CardTitle>
            {!editNotes && (
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { setEditNotes(true); setNotesValue(cu.notes || ''); }}>Modifier</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editNotes ? (
            <div className="space-y-2">
              <Textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={4} className="text-sm" placeholder="Notes libres..." />
              <div className="flex gap-2">
                <Button size="sm" className="bg-teal hover:bg-teal-dark text-xs" onClick={() => updateNotesMut.mutate()} disabled={updateNotesMut.isPending}>
                  <Save className="w-3 h-3 mr-1" /> Enregistrer
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditNotes(false)}>Annuler</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{cu.notes || cu.observations || <span className="text-gray-400 italic">Aucune note</span>}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
