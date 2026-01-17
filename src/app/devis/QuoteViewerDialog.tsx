
'use client';

import { useState } from 'react';
import type { Quote, Client, Settings } from '@/lib/types';
import { DetailedQuoteTemplate } from '@/components/quote-templates/DetailedQuoteTemplate';
import { Button } from '@/components/ui/button';
import { Eye, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

type QuoteViewerDialogProps = {
  quote: Quote;
  client: Client;
  settings: Settings;
};

export function QuoteViewerDialog({ quote, client, settings }: QuoteViewerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrint = () => {
    const content = document.getElementById('quote-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      const suggestedFilename = `PROFORMA-${quote.quoteNumber}`;
      printWindow?.document.write(`<html><head><title>${suggestedFilename}</title>`);
      // It's crucial to include stylesheets for print.
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if (styleSheet.href) {
            printWindow?.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
          } else if (styleSheet.cssRules) {
            printWindow?.document.write(`<style>${Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')}</style>`);
          }
        } catch (e) {
            console.warn('Could not read stylesheet for printing', e);
        }
      });
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(content.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      
      // Delay printing to allow styles to load
      setTimeout(() => {
        printWindow?.print();
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Voir la proforma">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-4xl p-0">
        <div className="p-6">
            <DialogHeader>
            <DialogTitle>Aperçu de la Proforma - {quote.quoteNumber}</DialogTitle>
            </DialogHeader>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-gray-50">
            <DetailedQuoteTemplate quote={quote} client={client} settings={settings} />
        </div>
        <DialogFooter className="p-6 bg-white border-t">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer / PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
