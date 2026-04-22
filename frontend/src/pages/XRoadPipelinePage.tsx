import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, Circle, AlertTriangle, Clock, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const JALONS = [
  { key: 'serveurDedie', label: 'Serveur dédié' },
  { key: 'connectiviteReseau', label: 'Connectivité' },
  { key: 'certificatsSSL', label: 'Certificats SSL' },
  { key: 'securityServerInstall', label: 'Security Server' },
  { key: 'premierServicePublie', label: '1er service' },
  { key: 'premierEchangeReussi', label: '1er échange' },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  TERMINE: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Terminé' },
  EN_COURS: { icon: Clock, color: 'text-gold', bg: 'bg-gold-50', label: 'En cours' },
  BLOQUE: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Bloqué' },
  NON_DEMARRE: { icon: Circle, color: 'text-gray-300', bg: 'bg-gray-50', label: 'Non démarré' },
};

const HEBERGEMENT_LABELS: Record<string, { label: string; color: string }> = {
  SENUM_CENTRALISE: { label: 'SENUM', color: 'bg-teal-50 text-teal' },
  HEBERGEMENT_PROPRE: { label: 'Propre', color: 'bg-navy/10 text-navy' },
  MIXTE: { label: 'Mixte', color: 'bg-gold-50 text-gold' },
};

const STATUS_OPTIONS = ['NON_DEMARRE', 'EN_COURS', 'TERMINE', 'BLOQUE'];
const HEB_OPTIONS = ['SENUM_CENTRALISE', 'HEBERGEMENT_PROPRE', 'MIXTE'];

export function XRoadPipelinePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['xroad-readiness'],
    queryFn: () => api.get('/xroad-readiness'),
  });

  const updateMut = useMutation({
    mutationFn: ({ institutionId, body }: { institutionId: string; body: any }) =>
      api.put(`/xroad-readiness/${institutionId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['xroad-readiness'] });
      setEditing(null);
      toast({ title: 'Pipeline mis à jour' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e?.response?.data?.message || 'Échec de la mise à jour', variant: 'destructive' }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const readiness = data?.data || [];
  const withSS = readiness.filter((r: any) => r.securityServerInstall === 'TERMINE').length;
  const withAPI = readiness.filter((r: any) => r.disposeAPI).length;
  const blocked = readiness.filter((r: any) => r.blocage).length;

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      serveurDedie: r.serveurDedie || 'NON_DEMARRE',
      connectiviteReseau: r.connectiviteReseau || 'NON_DEMARRE',
      certificatsSSL: r.certificatsSSL || 'NON_DEMARRE',
      securityServerInstall: r.securityServerInstall || 'NON_DEMARRE',
      premierServicePublie: r.premierServicePublie || 'NON_DEMARRE',
      premierEchangeReussi: r.premierEchangeReussi || 'NON_DEMARRE',
      hebergement: r.hebergement || 'SENUM_CENTRALISE',
      hebergementCible: r.hebergementCible || '',
      disposeAPI: r.disposeAPI || false,
      maturiteAPI: r.maturiteAPI || '',
      systemeSource: r.systemeSource || '',
      protocoleAPI: r.protocoleAPI || '',
      observationsAPI: r.observationsAPI || '',
      blocage: r.blocage || '',
      prochainJalon: r.prochainJalon || '',
      observations: r.observations || '',
      prerequisMigration: r.prerequisMigration || '',
    });
  };

  const save = () => {
    if (!editing) return;
    const body = { ...form };
    if (!body.hebergementCible) body.hebergementCible = null;
    updateMut.mutate({ institutionId: editing.institution.id, body });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Pipeline de déploiement X-Road</h1>
        <p className="text-gray-500 mt-1">État réel des agences pilotes — synchronisé avec DAT PexOne v0.5</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-navy"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Agences pilotes</p><p className="text-xl font-bold text-navy">{readiness.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-teal"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Avec API</p><p className="text-xl font-bold text-teal">{withAPI}/{readiness.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Security Server installe</p><p className="text-xl font-bold text-success">{withSS}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-3"><p className="text-[10px] text-gray-500">Bloquees</p><p className="text-xl font-bold text-red-500">{blocked}</p></CardContent></Card>
      </div>

      {/* Tableau pipeline */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-gray-500 sticky left-0 bg-white">Institution</th>
                {JALONS.map(j => (
                  <th key={j.key} className="p-3 text-center text-gray-500 whitespace-nowrap text-xs">{j.label}</th>
                ))}
                <th className="p-3 text-center text-gray-500 text-xs">Hébergement</th>
                <th className="p-3 text-center text-gray-500 text-xs">API</th>
                <th className="p-3 text-left text-gray-500 text-xs">Blocage</th>
                {isAdmin && <th className="p-3 text-center text-gray-500 text-xs">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {readiness.map((r: any) => {
                const heb = HEBERGEMENT_LABELS[r.hebergement] || HEBERGEMENT_LABELS.SENUM_CENTRALISE;
                const hebCible = r.hebergementCible ? HEBERGEMENT_LABELS[r.hebergementCible] : null;

                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy sticky left-0 bg-white">
                      <div>
                        <span className="font-bold">{r.institution?.code}</span>
                        <span className="text-xs text-gray-500 block">{r.institution?.nom}</span>
                        <span className="text-[10px] text-gray-400 block">{r.institution?.ministere}</span>
                      </div>
                    </td>
                    {JALONS.map(j => {
                      const status = r[j.key] || 'NON_DEMARRE';
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      return (
                        <td key={j.key} className="p-3 text-center">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mx-auto', config.bg)} title={config.label}>
                            <Icon className={cn('w-4 h-4', config.color)} />
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', heb.color)}>{heb.label}</span>
                        {hebCible && hebCible.label !== heb.label && (
                          <span className="text-[9px] text-gray-400">→ {hebCible.label}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', r.disposeAPI ? 'bg-teal-50 text-teal' : 'bg-red-50 text-red-500')}>
                          {r.disposeAPI ? 'Oui' : 'Non'}
                        </span>
                        {r.maturiteAPI && <span className="text-[9px] text-gray-400 mt-0.5">{r.maturiteAPI}</span>}
                        {r.protocoleAPI && <span className="text-[9px] text-gray-400">{r.protocoleAPI}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-red-500 max-w-[250px]">
                      {r.blocage || <span className="text-gray-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-center">
                        <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-teal-50 rounded" title="Modifier">
                          <Pencil className="w-3.5 h-3.5 text-teal" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Détail par agence */}
      {readiness.map((r: any) => (
        <Card key={r.id} className="border-l-4 border-l-navy">
          <CardHeader>
            <CardTitle className="text-navy text-sm">{r.institution?.code} — {r.institution?.nom}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-500 mb-1">Système source</p>
              <p>{r.systemeSource || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500 mb-1">Protocole API</p>
              <p>{r.protocoleAPI || '—'}</p>
            </div>
            {r.observationsAPI && (
              <div className="col-span-2">
                <p className="font-medium text-gray-500 mb-1">Observations API</p>
                <p className="text-gray-600">{r.observationsAPI}</p>
              </div>
            )}
            {r.prerequisMigration && (
              <div className="col-span-2">
                <p className="font-medium text-gray-500 mb-1">Prérequis migration</p>
                <p className="text-gray-600">{r.prerequisMigration}</p>
              </div>
            )}
            {r.observations && (
              <div className="col-span-2">
                <p className="font-medium text-gray-500 mb-1">Observations</p>
                <p className="text-gray-600">{r.observations}</p>
              </div>
            )}
            {r.prochainJalon && (
              <div className="col-span-2">
                <p className="font-medium text-gray-500 mb-1">Prochain jalon</p>
                <p className="text-gray-600">{r.prochainJalon}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-navy text-white px-5 py-3 rounded-t-xl flex items-center justify-between z-10">
              <h3 className="font-bold text-sm">Modifier le pipeline — {editing.institution?.code} ({editing.institution?.nom})</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Jalons */}
              <div>
                <h4 className="text-xs font-bold text-navy uppercase mb-2">Jalons de déploiement</h4>
                <div className="grid grid-cols-2 gap-3">
                  {JALONS.map(j => (
                    <div key={j.key}>
                      <Label className="text-xs">{j.label}</Label>
                      <select
                        value={form[j.key] || 'NON_DEMARRE'}
                        onChange={e => setForm({ ...form, [j.key]: e.target.value })}
                        className="w-full h-8 px-2 text-sm border rounded-md"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hébergement */}
              <div>
                <h4 className="text-xs font-bold text-navy uppercase mb-2">Hébergement Security Server</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Hébergement actuel</Label>
                    <select
                      value={form.hebergement || 'SENUM_CENTRALISE'}
                      onChange={e => setForm({ ...form, hebergement: e.target.value })}
                      className="w-full h-8 px-2 text-sm border rounded-md"
                    >
                      {HEB_OPTIONS.map(h => <option key={h} value={h}>{HEBERGEMENT_LABELS[h].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Hébergement cible (optionnel)</Label>
                    <select
                      value={form.hebergementCible || ''}
                      onChange={e => setForm({ ...form, hebergementCible: e.target.value })}
                      className="w-full h-8 px-2 text-sm border rounded-md"
                    >
                      <option value="">— Aucun —</option>
                      {HEB_OPTIONS.map(h => <option key={h} value={h}>{HEBERGEMENT_LABELS[h].label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-xs">Prérequis migration</Label>
                  <Textarea value={form.prerequisMigration || ''} onChange={e => setForm({ ...form, prerequisMigration: e.target.value })} rows={2} className="text-sm" />
                </div>
              </div>

              {/* API */}
              <div>
                <h4 className="text-xs font-bold text-navy uppercase mb-2">Maturité API</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-end pb-1">
                    <label className="flex items-center space-x-2 text-xs">
                      <input type="checkbox" checked={form.disposeAPI || false} onChange={e => setForm({ ...form, disposeAPI: e.target.checked })} className="rounded" />
                      <span>Dispose d'une API exposable</span>
                    </label>
                  </div>
                  <div>
                    <Label className="text-xs">Maturité API</Label>
                    <Input value={form.maturiteAPI || ''} onChange={e => setForm({ ...form, maturiteAPI: e.target.value })} placeholder="Ex : Mature, En cours, Faible" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Système source</Label>
                    <Input value={form.systemeSource || ''} onChange={e => setForm({ ...form, systemeSource: e.target.value })} placeholder="Ex : GAINDE, SIGTAS" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Protocole API</Label>
                    <Input value={form.protocoleAPI || ''} onChange={e => setForm({ ...form, protocoleAPI: e.target.value })} placeholder="Ex : REST/JSON, SOAP" className="h-8 text-sm" />
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-xs">Observations API</Label>
                  <Textarea value={form.observationsAPI || ''} onChange={e => setForm({ ...form, observationsAPI: e.target.value })} rows={2} className="text-sm" />
                </div>
              </div>

              {/* Suivi */}
              <div>
                <h4 className="text-xs font-bold text-navy uppercase mb-2">Suivi & blocages</h4>
                <div>
                  <Label className="text-xs">Blocage actuel</Label>
                  <Input value={form.blocage || ''} onChange={e => setForm({ ...form, blocage: e.target.value })} placeholder="Description courte du blocage en cours" className="h-8 text-sm" />
                </div>
                <div className="mt-2">
                  <Label className="text-xs">Prochain jalon</Label>
                  <Input value={form.prochainJalon || ''} onChange={e => setForm({ ...form, prochainJalon: e.target.value })} placeholder="Action attendue prochainement" className="h-8 text-sm" />
                </div>
                <div className="mt-2">
                  <Label className="text-xs">Observations générales</Label>
                  <Textarea value={form.observations || ''} onChange={e => setForm({ ...form, observations: e.target.value })} rows={3} className="text-sm" />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                <Button size="sm" className="bg-teal hover:bg-teal-dark" onClick={save} disabled={updateMut.isPending}>
                  {updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
