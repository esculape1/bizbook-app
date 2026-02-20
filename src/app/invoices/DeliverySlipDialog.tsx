
'use client';

import { useState } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { DeliverySlipTemplate } from '@/components/delivery-slip/DeliverySlipTemplate';
import { Button } from '@/components/ui/button';
import { Truck, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

type DeliverySlipDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function DeliverySlipDialog({ invoice, client, settings }: DeliverySlipDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

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
      <DialogContent className="w-[95vw] sm:max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-6 border-b bg-muted/30">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Bordereau de Livraison - {`BL-${invoice.invoiceNumber}`}</DialogTitle>
            </DialogHeader>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-gray-100 p-4 md:p-8 flex justify-center">
            <div className="shadow-xl bg-white w-full max-w-[210mm]">
                <DeliverySlipTemplate invoice={invoice} client={client} settings={settings} />
            </div>
        </div>
        <DialogFooter className="p-6 bg-white border-t flex-row gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="flex-1 font-bold">Fermer</Button>
             <Button onClick={handlePrint} className="flex-1 font-black">
                <Printer className="mr-2 h-4 w-4" />
                Imprimer / PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
