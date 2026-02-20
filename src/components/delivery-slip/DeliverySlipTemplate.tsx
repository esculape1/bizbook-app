'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function DeliverySlipTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const deliverySlipNumber = `BL-${invoice.invoiceNumber}`;

  return (
    <>
      <style>{`
        .slip-wrapper {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          font-family: 'Inter', sans-serif;
          color: black;
          font-size: 10pt;
          line-height: 1.2;
          position: relative;
          box-sizing: border-box;
        }
        .blue-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 6mm;
          background-color: #002060;
        }
        .content-inner {
          padding: 10mm 10mm 15mm 15mm;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
        }
        .item-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
        .item-table th { background-color: #002060; color: white; padding: 6px 4px; font-weight: 900; font-size: 8pt; text-transform: uppercase; }
        .item-table td { border-bottom: 1px solid #e5e7eb; padding: 10px 4px; vertical-align: middle; font-size: 9pt; }
        
        .col-des { width: 45%; }
        .col-qty-cmd { width: 15%; }
        .col-qty-liv { width: 15%; }
        .col-obs { width: 25%; }

        @media (max-width: 480px) {
          .slip-wrapper { font-size: 8.5pt; }
          .content-inner { padding: 8mm 5mm 10mm 10mm; }
          .item-table td { font-size: 7.5pt; padding: 6px 2px; }
          .item-table th { font-size: 6.5pt; }
        }

        @media print {
          .slip-wrapper { max-width: none; width: 210mm; box-shadow: none; margin: 0; }
          .blue-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .item-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div id="delivery-slip-content" className="slip-wrapper">
        <div className="blue-bar"></div>
        <div className="content-inner">
          <header className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {settings.logoUrl && (
                <Image src={settings.logoUrl} alt="Logo" width={80} height={40} className="object-contain" data-ai-hint="logo" />
              )}
              <h1 className="text-xl md:text-2xl font-black text-[#1f4e78] mt-2 tracking-tight uppercase">BORDEREAU DE LIVRAISON</h1>
            </div>
            <div className="text-right font-bold text-[8pt] md:text-[9pt] shrink-0">
              <p>DATE: {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}</p>
              <p>N°: {deliverySlipNumber}</p>
            </div>
          </header>

          <div className="flex justify-between items-start mb-8 gap-4 text-[8pt] md:text-[9pt]">
            <div className="flex-1 border-l-2 border-[#1f4e78] pl-2">
              <p className="font-black text-[#1f4e78] uppercase mb-1">Émetteur</p>
              <p className="font-bold">{settings.legalName || settings.companyName}</p>
              <p className="line-clamp-2">{settings.companyAddress}</p>
              <p>Tel: {settings.companyPhone}</p>
              <p className="text-[7pt] opacity-70">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
            </div>
            <div className="flex-1 border-l-2 border-[#1f4e78] pl-2">
              <p className="font-black text-[#1f4e78] uppercase mb-1 underline">Client</p>
              <p className="font-black uppercase">{client.name}</p>
              <p className="italic line-clamp-2">{client.address || '-'}</p>
              <p>Tel: {client.phone || '-'}</p>
            </div>
          </div>

          <main className="flex-grow">
            <table className="item-table">
              <thead>
                <tr>
                  <th className="col-des text-left">DÉSIGNATION</th>
                  <th className="col-qty-cmd text-center">QTÉ CMD.</th>
                  <th className="col-qty-liv text-center">QTÉ LIV.</th>
                  <th className="col-obs text-center">OBSERVATIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="font-bold text-[#002060] uppercase truncate">{item.productName}</td>
                    <td className="text-center font-bold">{item.quantity}</td>
                    <td className="text-center border-x border-gray-100"></td>
                    <td className="text-center"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>

          <div className="mt-auto">
            <div className="flex justify-between items-start mb-8 pt-6 border-t-2 border-dashed border-gray-300">
              <div className="flex-1 text-center">
                <p className="font-black uppercase text-[7pt] md:text-[8pt] underline mb-16">Cachet Entreprise</p>
                <div className="border-b-2 border-gray-400 mx-4"></div>
              </div>
              <div className="flex-1 text-center">
                <p className="font-black uppercase text-[7pt] md:text-[8pt] underline mb-16">Visa Client</p>
                <div className="border-b-2 border-gray-400 mx-4"></div>
                <p className="text-[6.5pt] text-gray-500 mt-1 italic">("Reçu pour le compte de")</p>
              </div>
            </div>

            <footer className="text-center text-gray-700 text-[7pt] md:text-[7.5pt] border-t-2 border-[#002060] pt-2">
              <p className="font-bold">RCCM: {settings.companyRccm} | IFU: {settings.companyIfu}</p>
              <p className="truncate">Siège : {settings.companyAddress} | Tel: {settings.companyPhone}</p>
              <p className="italic opacity-50 mt-1">Généré par BizBook Management Suite</p>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
