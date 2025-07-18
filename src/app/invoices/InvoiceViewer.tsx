
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
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let startY = 15;

    // Header
    if (settings.logoUrl) {
        try {
            const response = await fetch(settings.logoUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                doc.addImage(base64data, 'PNG', 14, startY, 30, 30);
                generatePdfContent(doc); // Continue generation inside callback
            };
        } catch (e) {
            console.error("Error loading logo, proceeding without it.", e);
            generatePdfContent(doc); // Proceed without logo on error
        }
    } else {
        generatePdfContent(doc); // Proceed if no logo
    }

    const generatePdfContent = (docInstance: jsPDF) => {
        // --- Company Info ---
        docInstance.setFontSize(16);
        docInstance.setFont('helvetica', 'bold');
        docInstance.text(settings.companyName, pageWidth - 14, startY + 5, { align: 'right' });
        docInstance.setFontSize(10);
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(settings.companyAddress, pageWidth - 14, startY + 12, { align: 'right' });
        docInstance.text(`Tél: ${settings.companyPhone}`, pageWidth - 14, startY + 17, { align: 'right' });
        docInstance.text(`IFU: ${settings.companyIfu} / RCCM: ${settings.companyRccm}`, pageWidth - 14, startY + 22, { align: 'right' });

        startY += 40;

        // --- Invoice Title & Client Info ---
        docInstance.setFontSize(18);
        docInstance.setFont('helvetica', 'bold');
        docInstance.text(`FACTURE: ${invoice.invoiceNumber}`, 14, startY);
        docInstance.setFontSize(10);
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(`Date: ${format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}`, 14, startY + 7);
        docInstance.text(`Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`, 14, startY + 12);
        
        docInstance.setFont('helvetica', 'bold');
        docInstance.text('Client:', pageWidth - 14, startY, { align: 'right' });
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(client.name, pageWidth - 14, startY + 7, { align: 'right' });
        docInstance.text(client.address || '', pageWidth - 14, startY + 12, { align: 'right' });
        docInstance.text(client.phone || '', pageWidth - 14, startY + 17, { align: 'right' });

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

        autoTable(docInstance, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            headStyles: { fillColor: [30, 30, 30] },
            didDrawPage: (data) => {
                // We'll use the finalY for subsequent elements
            }
        });

        let finalY = (docInstance as any).lastAutoTable.finalY;

        // --- Totals ---
        const totals = [
            ['Sous-total', formatCurrency(invoice.subTotal, settings.currency)],
            [`Remise (${invoice.discount}%)`, `-${formatCurrency(invoice.discountAmount, settings.currency)}`],
            [`TVA (${invoice.vat}%)`, `+${formatCurrency(invoice.vatAmount, settings.currency)}`],
            [{ content: 'Total TTC', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: formatCurrency(invoice.totalAmount, settings.currency), styles: { fontStyle: 'bold', fontSize: 12 } }]
        ];
        
        autoTable(docInstance, {
            body: totals,
            startY: finalY + 5,
            theme: 'plain',
            tableWidth: 80,
            margin: { left: pageWidth - 80 - 14 }, // Align to the right
            styles: { cellPadding: 1 },
            columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' } }
        });
        
        finalY = (docInstance as any).lastAutoTable.finalY;

        // --- Footer ---
        docInstance.setFontSize(9);
        docInstance.text(`Arrêtée la présente facture à la somme de : ${formatCurrency(invoice.totalAmount, settings.currency)}`, 14, finalY + 15);

        // Save the PDF
        docInstance.save(`Facture_${invoice.invoiceNumber}.pdf`);
    };
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
