import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportPDFButtonProps {
  targetId: string;
  filename?: string;
  title?: string;
}

export function ExportPDFButton({ targetId, filename = 'export', title }: ExportPDFButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(12, 31, 58); // navy
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(212, 168, 32); // gold
      pdf.setFontSize(10);
      pdf.text('MCTN / SENUM — Plateforme d\'Interopérabilité PINS', pageWidth / 2, 10, { align: 'center' });

      // Image
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const finalHeight = Math.min(imgHeight, pageHeight - 35);
      pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, finalHeight);

      // Footer
      pdf.setTextColor(150);
      pdf.setFontSize(7);
      pdf.text(`Document confidentiel — Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
    setExporting(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
      {title || 'Export PDF'}
    </Button>
  );
}
