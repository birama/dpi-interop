import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, institutionsApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Upload, Loader2, CheckCircle, FileText, X, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ImportPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [parsed, setParsed] = useState<any>(null);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<string[]>(['institution']);
  const [dragOver, setDragOver] = useState(false);

  const { data: instsData } = useQuery({ queryKey: ['institutions-import'], queryFn: () => institutionsApi.getAll({ limit: 500 }) });
  const { data: filesData, refetch: refetchFiles } = useQuery({ queryKey: ['import-files'], queryFn: () => api.get('/import/files') });
  const institutions = instsData?.data?.data || [];
  const instOptions = institutions.map((i: any) => ({ value: i.id, label: i.nom, sublabel: `${i.code} — ${i.ministere}` }));

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/import/questionnaire', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      const data = res.data;
      setParsed(data);
      setSelectedInstId(data.institutionId || '');
      setStep('preview');
      toast({ title: `Fichier parsé : ${data.filename}` });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.error || e.message }),
  });

  const confirmMut = useMutation({
    mutationFn: (data: any) => api.post('/import/questionnaire/confirm', data),
    onSuccess: (res) => { setResult(res.data); setStep('done'); refetchFiles(); toast({ title: 'Import réussi' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.details || e.message }),
  });

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.docx')) { toast({ variant: 'destructive', title: 'Format non supporté', description: 'Seuls les fichiers .docx sont acceptés' }); return; }
    uploadMut.mutate(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }, [handleFile]);
  const toggle = (id: string) => setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const isOpen = (id: string) => expanded.includes(id);
  const avgMaturite = parsed?.maturite?.length > 0 ? (parsed.maturite.reduce((s: number, m: any) => s + (m.note || 0), 0) / parsed.maturite.length).toFixed(1) : '—';

  const handleConfirm = () => {
    if (!selectedInstId) { toast({ variant: 'destructive', title: 'Sélectionnez une institution' }); return; }
    const inst = institutions.find((i: any) => i.id === selectedInstId);
    confirmMut.mutate({ ...parsed, institutionId: selectedInstId, institutionCode: inst?.code });
  };

  const reset = () => { setStep('upload'); setParsed(null); setResult(null); setSelectedInstId(''); };

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-navy">Import questionnaires Word</h1><p className="text-xs text-gray-500">Uploader un questionnaire .docx rempli pour l'importer automatiquement</p></div>

      {/* ÉTAPE 1 : Upload */}
      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
          className={cn('border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer relative', dragOver ? 'border-teal bg-teal-50/30' : 'border-gray-300 hover:border-teal/50')}
        >
          {uploadMut.isPending ? (
            <div className="flex flex-col items-center"><Loader2 className="w-10 h-10 animate-spin text-teal mb-3" /><p className="text-sm text-gray-500">Analyse du fichier en cours...</p></div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-navy">Glisser-déposer un fichier .docx</p>
              <p className="text-xs text-gray-400 mt-1">ou cliquer pour parcourir</p>
              <input id="file-upload" type="file" accept=".docx" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </>
          )}
        </div>
      )}

      {/* ÉTAPE 2 : Preview */}
      {step === 'preview' && parsed && (
        <div className="space-y-3">
          <Card className="border-l-4 border-l-teal">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal" />
                <span className="text-sm font-medium text-navy">{parsed.filename}</span>
                <span className="text-xs text-gray-400">({Math.round(parsed.filesize / 1024)} Ko)</span>
              </div>
              <Button size="sm" variant="outline" onClick={reset}><X className="w-3 h-3 mr-1" /> Annuler</Button>
            </CardContent>
          </Card>

          {/* Alerte doublon */}
          {parsed.isDuplicate && (
            <Card className={cn('border-l-4', parsed.sameFile ? 'border-l-red-500 bg-red-50/30' : 'border-l-gold bg-gold-50/30')}>
              <CardContent className="p-3 flex items-start space-x-2">
                {parsed.sameFile ? (
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <FileText className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-navy">{parsed.sameFile ? 'Fichier déjà importé' : 'Soumission existante'}</p>
                  <p className="text-xs text-gray-600">{parsed.message}</p>
                  {parsed.existingSubmission && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Soumission {parsed.existingSubmission.status} du {new Date(parsed.existingSubmission.createdAt).toLocaleDateString('fr-FR')}
                      {parsed.existingSubmission.importFilename && ` — fichier: ${parsed.existingSubmission.importFilename}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Institution */}
          <SectionCard title="Institution" id="institution" isOpen={isOpen} toggle={toggle}
            badge={parsed.institutionTrouvee ? <span className="px-2 py-0.5 rounded text-[10px] bg-success/10 text-success font-medium">Trouvée : {parsed.institutionCode}</span> : <span className="px-2 py-0.5 rounded text-[10px] bg-orange-100 text-orange-600 font-medium">Non trouvée</span>}>
            <p className="text-xs text-gray-500 mb-2">Nom déclaré : <strong>{parsed.institutionNomDeclare}</strong></p>
            <SearchableSelect options={instOptions} value={selectedInstId} onChange={setSelectedInstId} placeholder="Sélectionner l'institution..." />
          </SectionCard>

          {/* Section A */}
          <SectionCard title="Identification (A)" id="a" isOpen={isOpen} toggle={toggle}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Data Owner :</span> {parsed.sectionA.dataOwnerNom || '—'}</div>
              <div><span className="text-gray-500">Fonction :</span> {parsed.sectionA.dataOwnerFonction || '—'}</div>
              <div><span className="text-gray-500">Data Steward :</span> {parsed.sectionA.dataStewardNom || '—'}</div>
              <div><span className="text-gray-500">Email :</span> {parsed.sectionA.email || '—'}</div>
              <div className="col-span-2"><span className="text-gray-500">Mission :</span> {parsed.sectionA.mission?.substring(0, 200) || '—'}</div>
            </div>
          </SectionCard>

          {/* Compteurs */}
          {[
            { id: 'b1', title: `Applications (${parsed.applications.length})`, items: parsed.applications, cols: ['nom', 'editeur'] },
            { id: 'b2', title: `Registres (${parsed.registres.length})`, items: parsed.registres, cols: ['nom', 'volumetrie'] },
            { id: 'c1', title: `Données à consommer (${parsed.donneesConsommer.length})`, items: parsed.donneesConsommer, cols: ['donnee', 'source'] },
            { id: 'c2', title: `Données à fournir (${parsed.donneesFournir.length})`, items: parsed.donneesFournir, cols: ['donnee', 'destinataires'] },
            { id: 'c3', title: `Flux existants (${parsed.fluxExistants.length})`, items: parsed.fluxExistants, cols: ['partenaire', 'donneesEchangees', 'mode'] },
            { id: 'c4', title: `Cas d'usage (${parsed.casUsage.length})`, items: parsed.casUsage, cols: ['titre', 'acteurs'] },
          ].map(sec => (
            <SectionCard key={sec.id} title={sec.title} id={sec.id} isOpen={isOpen} toggle={toggle}
              badge={sec.items.length === 0 ? <span className="text-[10px] text-gray-400">Vide</span> : <span className="text-[10px] text-teal font-medium">{sec.items.length}</span>}>
              {sec.items.length > 0 ? (
                <table className="w-full text-xs"><tbody>
                  {sec.items.slice(0, 5).map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">{sec.cols.map(c => <td key={c} className="p-1 text-gray-600">{item[c] || '—'}</td>)}</tr>
                  ))}
                  {sec.items.length > 5 && <tr><td className="p-1 text-gray-400 italic" colSpan={sec.cols.length}>+{sec.items.length - 5} autres...</td></tr>}
                </tbody></table>
              ) : <p className="text-xs text-gray-400 italic">Section non renseignée</p>}
            </SectionCard>
          ))}

          <SectionCard title={`Infrastructure (${parsed.infrastructure.length})`} id="b3" isOpen={isOpen} toggle={toggle}
            badge={<span className="text-[10px] text-teal font-medium">{parsed.infrastructure.length} items</span>}>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(parsed.infrastructure.reduce((acc: any, i: any) => { acc[i.domain] = (acc[i.domain] || 0) + 1; return acc; }, {})).map(([d, c]: any) => (
                <span key={d} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{d}: {c}</span>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={`Maturité (${parsed.maturite.length})`} id="d2" isOpen={isOpen} toggle={toggle}
            badge={<span className="text-[10px] text-navy font-bold">{avgMaturite}/5</span>}>
            {parsed.maturite.map((m: any, i: number) => (
              <div key={i} className="flex justify-between text-xs py-0.5 border-b last:border-0"><span>{m.dimension}</span><span className="font-bold text-navy">{m.note}/5</span></div>
            ))}
          </SectionCard>

          {/* Confirm button */}
          <div className="flex space-x-3 pt-2">
            {parsed.sameFile ? (
              <Button variant="outline" className="text-gray-500" disabled>
                <X className="w-4 h-4 mr-2" /> Fichier déjà importé — rien à faire
              </Button>
            ) : (
              <Button className="bg-teal hover:bg-teal-dark" disabled={!selectedInstId || confirmMut.isPending} onClick={handleConfirm}>
                {confirmMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {parsed.isDuplicate ? 'Mettre à jour la soumission existante' : 'Confirmer l\'import'}
              </Button>
            )}
            <Button variant="outline" onClick={reset}>Annuler</Button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : Done */}
      {step === 'done' && result && (
        <Card className="border-2 border-success/30">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-success mx-auto" />
            <h2 className="text-lg font-bold text-navy">Import réussi — {result.institutionCode}</h2>
            <div className="grid grid-cols-3 gap-3 text-sm max-w-md mx-auto">
              <div className="text-center"><p className="text-lg font-bold text-navy">{result.nbApps}</p><p className="text-[10px] text-gray-500">Applications</p></div>
              <div className="text-center"><p className="text-lg font-bold text-navy">{result.nbRegistres}</p><p className="text-[10px] text-gray-500">Registres</p></div>
              <div className="text-center"><p className="text-lg font-bold text-teal">{result.nbInfra}</p><p className="text-[10px] text-gray-500">Infrastructure</p></div>
              <div className="text-center"><p className="text-lg font-bold text-navy">{result.nbConsommer}</p><p className="text-[10px] text-gray-500">Consommer</p></div>
              <div className="text-center"><p className="text-lg font-bold text-navy">{result.nbFournir}</p><p className="text-[10px] text-gray-500">Fournir</p></div>
              <div className="text-center"><p className="text-lg font-bold text-teal">{result.nbFlux}</p><p className="text-[10px] text-gray-500">Flux</p></div>
              <div className="text-center"><p className="text-lg font-bold text-gold">{result.nbMaturite}</p><p className="text-[10px] text-gray-500">Maturité ({result.scoreMoyenMaturite}/5)</p></div>
              <div className="text-center"><p className="text-lg font-bold text-success">{result.nbForces}</p><p className="text-[10px] text-gray-500">Forces</p></div>
              <div className="text-center"><p className="text-lg font-bold text-red-500">{result.nbFaiblesses}</p><p className="text-[10px] text-gray-500">Faiblesses</p></div>
            </div>
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => window.location.href = `/submissions`}>Voir les soumissions</Button>
              <Button className="bg-teal hover:bg-teal-dark" onClick={reset}><Upload className="w-4 h-4 mr-2" /> Importer un autre</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des fichiers importés */}
      <Card>
        <div className="p-3 border-b">
          <h3 className="text-sm font-bold text-navy">Fichiers importés</h3>
        </div>
        <CardContent className="pt-3">
          {(() => {
            const files = filesData?.data || [];
            if (files.length === 0) return <p className="text-xs text-gray-400 text-center py-4">Aucun fichier importé</p>;
            return (
              <table className="w-full text-xs">
                <thead><tr className="border-b text-gray-500">
                  <th className="p-2 text-left">Institution</th>
                  <th className="p-2 text-left">Fichier</th>
                  <th className="p-2 text-center">Statut</th>
                  <th className="p-2 text-center">Date</th>
                  <th className="p-2 text-right">Action</th>
                </tr></thead>
                <tbody>
                  {files.map((f: any) => (
                    <tr key={f.id} className="border-b hover:bg-gray-50">
                      <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-navy/10 text-navy text-[10px] font-medium">{f.institution?.code}</span> <span className="text-gray-500">{f.institution?.nom}</span></td>
                      <td className="p-2 text-navy">{f.importFilename}</td>
                      <td className="p-2 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[10px]', f.status === 'SUBMITTED' ? 'bg-teal-50 text-teal' : 'bg-gray-100 text-gray-500')}>{f.status}</span></td>
                      <td className="p-2 text-center text-gray-500">{f.importedAt ? new Date(f.importedAt).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            const res = await api.get(`/import/files/${f.id}/download`, { responseType: 'blob' });
                            const url = URL.createObjectURL(res.data);
                            const a = document.createElement('a'); a.href = url; a.download = f.importFilename; a.click(); URL.revokeObjectURL(url);
                          } catch { toast({ variant: 'destructive', title: 'Fichier non disponible' }); }
                        }}>
                          <Download className="w-3 h-3 mr-1" /> Télécharger
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

function SectionCard({ title, id, isOpen, toggle, badge, children }: { title: string; id: string; isOpen: (id: string) => boolean; toggle: (id: string) => void; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggle(id)}>
        <div className="flex items-center space-x-2">
          {isOpen(id) ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          <span className="text-sm font-medium text-navy">{title}</span>
        </div>
        {badge}
      </div>
      {isOpen(id) && <CardContent className="pt-0 pb-3 px-3">{children}</CardContent>}
    </Card>
  );
}
