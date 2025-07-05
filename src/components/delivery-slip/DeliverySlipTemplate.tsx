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
  const emptyRowsCount = invoice.items.length <= 10 ? Math.max(0, 10 - invoice.items.length) : 0;

  return (
    <div className="bg-white p-6 font-serif text-sm text-gray-800" id="delivery-slip-content">
      {/* Header section with reduced margins */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-1/3">
          {settings.logoUrl && (
            <Image 
                src={settings.logoUrl} 
                alt={`${settings.companyName} logo`} 
                width={40} 
                height={40} 
                className="object-contain"
                data-ai-hint="logo"
            />
          )}
        </div>
        <div className="w-2/3 text-right">
          <h1 className="text-xl font-bold text-gray-900">BORDEREAU DE LIVRAISON</h1>
          <p className="mt-1">{deliverySlipNumber}</p>
          <p className="mt-1 text-gray-500">Date: {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      {/* Company and Client info */}
      <div className="flex justify-between mb-4">
        <div className="w-2/5 space-y-0.5">
          <h2 className="font-bold text-gray-600 border-b pb-1 mb-1">DE</h2>
          <p className="font-bold">{settings.companyName}</p>
          <p>{settings.legalName}</p>
          <p>{settings.companyAddress}</p>
          <p>Tél: {settings.companyPhone}</p>
          <p className="mt-1">IFU: {settings.companyIfu}</p>
          <p>RCCM: {settings.companyRccm}</p>
        </div>
        <div className="w-2/5 space-y-0.5">
          <h2 className="font-bold text-gray-600 border-b pb-1 mb-1">À</h2>
          <p className="font-bold">{client.name}</p>
          <p>{client.address}</p>
          <p>Contact: {client.phone}</p>
          {client.email && <p>Email: {client.email}</p>}
          <p className="mt-1">N° IFU: {client.ifu}</p>
          <p>N° RCCM: {client.rccm}</p>
          <p>Régime Fiscal: {client.taxRegime}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-1 px-1.5 text-left font-bold text-gray-600 uppercase w-[40%] border border-gray-300">Désignation</th>
              <th className="py-1 px-1.5 text-center font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Qté Commandée</th>
              <th className="py-1 px-1.5 text-center font-bold text-gray-600 uppercase w-[15%] border border-gray-300">Qté Livrée</th>
              <th className="py-1 px-1.5 text-center font-bold text-gray-600 uppercase w-[30%] border border-gray-300">Observations</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="py-1 px-1.5 border border-gray-300 h-6 font-bold text-center align-middle">{item.productName}</td>
                <td className="py-1 px-1.5 border border-gray-300 h-6 font-bold text-center align-middle">{item.quantity}</td>
                <td className="py-1 px-1.5 border border-gray-300 h-6 font-bold text-center align-middle"></td>
                <td className="py-1 px-1.5 border border-gray-300 h-6 font-bold text-center align-middle"></td>
              </tr>
            ))}
            {Array.from({ length: emptyRowsCount }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="py-1 px-1.5 h-6 border border-gray-300">&nbsp;</td>
                <td className="py-1 px-1.5 h-6 border border-gray-300"></td>
                <td className="py-1 px-1.5 h-6 border border-gray-300"></td>
                <td className="py-1 px-1.5 h-6 border border-gray-300"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-start mt-8 pt-4 border-t-2 border-dashed">
        <div className="w-2/5 text-center">
            <p className="text-sm">Date de facturation : {format(new Date(invoice.date), 'd MMM yyyy', { locale: fr })}</p>
            <div className="mt-4 border-2 border-dashed h-24 w-48 mx-auto flex items-center justify-center text-gray-400">
                Cachet
            </div>
        </div>
        <div className="w-2/5 text-center">
            <p className="font-bold">Date de reception et visa du client</p>
            <div className="mt-12 border-b-2 border-gray-400 h-8 w-48 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-1">(Précédé de la mention "Reçu pour le compte de")</p>
        </div>
      </div>
    </div>
  );
}
