
'use client';

import { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import type { Invoice, Client, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Download, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';

type ShippingLabelsDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function ShippingLabelsDialog({ invoice, client, settings }: ShippingLabelsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        JsBarcode("#barcode", invoice.invoiceNumber, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
        });
      } catch (e) {
        console.error("Erreur lors de la génération du code-barres:", e);
      }
    }
  }, [isOpen, invoice.invoiceNumber]);

  const handlePrint = () => {
    const printContent = document.getElementById('shipping-labels-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const title = `Etiquettes_${invoice.invoiceNumber.replace(/[\/\s]/g, '-')}`;
        printWindow.document.write(`<html><head><title>${title}</title>`);
        
        const printStyles = `
          @page {
            size: A4;
            margin: 1cm;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              margin: 0;
              padding: 0;
            }
            .no-print {
                display: none;
            }
            .labels-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
            }
            .label-item {
                border: 1px dashed #ccc;
                padding: 10px;
                height: 30%; /* Approximately 1/3 of the page height */
                box-sizing: border-box;
            }
          }
        `;

        printWindow.document.write(`<style>${printStyles}</style></head><body>`);
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

  const LabelContent = () => (
    <div className="label-item flex flex-col justify-between p-4 font-sans text-sm">
      <div className="flex justify-between">
        <div>
          <p className="font-bold text-lg">{client.name}</p>
          <p className="text-xs text-gray-600">Client</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{settings.companyName}</p>
          <p className="text-xs text-gray-600">Fournisseur</p>
        </div>
      </div>
      <div className="text-center my-4">
        <svg id="barcode"></svg>
      </div>
      <div className="text-center text-xs text-gray-500">
        Date de commande: {format(new Date(invoice.date), 'dd/MM/yyyy')}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Imprimer les étiquettes">
          <Ticket className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Aperçu des Étiquettes d'Expédition</DialogTitle>
        </DialogHeader>
        <div className="bg-gray-100 p-8">
            <div id="shipping-labels-content" className="bg-white shadow-lg mx-auto" style={{width: '210mm', height: '297mm'}}>
                <div className="labels-container h-full flex flex-col justify-around">
                    <LabelContent />
                    <LabelContent />
                    <LabelContent />
                </div>
            </div>
        </div>
        <DialogFooter className="p-6 bg-white border-t no-print">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
