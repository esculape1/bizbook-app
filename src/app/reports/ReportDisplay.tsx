

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportData, Settings, Invoice, Client } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer } from "lucide-react";
import { ClientStatementTemplate } from "@/components/report-templates/ClientStatementTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

const StatCard = ({ title, value, className }: { title: string, value: string, className?: string }) => (
    <Card className={cn("text-center", className)}>
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{value}</p>
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
    'Partially Paid': 'Partiellement Payée',
    Cancelled: 'Annulée'
};

export function ReportDisplay({ data, settings, currency, client }: { data: ReportData, settings: Settings, currency: Settings['currency'], client: Client | null }) {
  if (!data) return null;
  const reportDate = new Date();

  const handlePrint = () => {
    const content = document.getElementById('report-display-content-printable');
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle>Rapport d'activité</CardTitle>
              <CardDescription>
                  Période du {format(data.startDate, "d MMMM yyyy", { locale: fr })} au {format(data.endDate, "d MMMM yyyy", { locale: fr })}
              </CardDescription>
            </div>
             <div className="flex flex-wrap items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer le rapport
                </Button>
                {client && (
                    <Dialog>
                        <DialogTrigger asChild>
                           <Button size="sm" variant="outline">
                               <Printer className="mr-2 h-4 w-4" />
                               Relevé du Client
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
                               <Button type="button" variant="secondary" onClick={() => (document.querySelector('[data-radix-dialog-default-open="true"] [data-radix-dialog-close="true"]') as HTMLElement)?.click()}>Fermer</Button>
                               <Button onClick={() => {
                                   const content = document.getElementById('client-statement-content');
                                   if (content) {
                                       const printWindow = window.open('', '_blank');
                                       printWindow?.document.write('<html><head><title>Relevé de Compte</title>');
                                       Array.from(document.styleSheets).forEach(styleSheet => {
                                           try {
                                             if (styleSheet.href) {
                                                 printWindow?.document.write(`<link rel="stylesheet" href="${styleSheet.href}">`);
                                             } else if (styleSheet.cssRules) {
                                                 printWindow?.document.write(`<style>${Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')}</style>`);
                                             }
                                           } catch (e) { console.warn('Could not read stylesheet for printing', e); }
                                       });
                                       printWindow?.document.write('</head><body>');
                                       printWindow?.document.write(content.innerHTML);
                                       printWindow?.document.write('</body></html>');
                                       printWindow?.document.close();
                                       setTimeout(() => { printWindow?.print(); }, 500);
                                   }
                               }}>
                                   <Printer className="mr-2 h-4 w-4" />
                                   Imprimer / PDF
                               </Button>
                           </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
             <div id="report-summary-cards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Chiffre d'Affaires (Ventes)" value={formatCurrency(data.summary.grossSales, currency)} className="bg-green-500/10 text-green-800" />
                <StatCard title="Dépenses" value={formatCurrency(data.summary.totalExpenses, currency)} className="bg-orange-500/10 text-orange-800" />
                <StatCard title="Bénéfice Net" value={formatCurrency(data.summary.netProfit, currency)} className="bg-blue-500/10 text-blue-800" />
            </div>
        </CardContent>
      </Card>
      
      <div id="report-display-content-printable" className="printable-report space-y-6">
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
              <p className="text-sm">Période du {format(data.startDate, 'dd/MM/yy')} au {format(data.endDate, 'dd/MM/yy')}</p>
              {data.clientName !== "Tous les clients" && <p className="text-sm font-bold">Client: {data.clientName}</p>}
            </div>
        </header>

        {data.allInvoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Détail des Factures ({data.allInvoices.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Facture</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Dû</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.allInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{format(new Date(invoice.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {statusTranslations[invoice.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.totalAmount, currency)}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{formatCurrency(invoice.totalAmount - invoice.amountPaid, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                   <TableFooter>
                      <TableRow>
                          <TableCell colSpan={5} className="text-right font-bold">Total Ventes sur la période</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(data.summary.grossSales, currency)}</TableCell>
                      </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2" style={{ breakInside: 'avoid-page' }}>
          {data.productSales.length > 0 && (
              <Card>
                  <CardHeader>
                      <CardTitle>Ventes par Produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Produit</TableHead>
                                  <TableHead className="text-right">Qté Vendue</TableHead>
                                  <TableHead className="text-right">Stock Actuel</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {data.productSales.map(item => (
                                  <TableRow key={item.productName}>
                                      <TableCell>{item.productName}</TableCell>
                                      <TableCell className="text-right">{item.quantitySold}</TableCell>
                                      <TableCell className="text-right">{item.quantityInStock}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          )}
          
          {data.expenses.length > 0 && (
              <Card>
                  <CardHeader>
                      <CardTitle>Dépenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Catégorie</TableHead>
                                  <TableHead className="text-right">Montant</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {data.expenses.map(exp => (
                                  <TableRow key={exp.id}>
                                      <TableCell>{format(new Date(exp.date), "dd/MM/yyyy")}</TableCell>
                                      <TableCell>{exp.description}</TableCell>
                                      <TableCell>{exp.category}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(exp.amount, currency)}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                           <TableFooter>
                              <TableRow>
                                  <TableCell colSpan={3} className="text-right font-bold">Total Dépenses</TableCell>
                                  <TableCell className="text-right font-bold">{formatCurrency(data.summary.totalExpenses, currency)}</TableCell>
                              </TableRow>
                          </TableFooter>
                      </Table>
                  </CardContent>
              </Card>
          )}
        </div>
         <footer className="flex justify-between items-start mt-24 pt-8 border-t-2 border-dashed" style={{ breakInside: 'avoid-page' }}>
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
