
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function DeliverySlipTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  const deliverySlipNumber = `BL-${invoice.invoiceNumber}`;
  
  const ITEMS_PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < invoice.items.length; i += ITEMS_PER_PAGE) {
    pages.push(invoice.items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm 10mm 20mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-break-inside {
            page-break-inside: avoid;
          }
          .page-container {
             page-break-after: always;
          }
        }
      `}</style>
      <div id="delivery-slip-content" className="printable-area bg-gray-50 text-gray-800 font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          {pages.map((pageItems, pageIndex) => {
              const isLastPage = pageIndex === pages.length - 1;
              const emptyRowsCount = isLastPage ? Math.max(0, ITEMS_PER_PAGE - pageItems.length - 5) : Math.max(0, ITEMS_PER_PAGE - pageItems.length);

              return (
                  <div key={pageIndex} className="page-container bg-white" style={{
                      width: '210mm',
                      height: '297mm',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxSizing: 'border-box',
                  }}>
                      {/* Decorative Bar */}
                      <div className="absolute top-0 left-0 h-full w-[10mm] bg-primary/80"></div>
                      
                      <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: 1,
                          padding: '20mm 10mm 20mm 10mm',
                          boxSizing: 'border-box',
                      }}>
                          {/* Header */}
                          <header className="flex justify-between items-start mb-8 pl-[10mm]">
                              <div className="w-1/2">
                                  {settings.logoUrl && (
                                      <Image 
                                          src={settings.logoUrl} 
                                          alt={`${settings.companyName} logo`} 
                                          width={120} 
                                          height={60} 
                                          className="object-contain"
                                          data-ai-hint="logo"
                                      />
                                  )}
                              </div>
                              <div className="w-1/2 text-right">
                                  <h1 className="text-2xl font-bold text-gray-900">BORDEREAU DE LIVRAISON</h1>
                                  <p className="mt-1 text-base font-semibold">{deliverySlipNumber}</p>
                                  <p className="mt-2 text-sm text-gray-600">Date: {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
                              </div>
                          </header>
                          
                          {/* Company and Client info */}
                          <div className="flex justify-between mb-8 text-sm pl-[10mm]">
                              <div className="w-2/5">
                                  <h2 className="font-bold text-gray-600 border-b pb-1 mb-2 text-base">DE</h2>
                                  <div className="space-y-px">
                                      <p className="font-bold text-base">{settings.companyName}</p>
                                      <p>{settings.companyAddress}</p>
                                      <p>Tél: {settings.companyPhone}</p>
                                      <p className="mt-1">IFU: {settings.companyIfu} / RCCM: {settings.companyRccm}</p>
                                  </div>
                              </div>
                              <div className="w-2/5">
                                  <h2 className="font-bold text-gray-600 border-b pb-1 mb-2 text-base">À</h2>
                                  <div className="space-y-px">
                                      <p className="font-bold text-base">{client.name}</p>
                                      <p>{client.address}</p>
                                      <p>Contact: {client.phone}</p>
                                  </div>
                              </div>
                          </div>
                          
                          <main className="flex-grow pl-[10mm]">
                              <table className="w-full border-collapse text-sm">
                                  <thead className="bg-gray-100">
                                      <tr>
                                          <th className="py-2 px-2 text-left font-bold uppercase w-[40%] border border-gray-300">Désignation</th>
                                          <th className="py-2 px-2 text-center font-bold uppercase w-[15%] border border-gray-300">Qté Commandée</th>
                                          <th className="py-2 px-2 text-center font-bold uppercase w-[15%] border border-gray-300">Qté Livrée</th>
                                          <th className="py-2 px-2 text-center font-bold uppercase w-[30%] border border-gray-300">Observations</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {pageItems.map((item, index) => (
                                      <tr key={index} style={{ height: '36px' }}>
                                          <td className="py-2 px-2 border border-gray-300 align-middle font-bold">{item.productName}</td>
                                          <td className="py-2 px-2 border border-gray-300 text-center align-middle">{item.quantity}</td>
                                          <td className="py-2 px-2 border border-gray-300 text-center align-middle"></td>
                                          <td className="py-2 px-2 border border-gray-300 text-center align-middle"></td>
                                      </tr>
                                      ))}
                                      {Array.from({ length: emptyRowsCount }).map((_, index) => (
                                      <tr key={`empty-${index}`} style={{ height: '36px' }}>
                                          <td className="py-2 px-2 border border-gray-300">&nbsp;</td>
                                          <td className="py-2 px-2 border border-gray-300"></td>
                                          <td className="py-2 px-2 border border-gray-300"></td>
                                          <td className="py-2 px-2 border border-gray-300"></td>
                                      </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </main>
                          
                          {/* Footer */}
                          <footer className="mt-auto pt-4 pl-[10mm]">
                          {isLastPage && (
                              <div className="flex justify-between items-start mt-8 pt-4 border-t-2 border-dashed no-break-inside">
                                  <div className="w-2/5 text-center">
                                      <p className="font-bold text-sm">Cachet de l'Entreprise</p>
                                      <div className="mt-16 border-b-2 border-gray-400"></div>
                                  </div>
                                  <div className="w-2/5 text-center">
                                      <p className="font-bold text-sm">Visa du Client</p>
                                      <div className="mt-16 border-b-2 border-gray-400"></div>
                                      <p className="text-xs text-gray-500 mt-1">(Précédé de la mention "Reçu pour le compte de")</p>
                                  </div>
                              </div>
                          )}
                          
                          <div className="text-center text-gray-400 text-xs mt-8">
                              Page {pageIndex + 1} / {pages.length}
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
