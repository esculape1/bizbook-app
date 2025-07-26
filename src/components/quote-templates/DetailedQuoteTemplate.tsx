
'use client';

import type { Quote, Client, Settings } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { ToWords } from 'to-words';
import { useState, useEffect } from 'react';

// Helper function to convert number to French words for currency
const numberToWordsFr = (amount: number, currency: Settings['currency']): string => {
    const currencyInfo = {
        EUR: { name: 'Euro', plural: 'Euros', fractionalUnit: { name: 'Centime', plural: 'Centimes' } },
        USD: { name: 'Dollar', plural: 'Dollars', fractionalUnit: { name: 'Centime', plural: 'Centimes' } },
        GBP: { name: 'Livre Sterling', plural: 'Livres Sterling', fractionalUnit: { name: 'Penny', plural: 'Pence' } },
        XOF: { name: 'Franc CFA', plural: 'Francs CFA', fractionalUnit: { name: '', plural: '' } }, // No fractional part for XOF
    };
    
    const selectedCurrency = currencyInfo[currency];

    const toWordsInstance = new ToWords({
        localeCode: 'fr-FR',
        converterOptions: {
            currency: true,
            ignoreDecimal: !selectedCurrency.fractionalUnit.name,
            currencyOptions: {
                name: selectedCurrency.name,
                plural: selectedCurrency.plural,
                symbol: '', // We don't need the symbol in the words
                fractionalUnit: {
                    name: selectedCurrency.fractionalUnit.name,
                    plural: selectedCurrency.fractionalUnit.plural,
                    symbol: '',
                },
            }
        }
    });
    
    let words = toWordsInstance.convert(amount);
    words = words.replace(/ et zéro centimes?/i, '').replace(/ seulement/i, '');
    return words.charAt(0).toUpperCase() + words.slice(1);
};

export function DetailedQuoteTemplate({ quote, client, settings }: { quote: Quote, client: Client, settings: Settings }) {
  const [totalInWordsString, setTotalInWordsString] = useState('Chargement...');

  useEffect(() => {
    setTotalInWordsString(numberToWordsFr(quote.totalAmount, settings.currency));
  }, [quote.totalAmount, settings.currency]);

  const ITEMS_PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < quote.items.length; i += ITEMS_PER_PAGE) {
    pages.push(quote.items.slice(i, i + ITEMS_PER_PAGE));
  }
  
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
          .page-container:not(:last-child) {
             page-break-after: always;
          }
        }
      `}</style>
      <div id="quote-content" className="printable-area bg-gray-50 text-gray-800 font-sans">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const emptyRowsCount = ITEMS_PER_PAGE - pageItems.length;
          
          return (
            <div key={pageIndex} className="page-container bg-white relative" style={{
              width: '210mm',
              minHeight: '297mm',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              padding: '20mm 10mm 20mm 10mm',
            }}>
              {/* Decorative Bar */}
              <div className="absolute top-0 left-0 h-full w-[10mm] bg-primary/80"></div>
              
              <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  paddingLeft: '10mm',
              }}>
                {/* Header */}
                <header className="flex justify-between items-start mb-8 text-sm">
                    <div className="w-1/2 space-y-2">
                        <p className="font-semibold text-gray-500">DE</p>
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
                        <div className="space-y-px text-xs leading-snug">
                            <p className="font-bold text-base">{settings.companyName}</p>
                            <p>{settings.legalName}</p>
                            <p>{settings.companyAddress}</p>
                            <p>Tél: {settings.companyPhone}</p>
                            <p>IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                        </div>
                    </div>
                    <div className="w-1/2 text-right">
                        <h1 className="text-4xl font-bold text-gray-900">PROFORMA</h1>
                        <p className="text-base font-semibold mt-1">{quote.quoteNumber}</p>
                        <p className="text-xs text-gray-600 mt-2">Date: {format(new Date(quote.date), 'd MMMM yyyy', { locale: fr })}</p>
                        <p className="text-xs text-gray-600">Valable jusqu'au: {format(new Date(quote.expiryDate), 'd MMMM yyyy', { locale: fr })}</p>

                        <div className="mt-6 text-left">
                            <p className="font-semibold text-gray-500">À</p>
                            <div className="space-y-px text-xs leading-snug">
                                <p className="font-bold text-base">{client.name}</p>
                                <p>{client.address}</p>
                                <p>Contact: {client.phone}</p>
                                {client.ifu && <p>N° IFU: {client.ifu}</p>}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-grow">
                  {/* Items Table */}
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-2 text-left font-semibold uppercase w-[15%] border border-gray-300">Référence</th>
                        <th className="py-2 px-2 text-left font-semibold uppercase w-[40%] border border-gray-300">Désignation</th>
                        <th className="py-2 px-2 text-right font-semibold uppercase w-[15%] border border-gray-300">Prix U.</th>
                        <th className="py-2 px-2 text-right font-semibold uppercase w-[10%] border border-gray-300">Quantité</th>
                        <th className="py-2 px-2 text-right font-semibold uppercase w-[20%] border border-gray-300">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, index) => (
                        <tr key={index}>
                          <td className="py-1 px-2 border border-gray-300 h-8 align-middle">{item.reference}</td>
                          <td className="py-1 px-2 border border-gray-300 align-middle font-semibold">{item.productName}</td>
                          <td className="py-1 px-2 border border-gray-300 text-right align-middle">{formatCurrency(item.unitPrice, settings.currency)}</td>
                          <td className="py-1 px-2 border border-gray-300 text-center align-middle">{item.quantity}</td>
                          <td className="py-1 px-2 border border-gray-300 text-right align-middle font-semibold">{formatCurrency(item.total, settings.currency)}</td>
                        </tr>
                      ))}
                      {isLastPage && Array.from({ length: emptyRowsCount }).map((_, index) => (
                        <tr key={`empty-${index}`}>
                          <td className="py-1 px-2 border border-gray-300 h-8">&nbsp;</td>
                          <td className="py-1 px-2 border border-gray-300"></td>
                          <td className="py-1 px-2 border border-gray-300"></td>
                          <td className="py-1 px-2 border border-gray-300"></td>
                          <td className="py-1 px-2 border border-gray-300"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </main>

                {/* Page Footer */}
                <footer className="pt-4 mt-auto">
                    {isLastPage && (
                      <div className="flex justify-between items-start text-xs mb-8">
                          <div className="w-1/2 pt-2">
                              <p className="font-semibold text-gray-700">Arrêtée la présente proforma à la somme de :</p>
                              <p className="italic text-gray-600">{totalInWordsString}</p>
                          </div>
                          <div className="w-2/5">
                            <table className="w-full">
                                <tbody>
                                  <tr>
                                      <td className="py-1 pr-4 text-gray-600">Montant total:</td>
                                      <td className="py-1 text-right font-semibold">{formatCurrency(quote.subTotal, settings.currency)}</td>
                                  </tr>
                                  <tr>
                                      <td className="py-1 pr-4 text-gray-600">Remise ({quote.discount}%):</td>
                                      <td className="py-1 text-right font-semibold">-{formatCurrency(quote.discountAmount, settings.currency)}</td>
                                  </tr>
                                  <tr>
                                      <td className="py-1 pr-4 text-gray-600">TVA ({quote.vat}%):</td>
                                      <td className="py-1 text-right font-semibold">+{formatCurrency(quote.vatAmount, settings.currency)}</td>
                                  </tr>
                                  <tr className="border-t-2 border-gray-400 font-bold text-sm">
                                      <td className="pt-1 pr-4">Montant Total TTC:</td>
                                      <td className="pt-1 text-right">{formatCurrency(quote.totalAmount, settings.currency)}</td>
                                  </tr>
                                </tbody>
                            </table>
                          </div>
                      </div>
                    )}
                    {isLastPage && (
                        <div className="flex justify-end text-xs mb-4">
                            <div className="w-2/5 text-center">
                                <p className="font-semibold">Signature et Cachet</p>
                                <div className="mt-16 border-b border-gray-400"></div>
                                <p className="mt-1">{settings.managerName}</p>
                            </div>
                        </div>
                    )}
                  
                    <div className="text-center text-gray-500 text-xs border-t pt-2">
                      <p>Merci de votre confiance.</p>
                      <p>{settings.companyName} - {settings.legalName} - Tél: {settings.companyPhone}</p>
                      <p className="mt-2">Page {pageIndex + 1} / {pages.length}</p>
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
