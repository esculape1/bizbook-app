
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

export function DeliverySlipTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  return (
    <div id="delivery-slip-content" className="printable-area bg-white p-8 font-sans text-sm text-black ring-1 ring-gray-200 w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
        <header className="flex justify-between items-start mb-8 pb-4 border-b">
            <div>
                {settings.logoUrl && <Image src={settings.logoUrl} alt="Logo" width={120} height={60} className="object-contain mb-4" />}
                <h2 className="text-xl font-bold">{settings.companyName}</h2>
                <p className="text-xs">{settings.companyAddress}</p>
            </div>
            <div className="text-right">
                <h1 className="text-2xl font-bold uppercase">Bordereau de Livraison</h1>
                <p className="text-lg font-bold">Réf: BL-{invoice.invoiceNumber}</p>
                <p className="text-sm">Date: {format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
            </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-8">
            <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-bold text-gray-600 uppercase text-xs mb-2">Destinataire :</h3>
                <p className="font-bold">{client.name}</p>
                <p>{client.address || '-'}</p>
                <p>Tél: {client.phone || '-'}</p>
            </div>
        </div>

        <main className="flex-grow">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 border">Désignation</th>
                        <th className="p-2 border text-center">Qté Commandée</th>
                        <th className="p-2 border text-center">Qté Livrée</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border font-medium">{item.productName}</td>
                            <td className="p-2 border text-center font-bold">{item.quantity}</td>
                            <td className="p-2 border text-center"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>

        <footer className="mt-12 pt-4 border-t flex justify-between text-center">
            <div className="flex-1">
                <p className="font-bold underline mb-16">Le Transporteur</p>
                <div className="mx-8 border-b border-gray-400"></div>
            </div>
            <div className="flex-1">
                <p className="font-bold underline mb-16">Visa Client</p>
                <div className="mx-8 border-b border-gray-400"></div>
            </div>
        </footer>
    </div>
  );
}
