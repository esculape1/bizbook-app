'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportData, Settings, Client, Invoice } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, TrendingUp, Wallet, Package, Target, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { ClientStatementTemplate } from "@/components/report-templates/ClientStatementTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

const StatCard = ({ title, value, icon, className, colorClass, iconBg }: { title: string, value: string, icon: React.ReactNode, className?: string, colorClass: string, iconBg: string }) => (
    <Card className={cn("overflow-hidden border-2 shadow-sm group relative transition-all hover:scale-[1.02]", className, colorClass)}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl shadow-inner", iconBg)}>
                    {icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Indicateur Clé</span>
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold opacity-60 uppercase tracking-wider">{title}</p>
                <p className="text-xl md:text-2xl font-black tracking-tight">{value}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.05] scale-[2.5] rotate-12 transition-transform group-hover:rotate-0 duration-500">
                {icon}
            </div>
        </CardContent>
    </Card>
)

export function ReportDisplay({ data, settings, currency, client }: { data: ReportData, settings: Settings, currency: Settings['currency'], client: Client | null }) {
  if (!data) return null;
  const reportDate = new Date();
  
  const startDate = parseISO(data.startDate);
  const endDate = parseISO(data.endDate);

  // Calculate Revenue per Client
  const salesByClient = data.allInvoices.reduce((acc, inv) => {
    if (inv.status === 'Cancelled') return acc;
    const clientName = inv.clientName;
    if (!acc[clientName]) {
      acc[clientName] = 0;
    }
    acc[clientName] += inv.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const sortedSalesByClient = Object.entries(salesByClient)
    .sort(([, a], [, b]) => b - a);

  const handlePrint = (elementId: string) => {
    const content = document.getElementById(elementId);
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write('<html><head><title>Imprimer Rapport</title>');
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if (styleSheet.href) {
            printWindow?.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
          } else if (styleSheet.cssRules) {
            printWindow?.document.write(`<style>${Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')}</style>`);
          }
        } catch (e) {
            console.warn('Could not read stylesheet for printing', e);
        }
      });
      printWindow?.document.write('</head><body class="p-0 bg-white">');
      printWindow?.document.write(content.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      
      setTimeout(() => {
        printWindow?.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Analyse d'Activité</h2>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground font-medium">
                <Calendar className="size-4" />
                <span className="text-sm">Du {format(startDate, "d MMMM yyyy", { locale: fr })} au {format(endDate, "d MMMM yyyy", { locale: fr })}</span>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            {client && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="font-bold border-primary/20 hover:bg-primary/5">
                            <ArrowRight className="mr-2 h-4 w-4 text-primary" />
                            Relevé de Compte
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>Aperçu du relevé de compte</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[70vh] overflow-y-auto bg-gray-50">
                            <ClientStatementTemplate data={data} settings={settings} client={client} />
                        </div>
                        <DialogFooter className="p-6 bg-white border-t">
                            <Button variant="secondary" onClick={() => (document.querySelector('[data-radix-dialog-default-open="true"] [data-radix-dialog-close="true"]') as HTMLElement)?.click()}>Fermer</Button>
                            <Button onClick={() => handlePrint('client-statement-content')} className="font-black">
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer / PDF
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            <Button onClick={() => handlePrint('report-display-content-printable')} className="font-black shadow-md">
                <Printer className="mr-2 h-4 w-4" />
                Exporter le Rapport
            </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Chiffre d'Affaires" 
            value={formatCurrency(data.summary.grossSales, currency)} 
            icon={<TrendingUp className="size-6 text-emerald-600" />}
            colorClass="bg-emerald-50 border-emerald-100 text-emerald-900"
            iconBg="bg-emerald-100"
        />
        <StatCard 
            title="Coût Marchandises" 
            value={formatCurrency(data.summary.costOfGoodsSold, currency)} 
            icon={<Package className="size-6 text-amber-600" />}
            colorClass="bg-amber-50 border-amber-100 text-amber-900"
            iconBg="bg-amber-100"
        />
        <StatCard 
            title="Total Dépenses" 
            value={formatCurrency(data.summary.totalExpenses, currency)} 
            icon={<Wallet className="size-6 text-rose-600" />}
            colorClass="bg-rose-50 border-rose-100 text-rose-900"
            iconBg="bg-rose-100"
        />
        <StatCard 
            title="Bénéfice Net" 
            value={formatCurrency(data.summary.netProfit, currency)} 
            icon={<Target className="size-6 text-blue-600" />}
            colorClass="bg-blue-50 border-blue-100 text-blue-900"
            iconBg="bg-blue-100"
        />
      </div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
            <Card className="border-none shadow-premium bg-card overflow-hidden">
                <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200">
                            <Package className="size-5" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-amber-900">Ventes par Produit</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[450px] overflow-auto custom-scrollbar">
                        <Table>
                            <TableBody>
                                {data.productSales.map((sale, i) => (
                                    <TableRow key={i} className="group transition-all hover:bg-amber-500/5 border-l-4 border-l-transparent hover:border-l-amber-500 border-b last:border-0 bg-white">
                                        <TableCell className="py-4 px-5">
                                            <p className="font-bold text-xs uppercase tracking-tight leading-snug text-foreground">
                                                {sale.productName}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-4 px-5 text-right">
                                            <Badge variant="outline" className="bg-white font-black text-amber-700 border-amber-200">
                                                {sale.quantitySold}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-card overflow-hidden">
                <CardHeader className="bg-rose-500/5 border-b border-rose-500/10 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-200">
                            <Wallet className="size-5" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-rose-900">Détail des Dépenses</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[450px] overflow-auto custom-scrollbar">
                        <Table>
                            <TableBody>
                                {data.expenses.length > 0 ? data.expenses.map((exp) => (
                                    <TableRow key={exp.id} className="group transition-all hover:bg-rose-500/5 border-l-4 border-l-transparent hover:border-l-rose-500 border-b last:border-0 bg-white">
                                        <TableCell className="py-4 px-5">
                                            <p className="font-bold text-xs uppercase leading-none truncate max-w-[200px] text-foreground">{exp.description}</p>
                                            <p className="text-[9px] font-black text-muted-foreground mt-1.5 uppercase tracking-widest flex items-center gap-1">
                                                <ChevronRight className="size-2" /> {exp.category}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-4 px-5 text-right">
                                            <span className="font-black text-sm text-rose-700 whitespace-nowrap">
                                                {formatCurrency(exp.amount, currency)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell className="h-24 text-center text-muted-foreground text-xs italic">Aucune dépense.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
      </div>
      
      {/* VERSION IMPRIMABLE AMÉLIORÉE AVEC COULEURS LÉGÈRES */}
      <div id="report-display-content-printable" className="printable-report space-y-8 hidden print:block bg-white text-black">
        <style>{`
          @media print {
            .printable-report { padding: 15mm; font-family: 'Inter', sans-serif; background: white !important; }
            .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
            .print-card { 
                border: 1px solid #e5e7eb; 
                padding: 12px; 
                border-radius: 8px; 
                text-align: center; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
            }
            .print-card-title { font-size: 8pt; text-transform: uppercase; color: #4b5563; font-weight: 800; margin-bottom: 4px; }
            .print-card-value { font-size: 13pt; font-weight: 900; }
            
            /* Couleurs pastel forcées pour l'impression PDF */
            .bg-emerald-print { background-color: #f0fdf4 !important; border-color: #bbf7d0 !important; color: #065f46 !important; }
            .bg-amber-print { background-color: #fffbeb !important; border-color: #fef3c7 !important; color: #92400e !important; }
            .bg-rose-print { background-color: #fff1f2 !important; border-color: #fecdd3 !important; color: #9f1239 !important; }
            .bg-blue-print { background-color: #eff6ff !important; border-color: #bfdbfe !important; color: #1e40af !important; }

            .print-section-title { 
                font-size: 11pt; 
                font-weight: 900; 
                text-transform: uppercase; 
                border-bottom: 2px solid #000; 
                padding-bottom: 4px; 
                margin: 25px 0 12px 0; 
                color: #000;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { text-align: left; font-size: 8pt; text-transform: uppercase; padding: 6px 8px; background-color: #f3f4f6 !important; border: 1px solid #d1d5db; -webkit-print-color-adjust: exact; }
            td { padding: 6px 8px; border: 1px solid #d1d5db; font-size: 9pt; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
          }
        `}</style>

        <header className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
            <div className="flex gap-6 items-center">
              {settings.logoUrl && (
                <Image 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  width={100} 
                  height={50} 
                  className="object-contain"
                  data-ai-hint="logo"
                />
              )}
              <div>
                <h2 className="text-2xl font-black uppercase leading-tight">{settings.companyName}</h2>
                <p className="text-xs font-bold text-gray-600">{settings.companyAddress}</p>
                <p className="text-xs font-bold text-gray-600">Tél: {settings.companyPhone}</p>
                <p className="text-[10px] text-gray-500">IFU: {settings.companyIfu} | RCCM: {settings.companyRccm}</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Rapport d'Activité</h1>
              <p className="text-sm font-bold bg-black text-white px-3 py-1 inline-block mt-2">
                Période : {format(startDate, 'dd/MM/yy')} au {format(endDate, 'dd/MM/yy')}
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">Généré le {format(reportDate, 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
            </div>
        </header>

        <div className="print-grid">
            <div className="print-card bg-emerald-print">
                <p className="print-card-title">Ventes (CA)</p>
                <p className="print-card-value">{formatCurrency(data.summary.grossSales, currency)}</p>
            </div>
            <div className="print-card bg-amber-print">
                <p className="print-card-title">Coût Marchandises</p>
                <p className="print-card-value">{formatCurrency(data.summary.costOfGoodsSold, currency)}</p>
            </div>
            <div className="print-card bg-rose-print">
                <p className="print-card-title">Total Dépenses</p>
                <p className="print-card-value">{formatCurrency(data.summary.totalExpenses, currency)}</p>
            </div>
            <div className="print-card bg-blue-print">
                <p className="print-card-title">Bénéfice Net</p>
                <p className="print-card-value">{formatCurrency(data.summary.netProfit, currency)}</p>
            </div>
        </div>

        <section>
            <h3 className="print-section-title">Ventes par Client</h3>
            <table>
                <thead>
                    <tr>
                        <th>Nom du Client / Entreprise</th>
                        <th className="text-right">Chiffre d'Affaires Généré</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedSalesByClient.map(([clientName, revenue]) => (
                        <tr key={clientName}>
                            <td className="font-bold uppercase">{clientName}</td>
                            <td className="text-right font-bold">{formatCurrency(revenue, currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

        <div className="grid grid-cols-2 gap-8">
            <section>
                <h3 className="print-section-title">Ventes par Produit</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Désignation</th>
                            <th className="text-right">Qté Vendue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.productSales.map((sale, i) => (
                            <tr key={i}>
                                <td className="uppercase text-[10px]">{sale.productName}</td>
                                <td className="text-right font-bold">{sale.quantitySold}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section>
                <h3 className="print-section-title">Résumé des Dépenses</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Désignation</th>
                            <th className="text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.expenses.map((exp) => (
                            <tr key={exp.id}>
                                <td className="uppercase text-[10px]">{exp.description}</td>
                                <td className="text-right font-bold">{formatCurrency(exp.amount, currency)}</td>
                            </tr>
                        ))}
                        {data.expenses.length === 0 && (
                            <tr><td colSpan={2} className="text-center italic text-gray-400">Aucune dépense enregistrée.</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 font-bold">
                            <td className="text-right uppercase">Total Dépenses</td>
                            <td className="text-right">{formatCurrency(data.summary.totalExpenses, currency)}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>
        </div>

         <footer className="flex justify-between items-start mt-20 pt-10 border-t-2 border-dashed border-gray-300">
            <div className="w-1/3 text-center">
                <p className="font-black uppercase text-xs mb-16 underline">Le Comptable</p>
                <div className="border-b border-gray-400 w-full"></div>
            </div>
            <div className="w-1/3 text-center">
                <p className="font-black uppercase text-xs mb-16 underline">La Gérance</p>
                <div className="border-b border-gray-400 w-full"></div>
                <p className="text-[10px] font-bold mt-2 text-gray-700">{settings.managerName}</p>
            </div>
        </footer>
      </div>
    </div>
  );
}