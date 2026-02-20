'use client';

import { useState, useRef, useEffect } from 'react';
import type { Quote, Client, Settings } from '@/lib/types';
import { DetailedQuoteTemplate } from '@/components/quote-templates/DetailedQuoteTemplate';
import { Button } from '@/components/ui/button';
import { Eye, Printer, FileClock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type QuoteViewerDialogProps = {
  quote: Quote;
  client: Client;
  settings: Settings;
};

export function QuoteViewerDialog({ quote, client, settings }: QuoteViewerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const targetWidth = 800; // Largeur cible A4
          if (containerWidth < targetWidth) {
            setScale(containerWidth / targetWidth);
          } else {
            setScale(1);
          }
        }
      };

      const timer = setTimeout(updateScale, 100);
      window.addEventListener('resize', updateScale);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateScale);
      };
    }
  }, [isOpen]);

  const handlePrint = () => {
    const content = document.getElementById('quote-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      const suggestedFilename = `PROFORMA-${quote.quoteNumber}`;
      printWindow?.document.write(`<html><head><title>${suggestedFilename}</title>`);
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
      
      setTimeout(() => {
        printWindow?.print();
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10" title="Voir la proforma">
          <Eye className="h-4 w-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[98vw] max-w-5xl p-0 overflow-hidden border-none shadow-2xl h-[95vh] flex flex-col bg-muted/20">
        <div className="p-4 border-b bg-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-600">
                    <FileClock className="size-5" />
                </div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">Proforma - {quote.quoteNumber}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} className="font-black h-10 px-6 shadow-lg shadow-primary/20">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer / PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                    <X className="size-5" />
                </Button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 flex justify-center bg-muted/30">
            <div ref={containerRef} className="w-full flex justify-center">
                <div 
                    className="origin-top transition-all duration-500 ease-out"
                    style={{ 
                        width: '210mm', 
                        transform: `scale(${scale})`,
                        height: `${297 * scale}mm`,
                        marginBottom: scale < 1 ? `-${297 * (1 - scale)}mm` : '0' 
                    }}
                >
                    <div className="shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm bg-white overflow-hidden ring-1 ring-black/5">
                        <DetailedQuoteTemplate quote={quote} client={client} settings={settings} />
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
