
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
  const emptyRowsCount = invoice.items.length <= 15 ? Math.max(0, 15 - invoice.items.length) : 0;

  return (
    <div className="bg-white p-4 font-serif text-[10pt] text-gray-800 min-h-[29.7cm] flex flex-col printable-area" id="delivery-slip-content">
      {/* Header section with reduced margins */}
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
        <div className="w-2/3 text-right">
          <h1 className="text-lg font-bold text-gray-900">BORDEREAU DE LIVRAISON</h1>
          <p className="mt-1 text-xs">{deliverySlipNumber}</p>
          <p className="mt-0.5 text-xs text-gray-500">Date: {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      {/* Company and Client info */}
      <div className="flex justify-between mb-3 text-[9pt]">
        <div className="w-2/5">
          <h2 className="font-bold text-gray-600 border-b pb-0.5 mb-1 text-[10pt]">DE</h2>
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
          <h2 className="font-bold text-gray-600 border-b pb-0.5 mb-1 text-[10pt]">À</h2>
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

      {/* Items table */}
      <div className="overflow-x-auto flex-grow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-[9pt]">
            <tr>
              <th className="py-1 px-1 text-left font-bold text-gray-600 uppercase w-[40%] border border-gray-300">Désignation</th>
              <th className="py-1 px-1 text-center font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Qté Commandée</th>
              <th className="py-1 px-1 text-center font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Qté Livrée</th>
              <th className="py-1 px-1 text-center font-bold text-gray-600 uppercase w-[30%] border border-gray-300">Observations</th>
            </tr>
          </thead>
          <tbody className="text-[9pt]">
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="py-0.5 px-1 border border-gray-300 h-5 align-middle">{item.productName}</td>
                <td className="py-0.5 px-1 border border-gray-300 h-5 text-center align-middle">{item.quantity}</td>
                <td className="py-0.5 px-1 border border-gray-300 h-5 text-center align-middle"></td>
                <td className="py-0.5 px-1 border border-gray-300 h-5 text-center align-middle"></td>
              </tr>
            ))}
            {Array.from({ length: emptyRowsCount }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="py-0.5 px-1 h-5 border border-gray-300">&nbsp;</td>
                <td className="py-0.5 px-1 h-5 border border-gray-300"></td>
                <td className="py-0.5 px-1 h-5 border border-gray-300"></td>
                <td className="py-0.5 px-1 h-5 border border-gray-300"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-start mt-4 pt-4 border-t-2 border-dashed">
        <div className="w-2/5 text-center">
            <p className="text-xs">Date de facturation : {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
            <div className="mt-4 border-2 border-dashed h-20 w-40 mx-auto flex items-center justify-center text-gray-400">
                Cachet
            </div>
        </div>
        <div className="w-2/5 text-center">
            <p className="font-bold text-sm">Date de reception et visa du client</p>
            <div className="mt-12 border-b-2 border-gray-400 h-8 w-48 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-1">(Précédé de la mention "Reçu pour le compte de")</p>
        </div>
      </div>
    </div>
  );
}
