
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

  useEffect(() => {
    if (isOpen) {
      const qrCodeContent = `Produit: ${product.name}\nFournisseur: ${settings.companyName}\nContact: ${settings.companyPhone}`;
      QRCode.toDataURL(qrCodeContent, { 
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H'
      })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, [isOpen, product, settings]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    // Sanitize product name for filename
    const sanitizedProductName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `qrcode_${sanitizedProductName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Générer le QR Code">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code pour {product.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {qrCodeDataUrl ? (
            <Image
              src={qrCodeDataUrl}
              alt={`QR Code for ${product.name}`}
              width={256}
              height={256}
              className="rounded-lg border bg-white"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-muted" />
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Contient le nom du produit et les informations de contact de votre entreprise.
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
