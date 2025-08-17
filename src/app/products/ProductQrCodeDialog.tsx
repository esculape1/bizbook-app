
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';

type ProductQrCodeDialogProps = {
  product: Product;
  settings: Settings;
};

export function ProductQrCodeDialog({ product, settings }: ProductQrCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const whatsappNumber = '22678259385'; // Updated WhatsApp number

  useEffect(() => {
    if (isOpen) {
      const generateQrWithLogo = async () => {
        try {
          const prefilledMessage = encodeURIComponent(`Bonjour, je suis intéressé(e) par le produit suivant :\n\nNom: ${product.name}\nRéférence: ${product.reference}\n\nMerci de me donner plus d'informations.`);
          const qrCodeContent = `https://wa.me/${whatsappNumber}?text=${prefilledMessage}`;
          
          const canvas = canvasRef.current;
          if (!canvas) return;

          // Generate QR code on the canvas
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

      // Use a small timeout to ensure the canvas is ready in the DOM
      setTimeout(generateQrWithLogo, 50);
    }
  }, [isOpen, product.name, product.reference, settings.logoUrl, whatsappNumber]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    const sanitizedProductName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `qrcode_commande_${sanitizedProductName}.png`;
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code pour commander: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <canvas ref={canvasRef} style={{ display: 'none' }} width="300" height="300"></canvas>
          
          {qrCodeDataUrl ? (
            <Image
              src={qrCodeDataUrl}
              alt={`QR Code pour commander ${product.name}`}
              width={256}
              height={256}
              className="rounded-lg border bg-white"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-muted" />
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
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
