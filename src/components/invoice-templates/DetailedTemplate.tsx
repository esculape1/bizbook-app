
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
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

export function DetailedTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const [totalInWordsString, setTotalInWordsString] = useState('Chargement...');

  useEffect(() => {
    setTotalInWordsString(numberToWordsFr(invoice.totalAmount, settings.currency));
  }, [invoice.totalAmount, settings.currency]);
  
  const ITEMS_PER_PAGE = 15;
  const pages = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    pages.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm 10mm 20mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      <div id="invoice-content" className="printable-area bg-gray-50 text-gray-800 font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const emptyRowsCount = isLastPage ? Math.max(0, ITEMS_PER_PAGE - pageItems.length - 5) : ITEMS_PER_PAGE - pageItems.length;

          return (
            <div key={pageIndex} className="bg-white" style={{
              width: '210mm',
              height: '297mm',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              pageBreakAfter: isLastPage ? 'auto' : 'always',
              boxSizing: 'border-box',
              padding: '20mm 10mm 20mm 10mm',
            }}>

              {/* Header */}
              <header className="flex justify-between items-start mb-8">
                <div className="w-1/2">
                  <h2 className="font-bold text-gray-600 pb-1 mb-2 text-base">DE</h2>
                  {settings.logoUrl && (
                    <Image 
                        src={settings.logoUrl} 
                        alt={`${settings.companyName} logo`} 
                        width={120}
                        height={60} 
                        className="object-contain mb-2"
                        data-ai-hint="logo"
                    />
                  )}
                  <div className="space-y-px text-sm">
                    <p className="font-bold text-base">{settings.companyName}</p>
                    <p>{settings.legalName}</p>
                    <p>{settings.companyAddress}</p>
                    <p>Tél: {settings.companyPhone}</p>
                    <p className="mt-1">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                  </div>
                </div>
                <div className="w-1/2 text-right">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE</h1>
                    <p className="text-base font-semibold">{invoice.invoiceNumber}</p>
                    <p className="mt-2 text-sm text-gray-600">Date: {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
                    <p className="text-sm text-gray-600">Échéance: {format(new Date(invoice.dueDate), 'd MMMM yyyy', { locale: fr })}</p>

                    <div className="mt-8">
                        <h2 className="font-bold text-gray-600 pb-1 mb-2 text-base">À</h2>
                        <div className="space-y-px text-sm">
                            <p className="font-bold text-base">{client.name}</p>
                            <p>{client.address}</p>
                            <p>Contact: {client.phone}</p>
                            {client.email && <p>Email: {client.email}</p>}
                            <p className="mt-1">N° IFU: {client.ifu}</p>
                        </div>
                    </div>
                </div>
              </header>
              
              <main className="flex-grow">
                {/* Items Table */}
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-2 text-left font-bold uppercase w-[15%] border border-gray-300">Référence</th>
                      <th className="py-2 px-2 text-left font-bold uppercase w-[40%] border border-gray-300">Désignation</th>
                      <th className="py-2 px-2 text-right font-bold uppercase w-[15%] border border-gray-300">Prix U.</th>
                      <th className="py-2 px-2 text-right font-bold uppercase w-[10%] border border-gray-300">Quantité</th>
                      <th className="py-2 px-2 text-right font-bold uppercase w-[15%] border border-gray-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 px-2 border border-gray-300 text-center align-middle">{item.reference}</td>
                        <td className="py-2 px-2 border border-gray-300 align-middle font-bold">{item.productName}</td>
                        <td className="py-2 px-2 border border-gray-300 text-right align-middle">{formatCurrency(item.unitPrice, settings.currency)}</td>
                        <td className="py-2 px-2 border border-gray-300 text-center align-middle">{item.quantity}</td>
                        <td className="py-2 px-2 border border-gray-300 text-right align-middle">{formatCurrency(item.total, settings.currency)}</td>
                      </tr>
                    ))}
                    {Array.from({ length: emptyRowsCount }).map((_, index) => (
                      <tr key={`empty-${index}`} style={{ height: '38px' }}>
                        <td className="py-2 px-2 border border-gray-300">&nbsp;</td>
                        <td className="py-2 px-2 border border-gray-300"></td>
                        <td className="py-2 px-2 border border-gray-300"></td>
                        <td className="py-2 px-2 border border-gray-300"></td>
                        <td className="py-2 px-2 border border-gray-300"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </main>

              {/* Page Footer */}
              <footer className="mt-4">
                 {isLastPage && (
                    <div className="flex justify-between items-start">
                        <div className="w-2/3 pt-2">
                            <p className="font-bold text-gray-700 text-sm">Arrêtée la présente facture à la somme de :</p>
                            <p className="italic text-sm">{totalInWordsString}</p>
                        </div>
                        <div className="w-full max-w-xs text-sm">
                        <table className="w-full">
                            <tbody>
                            <tr>
                                <td className="py-1 pr-2 text-gray-600">Montant total:</td>
                                <td className="py-1 text-right font-medium">{formatCurrency(invoice.subTotal, settings.currency)}</td>
                            </tr>
                            <tr>
                                <td className="py-1 pr-2 text-gray-600">Remise ({invoice.discount}%):</td>
                                <td className="py-1 text-right font-medium">-{formatCurrency(invoice.discountAmount, settings.currency)}</td>
                            </tr>
                            <tr>
                                <td className="py-1 pr-2 text-gray-600">TVA ({invoice.vat}%):</td>
                                <td className="py-1 text-right font-medium">+{formatCurrency(invoice.vatAmount, settings.currency)}</td>
                            </tr>
                            <tr className="border-t-2 border-gray-400 font-bold text-base">
                                <td className="pt-1 pr-2">Montant Total TTC:</td>
                                <td className="pt-1 text-right">{formatCurrency(invoice.totalAmount, settings.currency)}</td>
                            </tr>
                            </tbody>
                        </table>
                        </div>
                    </div>
                 )}
                <div className="flex justify-between items-end mt-12">
                     <div className="text-center text-gray-600 text-xs">
                        <p>Merci de votre confiance.</p>
                        <p>{settings.companyName} - {settings.legalName} - Tél: {settings.companyPhone}</p>
                     </div>
                     {isLastPage && (
                        <div className="w-2/5 text-center">
                            <p className="font-bold text-gray-700 text-sm">Signature et Cachet</p>
                            <div className="mt-16 border-b-2 border-gray-400 h-8 w-full mx-auto"></div>
                            <p className="text-gray-600 mt-1 text-sm">{settings.managerName}</p>
                        </div>
                     )}
                </div>
                 <div className="text-center text-gray-400 text-xs mt-4">
                    Page {pageIndex + 1} / {pages.length}
                </div>
              </footer>
            </div>
          );
        })}
      </div>
    </>
  );
}
