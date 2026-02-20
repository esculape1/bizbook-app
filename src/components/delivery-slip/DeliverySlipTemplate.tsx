'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function DeliverySlipTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const deliverySlipNumber = `BL-${invoice.invoiceNumber}`;
  
  const ITEMS_PER_PAGE = 13;
  const pages = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    pages.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }
   if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <>
      <style>{`
        @media screen {
          .slip-container {
            width: 100%;
            max-width: 100vw;
            margin: 0 auto;
          }
          @media (max-width: 480px) {
            .printable-area { font-size: 8pt !important; }
            .text-2xl { font-size: 1.25rem !important; }
            th, td { padding: 4px 2px !important; }
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-container:not(:last-child) {
             page-break-after: always;
          }
        }
        .item-table { table-layout: fixed; width: 100%; }
        .col-des { width: 40%; }
        .col-qty-cmd { width: 15%; }
        .col-qty-liv { width: 15%; }
        .col-obs { width: 30%; }
      `}</style>
      <div id="delivery-slip-content" className="slip-container bg-white text-black font-sans text-[10pt] leading-tight printable-area">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const emptyRowsCount = isLastPage ? ITEMS_PER_PAGE - pageItems.length : 0;

          return (
            <div
              key={pageIndex}
              className="page-container bg-white relative mx-auto w-full max-w-[210mm]"
              style={{
                minHeight: '297mm',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                padding: '14mm 10mm 20mm 10mm',
              }}
            >
              {/* Blue sidebar */}
              <div className="absolute top-0 left-0 h-full w-[8mm] bg-[#002060]"></div>
              
              <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  paddingLeft: '5mm',
              }}>
                {/* Header */}
                <header className="mb-4">
                  <div className="flex justify-between items-start gap-2">
                      {/* Left Part: Logo & Title */}
                      <div className="flex-1">
                          {settings.logoUrl && (
                              <Image 
                                  src={settings.logoUrl} 
                                  alt={`${settings.companyName} logo`} 
                                  width={80}
                                  height={40} 
                                  className="object-contain"
                                  data-ai-hint="logo"
                              />
                          )}
                           <h1 className="text-xl md:text-2xl font-bold text-[#1f4e78] mt-2">BORDEREAU DE LIVRAISON</h1>
                      </div>

                      {/* Right Part: Date & Invoice Number */}
                      <div className="text-right text-[8pt] md:text-[9pt] font-bold shrink-0">
                          <p>DATE: {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}</p>
                          <p>N°: {deliverySlipNumber}</p>
                      </div>
                  </div>

                  <div className="flex justify-between items-start mt-4 text-[8pt] md:text-[9pt] gap-4">
                    {/* Company Info */}
                    <div className="flex-1">
                      <p className="font-bold text-[#1f4e78] uppercase border-b border-[#1f4e78] mb-1 pb-0.5">Émetteur</p>
                      <p className="font-bold">{settings.legalName || settings.companyName}</p>
                      <p className="line-clamp-2">{settings.companyAddress}</p>
                      <p>Tél: {settings.companyPhone}</p>
                      <p className="text-[7pt] md:text-[8pt]">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                    </div>

                    {/* Client Info */}
                    <div className="flex-1">
                      <p className="font-bold underline uppercase border-b border-[#1f4e78] mb-1 pb-0.5">Client</p>
                      <p className="font-bold uppercase">{client.name}</p>
                      <p className="line-clamp-2">{client.address}</p>
                      <p>Tel: {client.phone}</p>
                    </div>
                  </div>
                </header>
                
                <main className="flex-grow flex flex-col overflow-x-hidden">
                  <div className="flex-grow">
                    <table className="item-table border-collapse text-[8pt] md:text-[9pt]">
                      <thead className="bg-[#002060] text-white">
                          <tr>
                              <th className="col-des py-1.5 px-1 md:px-2 text-left font-bold border-r border-white/20 uppercase">DÉSIGNATION</th>
                              <th className="col-qty-cmd py-1.5 px-1 md:px-2 text-center font-bold border-r border-white/20 uppercase">QTÉ CMD.</th>
                              <th className="col-qty-liv py-1.5 px-1 md:px-2 text-center font-bold border-r border-white/20 uppercase">QTÉ LIV.</th>
                              <th className="col-obs py-1.5 px-1 md:px-2 text-center font-bold uppercase">OBSERVATIONS</th>
                          </tr>
                      </thead>
                      <tbody>
                          {pageItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-400">
                                <td className="py-1.5 px-1 md:px-2 border-l border-r border-gray-400 align-middle font-bold uppercase truncate">{item.productName}</td>
                                <td className="py-1.5 px-1 md:px-2 border-r border-gray-400 text-center align-middle">{item.quantity}</td>
                                <td className="py-1.5 px-1 md:px-2 border-r border-gray-400 text-center align-middle"></td>
                                <td className="py-1.5 px-1 md:px-2 border-r border-gray-400 text-center align-middle"></td>
                            </tr>
                          ))}
                          {isLastPage && emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, index) => (
                          <tr key={`empty-${index}`} className="border-b border-gray-400">
                              <td className="py-1.5 px-1 md:px-2 border-l border-r border-gray-400">&nbsp;</td>
                              <td className="py-1.5 px-1 md:px-2 border-r border-gray-400"></td>
                              <td className="py-1.5 px-1 md:px-2 border-r border-gray-400"></td>
                              <td className="py-1.5 px-1 md:px-2 border-r border-gray-400"></td>
                          </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </main>
                
                {/* Footer */}
                <footer className="pt-2 mt-auto shrink-0">
                    {isLastPage && (
                        <div className="flex justify-between items-start mt-8 pt-4 border-t-2 border-dashed gap-4">
                            <div className="flex-1 text-center">
                                <p className="font-bold text-[8pt] md:text-[9pt] uppercase underline">Cachet Entreprise</p>
                                <div className="mt-12 border-b-2 border-gray-400"></div>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="font-bold text-[8pt] md:text-[9pt] uppercase underline">Visa Client</p>
                                <div className="mt-12 border-b-2 border-gray-400"></div>
                                <p className="text-[7pt] text-gray-500 mt-1 italic">("Reçu pour le compte de")</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center text-gray-700 text-[7pt] md:text-[8pt] border-t-2 border-[#002060] pt-1 mt-4">
                        <p className="truncate">RCCM: {settings.companyRccm} | IFU: {settings.companyIfu} | {settings.companyAddress}</p>
                        <p className="truncate">Tel: {settings.companyPhone} | E-mail: dlgbiomed@gmail.com</p>
                    </div>
                </footer>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
