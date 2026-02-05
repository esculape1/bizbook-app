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
            {/* Decorative element */}
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
      printWindow?.document.write('<body class="p-8">');
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
      {/* En-tête du Rapport */}
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

      {/* Cartes de Synthèse */}
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
        {/* Détails des Factures */}
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
            {/* Ventes par Produit */}
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
                                {data.productSales.slice(0, 10).map((sale, i) => (
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

            {/* Liste des Dépenses */}
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
                                {data.expenses.length > 0 ? data.expenses.slice(0, 10).map((exp) => (
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
      
      {/* VERSION IMPRIMABLE (Cachée) */}
      <div id="report-display-content-printable" className="printable-report space-y-6 hidden print:block">
        <header className="flex justify-between items-start mb-8 pb-4 border-b">
            <div>
              {settings.logoUrl && (
                <Image 
                  src={settings.logoUrl} 
                  alt={`${settings.companyName} logo`} 
                  width={120} 
                  height={60} 
                  className="object-contain mb-4"
                  data-ai-hint="logo"
                />
              )}
              <h2 className="text-lg font-bold">{settings.companyName}</h2>
              <p className="text-xs">{settings.companyAddress}</p>
              <p className="text-xs">Tél: {settings.companyPhone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold">Rapport d'Activité</h1>
              <p className="text-sm">Date: {format(reportDate, 'd MMMM yyyy', { locale: fr })}</p>
              <p className="text-sm">Période du {format(startDate, 'dd/MM/yy')} au {format(endDate, 'dd/MM/yy')}</p>
              {data.clientName !== "Tous les clients" && <p className="text-sm font-bold">Client: {data.clientName}</p>}
            </div>
        </header>

        <div className="grid gap-4 grid-cols-4 mb-8">
            <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-[10px] font-bold uppercase text-gray-500">Ventes</p>
                <p className="text-lg font-black">{formatCurrency(data.summary.grossSales, currency)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-[10px] font-bold uppercase text-gray-500">Coût Marchandises</p>
                <p className="text-lg font-black">{formatCurrency(data.summary.costOfGoodsSold, currency)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-[10px] font-bold uppercase text-gray-500">Dépenses</p>
                <p className="text-lg font-black">{formatCurrency(data.summary.totalExpenses, currency)}</p>
            </div>
            <div className="p-4 bg-gray-800 text-white rounded-lg text-center">
                <p className="text-[10px] font-bold uppercase text-gray-300">Bénéfice Net</p>
                <p className="text-lg font-black">{formatCurrency(data.summary.netProfit, currency)}</p>
            </div>
        </div>

        <div className="space-y-8">
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-200">
                        <TableRow>
                            <TableHead className="text-black font-bold">N° Facture</TableHead>
                            <TableHead className="text-black font-bold">Client</TableHead>
                            <TableHead className="text-black font-bold">Date</TableHead>
                            <TableHead className="text-right text-black font-bold">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.allInvoices.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell className="font-bold">{inv.invoiceNumber}</TableCell>
                                <TableCell className="text-xs uppercase">{inv.clientName}</TableCell>
                                <TableCell>{format(new Date(inv.date), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(inv.totalAmount, currency)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>

         <footer className="flex justify-between items-start mt-24 pt-8 border-t-2 border-dashed">
            <div className="w-2/5 text-center">
                <p className="font-bold text-sm">Le Magasinier</p>
                <div className="mt-20 border-b-2 border-gray-400"></div>
            </div>
            <div className="w-2/5 text-center">
                <p className="font-bold text-sm">La Gérante</p>
                <div className="mt-20 border-b-2 border-gray-400"></div>
                <p className="text-xs text-gray-700 mt-1">{settings.managerName}</p>
            </div>
        </footer>
      </div>
    </div>
  );
}
