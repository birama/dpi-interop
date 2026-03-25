import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { Loader2, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as d3 from 'd3';

const MODE_COLORS: Record<string, string> = {
  'Manuel': '#C00000', 'Courrier': '#C00000', 'Papier': '#C00000',
  'Fichier (CSV/Excel)': '#ED7D31', 'Email': '#ED7D31', 'Déclaré': '#9CA3AF',
  'API REST': '#2D6A4F', 'Web Service SOAP': '#2D6A4F',
  'X-Road': '#0A6B68', 'Autre': '#9CA3AF',
};

const MINISTERE_COLORS: Record<string, string> = {
  'Finances': '#0C1F3A', 'Économie': '#1A3354', 'Justice': '#C55A18',
  'Intérieur': '#7C3AED', 'Santé': '#DC2626', 'Numérique': '#0A6B68',
  'Agriculture': '#2D6A4F', 'Éducation': '#D4A820', 'Emploi': '#6366F1',
  'Famille': '#EC4899', 'Présidence': '#0C1F3A', 'Primature': '#1A3354',
};

function getColor(group: string): string {
  for (const [k, c] of Object.entries(MINISTERE_COLORS)) { if (group?.includes(k)) return c; }
  return '#6B7280';
}
function getModeColor(mode: string): string {
  for (const [k, c] of Object.entries(MODE_COLORS)) { if (mode?.includes(k)) return c; }
  return '#9CA3AF';
}

interface GNode extends d3.SimulationNodeDatum {
  id: string; label: string; group: string; submissionStatus: string; maturite?: number;
}
interface GLink extends d3.SimulationLinkDatum<GNode> {
  donnee: string; mode: string; frequence: string;
}

export function GraphePage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GLink | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['graphe-data'],
    queryFn: () => api.get('/graphe'),
  });

  useEffect(() => {
    if (!data?.data || !svgRef.current) return;
    const { nodes, links } = data.data as { nodes: GNode[]; links: GLink[] };
    if (nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement!;
    const width = container.clientWidth;
    const height = 600;
    setDimensions({ width, height });

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    // Zoom
    const g = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    }) as any);

    // Connection count
    const connCount = new Map<string, number>();
    links.forEach(l => {
      const s = (l.source as any).id || l.source;
      const t = (l.target as any).id || l.target;
      connCount.set(s, (connCount.get(s) || 0) + 1);
      connCount.set(t, (connCount.get(t) || 0) + 1);
    });

    // Simulation
    const simulation = d3.forceSimulation<GNode>(nodes)
      .force('link', d3.forceLink<GNode, GLink>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Links
    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => getModeColor(d.mode))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (_e, d) => { setSelectedLink(d); setSelectedNode(null); setEditForm({ donnee: d.donnee, mode: d.mode, frequence: d.frequence }); });

    // Nodes
    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer')
      .on('click', (_e, d) => { setSelectedNode(d); setSelectedLink(null); })
      .call(d3.drag<SVGGElement, GNode>()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('circle')
      .attr('r', d => Math.max(8, Math.min(22, 6 + (connCount.get(d.id) || 0) * 1.5)))
      .attr('fill', d => getColor(d.group))
      .attr('stroke', d => d.submissionStatus === 'VALIDATED' ? '#2D6A4F' : d.submissionStatus === 'SUBMITTED' ? '#D4A820' : '#9CA3AF')
      .attr('stroke-width', 2.5);

    node.append('text')
      .text(d => d.id)
      .attr('dy', d => Math.max(8, 6 + (connCount.get(d.id) || 0) * 1.5) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#0C1F3A')
      .attr('font-weight', '500');

    // Hover highlight
    node.on('mouseenter', function(_e, d) {
      link.attr('stroke-opacity', l => ((l.source as any).id === d.id || (l.target as any).id === d.id) ? 1 : 0.08);
      node.selectAll('circle').attr('opacity', n => {
        if ((n as GNode).id === d.id) return 1;
        const connected = links.some(l => ((l.source as any).id === d.id && (l.target as any).id === (n as GNode).id) || ((l.target as any).id === d.id && (l.source as any).id === (n as GNode).id));
        return connected ? 1 : 0.15;
      });
      node.selectAll('text').attr('opacity', n => {
        if ((n as GNode).id === d.id) return 1;
        return links.some(l => ((l.source as any).id === d.id && (l.target as any).id === (n as GNode).id) || ((l.target as any).id === d.id && (l.source as any).id === (n as GNode).id)) ? 1 : 0.15;
      });
    }).on('mouseleave', () => {
      link.attr('stroke-opacity', 0.6);
      node.selectAll('circle').attr('opacity', 1);
      node.selectAll('text').attr('opacity', 1);
    });

    simulation.on('tick', () => {
      link.attr('x1', d => (d.source as any).x).attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x).attr('y2', d => (d.target as any).y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [data]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  const graphData = data?.data || { nodes: [], links: [] };
  const totalNodes = graphData.nodes?.length || 0;
  const totalLinks = graphData.links?.length || 0;
  const xroadLinks = (graphData.links || []).filter((l: any) => l.mode?.includes('X-Road')).length;
  const manualLinks = (graphData.links || []).filter((l: any) => ['Manuel', 'Courrier', 'Papier'].some((m: string) => l.mode?.includes(m))).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Graphe des flux inter-institutionnels</h1>
        <p className="text-gray-500 mt-1">Cartographie D3 force-directed — cliquez, zoomez, glissez</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 text-center"><p className="text-2xl font-bold text-navy">{totalNodes}</p><p className="text-xs text-gray-500">Institutions</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><p className="text-2xl font-bold text-teal">{totalLinks}</p><p className="text-xs text-gray-500">Flux total</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><p className="text-2xl font-bold text-success">{xroadLinks}</p><p className="text-xs text-gray-500">Via X-Road</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><p className="text-2xl font-bold" style={{ color: '#C00000' }}>{manualLinks}</p><p className="text-xs text-gray-500">Manuels</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-4 pb-2">
              <svg ref={svgRef} className="w-full rounded" style={{ height: 600, background: '#fafafa' }} />
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-4 mt-3 text-xs">
            <span className="flex items-center"><span className="w-3 h-0.5 mr-1" style={{ backgroundColor: '#C00000', display: 'inline-block' }} />Manuel</span>
            <span className="flex items-center"><span className="w-3 h-0.5 mr-1" style={{ backgroundColor: '#ED7D31', display: 'inline-block' }} />Fichier/Email</span>
            <span className="flex items-center"><span className="w-3 h-0.5 mr-1" style={{ backgroundColor: '#2D6A4F', display: 'inline-block' }} />API REST</span>
            <span className="flex items-center"><span className="w-3 h-0.5 mr-1" style={{ backgroundColor: '#0A6B68', display: 'inline-block' }} />X-Road</span>
            <span className="text-gray-400 ml-4">Bordure: vert=validé, gold=soumis, gris=non</span>
          </div>
        </div>

        <div className="space-y-4">
          {selectedNode && (
            <Card className="border-2 border-teal/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-navy text-sm">{selectedNode.id}</CardTitle>
                  <button onClick={() => setSelectedNode(null)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p className="text-gray-500">{selectedNode.label}</p>
                <p><span className="font-medium">Ministère:</span> {selectedNode.group}</p>
                <p><span className="font-medium">Statut:</span> {selectedNode.submissionStatus}</p>
              </CardContent>
            </Card>
          )}
          {selectedLink && (
            <Card className="border-2 border-gold/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-navy text-sm">{(selectedLink.source as any).id || selectedLink.source} → {(selectedLink.target as any).id || selectedLink.target}</CardTitle>
                  <button onClick={() => setSelectedLink(null)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p><span className="font-medium">Données:</span> {selectedLink.donnee || '—'}</p>
                <p><span className="font-medium">Mode:</span> <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: getModeColor(selectedLink.mode) + '20', color: getModeColor(selectedLink.mode) }}>{selectedLink.mode}</span></p>
                <p><span className="font-medium">Fréquence:</span> {selectedLink.frequence || '—'}</p>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="w-full h-6 text-[10px] mt-2" onClick={() => setEditForm({ ...editForm, editing: true })}>
                    Modifier ce flux
                  </Button>
                )}
                {isAdmin && editForm.editing && (
                  <div className="border-t pt-2 mt-2 space-y-2">
                    <div><Label className="text-[10px]">Données</Label><Input value={editForm.donnee ?? ''} onChange={e => setEditForm({ ...editForm, donnee: e.target.value })} className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Mode</Label>
                      <select value={editForm.mode ?? ''} onChange={e => setEditForm({ ...editForm, mode: e.target.value })} className="w-full h-7 px-2 text-xs border rounded-md">
                        <option value="Manuel">Manuel</option><option value="Courrier">Courrier</option><option value="Email">Email</option>
                        <option value="Fichier (CSV/Excel)">Fichier (CSV/Excel)</option><option value="API REST">API REST</option>
                        <option value="Web Service SOAP">Web Service SOAP</option><option value="X-Road">X-Road</option><option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div><Label className="text-[10px]">Fréquence</Label>
                      <select value={editForm.frequence ?? ''} onChange={e => setEditForm({ ...editForm, frequence: e.target.value })} className="w-full h-7 px-2 text-xs border rounded-md">
                        <option value="">—</option><option value="Temps réel">Temps réel</option><option value="Quotidien">Quotidien</option>
                        <option value="Hebdomadaire">Hebdomadaire</option><option value="Mensuel">Mensuel</option><option value="Trimestriel">Trimestriel</option>
                        <option value="Annuel">Annuel</option><option value="À la demande">À la demande</option>
                      </select>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" className="flex-1 bg-teal hover:bg-teal-dark h-6 text-[10px]" onClick={async () => {
                        try {
                          const linkId = (selectedLink as any).id;
                          const linkType = (selectedLink as any).type || 'flux';
                          if (!linkId) { toast({ variant: 'destructive', title: 'Ce flux ne peut pas être modifié' }); return; }
                          await api.patch(`/graphe/flux/${linkId}`, { type: linkType, donnee: editForm.donnee, mode: editForm.mode, frequence: editForm.frequence });
                          queryClient.invalidateQueries({ queryKey: ['graphe-data'] });
                          setEditForm({});
                          toast({ title: 'Flux mis à jour' });
                        } catch { toast({ variant: 'destructive', title: 'Erreur' }); }
                      }}><Save className="w-3 h-3 mr-1" /> Sauver</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setEditForm({})}>Annuler</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {!selectedNode && !selectedLink && (
            <Card><CardContent className="pt-4 text-xs text-gray-400 text-center">Cliquez sur un nœud ou une arête</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
