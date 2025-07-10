
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

type DeliverySlipTemplateProps = {
  invoice: Invoice;
  client: Client;
  settings: Settings;
};

export function DeliverySlipTemplate({ invoice, client, settings }: DeliverySlipTemplateProps) {
  const deliverySlipNumber = `BL-${invoice.invoiceNumber}`;
  
  const ITEMS_PER_PAGE = 13;
  const pages = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    pages.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <div id="delivery-slip-content" className="printable-area bg-white text-gray-800 font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        {pages.map((pageItems, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;
            const emptyRowsCount = isLastPage ? Math.max(0, ITEMS_PER_PAGE - pageItems.length) : 0;

            return (
                <div key={pageIndex} className="p-4 flex flex-col min-h-[29.7cm]" style={{ fontSize: '14pt', pageBreakAfter: isLastPage ? 'auto' : 'always' }}>
                    {/* Header */}
                    <header className="flex justify-between items-start mb-4">
                        <div className="w-1/3">
                            {settings.logoUrl && (
                                <Image 
                                    src={settings.logoUrl} 
                                    alt={`${settings.companyName} logo`} 
                                    width={128} 
                                    height={128} 
                                    className="object-contain"
                                    data-ai-hint="logo"
                                />
                            )}
                        </div>
                        <div className="w-1/2 text-right">
                            <h1 className="text-xl font-bold text-gray-900" style={{ fontSize: '18pt' }}>BORDEREAU DE LIVRAISON</h1>
                            <p className="mt-1">{deliverySlipNumber}</p>
                            <p className="mt-0.5 text-gray-500">Date: {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
                        </div>
                    </header>
                    
                    {/* Company and Client info */}
                    <div className="flex justify-between mb-4" style={{ fontSize: '12pt' }}>
                        <div className="w-2/5">
                            <h2 className="font-bold text-gray-600 border-b pb-1 mb-2" style={{ fontSize: '14pt' }}>DE</h2>
                            <div className="space-y-0.5">
                                <p className="font-bold">{settings.companyName}</p>
                                <p>{settings.legalName}</p>
                                <p>{settings.companyAddress}</p>
                                <p>Tél: {settings.companyPhone}</p>
                                <p className="mt-1">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                            </div>
                        </div>
                        <div className="w-2/5">
                            <h2 className="font-bold text-gray-600 border-b pb-1 mb-2" style={{ fontSize: '14pt' }}>À</h2>
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

                    {/* Items table */}
                    <main className="flex-grow">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-1 px-2 text-left font-bold uppercase w-[40%] border border-gray-300">Désignation</th>
                                    <th className="py-1 px-2 text-center font-bold uppercase w-[15%] border border-gray-300">Qté Commandée</th>
                                    <th className="py-1 px-2 text-center font-bold uppercase w-[15%] border border-gray-300">Qté Livrée</th>
                                    <th className="py-1 px-2 text-center font-bold uppercase w-[30%] border border-gray-300">Observations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-1 px-2 border border-gray-300 h-6 align-middle">{item.productName}</td>
                                    <td className="py-1 px-2 border border-gray-300 h-6 text-center align-middle">{item.quantity}</td>
                                    <td className="py-1 px-2 border border-gray-300 h-6 text-center align-middle"></td>
                                    <td className="py-1 px-2 border border-gray-300 h-6 text-center align-middle"></td>
                                </tr>
                                ))}
                                {Array.from({ length: emptyRowsCount }).map((_, index) => (
                                <tr key={`empty-${index}`}>
                                    <td className="py-1 px-2 h-6 border border-gray-300">&nbsp;</td>
                                    <td className="py-1 px-2 h-6 border border-gray-300"></td>
                                    <td className="py-1 px-2 h-6 border border-gray-300"></td>
                                    <td className="py-1 px-2 h-6 border border-gray-300"></td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </main>
                    
                    {/* Footer */}
                    {isLastPage && (
                        <footer className="mt-auto pt-4">
                            <div className="flex justify-between items-start mt-4 pt-4 border-t-2 border-dashed">
                                <div className="w-2/5 text-center">
                                    <p style={{ fontSize: '11pt' }}>Date de facturation : {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
                                    <div className="mt-4 border-2 border-dashed h-20 w-32 mx-auto flex items-center justify-center text-gray-400">
                                        Cachet
                                    </div>
                                </div>
                                <div className="w-2/5 text-center">
                                    <p className="font-bold">Date de reception et visa du client</p>
                                    <div className="mt-16 border-b-2 border-gray-400 h-8 w-48 mx-auto"></div>
                                    <p style={{ fontSize: '10pt' }} className="text-gray-500 mt-1">(Précédé de la mention "Reçu pour le compte de")</p>
                                </div>
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
