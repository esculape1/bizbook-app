
'use client';

import { useState } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { DeliverySlipTemplate } from '@/components/delivery-slip/DeliverySlipTemplate';
import { Button } from '@/components/ui/button';
import { Truck, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type DeliverySlipDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function DeliverySlipDialog({ invoice, client, settings }: DeliverySlipDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrint = () => {
    const printContent = document.getElementById('delivery-slip-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Bordereau de Livraison</title>');
        
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');

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

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 25; // 2.5cm

    const deliverySlipNumber = `BL-${invoice.invoiceNumber}`;

    const addPageHeader = () => {
        doc.setFillColor(37, 99, 235); // Blue color from primary
        doc.rect(0, 0, 10, pageHeight, 'F');
        
        if (settings.logoUrl) {
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = settings.logoUrl;
                doc.addImage(img, 'PNG', margin, margin, 30, 30);
            } catch (e) {
                console.error("Could not add logo to PDF:", e);
            }
        }
        
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.text("BORDEREAU DE LIVRAISON", pageWidth - margin, margin + 10, { align: 'right' });
        
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(deliverySlipNumber, pageWidth - margin, margin + 18, { align: 'right' });
        doc.text(`Date: ${format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}`, pageWidth - margin, margin + 23, { align: 'right' });
        
        const startYAddresses = margin + 40;
        doc.setFontSize(11);
        doc.setFont('times', 'bold');
        doc.text("DE", margin, startYAddresses);
        doc.text("À", pageWidth - margin, startYAddresses, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('times', 'normal');
        const companyInfo = [
            settings.companyName,
            settings.legalName,
            settings.companyAddress,
            `Tél: ${settings.companyPhone}`,
            `IFU: ${settings.companyIfu} / RCCM: ${settings.companyRccm}`
        ];
        doc.text(companyInfo, margin, startYAddresses + 6);

        const clientInfo = [
            client.name,
            client.address ?? '',
            `Contact: ${client.phone ?? ''}`,
            client.email ? `Email: ${client.email}` : '',
            client.ifu ? `N° IFU: ${client.ifu}` : '',
            client.rccm ? `N° RCCM: ${client.rccm}` : '',
            client.taxRegime ? `Régime Fiscal: ${client.taxRegime}` : ''
        ].filter(Boolean);
        doc.text(clientInfo, pageWidth - margin, startYAddresses + 6, { align: 'right' });
    };

    const addPageFooter = (pageNumber: number, totalPages: number) => {
        const footerY = pageHeight - margin;
        doc.setFontSize(8);
        doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
    };

    const head = [['Désignation', 'Qté Commandée', 'Qté Livrée', 'Observations']];
    const body = invoice.items.map(item => [
      item.productName,
      item.quantity.toString(),
      '',
      ''
    ]);

    let finalY = 0;
    autoTable(doc, {
      head: head,
      body: body,
      startY: margin + 80,
      theme: 'grid',
      didDrawPage: (data) => {
          addPageHeader();
          // Reset finalY for each new page
          finalY = 0; 
      },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: 'bold' },
      styles: { font: 'times', fontSize: 10, cellPadding: 2, valign: 'middle' },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
      margin: { top: margin, right: margin, bottom: margin + 50, left: margin }
    });
    
    // --- Fixed Signature Block ---
    const signatureY = pageHeight - margin - 45; // Fixed position for the signature block

    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Date de facturation : ${format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}`, margin, signatureY);

    doc.setLineCap('butt');
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(margin + 5, signatureY + 5, 40, 20); // Cachet box
    doc.text('Cachet', margin + 25, signatureY + 15, { align: 'center' });
    doc.setLineDashPattern([], 0);

    doc.setFont('times', 'bold');
    doc.text('Date de reception et visa du client', pageWidth - margin, signatureY, { align: 'right' });
    doc.line(pageWidth - margin - 60, signatureY + 20, pageWidth - margin, signatureY + 20);
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.text('(Précédé de la mention "Reçu pour le compte de")', pageWidth - margin, signatureY + 24, { align: 'right' });


    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addPageFooter(i, pageCount);
    }

    doc.save(`Bordereau_${deliverySlipNumber}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Truck className="mr-2 h-4 w-4" />
          Bordereau de Livraison
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="p-6">
            <DialogHeader>
            <DialogTitle>Bordereau de Livraison - {`BL-${invoice.invoiceNumber}`}</DialogTitle>
            </DialogHeader>
        </div>
        <div className="max-h-[70vh] overflow-y-auto bg-gray-50">
            <DeliverySlipTemplate invoice={invoice} client={client} settings={settings} />
        </div>
        <DialogFooter className="p-6 bg-white border-t">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
             <Button onClick={generatePdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
