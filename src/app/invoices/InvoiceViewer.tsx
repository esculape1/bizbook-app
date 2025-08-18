
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { ShippingLabelsDialog } from './ShippingLabelsDialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleDownloadPdf = async () => {
    const invoiceElement = document.getElementById('invoice-content');
    if (!invoiceElement) return;

    const pages = invoiceElement.querySelectorAll('.page-container');
    pages.forEach(page => ((page as HTMLElement).style.display = 'block'));

    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: invoiceElement.scrollWidth,
      windowHeight: invoiceElement.scrollHeight,
    });

    pages.forEach(page => ((page as HTMLElement).style.display = ''));

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / canvasHeight;
    let imgWidth = pdfWidth;
    let imgHeight = imgWidth / ratio;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    if (imgHeight < pdfHeight) {
       imgHeight = pdfHeight;
       imgWidth = imgHeight * ratio;
    }

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`Facture_${invoice.invoiceNumber.replace(/[\/\s]/g, '-')}.pdf`);
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
        <div className="flex justify-end gap-2">
            <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton />
            <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger la facture (PDF)
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
