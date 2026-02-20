'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function DetailedTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const vat = Number(invoice.vat) || 0;
  const retenue = Number(invoice.retenue) || 0;
  const discount = Number(invoice.discount) || 0;
  const netAPayer = invoice.netAPayer ?? invoice.totalAmount;

  return (
    <div id="invoice-content" className="printable-area bg-white p-8 font-sans text-sm text-black ring-1 ring-gray-200 w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
        {/* Header d'origine */}
        <header className="flex justify-between items-start mb-8 pb-4 border-b-2">
            <div>
                {settings.logoUrl && <Image src={settings.logoUrl} alt="Logo" width={120} height={60} className="object-contain mb-4" />}
                <h2 className="text-xl font-bold uppercase">{settings.companyName}</h2>
                <p className="text-xs">{settings.companyAddress}</p>
                <p className="text-xs">Tél: {settings.companyPhone}</p>
                <p className="text-[10px] font-semibold mt-1">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
            </div>
            <div className="text-right">
                <h1 className="text-3xl font-bold uppercase">Facture</h1>
                <p className="text-lg font-bold">N° {invoice.invoiceNumber}</p>
                <p className="text-sm">Date: {format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                <p className="text-sm">Échéance: {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</p>
            </div>
        </header>

        {/* Section Client */}
        <div className="mb-8 grid grid-cols-2 gap-8">
            <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-bold text-gray-600 uppercase text-[10px] mb-2">Facturé à :</h3>
                <p className="font-bold text-lg uppercase">{client.name}</p>
                <p className="text-xs">{client.address || '-'}</p>
                <p className="text-xs">Tél: {client.phone || '-'}</p>
                {client.ifu && <p className="text-xs">IFU: {client.ifu}</p>}
            </div>
        </div>

        {/* Tableau des articles */}
        <main className="flex-grow">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-200 text-[10px] uppercase">
                        <th className="p-2 border w-[45%]">Désignation</th>
                        <th className="p-2 border text-right">Prix Unitaire</th>
                        <th className="p-2 border text-center">Qté</th>
                        <th className="p-2 border text-right">Montant</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {invoice.items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border">
                                <p className="font-bold uppercase">{item.productName}</p>
                                <p className="text-[9px] text-gray-500">Réf: {item.reference}</p>
                            </td>
                            <td className="p-2 border text-right">{formatCurrency(item.unitPrice, settings.currency)}</td>
                            <td className="p-2 border text-center">{item.quantity}</td>
                            <td className="p-2 border text-right font-bold">{formatCurrency(item.total, settings.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>

        {/* Section Totaux - Toujours afficher TVA et Retenue */}
        <div className="mt-8 flex justify-end">
            <table className="w-full max-w-[350px] text-xs">
                <tbody>
                    <tr>
                        <td className="p-2 border font-bold uppercase">Sous-Total Brut</td>
                        <td className="p-2 border text-right">{formatCurrency(invoice.subTotal, settings.currency)}</td>
                    </tr>
                    {discount > 0 && (
                        <tr>
                            <td className="p-2 border">Remise ({discount}%)</td>
                            <td className="p-2 border text-right">-{formatCurrency(invoice.discountAmount || 0, settings.currency)}</td>
                        </tr>
                    )}
                    <tr>
                        <td className="p-2 border font-bold uppercase">Sous-Total Hors Taxes</td>
                        <td className="p-2 border text-right font-bold">{formatCurrency(invoice.subTotal - (invoice.discountAmount || 0), settings.currency)}</td>
                    </tr>
                    <tr>
                        <td className="p-2 border">TVA ({vat}%)</td>
                        <td className="p-2 border text-right">+{formatCurrency(invoice.vatAmount || 0, settings.currency)}</td>
                    </tr>
                    <tr>
                        <td className="p-2 border font-bold uppercase">Total TTC</td>
                        <td className="p-2 border text-right font-bold">{formatCurrency(invoice.totalAmount, settings.currency)}</td>
                    </tr>
                    <tr>
                        <td className="p-2 border text-destructive">Retenue à la source ({retenue}%)</td>
                        <td className="p-2 border text-right text-destructive">-{formatCurrency(invoice.retenueAmount || 0, settings.currency)}</td>
                    </tr>
                    <tr className="bg-gray-100 font-black text-sm">
                        <td className="p-2 border uppercase">Net à Payer</td>
                        <td className="p-2 border text-right">{formatCurrency(netAPayer, settings.currency)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Pied de page d'origine */}
        <footer className="mt-12 pt-4 border-t flex flex-col gap-8">
            <div className="text-xs italic space-y-1">
                <p>Arrêtée la présente facture à la somme de :</p>
                <p className="font-bold uppercase text-sm not-italic">{numberToWordsFr(netAPayer, settings.currency)}</p>
            </div>
            
            <div className="flex justify-end">
                <div className="w-[220px] text-center">
                    <p className="font-bold underline mb-16 uppercase text-[10px]">La Gérance</p>
                    <div className="border-b border-gray-400"></div>
                    <p className="text-xs font-bold mt-2 uppercase">{settings.managerName}</p>
                </div>
            </div>
        </footer>
    </div>
  );
}
