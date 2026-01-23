
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { QrCode, Download, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import html2canvas from 'html2canvas';

type ClientQrCodeDialogProps = {
  client: Client;
  children: React.ReactNode;
};

export function ClientQRCodeDialog({ client, children }: ClientQrCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const qrCodeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && client.id) {
      const generateQrCode = async () => {
        try {
          // Construct the full URL using the current window's origin
          const orderUrl = `${window.location.origin}/commande/${client.id}`;
          const dataUrl = await QRCode.toDataURL(orderUrl, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
          });
          setQrCodeDataUrl(dataUrl);
        } catch (err) {
          console.error("Failed to generate QR Code:", err);
          setQrCodeDataUrl('');
        }
      };
      
      // Delay generation slightly to ensure dialog is rendered
      setTimeout(generateQrCode, 50);
    }
  }, [isOpen, client.id]);

  const handleDownload = async () => {
    const element = qrCodeCardRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { 
      backgroundColor: '#ffffff',
      scale: 3
    });
    
    const data = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = data;
    const sanitizedClientName = client.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `qrcode_commande_${sanitizedClientName}.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code de Commande Express</DialogTitle>
          <DialogDescription>
            Votre client peut scanner ce code pour accéder directement à son portail de commande personnel.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
          <div ref={qrCodeCardRef} className="bg-white p-4 rounded-lg shadow-md">
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt={`QR Code de commande pour ${client.name}`}
                width={250}
                height={250}
                className="object-contain"
              />
            ) : (
              <div className="h-[250px] w-[250px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <p className="mt-2 text-center font-bold text-lg">{client.name}</p>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-xs">
            Imprimez ce code et donnez-le à votre client pour des commandes rapides.
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
