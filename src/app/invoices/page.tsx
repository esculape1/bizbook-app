
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { InvoiceForm } from "./InvoiceForm";
import Link from "next/link";
import { EditInvoiceForm } from "./EditInvoiceForm";
import { DeleteInvoiceButton } from "./DeleteInvoiceButton";
import { RecordPaymentButton } from "./RecordPaymentButton";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
  const user = await getSession();
  if (user?.role !== 'Admin') {
    redirect('/');
  }

  const [invoices, clients, products, settings] = await Promise.all([
    getInvoices(),
    getClients(),
    getProducts(),
    getSettings(),
  ]);

  const statusColors = {
    Paid: 'bg-green-500/20 text-green-700',
    Unpaid: 'bg-red-500/20 text-red-700',
    'Partially Paid': 'bg-yellow-500/20 text-yellow-700',
  }

  const statusTranslations: { [key: string]: string } = {
    Paid: 'Payée',
    Unpaid: 'Impayée',
    'Partially Paid': 'Partiellement Payée',
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factures"
        actions={<InvoiceForm clients={clients} products={products} settings={settings} />}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant Total</TableHead>
                <TableHead className="text-right">Montant Dû</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
                return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border", statusColors[invoice.status])}>
                      {statusTranslations[invoice.status] || invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount, settings.currency)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{formatCurrency(amountDue > 0 ? amountDue : 0, settings.currency)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <RecordPaymentButton invoice={invoice} settings={settings} />
                      <EditInvoiceForm invoice={invoice} clients={clients} products={products} settings={settings} />
                      <DeleteInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} />
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
