
'use client';

import type { Invoice, Client, Settings } from '@/lib/types';
import { formatCurrency, numberToWordsFr } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

export function DetailedTemplate({ invoice, client, settings }: { invoice: Invoice, client: Client, settings: Settings }) {
  // Sécurisation des valeurs numériques
  const vat = Number(invoice.vat) || 0;
  const retenue = Number(invoice.retenue) || 0;
  const discount = Number(invoice.discount) || 0;
  const netAPayer = invoice.netAPayer ?? invoice.totalAmount;

  return (
    <div id="invoice-content" className="printable-area bg-white p-8 font-sans text-sm text-black ring-1 ring-gray-200 w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col">
        {/* Header Premium */}
        <header className="flex justify-between items-start mb-8 pb-6 border-b-4 border-primary">
            <div className="flex items-center gap-6">
                {settings.logoUrl && (
                  <div className="shrink-0">
                    <Image src={settings.logoUrl} alt="Logo" width={120} height={120} className="object-contain" />
                  </div>
                )}
                <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-primary leading-none">{settings.companyName}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{settings.legalName}</p>
                    <div className="text-xs font-medium space-y-0.5 mt-2">
                        <p>{settings.companyAddress}</p>
                        <p>Tél: {settings.companyPhone}</p>
                        <p className="text-[10px] font-black mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded">
                            IFU: {settings.companyIfu} | RCCM: {settings.companyRccm}
                        </p>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-primary">Facture</h1>
                <p className="text-xl font-black mt-1">N° {invoice.invoiceNumber}</p>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest">Date: <span className="font-black">{format(new Date(invoice.date), 'dd/MM/yyyy')}</span></p>
                  <p className="text-xs font-bold uppercase tracking-widest text-destructive">Échéance: <span className="font-black">{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</span></p>
                </div>
            </div>
        </header>

        {/* Client & Infos */}
        <div className="mb-8 grid grid-cols-2 gap-12">
            <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8"></div>
                <h3 className="font-black text-primary uppercase text-[10px] tracking-[0.2em] mb-4 border-b-2 border-primary/10 pb-1 inline-block">Facturé à :</h3>
                <p className="font-black text-xl uppercase tracking-tight leading-none text-foreground mb-2">{client.name}</p>
                <div className="text-xs space-y-1 font-bold text-muted-foreground">
                    <p>{client.address || 'Adresse non spécifiée'}</p>
                    <p>Contact: {client.phone || '-'}</p>
                    {client.ifu && <p className="text-primary/80">IFU: {client.ifu}</p>}
                </div>
            </div>
            <div className="flex flex-col justify-center items-end text-right space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Condition de paiement</p>
                    <p className="font-black text-sm border-b-2 border-primary pb-1 inline-block">
                        {invoice.status === 'Paid' ? 'SOLDE PAYÉ' : 'À RÉGLER'}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signataire</p>
                    <p className="font-bold text-xs">{settings.managerName}</p>
                </div>
            </div>
        </div>

        {/* Table des articles */}
        <main className="flex-grow">
            <table className="w-full text-left border-collapse border-2 border-primary/10 rounded-xl overflow-hidden shadow-sm">
                <thead>
                    <tr className="bg-primary text-white">
                        <th className="p-4 font-black uppercase text-[10px] tracking-[0.2em]">Désignation des Articles</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-[0.2em] text-right">Prix Unitaire</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-[0.2em] text-center">Qté</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-[0.2em] text-right">Montant Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-primary/5 bg-white">
                    {invoice.items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-primary/[0.02]'}>
                            <td className="p-4">
                              <p className="font-black text-sm uppercase tracking-tight">{item.productName}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Réf: {item.reference}</p>
                            </td>
                            <td className="p-4 text-right font-bold text-muted-foreground">{formatCurrency(item.unitPrice, settings.currency)}</td>
                            <td className="p-4 text-center font-black text-primary">{item.quantity}</td>
                            <td className="p-4 text-right font-black text-foreground">{formatCurrency(item.total, settings.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>

        {/* Totaux & Calculs */}
        <div className="mt-10 flex justify-end">
            <div className="w-full max-w-[380px] space-y-1.5 p-4 rounded-3xl bg-muted/20 border-2 border-primary/5">
                <div className="flex justify-between items-center px-2 py-1">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Sous-Total Brut</span>
                  <span className="font-bold text-sm">{formatCurrency(invoice.subTotal, settings.currency)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between items-center px-2 py-1 text-emerald-600 font-bold bg-emerald-50 rounded-lg">
                    <span className="text-[10px] uppercase">Remise Commerciale ({discount}%)</span>
                    <span className="text-sm">-{formatCurrency(invoice.discountAmount, settings.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center px-2 py-2 border-y-2 border-primary/10">
                  <span className="font-black text-primary text-[11px] uppercase tracking-widest">Total Hors Taxes</span>
                  <span className="font-black text-primary">{formatCurrency(invoice.subTotal - (invoice.discountAmount || 0), settings.currency)}</span>
                </div>

                {vat > 0 && (
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider">Taxe Valeur Ajoutée (TVA {vat}%)</span>
                    <span className="font-bold text-sm">+{formatCurrency(invoice.vatAmount, settings.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center px-3 py-3 bg-white rounded-xl border-2 border-primary/10 shadow-sm">
                  <span className="font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total TTC</span>
                  <span className="font-black text-xl">{formatCurrency(invoice.totalAmount, settings.currency)}</span>
                </div>

                {retenue > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 text-destructive bg-destructive/5 rounded-xl border border-destructive/10">
                    <span className="font-black text-[10px] uppercase tracking-widest">Retenue à la source ({retenue}%)</span>
                    <span className="font-black">-{formatCurrency(invoice.retenueAmount || 0, settings.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 scale-105 transform origin-right">
                  <span className="font-black text-xs uppercase tracking-[0.3em]">NET À PAYER</span>
                  <span className="font-black text-2xl tracking-tighter">{formatCurrency(netAPayer, settings.currency)}</span>
                </div>
            </div>
        </div>

        {/* Footer avec pied de page */}
        <footer className="mt-16 pt-8 border-t-4 border-primary flex justify-between items-start">
            <div className="max-w-[65%] space-y-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Montant de la présente facture arrêté à :</p>
                    <p className="font-black text-lg uppercase leading-tight text-foreground underline decoration-primary decoration-4 underline-offset-8">
                        {numberToWordsFr(netAPayer, settings.currency)}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-10">
                    <div className="space-y-1.5 p-3 rounded-xl border border-primary/10 bg-primary/[0.01]">
                        <p className="text-[9px] font-black uppercase text-primary tracking-widest">Conditions de règlement</p>
                        <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground">
                            Paiement par virement, chèque ou espèces. Les marchandises restent la propriété de l'entreprise jusqu'au paiement intégral.
                        </p>
                    </div>
                    <div className="space-y-1.5 p-3 rounded-xl border border-primary/10 bg-primary/[0.01]">
                        <p className="text-[9px] font-black uppercase text-primary tracking-widest">Mention légale</p>
                        <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground">
                            Une pénalité de 3 fois le taux d'intérêt légal sera appliquée en cas de dépassement de l'échéance de paiement indiquée.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="w-[220px] flex flex-col items-center">
                <p className="font-black uppercase text-[11px] mb-3 tracking-[0.3em] text-primary">La Gérance</p>
                <div className="h-28 w-full flex items-center justify-center border-4 border-dashed border-primary/5 rounded-3xl bg-muted/10 mb-3 relative overflow-hidden">
                  <span className="text-[9px] font-black text-primary/10 uppercase tracking-[0.5em] -rotate-12">CACHET & SIGNATURE</span>
                </div>
                <p className="text-xs font-black uppercase tracking-tight text-foreground">{settings.managerName}</p>
            </div>
        </footer>
    </div>
  );
}
