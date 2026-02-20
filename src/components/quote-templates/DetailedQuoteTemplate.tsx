
'use client';

import type { Quote, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function DetailedQuoteTemplate({ quote, client, settings }: { quote: Quote, client: Client, settings: Settings }) {
  return (
    <div id="quote-content" className="printable-area bg-white p-8 font-sans text-sm text-black ring-1 ring-gray-200 w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
        <header className="flex justify-between items-start mb-8 pb-4 border-b">
            <div>
                {settings.logoUrl && <Image src={settings.logoUrl} alt="Logo" width={120} height={60} className="object-contain mb-4" />}
                <h2 className="text-xl font-bold">{settings.companyName}</h2>
                <p className="text-xs">{settings.companyAddress}</p>
                <p className="text-xs">Tél: {settings.companyPhone}</p>
            </div>
            <div className="text-right">
                <h1 className="text-2xl font-bold uppercase">Facture Proforma</h1>
                <p className="text-lg font-bold">N° {quote.quoteNumber}</p>
                <p className="text-sm">Date: {format(new Date(quote.date), 'dd/MM/yyyy')}</p>
                <p className="text-sm">Validité: {format(new Date(quote.expiryDate), 'dd/MM/yyyy')}</p>
            </div>
        </header>

        <div className="mb-8 p-4 bg-gray-100 rounded-md">
            <h3 className="font-bold text-gray-600 uppercase text-xs mb-2">À l'attention de :</h3>
            <p className="font-bold text-lg">{client.name}</p>
            <p>{client.address || '-'}</p>
            <p>Tél: {client.phone || '-'}</p>
        </div>

        <main className="flex-grow">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 border">Description</th>
                        <th className="p-2 border text-right">PU</th>
                        <th className="p-2 border text-center">Qté</th>
                        <th className="p-2 border text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {quote.items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border font-medium">{item.productName}</td>
                            <td className="p-2 border text-right">{formatCurrency(item.unitPrice, settings.currency)}</td>
                            <td className="p-2 border text-center">{item.quantity}</td>
                            <td className="p-2 border text-right font-bold">{formatCurrency(item.total, settings.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>

        <div className="mt-8 flex justify-end">
            <table className="w-full max-w-[300px]">
                <tbody>
                    <tr><td className="p-2 border font-bold">SOUS-TOTAL</td><td className="p-2 border text-right">{formatCurrency(quote.subTotal, settings.currency)}</td></tr>
                    {quote.discount > 0 && <tr><td className="p-2 border">Remise {quote.discount}%</td><td className="p-2 border text-right">-{formatCurrency(quote.discountAmount, settings.currency)}</td></tr>}
                    {quote.vat > 0 && <tr><td className="p-2 border">TVA {quote.vat}%</td><td className="p-2 border text-right">+{formatCurrency(quote.vatAmount, settings.currency)}</td></tr>}
                    <tr className="bg-gray-100"><td className="p-2 border font-bold">TOTAL TTC</td><td className="p-2 border text-right font-bold text-lg">{formatCurrency(quote.totalAmount, settings.currency)}</td></tr>
                </tbody>
            </table>
        </div>

        <footer className="mt-12 pt-4 border-t flex justify-between">
            <div className="text-xs italic text-gray-500">
                <p>Arrêtée la présente proforma à la somme de :</p>
                <p className="font-bold uppercase text-black">{numberToWordsFr(quote.totalAmount, settings.currency)}</p>
            </div>
            <div className="w-[200px] text-center">
                <p className="font-bold underline mb-16">La Gérance</p>
                <div className="border-b border-gray-400"></div>
                <p className="text-xs mt-1">{settings.managerName}</p>
            </div>
        </footer>
    </div>
  );
}
