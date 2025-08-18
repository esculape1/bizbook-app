
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportData, Settings, Invoice, Client } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileDown } from "lucide-react";

type ReportDisplayProps = {
  data: ReportData;
  settings: Settings;
  currency: Settings['currency'];
  client: Client | null; // Pass the full client object for the PDF
};

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

export function ReportDisplay({ data, settings, currency, client }: ReportDisplayProps) {
  if (!data) return null;

  const generateUnpaidPdf = async () => {
    if (!data?.unpaidInvoices || data.unpaidInvoices.length === 0) return;

    // Dynamically import jspdf and jspdf-autotable
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const leftMargin = 10;
    const contentStartX = leftMargin + 5; // Start content after the blue bar

    // Sidebar
    doc.setFillColor(0, 32, 96); // #002060
    doc.rect(0, 0, 8, pageHeight, 'F');

    // Header
    if (settings.logoUrl) {
      try {
        const response = await fetch(settings.logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const imgData = reader.result as string;
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = 25;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', contentStartX, 20, imgWidth, imgHeight);
      } catch (e) {
        console.error("Error loading logo for PDF", e);
      }
    }

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 120); // #1f4e78
    doc.text("RELEVÉ DES IMPAYÉS", pageWidth / 2, 45, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Date du relevé: ${format(new Date(), "d MMMM yyyy", { locale: fr })}`, pageWidth - leftMargin, 25, { align: 'right' });
    const reportPeriod = `Période du ${format(data.startDate, "d MMMM yyyy", { locale: fr })} au ${format(data.endDate, "d MMMM yyyy", { locale: fr })}`;
    doc.text(reportPeriod, pageWidth - leftMargin, 30, { align: 'right' });

    // Company & Client Info
    let startY = 55;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.legalName || settings.companyName, contentStartX, startY);
    doc.setFont('helvetica', 'normal');
    startY += 4;
    doc.text(settings.companyAddress, contentStartX, startY);
    startY += 4;
    doc.text(`Tél: ${settings.companyPhone}`, contentStartX, startY);
    startY += 4;
    doc.text(`IFU: ${settings.companyIfu} / RCCM: ${settings.companyRccm}`, contentStartX, startY);
    
    // Client info
    const clientX = pageWidth / 2 + 10;
    startY = 55;
    doc.setFont('helvetica', 'bold');
    doc.text("Client:", clientX, startY);
    doc.setFont('helvetica', 'normal');
    startY += 4;
    doc.text(client ? client.name : data.clientName, clientX, startY);
    if(client) {
      startY += 4;
      doc.text(client.address || '', clientX, startY);
      startY += 4;
      doc.text(`Tél: ${client.phone || ''}`, clientX, startY);
    }
    
    // Table
    autoTable(doc, {
        startY: 75,
        margin: { left: contentStartX },
        head: [['N° Facture', 'Date Facture', 'Date Échéance', 'Montant Dû']],
        body: data.unpaidInvoices.map(i => {
            const amountDue = i.totalAmount - (i.amountPaid || 0);
            return [
                i.invoiceNumber,
                format(new Date(i.date), "dd/MM/yyyy"),
                format(new Date(i.dueDate), "dd/MM/yyyy"),
                formatCurrency(amountDue, currency)
            ];
        }),
        foot: [
            [{ content: 'Total Impayé', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } }, 
             { content: formatCurrency(data.summary.totalUnpaid, currency), styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 32, 96], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2 },
        didDrawPage: (hookData) => {
            // Footer on each page
            const footerY = pageHeight - 20;
            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 32, 96);
            doc.line(leftMargin, footerY, pageWidth - leftMargin, footerY);
            doc.setFontSize(8);
            doc.setTextColor(100);
            const footerText1 = `${settings.companyAddress} RCCM: ${settings.companyRccm} IFU: ${settings.companyIfu}`;
            const footerText2 = `CMF N° 10001-010614200107 Tel: ${settings.companyPhone} E-mail: dlgbiomed@gmail.com`;
            doc.text(footerText1, pageWidth / 2, footerY + 5, { align: 'center' });
            doc.text(footerText2, pageWidth / 2, footerY + 9, { align: 'center' });

             // Signature
            const lastTableY = (doc as any).lastAutoTable.finalY || 0;
            const signatureY = Math.max(lastTableY, pageHeight - 60); // Ensure it's not overlapping footer
            if (hookData.pageNumber === hookData.pageCount) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(settings.managerName, pageWidth - leftMargin, signatureY, { align: 'right' });
                doc.text("Le Gérant", pageWidth - leftMargin, signatureY-4, { align: 'right' });
            }
        }
    });

    const fileName = `Releve_Impayes_${data.clientName.replace(/ /g, '_')}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle>Rapport du {format(data.startDate, "d MMMM yyyy", { locale: fr })} au {format(data.endDate, "d MMMM yyyy", { locale: fr })}</CardTitle>
              <CardDescription>Client: {data.clientName}</CardDescription>
            </div>
            <div className="flex gap-2">
                {data.unpaidInvoices.length > 0 && (
                    <Button onClick={generateUnpaidPdf} size="sm" variant="destructive">
                      <FileDown className="mr-2 h-4 w-4" />
                      PDF Impayés
                    </Button>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Chiffre d'Affaires (Encaissé)" value={formatCurrency(data.summary.totalRevenue, currency)} className="bg-green-500/10 text-green-800" />
                <StatCard title="Dépenses" value={formatCurrency(data.summary.totalExpenses, currency)} className="bg-orange-500/10 text-orange-800" />
                <StatCard title="Bénéfice Net" value={formatCurrency(data.summary.netProfit, currency)} className="bg-blue-500/10 text-blue-800" />
                <StatCard title="Total Impayé" value={formatCurrency(data.summary.totalUnpaid, currency)} className="bg-red-500/10 text-red-800" />
            </div>
        </CardContent>
      </Card>
      
      {data.allInvoices.length > 0 && (
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
                    <TableHead className="text-right">Payé</TableHead>
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
                      <TableCell className="text-right text-green-600">{formatCurrency(invoice.amountPaid, currency)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatCurrency(invoice.totalAmount - invoice.amountPaid, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                 <TableFooter>
                    <TableRow>
                        <TableCell colSpan={6} className="text-right font-bold">Total Impayé sur la période</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{formatCurrency(data.summary.totalUnpaid, currency)}</TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
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
                                <TableHead className="text-right">Quantité Vendue</TableHead>
                                <TableHead className="text-right">Valeur Totale</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.productSales.map(item => (
                                <TableRow key={item.productName}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.quantitySold}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.totalValue, currency)}</TableCell>
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

    </div>
  );
}
