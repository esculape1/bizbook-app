
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Ticket, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ShippingLabelsDialogProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
  asTextButton?: boolean;
};

export function ShippingLabelsDialog({ invoice, client, settings, asTextButton = false }: ShippingLabelsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const labelsContainerRef = useRef<HTMLDivElement>(null);

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
  
  const handleDownloadPdf = async () => {
    const container = labelsContainerRef.current;
    if (!container) return;

    const canvas = await html2canvas(container, {
      scale: 3, // Increase scale for better quality
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    
    let imgWidth = pdfWidth - 20; // with margin
    let imgHeight = imgWidth / ratio;

    if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * ratio;
    }

    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`Etiquettes_${invoice.invoiceNumber}.pdf`);
  };

  const LabelContent = ({ index }: { index: number }) => (
    <div className="label-item-printable flex h-full flex-col justify-between border border-solid border-black p-2 font-sans">
        <div className="space-y-1.5">
            {/* Company Info */}
            <div className="flex items-center gap-2 rounded border border-gray-300 p-1">
                {settings.logoUrl && (
                    <Image 
                        src={settings.logoUrl} 
                        alt="Logo" 
                        width={20} 
                        height={20} 
                        className="shrink-0 object-contain" 
                        data-ai-hint="logo"
                    />
                )}
                <p className="truncate font-semibold text-xs">{settings.companyName}</p>
            </div>
            {/* Client Info */}
            <div className="rounded border border-gray-300 p-1">
                <p className="truncate font-bold text-sm">{client.name}</p>
                {client.phone && <p className="truncate text-xs text-gray-600">{client.phone}</p>}
            </div>
            {/* Quantity and Date */}
            <div className="flex justify-between border-t border-dashed pt-1 text-xs">
                <span><strong>Qté:</strong> ....................</span>
                <span><strong>Date:</strong> {format(new Date(invoice.date), "dd/MM/yy")}</span>
            </div>
        </div>

        {/* Barcode */}
        <div className="w-full pt-1">
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
            <div id={`shipping-labels-content-printable-${invoice.id}`} ref={labelsContainerRef} className="bg-white shadow-lg mx-auto labels-container-printable grid grid-cols-2 gap-px" style={{width: '15.4cm', minHeight: '23.1cm'}}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="label-item-preview" style={{width: '7.6cm', height: '7.6cm'}}>
                        <LabelContent index={i} />
                    </div>
                ))}
            </div>
        </div>
        <DialogFooter className="p-6 bg-white border-t">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
            <Button onClick={handleDownloadPdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer les 6 étiquettes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
