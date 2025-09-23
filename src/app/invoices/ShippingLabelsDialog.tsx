
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Ticket, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
                width: 1.5,
                margin: 0,
              });
            } catch (e) {
              console.error(`Failed to generate barcode for canvas:`, e);
            }
          }
        });
      }, 100);
    }
  }, [isOpen, invoice.invoiceNumber]);

  const handleDownloadPng = async () => {
    const container = labelsContainerRef.current;
    if (!container) return;

    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Etiquettes_${invoice.invoiceNumber}.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const LabelContent = ({ index }: { index: number }) => (
    <div className="label-item-printable flex h-full flex-col justify-between border border-solid border-black p-2 font-sans">
        <div className="space-y-1.5 overflow-hidden">
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
                <p className="font-semibold text-xs break-words">{settings.companyName}</p>
            </div>
            <div className="rounded border border-gray-300 p-1">
                <p className="font-bold text-base break-words">{client.name}</p>
                {client.phone && <p className="text-sm text-gray-600 break-words">{client.phone}</p>}
            </div>
            <div className="flex justify-between border-t border-dashed pt-1 text-sm">
                <span><strong>Qté:</strong> ....................</span>
                <span><strong>Date:</strong> {format(new Date(invoice.date), "dd/MM/yy")}</span>
            </div>
        </div>

        <div className="w-full pt-1">
             <canvas ref={el => {
                if (el) barcodeRefs.current[index] = el;
             }} className="w-full"></canvas>
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
      <Ticket className="h-5 w-5" />
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
            <Button onClick={handleDownloadPng}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PNG
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
