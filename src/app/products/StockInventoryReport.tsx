'use client';

import { useState } from 'react';
import type { Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type StockInventoryReportProps = {
  products: Product[];
  settings: Settings;
};

export function StockInventoryReport({ products, settings }: StockInventoryReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reportDate = new Date();

  const totalPurchaseValue = products.reduce((sum, p) => sum + (p.purchasePrice || 0) * p.quantityInStock, 0);
  const totalSellingValue = products.reduce((sum, p) => sum + p.unitPrice * p.quantityInStock, 0);

  const handlePrint = () => {
    const printContent = document.getElementById('stock-inventory-content');
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Rapport d\'Inventaire de Stock</title>');
        
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              // For inline styles, read the rules
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              // For external stylesheets, link them
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');

        const printStyles = `
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .printable-area {
               background-color: #ffffff !important;
               color: #000000 !important;
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
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Rapport d'Inventaire
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-2">
            <DialogTitle>Aperçu du Rapport d'Inventaire</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            <div id="stock-inventory-content" className="printable-area bg-white p-4 font-sans text-sm text-black ring-1 ring-gray-200">
                {/* Header */}
                <header className="flex justify-between items-start mb-8 pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold">{settings.companyName}</h2>
                        <p className="text-xs">{settings.companyAddress}</p>
                        <p className="text-xs">Tél: {settings.companyPhone}</p>
                        <p className="text-xs">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold">Inventaire du Stock</h1>
                        <p className="text-sm">
                            Date: {format(reportDate, 'd MMMM yyyy', { locale: fr })}
                        </p>
                    </div>
                </header>

                {/* Table */}
                <main>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="text-black">Produit</TableHead>
                            <TableHead className="text-right text-black">Quantité</TableHead>
                            <TableHead className="text-right text-black">Prix d'Achat U.</TableHead>
                            <TableHead className="text-right text-black">Valeur Achat Total</TableHead>
                            <TableHead className="text-right text-black">Prix de Vente U.</TableHead>
                            <TableHead className="text-right text-black">Valeur Vente Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">{product.quantityInStock}</TableCell>
                                <TableCell className="text-right">{formatCurrency(product.purchasePrice || 0, settings.currency)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency((product.purchasePrice || 0) * product.quantityInStock, settings.currency)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(product.unitPrice, settings.currency)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(product.unitPrice * product.quantityInStock, settings.currency)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                            <TableCell colSpan={3} className="font-bold text-lg text-black">Total</TableCell>
                            <TableCell className="text-right font-bold text-lg text-black">{formatCurrency(totalPurchaseValue, settings.currency)}</TableCell>
                            <TableCell colSpan={1}></TableCell>
                            <TableCell className="text-right font-bold text-lg text-black">{formatCurrency(totalSellingValue, settings.currency)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </main>
                
                {/* Signature Footer */}
                <footer className="flex justify-end mt-24 pt-4 border-t">
                    <div className="w-1/3 text-center">
                        <p className="font-bold">Signature du Gestionnaire</p>
                        <div className="mt-16 border-b border-gray-400"></div>
                        <p className="mt-2 text-sm">{settings.managerName}</p>
                    </div>
                </footer>
            </div>
        </div>
        <DialogFooter className="p-6 bg-background border-t">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
