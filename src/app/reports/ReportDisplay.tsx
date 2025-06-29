'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportData, Settings } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";

type ReportDisplayProps = {
  data: ReportData;
  currency: Settings['currency'];
};

const statusColors = {
    Paid: 'bg-green-500/20 text-green-700',
    Unpaid: 'bg-red-500/20 text-red-700',
    'Partially Paid': 'bg-yellow-500/20 text-yellow-700',
};

const statusTranslations: { [key: string]: string } = {
    Paid: 'Payée',
    Unpaid: 'Impayée',
    'Partially Paid': 'Partiellement Payée',
};

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

export function ReportDisplay({ data, currency }: ReportDisplayProps) {
  if (!data) return null;

  const generatePdf = async () => {
    if (!data) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text("Rapport d'activité", pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    const reportPeriod = `Période du ${format(data.startDate, "d MMMM yyyy", { locale: fr })} au ${format(data.endDate, "d MMMM yyyy", { locale: fr })}`;
    doc.text(reportPeriod, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Client: ${data.clientName}`, pageWidth / 2, 36, { align: 'center' });

    let startY = 50;

    // Summary
    doc.setFontSize(16);
    doc.text("Résumé", 14, startY);
    autoTable(doc, {
        startY: startY + 5,
        body: [
            ['Chiffre d\'Affaires', formatCurrency(data.summary.totalRevenue, currency)],
            ['Dépenses', formatCurrency(data.summary.totalExpenses, currency)],
            ['Bénéfice Net', formatCurrency(data.summary.netProfit, currency)],
            ['Total Impayé', formatCurrency(data.summary.totalUnpaid, currency)],
        ],
        theme: 'striped',
        styles: { fontSize: 10 },
    });

    startY = (doc as any).lastAutoTable.finalY + 15;

    // Product Sales
    if (data.productSales.length > 0) {
        doc.setFontSize(16);
        doc.text("Ventes par Produit", 14, startY);
        autoTable(doc, {
            startY: startY + 5,
            head: [['Produit', 'Quantité Vendue', 'Valeur Totale']],
            body: data.productSales.map(p => [p.productName, p.quantitySold, formatCurrency(p.totalValue, currency)]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }, // Blue
            styles: { fontSize: 10 },
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expenses
    if (data.expenses.length > 0) {
        if (startY > pageHeight - 50) { doc.addPage(); startY = 20; }
        doc.setFontSize(16);
        doc.text("Dépenses", 14, startY);
        autoTable(doc, {
            startY: startY + 5,
            head: [['Date', 'Description', 'Catégorie', 'Montant']],
            body: data.expenses.map(e => [format(new Date(e.date), "dd/MM/yyyy"), e.description, e.category, formatCurrency(e.amount, currency)]),
            theme: 'grid',
            headStyles: { fillColor: [230, 126, 34] }, // Orange
            styles: { fontSize: 10 },
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // All Invoices
    if (data.allInvoices.length > 0) {
        if (startY > pageHeight - 60) { doc.addPage(); startY = 20; }
        doc.setFontSize(16);
        doc.text("Détail des Factures", 14, startY);
        autoTable(doc, {
            startY: startY + 5,
            head: [['N° Facture', 'Client', 'Date', 'Statut', 'Montant']],
            body: data.allInvoices.map(i => [i.invoiceNumber, i.clientName, format(new Date(i.date), "dd/MM/yyyy"), statusTranslations[i.status], formatCurrency(i.totalAmount, currency)]),
            theme: 'grid',
            headStyles: { fillColor: [80, 80, 80] },
            styles: { fontSize: 10 },
        });
    }

    // Footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 20, pageHeight - 10);
    }

    const fileName = `Rapport_${data.clientName.replace(/ /g, '_')}_${format(data.startDate, "yyyy-MM-dd")}_au_${format(data.endDate, "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Rapport du {format(data.startDate, "d MMMM yyyy", { locale: fr })} au {format(data.endDate, "d MMMM yyyy", { locale: fr })}</CardTitle>
              <CardDescription>Client: {data.clientName}</CardDescription>
            </div>
            <Button onClick={generatePdf} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Télécharger en PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Chiffre d'Affaires" value={formatCurrency(data.summary.totalRevenue, currency)} className="bg-green-500/10 text-green-800" />
                <StatCard title="Dépenses" value={formatCurrency(data.summary.totalExpenses, currency)} className="bg-orange-500/10 text-orange-800" />
                <StatCard title="Bénéfice Net" value={formatCurrency(data.summary.netProfit, currency)} className="bg-blue-500/10 text-blue-800" />
                <StatCard title="Total Impayé" value={formatCurrency(data.summary.totalUnpaid, currency)} className="bg-red-500/10 text-red-800" />
            </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Ventes par Produit</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Quantité Vendue</TableHead>
                            <TableHead className="text-right">Valeur Totale</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.productSales.map(item => (
                            <TableRow key={item.productName}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-right">{item.quantitySold}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.totalValue, currency)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
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
                                <TableCell className="font-medium">{exp.description}</TableCell>
                                <TableCell>{exp.category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(exp.amount, currency)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail des Factures</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.allInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{format(new Date(invoice.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border", statusColors[invoice.status as keyof typeof statusColors])}>
                      {statusTranslations[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
