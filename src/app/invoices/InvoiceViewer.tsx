'use client';

import { useRef, useState, useEffect } from 'react';
import type { Invoice, Client, Settings } from '@/lib/types';
import { DetailedTemplate } from '@/components/invoice-templates/DetailedTemplate';
import { Button } from '@/components/ui/button';
import { Printer, Truck } from 'lucide-react';
import { DeliverySlipDialog } from './DeliverySlipDialog';
import { ShippingLabelsDialog } from './ShippingLabelsDialog';

type InvoiceViewerProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function InvoiceViewer({ invoice, client, settings }: InvoiceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Calcul du nombre de pages pour ajuster la hauteur du conteneur
  const ITEMS_PER_PAGE = 12;
  const numPages = Math.max(1, Math.ceil(invoice.items.length / ITEMS_PER_PAGE));

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const targetWidth = 800; // Largeur A4 approx en px
        const newScale = containerWidth / targetWidth;
        setScale(newScale > 1 ? 1 : newScale);
      }
    };

    updateScale();
    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
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

  return (
    <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto w-full pb-20">
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

        {/* Zone de prévisualisation avec échelle automatique */}
        <div className="w-full px-2 sm:px-0">
            <div 
                ref={containerRef}
                className="bg-muted/40 rounded-[2.5rem] p-4 md:p-12 border shadow-inner flex justify-center overflow-hidden"
                style={{ height: `calc(297mm * ${numPages} * ${scale} + 4rem)` }}
            >
                <div 
                    className="origin-top transition-all duration-500 ease-out"
                    style={{ 
                        width: '210mm', 
                        transform: `scale(${scale})`,
                        backgroundColor: 'white',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                    }}
                >
                    <DetailedTemplate invoice={invoice} client={client} settings={settings} />
                </div>
            </div>
        </div>
    </div>
  );
}
