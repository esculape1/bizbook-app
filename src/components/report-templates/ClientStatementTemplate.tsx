
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

  // Focus on Net à Payer for all client debt calculations
  const totalInvoicedNet = data.allInvoices.reduce((sum, inv) => sum + (inv.netAPayer ?? inv.totalAmount), 0);
  const totalPaid = data.allInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const balanceDue = totalInvoicedNet - totalPaid;

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
      <div id="client-statement-content" className="printable-area bg-white text-black font-sans text-[10pt] w-full max-w-[210mm] mx-auto p-[14mm]">
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
            <h1 className="text-2xl font-bold">Relevé de Compte Client</h1>
            <p className="text-sm">Date: {format(reportDate, 'd MMMM yyyy', { locale: fr })}</p>
            <p className="text-sm">Période du {format(startDate, 'dd/MM/yy')} au {format(endDate, 'dd/MM/yy')}</p>
          </div>
        </header>

        <div className="mb-8 p-4 bg-gray-100 rounded-md">
            <h3 className="font-bold text-lg">Détails du Client</h3>
            <p className="font-semibold uppercase">{client.name}</p>
            <p className="text-xs mt-1">{client.address || 'Pas d\'adresse spécifiée'}</p>
            <p className="text-xs">Tel: {client.phone || 'N/A'}</p>
            {client.ifu && <p className="text-xs">IFU: {client.ifu}</p>}
        </div>

        <main>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border font-bold uppercase text-[9px]">Date</th>
                <th className="p-2 border font-bold uppercase text-[9px]">N° Facture</th>
                <th className="p-2 border font-bold uppercase text-[9px] text-right">Net à Payer</th>
                <th className="p-2 border font-bold uppercase text-[9px] text-right">Montant Payé</th>
                <th className="p-2 border font-bold uppercase text-[9px] text-right">Solde Restant</th>
              </tr>
            </thead>
            <tbody>
              {data.allInvoices.map(invoice => {
                const netToPay = invoice.netAPayer ?? invoice.totalAmount;
                const due = netToPay - (invoice.amountPaid || 0);
                return (
                  <tr key={invoice.id} className={invoice.status === 'Cancelled' ? 'opacity-50 line-through' : ''}>
                    <td className="p-2 border text-xs">{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                    <td className="p-2 border text-xs font-semibold">{invoice.invoiceNumber}</td>
                    <td className="p-2 border text-right text-xs">{formatCurrency(netToPay, settings.currency)}</td>
                    <td className="p-2 border text-right text-xs">{formatCurrency(invoice.amountPaid || 0, settings.currency)}</td>
                    <td className="p-2 border text-right text-xs font-bold">{formatCurrency(due > 0.01 ? due : 0, settings.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-black">
                <td className="p-2 border text-right uppercase text-[9px]" colSpan={2}>Totaux de la Période</td>
                <td className="p-2 border text-right text-xs">{formatCurrency(totalInvoicedNet, settings.currency)}</td>
                <td className="p-2 border text-right text-xs">{formatCurrency(totalPaid, settings.currency)}</td>
                <td className="p-2 border text-right text-xs text-destructive">{formatCurrency(balanceDue > 0.01 ? balanceDue : 0, settings.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </main>
        
        <div className="mt-8 p-6 text-center border-2 border-black rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Position Nette du Compte</p>
            <p className="font-black text-3xl">{formatCurrency(balanceDue > 0.01 ? balanceDue : 0, settings.currency)}</p>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
                {balanceDue > 0.01 ? 'Le solde ci-dessus est en attente de règlement.' : 'Le compte est actuellement soldé.'}
            </p>
        </div>

        <footer className="mt-12 pt-4 border-t flex justify-between items-start">
            <div className="text-xs text-gray-500">
                <p>Arrêté le présent relevé à la date du {format(reportDate, 'dd/MM/yyyy')}</p>
                <p className="mt-4 italic">Document généré par BizBook Management Suite</p>
            </div>
            <div className="text-center w-1/3">
                <p className="text-xs font-bold uppercase underline">La Gérance</p>
                <div className="mt-16 border-b border-gray-300"></div>
                <p className="text-[10px] mt-1">{settings.managerName}</p>
            </div>
        </footer>
      </div>
    </>
  );
}
