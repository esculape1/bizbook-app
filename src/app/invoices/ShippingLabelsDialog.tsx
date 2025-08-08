
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';

type ShippingLabelsDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
  asTextButton?: boolean;
};

export function ShippingLabelsDialog({ invoice, client, settings, asTextButton = false }: ShippingLabelsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Create a ref for each barcode canvas
  const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  barcodeRefs.current = Array.from({ length: 6 }).map(
    (_, i) => barcodeRefs.current[i] ?? null
  );

  useEffect(() => {
    if (isOpen) {
      barcodeRefs.current.forEach((canvas, index) => {
        if (canvas) {
          try {
            JsBarcode(canvas, invoice.invoiceNumber, {
              format: 'CODE128',
              displayValue: true,
              fontSize: 14,
              height: 40,
              width: 1.5,
              margin: 0,
            });
          } catch (e) {
            console.error(`Failed to generate barcode for label ${index}:`, e);
          }
        }
      });
    }
  }, [isOpen, invoice.invoiceNumber]);


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
              width: 190mm; /* A4 width - 2*margin */
              height: 277mm; /* A4 height - 2*margin */
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
              font-size: 9pt;
              line-height: 1.3;
              width: 90mm !important; /* Half of the container width minus gap */
              height: 90mm !important; /* Third of the container height minus gap */
            }
             .supplier-box, .client-box {
                border: 1px solid #ddd;
                padding: 4px;
                border-radius: 4px;
             }
             canvas {
                width: 100%;
                height: auto;
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

  const LabelContent = ({ index }: { index: number }) => (
    <div className="label-item-printable flex flex-col justify-between p-1.5 font-sans border border-solid border-black" style={{width: '90mm', height: '90mm'}}>
        {/* Top Section: Info Boxes */}
        <div>
            {/* Supplier Box */}
            <div className="supplier-box border border-gray-200 p-1 rounded-sm mb-2">
                <div className="flex items-center gap-2">
                    {settings.logoUrl && (
                        <Image 
                            src={settings.logoUrl} 
                            alt="Logo" 
                            width={24} 
                            height={24} 
                            className="object-contain" 
                            data-ai-hint="logo"
                        />
                    )}
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Fournisseur:</p>
                        <p className="font-bold text-sm truncate">{settings.companyName}</p>
                    </div>
                </div>
            </div>
            
            {/* Client Box */}
            <div className="client-box border border-gray-200 p-1 rounded-sm">
                 <p className="text-xs text-muted-foreground">Client:</p>
                <p className="font-bold text-sm truncate">{client.name}</p>
                {client.phone && <p className="text-xs text-muted-foreground truncate">Tél: {client.phone}</p>}
            </div>
        </div>

      {/* Bottom Section: Barcode */}
      <div className="w-full pt-2">
        <canvas ref={el => barcodeRefs.current[index] = el}></canvas>
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
            <div id={`shipping-labels-content-printable-${invoice.id}`} className="bg-white shadow-lg mx-auto labels-container-printable grid grid-cols-2 grid-rows-3 gap-2 p-2" style={{width: '190mm', minHeight: '277mm'}}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <LabelContent key={i} index={i} />
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
