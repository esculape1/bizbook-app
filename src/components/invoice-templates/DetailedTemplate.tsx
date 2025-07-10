
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

  const ITEMS_PER_PAGE = 13;
  const pages = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    pages.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <div id="invoice-content" className="printable-area bg-white text-gray-800 font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const emptyRowsCount = isLastPage ? Math.max(0, ITEMS_PER_PAGE - pageItems.length) : 0;

        return (
          <div key={pageIndex} className="p-4 flex flex-col min-h-[29.7cm]" style={{ fontSize: '12pt', pageBreakAfter: isLastPage ? 'auto' : 'always' }}>
            {/* Header */}
            <header className="flex justify-between items-start mb-4">
              <div className="w-1/3">
                {settings.logoUrl && (
                  <Image 
                      src={settings.logoUrl} 
                      alt={`${settings.companyName} logo`} 
                      width={64}
                      height={64} 
                      className="object-contain"
                      data-ai-hint="logo"
                  />
                )}
              </div>
              <div className="w-1/2 text-right">
                <h1 className="text-xl font-bold text-gray-900" style={{ fontSize: '18pt' }}>FACTURE</h1>
                <p className="mt-1">{invoice.invoiceNumber}</p>
                <p className="mt-0.5 text-gray-500">Date: {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
                <p className="text-gray-500">Échéance: {format(new Date(invoice.dueDate), 'd MMM yyyy', { locale: fr })}</p>
              </div>
            </header>

            {/* Company & Client Info */}
            <div className="flex justify-between mb-4" style={{ fontSize: '10pt' }}>
              <div className="w-2/5">
                <h2 className="font-bold text-gray-600 border-b pb-1 mb-2" style={{ fontSize: '12pt' }}>DE</h2>
                <div className="space-y-0.5">
                  <p className="font-bold">{settings.companyName}</p>
                  <p>{settings.legalName}</p>
                  <p>{settings.companyAddress}</p>
                  <p>Tél: {settings.companyPhone}</p>
                  <p className="mt-1">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                </div>
              </div>
              <div className="w-2/5">
                <h2 className="font-bold text-gray-600 border-b pb-1 mb-2" style={{ fontSize: '12pt' }}>À</h2>
                <div className="space-y-0.5">
                  <p className="font-bold">{client.name}</p>
                  <p>{client.address}</p>
                  <p>Contact: {client.phone}</p>
                  {client.email && <p>Email: {client.email}</p>}
                  <p className="mt-1">N° IFU: {client.ifu}</p>
                  <p>N° RCCM: {client.rccm}</p>
                  <p>Régime Fiscal: {client.taxRegime}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <main className="flex-grow">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-1 px-2 text-left font-bold uppercase w-[15%] border border-gray-300">Référence</th>
                    <th className="py-1 px-2 text-left font-bold uppercase w-[40%] border border-gray-300">Désignation</th>
                    <th className="py-1 px-2 text-right font-bold uppercase w-[15%] border border-gray-300">Prix U.</th>
                    <th className="py-1 px-2 text-right font-bold uppercase w-[10%] border border-gray-300">Quantité</th>
                    <th className="py-1 px-2 text-right font-bold uppercase w-[15%] border border-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, index) => (
                    <tr key={index}>
                      <td className="py-1 px-2 border border-gray-300 h-6 text-center align-middle">{item.reference}</td>
                      <td className="py-1 px-2 border border-gray-300 h-6 align-middle">{item.productName}</td>
                      <td className="py-1 px-2 border border-gray-300 h-6 text-right align-middle">{formatCurrency(item.unitPrice, settings.currency)}</td>
                      <td className="py-1 px-2 border border-gray-300 h-6 text-center align-middle">{item.quantity}</td>
                      <td className="py-1 px-2 border border-gray-300 h-6 text-right align-middle">{formatCurrency(item.total, settings.currency)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRowsCount }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      <td className="py-1 px-2 h-6 border border-gray-300">&nbsp;</td>
                      <td className="py-1 px-2 h-6 border border-gray-300"></td>
                      <td className="py-1 px-2 h-6 border border-gray-300"></td>
                      <td className="py-1 px-2 h-6 border border-gray-300"></td>
                      <td className="py-1 px-2 h-6 border border-gray-300"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </main>

            {/* Footer Section - Only on the last page */}
            {isLastPage && (
              <footer className="mt-auto pt-4">
                <div className="flex justify-between items-start mt-2">
                  <div className="w-2/3 pt-1">
                      <p className="font-bold text-gray-700">Arrêtée la présente facture à la somme de :</p>
                      <p className="italic" style={{ fontSize: '11pt' }}>{totalInWordsString}</p>
                  </div>
                  <div className="w-full max-w-[280px]">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-0.5 pr-2 text-gray-600">Montant total:</td>
                          <td className="py-0.5 text-right font-medium">{formatCurrency(invoice.subTotal, settings.currency)}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2 text-gray-600">Remise ({invoice.discount}%):</td>
                          <td className="py-0.5 text-right font-medium">-{formatCurrency(invoice.discountAmount, settings.currency)}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2 text-gray-600">TVA ({invoice.vat}%):</td>
                          <td className="py-0.5 text-right font-medium">+{formatCurrency(invoice.vatAmount, settings.currency)}</td>
                        </tr>
                        <tr className="border-t-2 border-gray-300" style={{ fontSize: '13pt' }}>
                          <td className="pt-1 pr-2 font-bold">Montant Total TTC:</td>
                          <td className="pt-1 text-right font-bold">{formatCurrency(invoice.totalAmount, settings.currency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end items-end mt-4 pt-4">
                  <div className="w-2/5 text-center">
                    <p className="font-bold text-gray-700">Signature et Cachet</p>
                    <div className="mt-12 border-b-2 border-gray-400 h-8 w-full mx-auto"></div>
                    <p className="text-gray-600 mt-1" style={{ fontSize: '10pt' }}>{settings.managerName}</p>
                  </div>
                </div>

                <div className="text-center text-gray-500 border-t pt-2 mt-4" style={{ fontSize: '9pt' }}>
                  <p>Merci de votre confiance.</p>
                  <p>{settings.companyName} - {settings.legalName}</p>
                </div>
              </footer>
            )}
            
            <div className="text-center text-gray-400 text-xs mt-2">
                Page {pageIndex + 1} / {pages.length}
            </div>
          </div>
        );
      })}
    </div>
  );
}
