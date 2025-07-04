'use client';

import { useState } from 'react';
import type { Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Printer, FileText } from 'lucide-react';

type StockInventoryReportProps = {
  products: Product[];
  settings: Settings;
};

export function StockInventoryReport({ products, settings }: StockInventoryReportProps) {
  const [isOpen, setIsOpen] = useState(false);

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
              return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
          }).join('\n');

        printWindow.document.write(`<style>${styles}</style></head><body>`);
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
        <div id="stock-inventory-content" className="p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl mb-4">Inventaire du Stock</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix d'Achat U.</TableHead>
                  <TableHead className="text-right">Valeur Achat Total</TableHead>
                  <TableHead className="text-right">Prix de Vente U.</TableHead>
                  <TableHead className="text-right">Valeur Vente Total</TableHead>
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
                  <TableCell colSpan={3} className="font-bold text-lg">Total</TableCell>
                  <TableCell className="text-right font-bold text-lg">{formatCurrency(totalPurchaseValue, settings.currency)}</TableCell>
                  <TableCell colSpan={1}></TableCell>
                  <TableCell className="text-right font-bold text-lg">{formatCurrency(totalSellingValue, settings.currency)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
        <DialogFooter className="p-6 bg-white border-t">
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
