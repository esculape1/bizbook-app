
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeliverySlipDialog } from './DeliverySlipDialog';

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
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Facture</title>');
        
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              console.warn("Could not read stylesheet, linking instead", e);
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');

        const printStyles = `
          @page {
            size: A4;
            margin: 0 !important;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .printable-area {
               background-color: #ffffff !important;
               color: #000000 !important;
            }
          }
        `;

        printWindow.document.write(`<style>${styles}${printStyles}</style></head><body>`);
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const generatePdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    
    const content = document.getElementById('invoice-content');
    if (content) {
      // Increase scale for better resolution
      const canvas = await html2canvas(content, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Facture_${invoice.invoiceNumber}.pdf`);
    }
  }

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
        <div className="flex justify-end gap-2">
            <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            <Button onClick={generatePdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
            </Button>
            <Button onClick={handlePrint}>
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
