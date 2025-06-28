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
  const emptyRowsCount = Math.max(0, 15 - invoice.items.length);

  return (
    <div className="bg-white p-8 font-sans text-sm text-gray-800" id="delivery-slip-content">
      <div className="flex justify-between items-start mb-2 p-2">
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
        <div className="w-1/3 text-right">
          <h1 className="text-xl font-bold text-gray-900">BORDEREAU DE LIVRAISON</h1>
          <p className="mt-2">{deliverySlipNumber}</p>
          <p className="mt-1 text-gray-500">Date: {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      <div className="flex justify-between mb-4 p-4">
        <div className="w-2/5">
          <h2 className="font-bold text-gray-600 border-b pb-2 mb-2">DE</h2>
          <p className="font-bold text-lg">{settings.companyName}</p>
          <p>{settings.legalName}</p>
          <p>{settings.companyAddress}</p>
          <p>Tél: {settings.companyPhone}</p>
          <p className="mt-2">IFU: {settings.companyIfu}</p>
          <p>RCCM: {settings.companyRccm}</p>
        </div>
        <div className="w-2/5">
          <h2 className="font-bold text-gray-600 border-b pb-2 mb-2">À</h2>
          <p className="font-bold text-lg">{client.name}</p>
          <p>{client.address}</p>
          <p>Contact: {client.phone}</p>
          {client.email && <p>Email: {client.email}</p>}
          <p className="mt-2">N° IFU: {client.ifu}</p>
          <p>N° RCCM: {client.rccm}</p>
          <p>Régime Fiscal: {client.taxRegime}</p>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-1 px-2 text-left font-bold text-gray-600 uppercase w-1/4 border border-gray-300">Désignation</th>
              <th className="py-1 px-2 text-center font-bold text-gray-600 uppercase w-1/4 border border-gray-300">Qté Commandée</th>
              <th className="py-1 px-2 text-center font-bold text-gray-600 uppercase w-1/4 border border-gray-300">Qté Livrée</th>
              <th className="py-1 px-2 text-center font-bold text-gray-600 uppercase w-1/4 border border-gray-300">Observations</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="py-1 px-2 align-top border border-gray-300 h-8">{item.productName}</td>
                <td className="py-1 px-2 text-center align-top border border-gray-300">{item.quantity}</td>
                <td className="py-1 px-2 text-center align-top border border-gray-300"></td>
                <td className="py-1 px-2 text-center align-top border border-gray-300"></td>
              </tr>
            ))}
            {Array.from({ length: emptyRowsCount }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="py-1 px-2 h-8 border border-gray-300">&nbsp;</td>
                <td className="border border-gray-300"></td>
                <td className="border border-gray-300"></td>
                <td className="border border-gray-300"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-start mt-4 pt-6 p-4 border-t-2 border-dashed">
        <div className="w-2/5 text-center">
            <p>Date de facturation : {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
            <div className="mt-4 border-2 border-dashed h-24 w-48 mx-auto flex items-center justify-center text-gray-400">
                Cachet de l'entreprise
            </div>
        </div>
        <div className="w-2/5 text-center">
            <p className="font-bold">Date de reception et visa du client</p>
            <div className="mt-12 border-b-2 border-gray-400 h-12 w-48 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-1">(Précédé de la mention "Reçu pour le compte de")</p>
        </div>
      </div>
    </div>
  );
}
