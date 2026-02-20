'use client';

import type { Quote, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function DetailedQuoteTemplate({ quote, client, settings }: { quote: Quote, client: Client, settings: Settings }) {
  const netAPayer = quote.netAPayer ?? quote.totalAmount;
  const retenue = quote.retenue ?? 0;
  const retenueAmount = quote.retenueAmount ?? 0;

  const [totalInWordsString, setTotalInWordsString] = useState('Chargement...');

  useEffect(() => {
    if (typeof netAPayer === 'number') {
      setTotalInWordsString(numberToWordsFr(netAPayer, settings.currency));
    }
  }, [netAPayer, settings.currency]);

  const ITEMS_PER_PAGE = 12;
  const pages = [];
  for (let i = 0; i < quote.items.length; i += ITEMS_PER_PAGE) {
    pages.push(quote.items.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <>
      <style>{`
        @media screen {
          .quote-container {
            width: 100%;
            max-width: 100vw;
            margin: 0 auto;
          }
          @media (max-width: 480px) {
            .printable-area { font-size: 8pt !important; }
            .text-2xl { font-size: 1.25rem !important; }
            th, td { padding: 4px 2px !important; }
            .total-box { width: 100% !important; }
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 99.5%;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-container {
            overflow: hidden;
            height: 100%;
          }
           .page-container:not(:last-child) {
             page-break-after: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }
        .item-table { table-layout: fixed; width: 100%; }
        .total-table { table-layout: fixed; width: 100%; }
        .col-ref { width: 18%; }
        .col-des { width: 42%; }
        .col-pu { width: 15%; }
        .col-qty { width: 10%; }
        .col-tot { width: 15%; }
      `}</style>
      <div id="quote-content" className="quote-container bg-white text-black font-sans text-[10pt] leading-tight printable-area">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const emptyRowsCount = isLastPage ? ITEMS_PER_PAGE - pageItems.length : 0;

          return (
            <div
              key={pageIndex}
              className="page-container bg-white relative mx-auto w-full max-w-[210mm]"
              style={{
                minHeight: '297mm',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                padding: '10mm',
              }}
            >
              <div className="absolute top-0 left-0 h-full w-[8mm] bg-[#002060]"></div>
              
              <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  paddingLeft: '5mm',
                }}>
                <header className="mb-4">
                  <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
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
                           <h1 className="text-xl md:text-2xl font-bold text-[#1f4e78] mt-2">FACTURE PROFORMA</h1>
                      </div>
                      <div className="text-right text-[8pt] md:text-[9pt] shrink-0 font-bold">
                          <p>DATE: {format(new Date(quote.date), 'dd/MM/yyyy', { locale: fr })}</p>
                          <p>N°: {quote.quoteNumber}</p>
                          <p className="text-[#1f4e78]">Valable jusqu'au: {format(new Date(quote.expiryDate), 'dd/MM/yyyy', { locale: fr })}</p>
                      </div>
                  </div>
                  <div className="flex justify-between items-start mt-4 text-[8pt] md:text-[9pt] gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-[#1f4e78] uppercase border-b border-[#1f4e78] mb-1 pb-0.5">Émetteur</p>
                      <p className="font-bold">{settings.legalName || settings.companyName}</p>
                      <p className="line-clamp-2">{settings.companyAddress}</p>
                      <p>Tel: {settings.companyPhone}</p>
                      <p className="text-[7pt] md:text-[8pt]">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold underline uppercase border-b border-[#1f4e78] mb-1 pb-0.5">Client</p>
                      <p className="font-bold uppercase">{client.name}</p>
                      <p className="line-clamp-2">{client.address}</p>
                      <p>Tel: {client.phone}</p>
                      <p className="text-[7pt] md:text-[8pt]">IFU: {client.ifu} / RCCM: {client.rccm}</p>
                    </div>
                  </div>
                </header>
                
                <main className="flex flex-col overflow-x-hidden">
                  <table className="item-table border-collapse text-[8pt] md:text-[9pt]">
                    <thead className="bg-[#002060] text-white">
                      <tr>
                        <th className="col-ref py-1 px-1 md:px-2 text-left font-bold border-r border-white uppercase">RÉF</th>
                        <th className="col-des py-1 px-1 md:px-2 text-left font-bold border-r border-white uppercase">DÉSIGNATION</th>
                        <th className="col-pu py-1 px-1 md:px-2 text-right font-bold border-r border-white uppercase">PRIX U.</th>
                        <th className="col-qty py-1 px-1 md:px-2 text-center font-bold border-r border-white uppercase">Qté</th>
                        <th className="col-tot py-1 px-1 md:px-2 text-right font-bold uppercase">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-400">
                          <td className="py-1 px-1 md:px-2 border-l border-r border-gray-400 align-middle truncate">{item.reference}</td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400 align-middle font-bold uppercase truncate">{item.productName}</td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400 text-right align-middle tabular-nums">{formatCurrency(item.unitPrice, settings.currency)}</td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400 text-center align-middle">{item.quantity}</td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400 text-right align-middle font-semibold tabular-nums">{formatCurrency(item.total, settings.currency)}</td>
                        </tr>
                      ))}
                      {isLastPage && emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, index) => (
                        <tr key={`empty-${index}`} className="border-b border-gray-400">
                          <td className="py-1 px-1 md:px-2 border-l border-r border-gray-400">&nbsp;</td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400"></td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400"></td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400"></td>
                          <td className="py-1 px-1 md:px-2 border-r border-gray-400"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </main>

                {isLastPage && (
                    <div className="no-break mt-4">
                        <div className="flex justify-end">
                            <div className="total-box w-full max-w-[280px]">
                                <table className="total-table border-collapse text-[8pt] md:text-[9pt] border-2 border-black">
                                    <tbody>
                                        <tr className="border-b border-gray-300">
                                            <td className="p-1 pr-2 font-bold uppercase w-1/2">SOUS-TOTAL:</td>
                                            <td className="p-1 text-right font-semibold tabular-nums w-1/2">{formatCurrency(quote.subTotal, settings.currency)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-300">
                                            <td className="p-1 pr-2 uppercase">REMISE {quote.discount}%:</td>
                                            <td className="p-1 text-right font-semibold tabular-nums">-{formatCurrency(quote.discountAmount, settings.currency)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-300">
                                            <td className="p-1 pr-2 uppercase">TVA {quote.vat}%:</td>
                                            <td className="p-1 text-right font-semibold tabular-nums">+{formatCurrency(quote.vatAmount, settings.currency)}</td>
                                        </tr>
                                        <tr className="border-b border-black font-bold">
                                            <td className="p-1 pr-2 uppercase">TOTAL TTC:</td>
                                            <td className="p-1 text-right font-semibold tabular-nums">{formatCurrency(quote.totalAmount, settings.currency)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-300 text-destructive">
                                            <td className="p-1 pr-2 font-bold uppercase">RETENUE {retenue}%:</td>
                                            <td className="p-1 text-right font-semibold tabular-nums">-{formatCurrency(retenueAmount, settings.currency)}</td>
                                        </tr>
                                        <tr className="border border-gray-400 bg-gray-900 text-white font-black">
                                            <td className="p-1.5 pr-2 uppercase text-[9pt] md:text-[10pt]">NET À PAYER:</td>
                                            <td className="p-1.5 text-right font-black tabular-nums text-[10pt] md:text-[11pt]">{formatCurrency(netAPayer, settings.currency)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-baseline mt-4 text-[8pt] md:text-[9pt] gap-4">
                           <div className="w-1/3 text-center">
                               <div className="mt-12 border-b-2 border-gray-400"></div>
                               <p className="font-bold mt-1 uppercase text-[7pt] md:text-[8pt]">{settings.managerName}</p>
                           </div>
                           <div className="w-2/3 pl-4">
                                <p className="font-semibold underline">Arrêtée la présente proforma à la somme de :</p>
                                <p className="italic font-medium text-[9pt] uppercase tracking-tight text-[#002060]">{totalInWordsString}</p>
                           </div>
                        </div>
                    </div>
                  )}
              
                <div className="flex-grow" />

                <footer className="text-center text-gray-700 text-[7pt] border-t-2 border-[#002060] pt-1 mt-4 mb-2 shrink-0">
                 <p className="leading-tight truncate">RCCM: {settings.companyRccm} | IFU: {settings.companyIfu}</p>
                 <p className="leading-tight truncate">Siège : {settings.companyAddress} | Tel: {settings.companyPhone}</p>
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
