'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportData, Settings, Client, Invoice } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, TrendingUp, Wallet, Package, Target, FileText, User as UserIcon, Calendar, ArrowRight, ChevronRight } from "lucide-react";
import { ClientStatementTemplate } from "@/components/report-templates/ClientStatementTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

const StatCard = ({ title, value, icon, className, colorClass }: { title: string, value: string, icon: React.ReactNode, className?: string, colorClass: string }) => (
    <Card className={cn("overflow-hidden border-none shadow-md group relative transition-all hover:scale-[1.02]", className, colorClass)}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner">
                    {icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Indicateur Clé</span>
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">{title}</p>
                <p className="text-xl md:text-2xl font-black text-white tracking-tight">{value}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 scale-[2.5] text-white rotate-12 transition-transform group-hover:rotate-0 duration-500">
                {icon}
            </div>
        </CardContent>
    </Card>
)

const getStatusVariant = (status: Invoice['status']): "success" | "warning" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially Paid':
        return 'warning';
      case 'Unpaid':
        return 'destructive';
      case 'Cancelled':
      default:
        return 'outline';
    }
}

const statusTranslations: { [key: string]: string } = {
    Paid: 'Payée',
    Unpaid: 'Impayée',
    'Partially Paid': 'Partiel',
    Cancelled: 'Annulée'
};

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
            icon={<TrendingUp className="size-6" />}
            colorClass="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard 
            title="Coût Marchandises" 
            value={formatCurrency(data.summary.costOfGoodsSold, currency)} 
            icon={<Package className="size-6" />}
            colorClass="bg-gradient-to-br from-orange-400 to-amber-600"
        />
        <StatCard 
            title="Total Dépenses" 
            value={formatCurrency(data.summary.totalExpenses, currency)} 
            icon={<Wallet className="size-6" />}
            colorClass="bg-gradient-to-br from-rose-500 to-red-600"
        />
        <StatCard 
            title="Bénéfice Net" 
            value={formatCurrency(data.summary.netProfit, currency)} 
            icon={<Target className="size-6" />}
            colorClass="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
      </div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-none shadow-premium bg-card overflow-hidden">
            <CardHeader className="bg-white border-b py-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                    </div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Factures de la période</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-md z-10">
                            <TableRow className="hover:bg-transparent border-b-2">
                                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground/70">N° Facture</TableHead>
                                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground/70">Client</TableHead>
                                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground/70">Date</TableHead>
                                <TableHead className="py-4 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/70">Statut</TableHead>
                                <TableHead className="py-4 text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground/70">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.allInvoices.length > 0 ? data.allInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary border-b">
                                    <TableCell className="py-5 font-black text-sm text-foreground uppercase tracking-tight">
                                        {invoice.invoiceNumber}
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <p className="font-bold text-[11px] uppercase text-muted-foreground/80 leading-snug line-clamp-2 max-w-[200px]">
                                            {invoice.clientName}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-5 text-xs font-semibold text-muted-foreground">
                                        {format(new Date(invoice.date), "dd/MM/yy")}
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <Badge 
                                            variant={getStatusVariant(invoice.status)} 
                                            className="font-black text-[9px] px-3 py-1 uppercase rounded-full tracking-wide shadow-sm"
                                        >
                                            {statusTranslations[invoice.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5 text-right">
                                        <span className="font-black text-base text-primary tracking-tight">
                                            {formatCurrency(invoice.totalAmount, currency)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">Aucune facture sur cette période.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <div className="space-y-8">
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
                    <div className="max-h-[350px] overflow-auto custom-scrollbar">
                        <Table>
                            <TableBody>
                                {data.productSales.map((sale, i) => (
                                    <TableRow key={i} className="group transition-all hover:bg-amber-500/5 border-l-4 border-l-transparent hover:border-l-amber-500 border-b last:border-0">
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
                        <CardTitle className="text-lg font-black uppercase tracking-tight text-rose-900">Dernières Dépenses</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[350px] overflow-auto custom-scrollbar">
                        <Table>
                            <TableBody>
                                {data.expenses.length > 0 ? data.expenses.map((exp) => (
                                    <TableRow key={exp.id} className="group transition-all hover:bg-rose-500/5 border-l-4 border-l-transparent hover:border-l-rose-500 border-b last:border-0">
                                        <TableCell className="py-4 px-5">
                                            <p className="font-bold text-xs uppercase leading-none truncate max-w-[160px] text-foreground">{exp.description}</p>
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
      </div>
      
      {/* VERSION IMPRIMABLE AMÉLIORÉE */}
      <div id="report-display-content-printable" className="printable-report space-y-8 hidden print:block bg-white text-black">
        <style>{`
          @media print {
            .printable-report { padding: 20mm; font-family: 'Inter', sans-serif; }
            .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .print-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
            .print-card-title { font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: 800; margin-bottom: 5px; }
            .print-card-value { font-size: 16px; font-weight: 900; }
            .print-section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; margin: 30px 0 15px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; font-size: 10px; text-transform: uppercase; padding: 8px; background-color: #f3f4f6 !important; border: 1px solid #d1d5db; -webkit-print-color-adjust: exact; }
            td { padding: 8px; border: 1px solid #d1d5db; font-size: 11px; }
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
            <div className="print-card">
                <p className="print-card-title">Ventes (CA)</p>
                <p className="print-card-value">{formatCurrency(data.summary.grossSales, currency)}</p>
            </div>
            <div className="print-card">
                <p className="print-card-title">Coût Marchandises</p>
                <p className="print-card-value">{formatCurrency(data.summary.costOfGoodsSold, currency)}</p>
            </div>
            <div className="print-card">
                <p className="print-card-title">Total Dépenses</p>
                <p className="print-card-value">{formatCurrency(data.summary.totalExpenses, currency)}</p>
            </div>
            <div className="print-card" style={{ backgroundColor: '#000 !important', color: '#fff !important' }}>
                <p className="print-card-title" style={{ color: '#ccc !important' }}>Bénéfice Net</p>
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

        <section>
            <h3 className="print-section-title">Détail des Factures</h3>
            <table>
                <thead>
                    <tr>
                        <th>N° Facture</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th className="text-right">Montant</th>
                    </tr>
                </thead>
                <tbody>
                    {data.allInvoices.map((inv) => (
                        <tr key={inv.id}>
                            <td className="font-bold">{inv.invoiceNumber}</td>
                            <td className="uppercase">{inv.clientName}</td>
                            <td>{format(new Date(inv.date), "dd/MM/yyyy")}</td>
                            <td className="text-right font-bold">{formatCurrency(inv.totalAmount, currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

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
