
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Truck } from 'lucide-react';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { ShippingLabelsDialog } from './ShippingLabelsDialog';

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
      printWindow?.document.write('<html><head><title>Impression Facture</title>');
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if (styleSheet.href) {
            printWindow?.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
          } else if (styleSheet.cssRules) {
            printWindow?.document.write(`<style>${Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')}</style>`);
          }
        } catch (e) {}
      });
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(content.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      setTimeout(() => printWindow?.print(), 500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-wrap justify-between items-center bg-card p-4 rounded-xl border shadow-sm sticky top-0 z-10 gap-4">
            <div className="flex gap-2">
                <Button onClick={handlePrint} className="font-black">
                    <Printer className="mr-2 h-4 w-4" /> Imprimer Facture
                </Button>
                <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            </div>
            <div className="flex gap-2">
                <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton />
            </div>
        </div>
        <div className="bg-white p-4 md:p-8 rounded-lg border shadow-lg overflow-auto">
            <div className="max-w-[210mm] mx-auto">
                <DetailedTemplate invoice={invoice} client={client} settings={settings} />
            </div>
        </div>
    </div>
  );
}
