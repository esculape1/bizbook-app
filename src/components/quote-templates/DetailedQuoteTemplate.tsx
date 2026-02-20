'use client';

import type { Quote, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function DetailedQuoteTemplate({ quote, client, settings }: { quote: Quote, client: Client, settings: Settings }) {
  const netAPayer = quote.netAPayer ?? quote.totalAmount;
  const retenue = quote.retenue ?? 0;
  const retenueAmount = quote.retenueAmount ?? 0;

  const [totalInWordsString, setTotalInWordsString] = useState('...');

  useEffect(() => {
    if (typeof netAPayer === 'number') {
      setTotalInWordsString(numberToWordsFr(netAPayer, settings.currency));
    }
  }, [netAPayer, settings.currency]);

  return (
    <>
      <style>{`
        .quote-wrapper {
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
        .item-table td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; vertical-align: middle; font-size: 9pt; }
        
        .col-ref { width: 15%; }
        .col-des { width: 45%; }
        .col-pu { width: 15%; }
        .col-qty { width: 10%; }
        .col-tot { width: 15%; }

        .totals-table { width: 100%; max-width: 280px; margin-left: auto; border: 2px solid black; border-collapse: collapse; }
        .totals-table td { padding: 5px 8px; font-size: 9pt; border-bottom: 1px solid #eee; }
        
        @media (max-width: 480px) {
          .quote-wrapper { font-size: 8.5pt; }
          .content-inner { padding: 8mm 5mm 10mm 10mm; }
          .item-table td { font-size: 7.5pt; padding: 4px 2px; }
          .item-table th { font-size: 6.5pt; }
          .totals-table td { font-size: 8pt; padding: 4px 6px; }
        }

        @media print {
          .quote-wrapper { max-width: none; width: 210mm; box-shadow: none; margin: 0; }
          .blue-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .item-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div id="quote-content" className="quote-wrapper">
        <div className="blue-bar"></div>
        <div className="content-inner">
          <header className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {settings.logoUrl && (
                <Image src={settings.logoUrl} alt="Logo" width={80} height={40} className="object-contain" data-ai-hint="logo" />
              )}
              <h1 className="text-xl md:text-2xl font-bold text-[#1f4e78] mt-2 tracking-tight uppercase">FACTURE PROFORMA</h1>
            </div>
            <div className="text-right font-bold text-[8pt] md:text-[9pt] shrink-0">
              <p>DATE: {format(new Date(quote.date), 'dd/MM/yyyy', { locale: fr })}</p>
              <p>N°: {quote.quoteNumber}</p>
              <p className="text-[#1f4e78]">Valable jusqu'au: {format(new Date(quote.expiryDate), 'dd/MM/yyyy', { locale: fr })}</p>
            </div>
          </header>

          <div className="flex justify-between items-start mb-8 gap-4 text-[8pt] md:text-[9pt]">
            <div className="flex-1 border-l-2 border-[#1f4e78] pl-2">
              <p className="font-bold text-[#1f4e78] uppercase mb-1">Émetteur</p>
              <p className="font-bold">{settings.legalName || settings.companyName}</p>
              <p className="line-clamp-2">{settings.companyAddress}</p>
              <p>Tel: {settings.companyPhone}</p>
              <p className="text-[7pt] opacity-70">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
            </div>
            <div className="flex-1 border-l-2 border-[#1f4e78] pl-2">
              <p className="font-bold text-[#1f4e78] uppercase mb-1 underline">Client</p>
              <p className="font-black uppercase">{client.name}</p>
              <p className="italic line-clamp-2">{client.address || '-'}</p>
              <p>Tel: {client.phone || '-'}</p>
              <p className="text-[7pt] opacity-70">IFU: {client.ifu || '-'} / RCCM: {client.rccm || '-'}</p>
            </div>
          </div>

          <main className="flex-grow">
            <table className="item-table">
              <thead>
                <tr>
                  <th className="col-ref text-left">RÉF</th>
                  <th className="col-des text-left">DÉSIGNATION</th>
                  <th className="col-pu text-right">PRIX U.</th>
                  <th className="col-qty text-center">Qté</th>
                  <th className="col-tot text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="text-gray-500 font-medium truncate">{item.reference}</td>
                    <td className="font-bold text-[#002060] uppercase truncate">{item.productName}</td>
                    <td className="text-right tabular-nums">{formatCurrency(item.unitPrice, settings.currency)}</td>
                    <td className="text-center font-bold">{item.quantity}</td>
                    <td className="text-right font-black tabular-nums">{formatCurrency(item.total, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>

          <div className="mt-6">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td className="font-bold uppercase">SOUS-TOTAL:</td>
                  <td className="text-right font-bold tabular-nums">{formatCurrency(quote.subTotal, settings.currency)}</td>
                </tr>
                {quote.discount > 0 && (
                  <tr className="text-gray-600">
                    <td className="uppercase">REMISE {quote.discount}%:</td>
                    <td className="text-right tabular-nums">-{formatCurrency(quote.discountAmount, settings.currency)}</td>
                  </tr>
                )}
                {quote.vat > 0 && (
                  <tr className="text-gray-600">
                    <td className="uppercase">TVA {quote.vat}%:</td>
                    <td className="text-right tabular-nums">+{formatCurrency(quote.vatAmount, settings.currency)}</td>
                  </tr>
                )}
                <tr className="font-bold text-[#002060]">
                  <td className="uppercase">TOTAL TTC:</td>
                  <td className="text-right tabular-nums">{formatCurrency(quote.totalAmount, settings.currency)}</td>
                </tr>
                {retenue > 0 && (
                  <tr className="text-destructive font-bold">
                    <td className="uppercase">RETENUE {retenue}%:</td>
                    <td className="text-right tabular-nums">-{formatCurrency(retenueAmount, settings.currency)}</td>
                  </tr>
                )}
                <tr className="bg-gray-900 text-white font-black">
                  <td className="uppercase text-[9pt] md:text-[10pt]">NET À PAYER:</td>
                  <td className="text-right text-[10pt] md:text-[11pt] tabular-nums">{formatCurrency(netAPayer, settings.currency)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="font-bold text-[8pt] md:text-[9pt] mb-1 underline">Arrêtée la présente proforma à la somme de :</p>
              <p className="italic font-bold text-[9pt] md:text-[10pt] uppercase text-[#002060] leading-snug">
                {totalInWordsString}
              </p>
            </div>

            <div className="flex justify-between items-start mt-10 text-center">
              <div className="w-[120px]">
                <div className="mt-12 border-b-2 border-gray-400"></div>
                <p className="font-bold mt-1 uppercase text-[7pt] md:text-[8pt]">{settings.managerName}</p>
              </div>
              <div className="w-[120px]">
                <p className="font-black uppercase text-[7pt] md:text-[8pt] underline mb-12">Le Client</p>
                <div className="border-b-2 border-gray-400"></div>
              </div>
            </div>
          </div>

          <footer className="text-center text-gray-700 text-[7pt] md:text-[7.5pt] border-t-2 border-[#002060] pt-2 mt-auto">
            <p className="font-bold truncate">RCCM: {settings.companyRccm} | IFU: {settings.companyIfu}</p>
            <p className="truncate">Siège : {settings.companyAddress} | Tel: {settings.companyPhone}</p>
            <p className="italic opacity-50 mt-1">Document généré par BizBook Management Suite</p>
          </footer>
        </div>
      </div>
    </>
  );
}
