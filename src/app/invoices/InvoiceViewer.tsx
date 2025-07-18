
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { formatCurrency } from '@/lib/utils';
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

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let startY = 15;

    const addCompanyInfo = () => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.companyName, pageWidth - 14, startY + 5, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(settings.companyAddress, pageWidth - 14, startY + 12, { align: 'right' });
        doc.text(`Tél: ${settings.companyPhone}`, pageWidth - 14, startY + 17, { align: 'right' });
        doc.text(`IFU: ${settings.companyIfu} / RCCM: ${settings.companyRccm}`, pageWidth - 14, startY + 22, { align: 'right' });
    }

    const generatePdfContent = () => {
        addCompanyInfo();

        startY += 40;

        // --- Invoice Title & Client Info ---
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`FACTURE: ${invoice.invoiceNumber}`, 14, startY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}`, 14, startY + 7);
        doc.text(`Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`, 14, startY + 12);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Client:', pageWidth - 14, startY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text(client.name, pageWidth - 14, startY + 7, { align: 'right' });
        if(client.address) doc.text(client.address, pageWidth - 14, startY + 12, { align: 'right' });
        if(client.phone) doc.text(client.phone, pageWidth - 14, startY + 17, { align: 'right' });

        startY += 25;

        // --- Items Table ---
        const tableColumn = ["Référence", "Désignation", "Qté", "Prix U.", "Total"];
        const tableRows = invoice.items.map(item => [
            item.reference,
            item.productName,
            item.quantity,
            formatCurrency(item.unitPrice, settings.currency),
            formatCurrency(item.total, settings.currency)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            headStyles: { fillColor: [30, 30, 30] },
        });

        let finalY = (doc as any).lastAutoTable.finalY;

        // --- Totals ---
        const totals = [
            ['Sous-total', formatCurrency(invoice.subTotal, settings.currency)],
            [`Remise (${invoice.discount}%)`, `-${formatCurrency(invoice.discountAmount, settings.currency)}`],
            [`TVA (${invoice.vat}%)`, `+${formatCurrency(invoice.vatAmount, settings.currency)}`],
            [{ content: 'Total TTC', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: formatCurrency(invoice.totalAmount, settings.currency), styles: { fontStyle: 'bold', fontSize: 12 } }]
        ];
        
        autoTable(doc, {
            body: totals,
            startY: finalY + 5,
            theme: 'plain',
            tableWidth: 80,
            margin: { left: pageWidth - 80 - 14 }, // Align to the right
            styles: { cellPadding: 1 },
            columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' } }
        });
        
        finalY = (doc as any).lastAutoTable.finalY;

        // --- Footer ---
        doc.setFontSize(9);
        doc.text(`Arrêtée la présente facture à la somme de : ${formatCurrency(invoice.totalAmount, settings.currency)}`, 14, finalY + 15);

        // Save the PDF
        doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
    };

    if (settings.logoUrl) {
        try {
            const response = await fetch(settings.logoUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                doc.addImage(base64data, 'PNG', 14, startY, 30, 30);
                generatePdfContent();
            };
        } catch (e) {
            console.error("Error loading logo, proceeding without it.", e);
            generatePdfContent();
        }
    } else {
        generatePdfContent();
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
