
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

type ProductQrCodeDialogProps = {
  product: Product;
  settings: Settings;
};

export function ProductQrCodeDialog({ product, settings }: ProductQrCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCodeCardRef = useRef<HTMLDivElement>(null);
  
  const whatsappNumber = '22678259385';

  useEffect(() => {
    if (isOpen) {
      const generateQrWithLogo = async () => {
        try {
          const prefilledMessage = encodeURIComponent(`Bonjour, je suis intéressé(e) par le produit suivant :\n\nNom: ${product.name}\nRéférence: ${product.reference}\n\nMerci de me donner plus d'informations.`);
          const qrCodeContent = `https://wa.me/${whatsappNumber}?text=${prefilledMessage}`;
          
          const canvas = canvasRef.current;
          if (!canvas) return;

          await QRCode.toCanvas(canvas, qrCodeContent, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setQrCodeDataUrl(canvas.toDataURL('image/png'));
            return;
          };

          if (settings.logoUrl) {
            const logo = document.createElement('img');
            logo.crossOrigin = "Anonymous";
            
            logo.onload = () => {
              try {
                const logoSize = canvas.width / 5;
                const x = (canvas.width - logoSize) / 2;
                const y = (canvas.height - logoSize) / 2;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
                
                ctx.drawImage(logo, x, y, logoSize, logoSize);
                
                setQrCodeDataUrl(canvas.toDataURL('image/png'));
              } catch(e) {
                  console.error("Error drawing logo on canvas, using QR code without logo.", e);
                  setQrCodeDataUrl(canvas.toDataURL('image/png'));
              }
            };
            
            logo.onerror = () => {
              console.warn("Logo could not be loaded, using QR code without it.");
              setQrCodeDataUrl(canvas.toDataURL('image/png'));
            }

            logo.src = settings.logoUrl;
          } else {
            setQrCodeDataUrl(canvas.toDataURL('image/png'));
          }

        } catch (err) {
          console.error("Failed to generate QR Code:", err);
          setQrCodeDataUrl('');
        }
      };
      
      setTimeout(generateQrWithLogo, 50);
    }
  }, [isOpen, product.name, product.reference, settings.logoUrl, whatsappNumber]);

  const handleDownload = async () => {
    const element = qrCodeCardRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { 
      backgroundColor: null, // Transparent background for the capture
      scale: 3 // Higher scale for better quality
    });
    
    const data = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = data;
    const sanitizedProductName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `qrcode_${sanitizedProductName}.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Générer le QR Code de commande">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code pour commander: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100">
          <canvas ref={canvasRef} style={{ display: 'none' }} width="300" height="300"></canvas>
          
          <div 
            ref={qrCodeCardRef} 
            className="relative bg-white"
            style={{ width: '283px', height: '283px' /* Approx 7.5cm at 96 DPI */ }}
          >
            {/* Main Black Frame */}
            <div className="absolute inset-0 bg-black"></div>

            {/* White Content Area with Padding */}
            <div className="absolute inset-2 bg-white flex flex-col">
              
              {/* Header */}
              <div className="flex justify-center items-center py-2 px-4 relative z-10">
                <div className="bg-black text-white text-center text-sm font-semibold px-4 py-1">
                  Scanner moi pour commander
                </div>
              </div>
              
              {/* QR Code Image */}
              <div className="flex-grow flex items-center justify-center px-2">
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt={`QR Code pour ${product.name}`}
                    width={200}
                    height={200}
                    className="object-contain"
                  />
                ) : (
                  <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-gray-200" />
                )}
              </div>
              
              {/* Footer */}
              <div className="bg-black text-white text-center text-xs font-semibold py-1 px-2 tracking-wider">
                {settings.companyPhone}
              </div>
            </div>

             {/* Top-left corner graphic */}
             <div className="absolute top-0 left-0 w-16 h-16 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}>
               <div className="absolute top-0 left-0 w-full h-full bg-black" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 0 calc(100% - 6px))' }}></div>
             </div>
          </div>
          
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-xs">
            Scannez ce code pour ouvrir une discussion WhatsApp et commander ce produit.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
          <Button onClick={handleDownload} disabled={!qrCodeDataUrl}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger (.png)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
