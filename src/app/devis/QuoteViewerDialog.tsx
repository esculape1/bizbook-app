
'use client';

import { useState } from 'react';
import type { Quote, Client, Settings } from '@/lib/types';
import { DetailedQuoteTemplate } from '@/components/quote-templates/DetailedQuoteTemplate';
import { Button } from '@/components/ui/button';
import { Eye, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type QuoteViewerDialogProps = {
  quote: Quote;
  client: Client;
  settings: Settings;
};

export function QuoteViewerDialog({ quote, client, settings }: QuoteViewerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadPdf = async () => {
    const quoteElement = document.getElementById('quote-content');
    if (!quoteElement) return;

    const pages = quoteElement.querySelectorAll('.page-container');
    pages.forEach(page => ((page as HTMLElement).style.display = 'block'));

    const canvas = await html2canvas(quoteElement, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: quoteElement.scrollWidth,
      windowHeight: quoteElement.scrollHeight,
    });

    pages.forEach(page => ((page as HTMLElement).style.display = ''));

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / canvasHeight;
    let imgWidth = pdfWidth;
    let imgHeight = imgWidth / ratio;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    if (imgHeight < pdfHeight) {
       imgHeight = pdfHeight;
       imgWidth = imgHeight * ratio;
    }

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`Proforma_${quote.quoteNumber.replace(/[\/\s]/g, '-')}.pdf`);
  };

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
            <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
