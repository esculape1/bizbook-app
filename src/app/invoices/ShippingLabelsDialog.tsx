
'use client';

import { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import type { Invoice, Client, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import Image from 'next/image';

type ShippingLabelsDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
  asTextButton?: boolean;
};

export function ShippingLabelsDialog({ invoice, client, settings, asTextButton = false }: ShippingLabelsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        for (let i = 1; i <= 6; i++) {
          try {
            JsBarcode(`#barcode-${invoice.id}-${i}`, invoice.invoiceNumber, {
              format: "CODE128",
              lineColor: "#000",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 12
            });
          } catch (e) {
            console.error(`Erreur lors de la génération du code-barres #${i}:`, e);
          }
        }
      }, 100);
    }
  }, [isOpen, invoice.invoiceNumber, invoice.id]);

  const handlePrint = () => {
    const printContent = document.getElementById(`shipping-labels-content-printable-${invoice.id}`);
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
            .labels-container-printable {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              grid-template-rows: repeat(3, 1fr) !important;
              gap: 5mm !important;
              width: 190mm;
              height: 277mm;
              page-break-inside: avoid;
            }
            .label-item-printable {
              border: 1px solid #000 !important;
              padding: 4px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
              font-size: 8pt;
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

  const LabelContent = ({ barcodeId }: { barcodeId: string }) => (
    <div className="label-item-printable flex flex-col justify-between p-1 font-sans text-xs border border-solid border-black">
      {/* Top section */}
      <div className="flex justify-between items-start gap-2">
        {/* Top-left: Client, Supplier, Logo */}
        <div className="flex flex-col items-start w-1/2">
          <p className="font-bold text-sm truncate">{client.name}</p>
          <p className="text-xs text-gray-700">{settings.companyName}</p>
          {settings.logoUrl && (
            <Image src={settings.logoUrl} alt="Logo" width={40} height={40} className="object-contain mt-1" data-ai-hint="logo company" />
          )}
        </div>
        {/* Top-right: Items List */}
        <div className="w-1/2 text-right">
            <ul className="list-none p-0 m-0 text-gray-800" style={{ fontSize: '7pt', lineHeight: '1.2' }}>
                {invoice.items.slice(0, 4).map(item => ( // Limit to 4 items to avoid overflow
                    <li key={item.productId} className="truncate"> - {item.productName}</li>
                ))}
                {invoice.items.length > 4 && <li className="truncate">...et autres</li>}
            </ul>
        </div>
      </div>

      {/* Bottom section: Bars and Barcode */}
      <div className="mt-auto">
        {/* Middle section with horizontal rules */}
        <div className="my-1 text-xs">
          <hr className="border-t border-black" />
          <div className="flex justify-between items-center py-0.5">
            <span>Quantité: ________</span>
            <span>Date: {format(new Date(invoice.date), 'dd/MM/yy')}</span>
          </div>
          <hr className="border-t border-black" />
        </div>

        {/* Barcode */}
        <div className="text-center flex justify-center">
          <svg id={barcodeId}></svg>
        </div>
      </div>
    </div>
  );

  const TriggerButton = asTextButton ? (
    <Button variant="outline">
      <Ticket className="mr-2 h-4 w-4" />
      Étiquettes
    </Button>
  ) : (
    <Button variant="ghost" size="icon" title="Imprimer les étiquettes">
      <Ticket className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Aperçu des Étiquettes d'Expédition</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-8">
            <div id={`shipping-labels-content-printable-${invoice.id}`} className="bg-white shadow-lg mx-auto labels-container-printable grid grid-cols-2 grid-rows-3 gap-2" style={{width: '210mm', minHeight: '297mm'}}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <LabelContent key={i} barcodeId={`barcode-${invoice.id}-${i + 1}`} />
                ))}
            </div>
        </div>
        <DialogFooter className="p-6 bg-white border-t">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer les 6 étiquettes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

