
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
const ModernTemplate = ({ invoice }: { invoice: Invoice }) => <div id="invoice-content" className="p-8 border rounded-lg">Modèle "Moderne" pour la facture {invoice.invoiceNumber}. À implémenter.</div>;
const ClassicTemplate = ({ invoice }: { invoice: Invoice }) => <div id="invoice-content" className="p-8 border rounded-lg">Modèle "Classique" pour la facture {invoice.invoiceNumber}. À implémenter.</div>;
const SimpleTemplate = ({ invoice }: { invoice: Invoice }) => <div id="invoice-content" className="p-8 border rounded-lg">Modèle "Simple" pour la facture {invoice.invoiceNumber}. À implémenter.</div>;


export function InvoiceViewer({ invoice, client, settings }: InvoiceViewerProps) {

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Facture</title>');
        
        // Transfer all stylesheets
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              console.warn("Could not read stylesheet, linking instead", e);
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');

        // Add print-specific styles for margins and removing browser headers/footers
        const printStyles = `
          @page {
            size: A4;
            margin: 2.5cm !important;
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
    if(content){
        // Reduced scale from 2 to 1 and changed image format to jpeg for better compression.
        const canvas = await html2canvas(content, { scale: 1 });
        const imgData = canvas.toDataURL('image/jpeg', 0.90); // 90% quality
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let width = pdfWidth;
        let height = width / ratio;
        
        // Handle multi-page content
        const pageHeightInPixels = height * (pdfHeight/width) * ratio;
        if (canvasHeight > pageHeightInPixels) {
          let yPosition = 0;
          let remainingHeight = canvasHeight;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvasWidth;
          pageCanvas.height = pageHeightInPixels;
          const pageCtx = pageCanvas.getContext('2d');

          while (remainingHeight > 0) {
            pageCtx?.drawImage(canvas, 0, yPosition, canvasWidth, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.90);
            pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            yPosition += pageCanvas.height;
            remainingHeight -= pageCanvas.height;

            if (remainingHeight > 0) {
              pdf.addPage();
            }
          }
        } else {
           pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
        }

        pdf.save(`Facture_${invoice.invoiceNumber}.pdf`);
    }
  }

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
