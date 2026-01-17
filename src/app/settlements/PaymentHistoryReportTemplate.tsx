
'use client';

import type { PaymentHistoryItem, Client, Settings } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

type TemplateProps = {
  history: PaymentHistoryItem[];
  client: Client;
  settings: Settings;
};

export function PaymentHistoryReportTemplate({ history, client, settings }: TemplateProps) {
  const reportDate = new Date();
  const totalPaid = history.reduce((sum, item) => sum + item.payment.amount, 0);

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      <div id="payment-history-report-content" className="printable-area bg-white text-black font-sans text-[10pt]" style={{ width: '210mm', minHeight: '297mm', padding: '14mm' }}>
        <header className="flex justify-between items-start mb-8 pb-4 border-b">
          <div>
            {settings.logoUrl && (
              <Image 
                src={settings.logoUrl} 
                alt={`${settings.companyName} logo`} 
                width={120} 
                height={60} 
                className="object-contain mb-4"
                data-ai-hint="logo"
              />
            )}
            <h2 className="text-lg font-bold">{settings.companyName}</h2>
            <p className="text-xs">{settings.companyAddress}</p>
            <p className="text-xs">Tél: {settings.companyPhone}</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Historique de Paiements</h1>
            <p className="text-sm">Client: <strong>{client.name}</strong></p>
            <p className="text-sm">Date d'impression: {format(reportDate, 'd MMMM yyyy', { locale: fr })}</p>
          </div>
        </header>

        <main>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border font-semibold">Date Paiement</th>
                <th className="p-2 border font-semibold">Facture Concernée</th>
                <th className="p-2 border font-semibold">Méthode</th>
                <th className="p-2 border font-semibold">Notes</th>
                <th className="p-2 border font-semibold text-right">Montant Payé</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={`${item.payment.id}-${index}`}>
                  <td className="p-2 border">{format(new Date(item.payment.date), 'dd/MM/yyyy')}</td>
                  <td className="p-2 border">{item.invoiceNumber}</td>
                  <td className="p-2 border">{item.payment.method}</td>
                  <td className="p-2 border text-xs">{item.payment.notes}</td>
                  <td className="p-2 border text-right font-medium">{formatCurrency(item.payment.amount, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td className="p-2 border text-right" colSpan={4}>Total des paiements affichés</td>
                <td className="p-2 border text-right">{formatCurrency(totalPaid, settings.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </main>
        
        <footer className="absolute bottom-[14mm] left-[14mm] right-[14mm] text-center text-xs text-gray-500 pt-4 border-t">
          <p>Merci pour votre confiance.</p>
          <p>{settings.companyName} - {settings.companyAddress}</p>
        </footer>
      </div>
    </>
  );
}
