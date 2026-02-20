'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { ShippingLabelsDialog } from './ShippingLabelsDialog';
import { ResponsiveA4Wrapper } from '@/components/ResponsiveA4Wrapper';

type InvoiceViewerProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function InvoiceViewer({ invoice, client, settings }: InvoiceViewerProps) {
  const handlePrint = () => {
    const content = document.getElementById('invoice-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      const suggestedFilename = `FACTURE-${invoice.invoiceNumber}`;
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
    <div className="flex flex-col items-center gap-6 max-w-5xl mx-auto w-full pb-20">
        {/* Actions au sommet */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-2">
            <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            <Button 
                onClick={handlePrint} 
                size="lg" 
                className="w-full h-14 text-lg font-black uppercase tracking-tight shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
                <Printer className="mr-3 h-6 w-6" />
                Imprimer la facture
            </Button>
        </div>

        <div className="flex justify-center w-full px-4">
            <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton />
        </div>

        {/* Zone de prévisualisation avec ResponsiveA4Wrapper */}
        <div className="w-full px-2">
            <div className="bg-muted/30 rounded-[2rem] p-2 md:p-10 border-2 border-dashed border-primary/10 shadow-inner overflow-hidden">
                <ResponsiveA4Wrapper>
                    <div className="shadow-2xl mx-auto overflow-hidden rounded-sm ring-1 ring-black/5 bg-white">
                        <DetailedTemplate invoice={invoice} client={client} settings={settings} />
                    </div>
                </ResponsiveA4Wrapper>
            </div>
        </div>
    </div>
  );
}
