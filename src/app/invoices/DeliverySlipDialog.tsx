'use client';

import { useState, useRef, useEffect } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { DeliverySlipTemplate } from '@/components/delivery-slip/DeliverySlipTemplate';
import { Button } from '@/components/ui/button';
import { Truck, Printer, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type DeliverySlipDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function DeliverySlipDialog({ invoice, client, settings }: DeliverySlipDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  const ITEMS_PER_PAGE = 13;
  const numPages = Math.max(1, Math.ceil(invoice.items.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (isOpen) {
      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const targetWidth = 800;
          const newScale = containerWidth / targetWidth;
          setScale(newScale > 1 ? 1 : newScale);
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
    const content = document.getElementById('delivery-slip-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      const suggestedFilename = `BL-${invoice.invoiceNumber}`;
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
      printWindow?.document.write('<body class="p-0 m-0">');
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
        <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-14 text-lg font-black uppercase tracking-tight border-2 border-primary/10 hover:bg-primary/5 shadow-sm transition-all active:scale-95"
        >
          <Truck className="mr-3 h-6 w-6 text-primary" />
          Bordereau de Livraison
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[98vw] max-w-5xl p-0 overflow-hidden border-none shadow-2xl h-[95vh] flex flex-col bg-muted/20">
        <div className="p-4 border-b bg-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Truck className="size-5" />
                </div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">Bordereau - {`BL-${invoice.invoiceNumber}`}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} className="font-black h-10 px-6 shadow-lg shadow-primary/20">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer
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
                        height: `calc(297mm * ${numPages} * ${scale})`,
                        backgroundColor: 'white',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                    }}
                >
                    <DeliverySlipTemplate invoice={invoice} client={client} settings={settings} />
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
