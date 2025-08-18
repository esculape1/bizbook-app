
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
      printWindow?.document.write('<html><head><title>Imprimer Bordereau</title>');
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
        <Button variant="outline">
          <Truck className="mr-2 h-4 w-4" />
          Bordereau de Livraison
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="p-6">
            <DialogHeader>
            <DialogTitle>Bordereau de Livraison - {`BL-${invoice.invoiceNumber}`}</DialogTitle>
            </DialogHeader>
        </div>
        <div className="max-h-[70vh] overflow-y-auto bg-gray-50">
            <DeliverySlipTemplate invoice={invoice} client={client} settings={settings} />
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
