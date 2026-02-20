
'use client';

import { useRef, useState, useEffect } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Truck } from 'lucide-react';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { ShippingLabelsDialog } from './ShippingLabelsDialog';
import { cn } from '@/lib/utils';

type InvoiceViewerProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function InvoiceViewer({ invoice, client, settings }: InvoiceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calcule l'échelle pour que la largeur A4 (210mm) tienne dans l'écran
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const targetWidth = 800; // Largeur approximative pour 210mm à 96dpi
        if (containerWidth < targetWidth) {
          setScale(containerWidth / targetWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handlePrint = () => {
    const content = document.getElementById('invoice-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      const suggestedFilename = `FACTURE-${invoice.invoiceNumber}`;
      printWindow?.document.write(`<html><head><title>${suggestedFilename}</title>`);
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if (styleSheet.href) {
            printWindow?.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
          } else if (styleSheet.cssRules) {
            printWindow?.document.write(`<style>${Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')}</style>`);
          }
        } catch (e) {
          console.warn('Could not read stylesheet for printing', e);
        }
      });
      printWindow?.document.write('<body class="p-0 m-0">');
      printWindow?.document.write(content.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      setTimeout(() => {
        printWindow?.print();
      }, 500);
    }
  };

  const renderTemplate = () => {
    // On utilise DetailedTemplate par défaut pour l'instant car c'est le plus complet
    return <DetailedTemplate invoice={invoice} client={client} settings={settings} />;
  }

  return (
    <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto w-full pb-20">
        {/* Actions au sommet comme sur la photo */}
        <div className="w-full flex flex-col gap-4 px-4">
            <DeliverySlipDialog invoice={invoice} client={client} settings={settings} />
            
            <Button 
                onClick={handlePrint} 
                size="lg" 
                className="w-full h-14 text-lg font-black uppercase tracking-tight shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
                <Printer className="mr-3 h-6 w-6" />
                Imprimer la facture
            </Button>

            <div className="flex justify-center pt-2">
                <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton />
            </div>
        </div>

        {/* Zone de prévisualisation "Papier" */}
        <div className="w-full px-2 sm:px-0">
            <div className="bg-muted/40 rounded-[2.5rem] p-4 md:p-12 border shadow-inner flex justify-center overflow-hidden">
                <div ref={containerRef} className="w-full flex justify-center">
                    <div 
                        className="origin-top transition-all duration-500 ease-out"
                        style={{ 
                            width: '210mm', 
                            transform: `scale(${scale})`,
                            height: `${297 * scale}mm`, // Ajuste la hauteur du parent pour éviter le vide en dessous
                            marginBottom: scale < 1 ? `-${297 * (1 - scale)}mm` : '0' 
                        }}
                    >
                        <div className="shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm bg-white overflow-hidden ring-1 ring-black/5">
                            {renderTemplate()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
