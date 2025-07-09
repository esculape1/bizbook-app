'use client';

import { useState } from 'react';
import type { Quote, Client, Settings } from '@/lib/types';
import { DetailedQuoteTemplate } from '@/components/quote-templates/DetailedQuoteTemplate';
import { Button } from '@/components/ui/button';
import { Eye, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

type QuoteViewerDialogProps = {
  quote: Quote;
  client: Client;
  settings: Settings;
};

export function QuoteViewerDialog({ quote, client, settings }: QuoteViewerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrint = () => {
    const printContent = document.getElementById('quote-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Facture Proforma</title>');
        
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');
          
        const printStyles = `
          @page {
            size: A4;
            margin: 2.5cm !important;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .printable-area {
               background-color: #ffffff !important;
               color: #000000 !important;
            }
          }
        `;

        printWindow.document.write(`<style>${styles}${printStyles}</style></head><body>`);
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };
  
  const generatePdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const content = document.getElementById('quote-content');
    if(content){
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;
        pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
        pdf.save(`Proforma_${quote.quoteNumber}.pdf`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Voir la proforma">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="p-6">
            <DialogHeader>
            <DialogTitle>Aperçu de la Proforma - {quote.quoteNumber}</DialogTitle>
            </DialogHeader>
        </div>
        <div className="max-h-[70vh] overflow-y-auto bg-gray-50">
            <DetailedQuoteTemplate quote={quote} client={client} settings={settings} />
        </div>
        <DialogFooter className="p-6 bg-white border-t">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
            <Button onClick={generatePdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                PDF
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
