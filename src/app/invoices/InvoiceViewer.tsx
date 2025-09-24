
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { ShippingLabelsDialog } from './ShippingLabelsDialog';

type InvoiceViewerProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

// Placeholder for other templates
const ModernTemplate = ({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) => <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
const ClassicTemplate = ({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) => <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
const SimpleTemplate = ({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) => <DetailedTemplate invoice={invoice} client={client} settings={settings} />;


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
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(content.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      setTimeout(() => {
        printWindow?.print();
      }, 500);
    }
  };

  const renderTemplate = () => {
    switch (settings.invoiceTemplate) {
      case 'detailed':
        return <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
      case 'modern':
        return <ModernTemplate invoice={invoice} client={client} settings={settings} />;
      case 'classic':
        return <ClassicTemplate invoice={invoice} client={client} settings={settings} />;
      case 'simple':
        return <SimpleTemplate invoice={invoice} client={client} settings={settings} />;
      default:
        return <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
    }
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap justify-center items-center gap-2">
            <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton />
            <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer la facture
            </Button>
        </div>
        <Card className="shadow-lg overflow-hidden">
            <CardContent className="p-0 md:p-6 bg-gray-100 flex justify-center">
                <div className="w-full max-w-full overflow-x-auto">
                    <div className="mx-auto" style={{ width: '210mm' }}>
                        {renderTemplate()}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
