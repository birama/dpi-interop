import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, Check } from 'lucide-react';

const DEFAULT_URL = `${window.location.origin}/recensement`;

const DARK = '#0C1F3A';
const BASE_OPTS = { errorCorrectionLevel: 'H' as const, margin: 4, width: 2000 };

export function AdminQrCodePage() {
  const [customUrl, setCustomUrl] = useState('');
  const [previewBg, setPreviewBg] = useState<'white' | 'transparent'>('white');
  const [qrPngWhite, setQrPngWhite] = useState('');
  const [qrPngTransparent, setQrPngTransparent] = useState('');
  const [qrSvgWhite, setQrSvgWhite] = useState('');
  const [qrSvgTransparent, setQrSvgTransparent] = useState('');
  const [previewSvg, setPreviewSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const displayUrl = customUrl.trim() || DEFAULT_URL;

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      try {
        const [svgW, svgT, pngW, pngT] = await Promise.all([
          QRCode.toString(displayUrl, { ...BASE_OPTS, type: 'svg', color: { dark: DARK, light: '#FFFFFFFF' } }),
          QRCode.toString(displayUrl, { ...BASE_OPTS, type: 'svg', color: { dark: DARK, light: '#FFFFFF00' } })
            .then((s: string) => s.replace(/<rect[^>]*fill="#FFFFFF00"[^>]*\/>/, '<rect width="100%" height="100%" fill="transparent"/>')),
          QRCode.toDataURL(displayUrl, { ...BASE_OPTS, color: { dark: DARK, light: '#FFFFFFFF' } }),
          QRCode.toDataURL(displayUrl, { ...BASE_OPTS, color: { dark: DARK, light: '#FFFFFF00' } }),
        ]);
        if (cancelled) return;
        setQrSvgWhite(svgW);
        setQrSvgTransparent(svgT);
        setQrPngWhite(pngW);
        setQrPngTransparent(pngT);
        setPreviewSvg(previewBg === 'white' ? svgW : svgT);
      } catch { /* URL invalide */ }
    }
    gen();
    return () => { cancelled = true; };
  }, [displayUrl, previewBg]);

  // Met à jour le preview SVG quand on change de fond
  useEffect(() => {
    setPreviewSvg(previewBg === 'white' ? qrSvgWhite : qrSvgTransparent);
  }, [previewBg, qrSvgWhite, qrSvgTransparent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSvg = (svg: string, filename: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; a.click();
  };

  const qrSize = 260;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">QR code du formulaire</h1>
        <p className="text-sm text-gray-500 mt-1">Comité GouvNum — Diffusion du lien de recensement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche : contrôles */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-xs">URL du formulaire</Label>
              <div className="flex mt-1 gap-2">
                <Input
                  className="h-9 text-sm font-mono"
                  value={displayUrl}
                  readOnly
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {copied && <p className="text-xs text-teal">URL copiée !</p>}
            </div>

            <div>
              <Label className="text-xs">URL personnalisée (optionnel)</Label>
              <Input
                className="h-9 text-sm mt-1"
                placeholder="Ex: http://localhost:5173/recensement"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Utile pour tester en réseau local avant l'ouverture WAF.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-navy mb-3">Aperçu</h3>
              <div className="flex gap-2 mb-3">
                <Button
                  variant={previewBg === 'white' ? 'default' : 'outline'}
                  size="sm"
                  className={previewBg === 'white' ? 'bg-navy hover:bg-navy-light' : ''}
                  onClick={() => setPreviewBg('white')}
                >
                  Fond blanc
                </Button>
                <Button
                  variant={previewBg === 'transparent' ? 'default' : 'outline'}
                  size="sm"
                  className={previewBg === 'transparent' ? 'bg-navy hover:bg-navy-light' : ''}
                  onClick={() => setPreviewBg('transparent')}
                >
                  Fond transparent
                </Button>
              </div>
              <div
                className={`rounded-lg p-3 inline-block ${previewBg === 'transparent' ? 'bg-gray-100 border-2 border-dashed border-gray-300' : 'border-2 border-gray-200 bg-white'}`}
                style={{ width: qrSize + 24, height: qrSize + 24 }}
                dangerouslySetInnerHTML={{
                  __html: previewSvg
                    ? previewSvg.replace(/width="[^"]*"/, `width="${qrSize}"`).replace(/height="[^"]*"/, `height="${qrSize}"`)
                    : ''
                }}
              />
              {!previewSvg && (
                <div className="flex items-center justify-center text-gray-300 text-sm" style={{ width: qrSize + 24, height: qrSize + 24 }}>
                  Saisissez une URL
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-navy mb-3">Téléchargements</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => downloadPng(qrPngWhite, 'qr_recensement_blanc.png')}
                  disabled={!qrPngWhite}
                >
                  <Download className="w-4 h-4 mr-1" /> PNG fond blanc
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => downloadPng(qrPngTransparent, 'qr_recensement_transparent.png')}
                  disabled={!qrPngTransparent}
                >
                  <Download className="w-4 h-4 mr-1" /> PNG transparent
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => downloadSvg(qrSvgWhite, 'qr_recensement_blanc.svg')}
                  disabled={!qrSvgWhite}
                >
                  <Download className="w-4 h-4 mr-1" /> SVG fond blanc
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => downloadSvg(qrSvgTransparent, 'qr_recensement_transparent.svg')}
                  disabled={!qrSvgTransparent}
                >
                  <Download className="w-4 h-4 mr-1" /> SVG transparent
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">PNG généré en 2000×2000 px.</p>
            </div>
          </CardContent>
        </Card>

        {/* Colonne droite : note technique */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-3">
              <div>
                <h3 className="font-semibold text-navy">Recommandations d'impression</h3>
                <ul className="list-disc pl-4 mt-1 text-gray-600 space-y-1">
                  <li>Privilégier le <strong>SVG</strong> pour l'impression (vectoriel, pas de perte de qualité)</li>
                  <li>Taille minimale recommandée : <strong>3 cm</strong> de côté sur le support imprimé</li>
                  <li>Correction d'erreur niveau <strong>H</strong> (30%) — scan fiable même à distance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-navy">Utilisation</h3>
                <ul className="list-disc pl-4 mt-1 text-gray-600 space-y-1">
                  <li>Le QR code pointe vers le formulaire public <strong>/recensement</strong></li>
                  <li>Fonctionne sans authentification — le destinataire scanne et remplit</li>
                  <li>URL dérivée automatiquement de l'environnement (local ou production)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-navy">Redirection stable</h3>
                <p className="text-gray-600 mt-1">
                  Pour pouvoir changer la destination sans réimprimer, faire pointer le QR code
                  vers une adresse de redirection que vous contrôlez (ex: <code className="text-xs bg-gray-200 px-1 rounded">numerique.gouv.sn/recensement</code>).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
