
'use client';

import { useState } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { DeliverySlipTemplate } from '@/components/delivery-slip/DeliverySlipTemplate';
import { Button } from '@/components/ui/button';
import { Truck, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type DeliverySlipDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function DeliverySlipDialog({ invoice, client, settings }: DeliverySlipDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadPdf = async () => {
    const slipElement = document.getElementById('delivery-slip-content');
    if (!slipElement) return;

    const pages = slipElement.querySelectorAll('.page-container');
    pages.forEach(page => ((page as HTMLElement).style.display = 'block'));

    const canvas = await html2canvas(slipElement, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: slipElement.scrollWidth,
      windowHeight: slipElement.scrollHeight,
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
    
    pdf.save(`Bordereau_de_Livraison_${invoice.invoiceNumber.replace(/[\/\s]/g, '-')}.pdf`);
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
             <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
