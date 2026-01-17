
'use client';

import type { ReportData, Client, Settings } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function ClientStatementTemplate({ data, client, settings }: { data: ReportData, client: Client, settings: Settings }) {
  if (!data) {
    return null; // Return early if data is null to prevent runtime errors
  }
  
  const reportDate = new Date();
  const startDate = parseISO(data.startDate);
  const endDate = parseISO(data.endDate);

  
  const totalInvoiced = data.allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = data.allInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const balanceDue = totalInvoiced - totalPaid;

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
      <div id="client-statement-content" className="printable-area bg-white text-black font-sans text-[10pt] w-full md:max-w-[210mm] mx-auto" style={{ minHeight: '297mm', padding: '14mm' }}>
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
            <h1 className="text-2xl font-bold">Relevé de Compte</h1>
            <p className="text-sm">Date: {format(reportDate, 'd MMMM yyyy', { locale: fr })}</p>
            <p className="text-sm">Période du {format(startDate, 'dd/MM/yy')} au {format(endDate, 'dd/MM/yy')}</p>
          </div>
        </header>

        <div className="mb-8 p-4 bg-gray-100 rounded-md">
            <h3 className="font-bold text-lg">Client</h3>
            <p className="font-semibold">{client.name}</p>
            <p>{client.address}</p>
            <p>Tel: {client.phone}</p>
            <p>IFU: {client.ifu}</p>
        </div>

        <main>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border font-semibold">Date Facture</th>
                <th className="p-2 border font-semibold">N° Facture</th>
                <th className="p-2 border font-semibold">Montant Total</th>
                <th className="p-2 border font-semibold">Montant Payé</th>
                <th className="p-2 border font-semibold">Solde Dû</th>
              </tr>
            </thead>
            <tbody>
              {data.allInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="p-2 border">{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                  <td className="p-2 border">{invoice.invoiceNumber}</td>
                  <td className="p-2 border text-right">{formatCurrency(invoice.totalAmount, settings.currency)}</td>
                  <td className="p-2 border text-right">{formatCurrency(invoice.amountPaid, settings.currency)}</td>
                  <td className="p-2 border text-right font-medium">{formatCurrency(invoice.totalAmount - invoice.amountPaid, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td className="p-2 border text-right" colSpan={2}>Totaux</td>
                <td className="p-2 border text-right">{formatCurrency(totalInvoiced, settings.currency)}</td>
                <td className="p-2 border text-right">{formatCurrency(totalPaid, settings.currency)}</td>
                <td className="p-2 border text-right">{formatCurrency(balanceDue, settings.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </main>
        
        <div className="mt-8 p-4 text-center bg-gray-800 text-white rounded-md">
            <p className="font-bold text-lg">Solde Total Dû</p>
            <p className="font-bold text-2xl">{formatCurrency(balanceDue, settings.currency)}</p>
        </div>

        <footer className="text-center text-xs text-gray-500 mt-12 pt-4 border-t">
          Merci pour votre confiance.
        </footer>
      </div>
    </>
  );
}
