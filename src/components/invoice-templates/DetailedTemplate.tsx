
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
    // The library adds "Seulement" at the end, which we can remove if not desired.
    // Also remove "et zéro centime" for whole numbers.
    words = words.replace(/ et zéro centimes?/i, '').replace(/ seulement/i, '');
    return words.charAt(0).toUpperCase() + words.slice(1);
};

export function DetailedTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const [totalInWordsString, setTotalInWordsString] = useState('Chargement...');

  useEffect(() => {
    setTotalInWordsString(numberToWordsFr(invoice.totalAmount, settings.currency));
  }, [invoice.totalAmount, settings.currency]);

  // Adjust empty rows logic to fit more content on one page.
  const emptyRowsCount = invoice.items.length <= 18 ? Math.max(0, 18 - invoice.items.length) : 0;

  return (
    // A4 sizing and margins simulation with more compact layout
    <div className="bg-white p-4 font-serif text-[9pt] text-gray-800 min-h-[29.7cm] flex flex-col printable-area" id="invoice-content">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="w-1/3">
          {settings.logoUrl && (
            <Image 
                src={settings.logoUrl} 
                alt={`${settings.companyName} logo`} 
                width={36}
                height={36} 
                className="object-contain"
                data-ai-hint="logo"
            />
          )}
        </div>
        <div className="w-1/3 text-right">
          <h1 className="text-lg font-bold text-gray-900">FACTURE</h1>
          <p className="mt-1 text-xs">{invoice.invoiceNumber}</p>
          <p className="mt-0.5 text-xs text-gray-500">Date: {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
          <p className="text-xs text-gray-500">Échéance: {format(new Date(invoice.dueDate), 'd MMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      {/* Company & Client Info */}
      <div className="flex justify-between mb-2 text-[8pt]">
        <div className="w-2/5">
          <h2 className="font-bold text-gray-600 border-b pb-0.5 mb-1 text-[9pt]">DE</h2>
          <div className="space-y-px">
            <p className="font-bold">{settings.companyName}</p>
            <p>{settings.legalName}</p>
            <p>{settings.companyAddress}</p>
            <p>Tél: {settings.companyPhone}</p>
            <p className="mt-1">IFU: {settings.companyIfu}</p>
            <p>RCCM: {settings.companyRccm}</p>
          </div>
        </div>
        <div className="w-2/5">
          <h2 className="font-bold text-gray-600 border-b pb-0.5 mb-1 text-[9pt]">À</h2>
          <div className="space-y-px">
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
      <div className="overflow-x-auto flex-grow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-[8pt]">
            <tr>
              <th className="py-0.5 px-1 text-left font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Référence</th>
              <th className="py-0.5 px-1 text-left font-bold text-gray-600 uppercase w-[40%] border border-gray-300">Désignation</th>
              <th className="py-0.5 px-1 text-right font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Prix U.</th>
              <th className="py-0.5 px-1 text-right font-bold text-gray-600 uppercase w-[10%] border border-gray-300">Quantité</th>
              <th className="py-0.5 px-1 text-right font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody className="text-[9pt]">
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="py-0.5 px-1 border border-gray-300 h-4 text-center align-middle">{item.reference}</td>
                <td className="py-0.5 px-1 border border-gray-300 h-4 align-middle">{item.productName}</td>
                <td className="py-0.5 px-1 border border-gray-300 h-4 text-right align-middle">{formatCurrency(item.unitPrice, settings.currency)}</td>
                <td className="py-0.5 px-1 border border-gray-300 h-4 text-center align-middle">{item.quantity}</td>
                <td className="py-0.5 px-1 border border-gray-300 h-4 text-right align-middle">{formatCurrency(item.total, settings.currency)}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRowsCount }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="py-0.5 px-1 h-4 border border-gray-300">&nbsp;</td>
                <td className="py-0.5 px-1 h-4 border border-gray-300"></td>
                <td className="py-0.5 px-1 h-4 border border-gray-300"></td>
                <td className="py-0.5 px-1 h-4 border border-gray-300"></td>
                <td className="py-0.5 px-1 h-4 border border-gray-300"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals and Signature */}
      <div className="flex justify-between items-start mt-2 text-[9pt]">
        <div className="w-2/3 pt-1">
            <p className="font-bold text-gray-700">Arrêtée la présente facture à la somme de :</p>
            <p className="italic text-[8pt]">{totalInWordsString}</p>
        </div>
        <div className="w-full max-w-[240px]">
          <table className="w-full text-[9pt]">
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
              <tr className="border-t-2 border-gray-300 text-[10pt]">
                <td className="pt-1 pr-2 font-bold">Montant Total TTC:</td>
                <td className="pt-1 text-right font-bold">{formatCurrency(invoice.totalAmount, settings.currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end items-end mt-1 pt-1">
        <div className="w-2/5 text-center">
          <p className="font-bold text-gray-700 text-[9pt]">Signature et Cachet</p>
          <div className="mt-8 border-b-2 border-gray-400 h-8 w-full mx-auto"></div>
          <p className="text-gray-600 mt-1 text-[8pt]">{settings.managerName}</p>
        </div>
      </div>

      <div className="text-center text-[7pt] text-gray-500 border-t pt-1 mt-auto">
        <p>Merci de votre confiance.</p>
        <p>{settings.companyName} - {settings.legalName}</p>
      </div>
    </div>
  );
}
