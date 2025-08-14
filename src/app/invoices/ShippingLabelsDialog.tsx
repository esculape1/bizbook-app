
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ShippingLabelsDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
  asTextButton?: boolean;
};

export function ShippingLabelsDialog({ invoice, client, settings, asTextButton = false }: ShippingLabelsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        barcodeRefs.current.forEach((canvas) => {
          if (canvas) {
            try {
              JsBarcode(canvas, invoice.invoiceNumber, {
                format: 'CODE128',
                displayValue: true,
                fontSize: 14,
                height: 40,
                width: 1.2,
                margin: 0,
              });
            } catch (e) {
              console.error(`Failed to generate barcode for canvas:`, e);
            }
          }
        });
      }, 100);
    }
  }, [isOpen, invoice.id, invoice.invoiceNumber]);

  const handlePrint = () => {
    const printContent = document.getElementById(`shipping-labels-content-printable-${invoice.id}`);
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const title = `Etiquettes_${invoice.invoiceNumber.replace(/[\/\s]/g, '-')}`;
        printWindow.document.write(`<html><head><title>${title}</title>`);
        
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              // @ts-ignore
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              // @ts-ignore
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');
          
        const printStyles = `
          @media print {
            @page {
              size: A4;
              margin: 10mm !important;
            }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .labels-container-printable {
              display: grid !important;
              grid-template-columns: repeat(2, 7.6cm) !important;
              grid-template-rows: repeat(3, 7.6cm) !important;
              gap: 1mm !important; /* Ajoute un petit espace entre les étiquettes */
              width: fit-content !important;
              height: fit-content !important;
              page-break-inside: avoid !important;
            }
            .label-item-printable {
              width: 7.6cm !important;
              height: 7.6cm !important;
              border: 1px solid #000 !important;
              padding: 4mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              font-size: 8pt !important;
            }
            canvas {
                max-width: 100% !important;
                height: auto !important;
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

  const LabelContent = ({ index }: { index: number }) => (
    <div className="label-item-printable flex flex-col justify-between p-2 font-sans border border-solid border-black">
        <div>
            <div className="border border-gray-300 rounded p-1 mb-2">
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
                    <p className="font-semibold text-xs truncate">{settings.companyName}</p>
                </div>
            </div>
             <div className="border border-gray-300 rounded p-2">
                <div className="mt-1">
                     <p className="font-bold text-sm truncate">{client.name}</p>
                    {client.phone && <p className="text-xs text-muted-foreground truncate">{client.phone}</p>}
                </div>
            </div>
            <div className="text-xs mt-2 border-t border-dashed pt-1 space-y-1">
                <p><strong>Quantité:</strong> .....................................</p>
                <p><strong>Date:</strong> {format(new Date(invoice.date), "dd/MM/yyyy", { locale: fr })}</p>
            </div>
        </div>

        <div className="w-full pt-2">
             <canvas ref={el => {
                if (el) barcodeRefs.current[index] = el;
             }}></canvas>
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
        <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-8 flex justify-center items-start">
            <div id={`shipping-labels-content-printable-${invoice.id}`} className="bg-white shadow-lg mx-auto labels-container-printable grid grid-cols-2 gap-4" style={{width: '16cm', minHeight: '23cm'}}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="label-item-preview" style={{width: '7.6cm', height: '7.6cm'}}>
                        <LabelContent index={i} />
                    </div>
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
