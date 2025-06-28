'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeliverySlipDialog } from './DeliverySlipDialog';

type InvoiceViewerProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

// Placeholder for other templates
const ModernTemplate = ({ invoice }: { invoice: Invoice }) => <div id="invoice-content" className="p-8 border rounded-lg">Modèle "Moderne" pour la facture {invoice.invoiceNumber}. À implémenter.</div>;
const ClassicTemplate = ({ invoice }: { invoice: Invoice }) => <div id="invoice-content" className="p-8 border rounded-lg">Modèle "Classique" pour la facture {invoice.invoiceNumber}. À implémenter.</div>;
const SimpleTemplate = ({ invoice }: { invoice: Invoice }) => <div id="invoice-content" className="p-8 border rounded-lg">Modèle "Simple" pour la facture {invoice.invoiceNumber}. À implémenter.</div>;


export function InvoiceViewer({ invoice, client, settings }: InvoiceViewerProps) {

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Imprimer la facture</title>');
        
        // It's important to include stylesheets for printing
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              console.warn("Could not read stylesheet", e);
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');

        printWindow.document.write(`<style>${styles}</style></head><body>`);
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        // Use timeout to ensure content is loaded before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const renderTemplate = () => {
    switch (settings.invoiceTemplate) {
      case 'detailed':
        return <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
      case 'modern':
        return <ModernTemplate invoice={invoice} />;
      case 'classic':
        return <ClassicTemplate invoice={invoice} />;
      case 'simple':
        return <SimpleTemplate invoice={invoice} />;
      default:
        return <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
    }
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end gap-2">
            <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer la facture
            </Button>
        </div>
        <Card className="shadow-lg">
            <CardContent className="p-0 bg-gray-50">
                {renderTemplate()}
            </CardContent>
        </Card>
    </div>
  );
}
