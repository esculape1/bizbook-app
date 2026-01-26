
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import type { PaymentHistoryItem, Client, Settings } from '@/lib/types';
import { PaymentHistoryReportTemplate } from './PaymentHistoryReportTemplate';

type PaymentHistoryReportDialogProps = {
  history: PaymentHistoryItem[];
  client: Client;
  settings: Settings;
};

export function PaymentHistoryReportDialog({ history, client, settings }: PaymentHistoryReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrint = () => {
    const content = document.getElementById('payment-history-report-content');
    if (content) {
      const printWindow = window.open('', '_blank');
      const suggestedFilename = `Releve_Paiements_${client.name.replace(/\s/g, '_')}`;
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
      printWindow?.document.write('<body class="p-8">');
      printWindow?.document.write(content.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      
      setTimeout(() => {
        printWindow?.print();
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Imprimer l'historique
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Aperçu de l'historique des paiements</DialogTitle>
          <DialogDescription>
            Ceci est un relevé de tous les paiements effectués par {client.name} que vous pouvez imprimer ou sauvegarder en PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto bg-gray-50">
          <PaymentHistoryReportTemplate history={history} client={client} settings={settings} />
        </div>
        <DialogFooter className="p-6 bg-white border-t">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Fermer</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
