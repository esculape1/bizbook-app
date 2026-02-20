'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function DetailedTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const netAPayer = invoice.netAPayer ?? invoice.totalAmount;
  const retenue = invoice.retenue ?? 0;
  const retenueAmount = invoice.retenueAmount ?? 0;
  
  const [totalInWordsString, setTotalInWordsString] = useState('...');

  useEffect(() => {
    if (typeof netAPayer === 'number') {
      setTotalInWordsString(numberToWordsFr(netAPayer, settings.currency));
    }
  }, [netAPayer, settings.currency]);

  const ITEMS_PER_PAGE = 12;
  const pages = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    pages.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }
   if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-container {
            overflow: hidden;
            height: 297mm !important;
            page-break-after: always;
          }
        }
      `}</style>
      <div id="invoice-content" className="bg-white text-black font-sans text-[10pt] leading-tight">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const emptyRowsCount = isLastPage ? ITEMS_PER_PAGE - pageItems.length : 0;

          return (
            <div
              key={pageIndex}
              className="page-container relative mx-auto w-full max-w-[210mm] bg-white print:shadow-none"
              style={{
                minHeight: '297mm',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                padding: '10mm',
              }}
            >
              {/* Blue sidebar */}
              <div className="absolute top-0 left-0 h-full w-[8mm] bg-[#002060]"></div>
              
              <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  paddingLeft: '5mm', 
              }}>
                <header className="mb-4">
                  <div className="flex justify-between items-start">
                      <div className="w-2/3">
                          {settings.logoUrl && (
                              <Image 
                                  src={settings.logoUrl} 
                                  alt={`${settings.companyName} logo`} 
                                  width={80}
                                  height={40} 
                                  className="object-contain"
                                  data-ai-hint="logo"
                              />
                          )}
                          <h1 className="text-2xl font-black text-[#1f4e78] mt-2 tracking-tight uppercase">FACTURE DEFINITIVE</h1>
                      </div>
                      <div className="w-1/3 text-right text-[9pt] font-bold">
                          <p className="uppercase opacity-60">Détails de la facture</p>
                          <p className="mt-1">DATE: {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}</p>
                          <p>N°: {invoice.invoiceNumber}</p>
                          <p>ÉCHÉANCE: {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}</p>
                      </div>
                  </div>
                  <div className="flex justify-between items-start mt-6 text-[9pt]">
                    <div className="w-1/2 pr-4">
                      <p className="font-black text-[#1f4e78] uppercase border-b border-[#1f4e78] mb-1 pb-0.5">Émetteur</p>
                      <p className="font-bold text-sm">{settings.legalName || settings.companyName}</p>
                      <p>{settings.companyAddress}</p>
                      <p>Tel: {settings.companyPhone}</p>
                      <p>IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                    </div>
                    <div className="w-1/2 pl-4">
                      <p className="font-black text-[#1f4e78] uppercase border-b border-[#1f4e78] mb-1 pb-0.5">Client</p>
                      <p className="font-black text-sm uppercase">{client.name}</p>
                      <p className="italic">{client.address || '-'}</p>
                      <p>Tel: {client.phone || '-'}</p>
                      <p>IFU: {client.ifu || '-'} / RCCM: {client.rccm || '-'}</p>
                    </div>
                  </div>
                </header>
                
                <main className="mt-2 flex flex-col flex-grow">
                    <table className="w-full border-collapse text-[9pt]">
                      <thead className="bg-[#002060] text-white">
                        <tr>
                          <th className="py-1.5 px-2 text-left font-bold w-[15%] border-r border-white/20 uppercase text-[8pt]">REFERENCE</th>
                          <th className="py-1.5 px-2 text-left font-bold w-[45%] border-r border-white/20 uppercase text-[8pt]">DESIGNATION</th>
                          <th className="py-1.5 px-2 text-right font-bold w-[15%] border-r border-white/20 uppercase text-[8pt]">PRIX U.</th>
                          <th className="py-1.5 px-2 text-center font-bold w-[10%] border-r border-white/20 uppercase text-[8pt]">Qté</th>
                          <th className="py-1.5 px-2 text-right font-bold w-[15%] uppercase text-[8pt]">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((item, index) => (
                          <tr key={index} className="border-b border-gray-300">
                            <td className="py-1.5 px-2 border-l border-r border-gray-300 align-middle whitespace-nowrap text-gray-600">{item.reference}</td>
                            <td className="py-1.5 px-2 border-r border-gray-300 align-middle font-bold text-[#002060] uppercase">{item.productName}</td>
                            <td className="py-1.5 px-2 border-r border-gray-300 text-right align-middle whitespace-nowrap">{formatCurrency(item.unitPrice, settings.currency)}</td>
                            <td className="py-1.5 px-2 border-r border-gray-300 text-center align-middle font-bold">{item.quantity}</td>
                            <td className="py-1.5 px-2 border-r border-gray-300 text-right align-middle font-black whitespace-nowrap">{formatCurrency(item.total, settings.currency)}</td>
                          </tr>
                        ))}
                        {isLastPage && emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, index) => (
                          <tr key={`empty-${index}`} className="border-b border-gray-200">
                            <td className="py-1.5 px-2 border-l border-r border-gray-200">&nbsp;</td>
                            <td className="py-1.5 px-2 border-r border-gray-200"></td>
                            <td className="py-1.5 px-2 border-r border-gray-200"></td>
                            <td className="py-1.5 px-2 border-r border-gray-200"></td>
                            <td className="py-1.5 px-2 border-r border-gray-200"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </main>
                
                {isLastPage && (
                    <div className="mt-6">
                        <div className="flex justify-end">
                          <div className="w-[280px]">
                            <table className="w-full border-collapse text-[9pt] border-2 border-black">
                              <tbody>
                                <tr className="border-b border-gray-300">
                                  <td className="p-1.5 font-bold uppercase text-[8pt]">SOUS-TOTAL:</td>
                                  <td className="p-1.5 text-right font-bold">{formatCurrency(invoice.subTotal, settings.currency)}</td>
                                </tr>
                                <tr className="border-b border-gray-300 text-gray-600">
                                  <td className="p-1.5 text-[8pt]">REMISE {invoice.discount}%:</td>
                                  <td className="p-1.5 text-right">-{formatCurrency(invoice.discountAmount, settings.currency)}</td>
                                </tr>
                                <tr className="border-b border-gray-300 text-gray-600">
                                  <td className="p-1.5 text-[8pt]">TVA {invoice.vat}%:</td>
                                  <td className="p-1.5 text-right">+{formatCurrency(invoice.vatAmount, settings.currency)}</td>
                                </tr>
                                <tr className="border-b-2 border-black font-bold text-[#002060]">
                                  <td className="p-1.5 text-[8pt]">TOTAL TTC:</td>
                                  <td className="p-1.5 text-right">{formatCurrency(invoice.totalAmount, settings.currency)}</td>
                                </tr>
                                <tr className="border-b border-gray-300 text-destructive">
                                  <td className="p-1.5 font-bold text-[8pt]">RETENUE {retenue}%:</td>
                                  <td className="p-1.5 text-right font-bold">-{formatCurrency(retenueAmount, settings.currency)}</td>
                                </tr>
                                <tr className="bg-gray-900 text-white font-black">
                                  <td className="p-2 uppercase text-[9pt]">NET A PAYER:</td>
                                  <td className="p-2 text-right text-[11pt]">{formatCurrency(netAPayer, settings.currency)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="mt-6 text-[9pt]">
                            <p className="font-bold border-b border-black inline-block mb-1">Arrêtée la présente facture à la somme de :</p>
                            <p className="italic font-medium text-[10pt] uppercase tracking-tight text-[#002060]">{totalInWordsString}</p>
                        </div>

                        <div className="flex justify-between items-start mt-10">
                            <div className="w-1/3 text-center">
                                <p className="font-black uppercase text-[8pt] underline mb-16">Le Client</p>
                                <div className="border-b border-gray-400"></div>
                            </div>
                           <div className="w-1/3 text-center">
                                <p className="font-black uppercase text-[8pt] underline mb-16">La Gérance</p>
                                <div className="border-b border-gray-400"></div>
                                <p className="font-bold mt-2 text-[9pt]">{settings.managerName}</p>
                           </div>
                        </div>
                    </div>
                  )}

                <footer className="text-center text-gray-500 text-[7.5pt] border-t border-[#002060] pt-2 mt-auto mb-2">
                    <p className="font-bold">RCCM: {settings.companyRccm} | IFU: {settings.companyIfu}</p>
                    <p>Siège : {settings.companyAddress} | Tél: {settings.companyPhone}</p>
                    <p className="italic">Généré par BizBook Management Suite</p>
                </footer>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
