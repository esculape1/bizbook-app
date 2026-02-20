
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
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
      if (!printWindow) return;
      
      printWindow.document.write('<html><head><title>Facture ' + invoice.invoiceNumber + '</title>');
      
      // Injection robuste des styles pour l'impression
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if (styleSheet.href) {
            printWindow.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
          } else if (styleSheet.cssRules) {
            printWindow.document.write(`<style>${Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')}</style>`);
          }
        } catch (e) {
            console.warn('Could not read stylesheet', e);
        }
      });
      
      printWindow.document.write('</head><body class="p-0 bg-white">');
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-wrap justify-between items-center bg-card p-4 rounded-2xl border shadow-sm sticky top-0 z-10 gap-4">
            <div className="flex gap-2">
                <Button onClick={handlePrint} className="font-black h-10 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Printer className="mr-2 h-4 w-4" /> Imprimer la Facture
                </Button>
                <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            </div>
            <div className="flex gap-2">
                <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton />
            </div>
        </div>
        
        {/* Affichage standard sans transformation distordue */}
        <div className="bg-muted/30 p-2 md:p-10 rounded-3xl border shadow-inner overflow-auto">
            <div className="max-w-[210mm] mx-auto shadow-2xl bg-white p-0 rounded-sm">
                <DetailedTemplate invoice={invoice} client={client} settings={settings} />
            </div>
        </div>
    </div>
  );
}
