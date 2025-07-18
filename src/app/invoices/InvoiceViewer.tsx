
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 25;

    const addPageHeader = () => {
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 10, pageHeight, 'F');
      
      if (settings.logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = settings.logoUrl;
          doc.addImage(img, 'PNG', margin, 15, 30, 30);
        } catch(e) {
          console.error("Could not add logo to PDF:", e);
        }
      }

      doc.setFontSize(22);
      doc.setFont('times', 'bold');
      doc.text("FACTURE", pageWidth - margin, 25, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.text(invoice.invoiceNumber, pageWidth - margin, 32, { align: 'right' });
      doc.text(`Date: ${format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}`, pageWidth - margin, 37, { align: 'right' });
      doc.text(`Échéance: ${format(new Date(invoice.dueDate), 'd MMM yyyy', { locale: fr })}`, pageWidth - margin, 42, { align: 'right' });
    };

    const addPageFooter = (pageNumber: number, totalPages: number) => {
        const footerY = pageHeight - margin;
        doc.setFontSize(8);
        doc.setLineWidth(0.2);
        
        const footerTextLine1 = 'Merci de votre confiance.';
        const footerTextLine2 = `${settings.companyName} - ${settings.legalName} - Tél: ${settings.companyPhone}`;
        const pageNumText = `Page ${pageNumber} sur ${totalPages}`;

        doc.text(footerTextLine1, pageWidth / 2, footerY + 7, { align: 'center' });
        doc.text(footerTextLine2, pageWidth / 2, footerY + 11, { align: 'center' });
        doc.text(pageNumText, pageWidth / 2, footerY + 15, { align: 'center' });
        doc.line(margin, footerY, pageWidth - margin, footerY); // Draw line above the footer text
    };

    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text("DE", margin, 60);
    doc.text("À", pageWidth / 2, 60);
    
    doc.setLineWidth(0.2);
    doc.line(margin, 61, margin + 80, 61);
    doc.line(pageWidth / 2, 61, pageWidth / 2 + 80, 61);

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const companyInfo = [
      settings.companyName,
      settings.legalName,
      settings.companyAddress,
      `Tél: ${settings.companyPhone}`,
      `IFU: ${settings.companyIfu} / RCCM: ${settings.companyRccm}`
    ];
    doc.text(companyInfo, margin, 66);

    const clientInfo = [
      client.name,
      client.address ?? '',
      `Contact: ${client.phone ?? ''}`,
      client.email ? `Email: ${client.email}` : '',
      client.ifu ? `N° IFU: ${client.ifu}`: '',
      client.rccm ? `N° RCCM: ${client.rccm}`: '',
      client.taxRegime ? `Régime Fiscal: ${client.taxRegime}`: ''
    ].filter(Boolean);
    doc.text(clientInfo, pageWidth / 2, 66);

    const head = [['Référence', 'Désignation', 'Prix U.', 'Qté', 'Total']];
    const body = invoice.items.map(item => [
      item.reference,
      item.productName,
      formatCurrency(item.unitPrice, settings.currency),
      item.quantity.toString(),
      formatCurrency(item.total, settings.currency),
    ]);
    
    autoTable(doc, {
      head: head,
      body: body,
      startY: 100,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: 'bold' },
      styles: { font: 'times', fontSize: 9 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'right' } },
      didDrawPage: (data) => {
        addPageHeader();
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    if (finalY > pageHeight - margin - 50) {
        doc.addPage();
        finalY = margin;
    }

    const totalInWords = numberToWordsFr(invoice.totalAmount, settings.currency);
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text('Arrêtée la présente facture à la somme de :', margin, finalY + 10);
    doc.setFont('times', 'italic');
    doc.text(totalInWords, margin, finalY + 15, { maxWidth: (pageWidth / 2) - (margin * 2) });

    const totalsData = [
      ['Montant total:', formatCurrency(invoice.subTotal, settings.currency)],
      [`Remise (${invoice.discount}%):`, `-${formatCurrency(invoice.discountAmount, settings.currency)}`],
      [`TVA (${invoice.vat}%):`, `+${formatCurrency(invoice.vatAmount, settings.currency)}`],
    ];
    
    autoTable(doc, {
      body: totalsData,
      startY: finalY + 10,
      theme: 'plain',
      tableWidth: 80,
      margin: { left: pageWidth - margin - 80 },
      styles: { font: 'times', fontSize: 9 },
    });

    let grandTotalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 80, grandTotalY + 2, pageWidth - margin, grandTotalY + 2);
    doc.text('Montant Total TTC:', pageWidth - margin - 80, grandTotalY + 7);
    doc.text(formatCurrency(invoice.totalAmount, settings.currency), pageWidth - margin, grandTotalY + 7, { align: 'right' });

    let signatureY = grandTotalY + 20;

    if (signatureY > pageHeight - margin - 30) {
      doc.addPage();
      signatureY = margin;
    }
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('Signature et Cachet', pageWidth - margin - 70, signatureY);
    doc.line(pageWidth - margin - 70, signatureY + 15, pageWidth - margin, signatureY + 15);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(settings.managerName, pageWidth - margin - 70, signatureY + 20);
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addPageFooter(i, pageCount);
    }

    doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
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
