
'use client';

import type { Quote, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function DetailedQuoteTemplate({ quote, client, settings }: { quote: Quote, client: Client, settings: Settings }) {
  const [totalInWordsString, setTotalInWordsString] = useState('Chargement...');

  useEffect(() => {
    setTotalInWordsString(numberToWordsFr(quote.totalAmount, settings.currency));
  }, [quote.totalAmount, settings.currency]);

  const ITEMS_PER_PAGE = 16;
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
        .printable-area .page-container:not(:first-child) {
          display: none; /* Hide subsequent pages in normal view */
        }
        @media print {
          .printable-area .page-container {
            display: block !important; /* Show all pages for printing */
          }
          @page {
            size: A4;
            margin: 20mm 10mm 20mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-container:not(:last-child) {
             page-break-after: always;
          }
        }
      `}</style>
      <div id="quote-content" className="printable-area bg-gray-50 text-black font-sans text-[10pt]">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const emptyRowsCount = isLastPage ? ITEMS_PER_PAGE - pageItems.length : 0;

          return (
            <div key={pageIndex} className="page-container bg-white relative" style={{
              width: '210mm',
              minHeight: '297mm',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              padding: '20mm 10mm 20mm 10mm',
            }}>
              {/* Blue sidebar */}
              <div className="absolute top-0 left-0 h-full w-[8mm] bg-[#002060]"></div>
              
              <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  paddingLeft: '5mm', // Space for the blue bar
              }}>
                {/* Header */}
                <header className="mb-4">
                  <div className="flex justify-between items-start">
                      {/* Left Part: Logo & Title */}
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
                           <h1 className="text-2xl font-bold text-[#1f4e78] mt-2">FACTURE PROFORMA</h1>
                      </div>

                      {/* Right Part: Date & quote Number */}
                      <div className="w-1/3 text-right text-xs">
                          <p><strong>DATE:</strong> {format(new Date(quote.date), 'dd/MM/yyyy', { locale: fr })}</p>
                          <p><strong>N°:</strong> {quote.quoteNumber}</p>
                          <p><strong>Valable jusqu'au:</strong> {format(new Date(quote.expiryDate), 'dd/MM/yyyy', { locale: fr })}</p>
                      </div>
                  </div>

                  <div className="flex justify-between items-start mt-4 text-xs">
                    {/* Company Info */}
                    <div className="w-1/2">
                      <p className="font-bold text-sm text-[#1f4e78]">{settings.legalName || settings.companyName}</p>
                      <p>{settings.companyAddress}</p>
                      <p>Tel: {settings.companyPhone}</p>
                      <p>IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                      <p>Régime fiscal: CME DGI Ouaga II</p>
                    </div>

                    {/* Client Info */}
                    <div className="w-1/2 pl-4">
                      <p className="font-bold underline">Client:</p>
                      <p className="font-bold">{client.name}</p>
                      <p>{client.address}</p>
                      <p>Tel: {client.phone}</p>
                      <p>IFU: {client.ifu}</p>
                      <p>RCCM: {client.rccm}</p>
                    </div>
                  </div>

                   <div className="text-xs mt-2">
                        <p><strong>Libellé:</strong> Vente de matériel médical</p>
                   </div>
                </header>
                
                <main className="flex-grow flex flex-col">
                  {/* Items Table */}
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-[#002060] text-white">
                      <tr>
                        <th className="py-1 px-2 text-left font-bold w-[15%] border-r border-white">REFERENCE</th>
                        <th className="py-1 px-2 text-left font-bold w-[45%] border-r border-white">DESIGNATION</th>
                        <th className="py-1 px-2 text-right font-bold w-[15%] border-r border-white">PRIX</th>
                        <th className="py-1 px-2 text-center font-bold w-[10%] border-r border-white">Qté</th>
                        <th className="py-1 px-2 text-right font-bold w-[15%]">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-400">
                          <td className="py-1 px-2 border-l border-r border-gray-400 align-middle">{item.reference}</td>
                          <td className="py-1 px-2 border-r border-gray-400 align-middle font-bold">{item.productName}</td>
                          <td className="py-1 px-2 border-r border-gray-400 text-right align-middle">{formatCurrency(item.unitPrice, settings.currency)}</td>
                          <td className="py-1 px-2 border-r border-gray-400 text-center align-middle">{item.quantity}</td>
                          <td className="py-1 px-2 border-r border-gray-400 text-right align-middle font-semibold">{formatCurrency(item.total, settings.currency)}</td>
                        </tr>
                      ))}
                      {Array.from({ length: emptyRowsCount }).map((_, index) => (
                        <tr key={`empty-${index}`} className="border-b border-gray-400 h-[24px]">
                          <td className="border-l border-r border-gray-400">&nbsp;</td>
                          <td className="border-r border-gray-400"></td>
                          <td className="border-r border-gray-400"></td>
                          <td className="border-r border-gray-400"></td>
                          <td className="border-r border-gray-400"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                   {isLastPage && (
                      <div className="flex justify-between items-start text-xs mt-4">
                          <div className="w-3/5">
                              <table className="w-full border-collapse mb-2">
                                  <tbody>
                                    <tr className="border border-gray-400">
                                        <td className="p-1 pr-4 font-bold">MONTANT TOTAL HORS TAXE:</td>
                                        <td className="p-1 text-right font-semibold">{formatCurrency(quote.subTotal, settings.currency)}</td>
                                    </tr>
                                     <tr className="border border-gray-400">
                                        <td className="p-1 pr-4 font-bold">REMISE {quote.discount}%:</td>
                                        <td className="p-1 text-right font-semibold">{formatCurrency(quote.discountAmount, settings.currency)}</td>
                                    </tr>
                                    <tr className="border border-gray-400">
                                        <td className="p-1 pr-4 font-bold">TVA {quote.vat}%:</td>
                                        <td className="p-1 text-right font-semibold">{formatCurrency(quote.vatAmount, settings.currency)}</td>
                                    </tr>
                                    <tr className="border border-gray-400 bg-gray-200 font-bold">
                                        <td className="p-1 pr-4">MONTANT TOTAL TTC:</td>
                                        <td className="p-1 text-right">{formatCurrency(quote.totalAmount, settings.currency)}</td>
                                    </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                    )}
                </main>

                {/* Page Footer */}
                <footer className="pt-2 mt-auto">
                    {isLastPage && (
                        <div className="flex justify-between items-end text-xs">
                            <div className="w-3/5">
                                <p className="font-semibold">Arrêtée la présente proforma à la somme de :</p>
                                <p className="italic">{totalInWordsString}</p>
                            </div>
                            <div className="w-2/5 text-center">
                                <p className="font-bold">{settings.managerName}</p>
                            </div>
                        </div>
                    )}
                    <div className="text-center text-gray-700 text-[8pt] border-t-2 border-[#002060] pt-1 mt-4">
                       <p>{settings.companyAddress} RCCM: {settings.companyRccm} IFU: {settings.companyIfu}</p>
                       <p>CMF N° 10001-010614200107 Tel: {settings.companyPhone} E-mail: dlgbiomed@gmail.com</p>
                  </div>
                </footer>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
