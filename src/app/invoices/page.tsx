
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { InvoiceForm } from "./InvoiceForm";
import Link from "next/link";
import { EditInvoiceForm } from "./EditInvoiceForm";
import { CancelInvoiceButton } from "./CancelInvoiceButton";
import { RecordPaymentButton } from "./RecordPaymentButton";
import { getSession } from "@/lib/session";

export default async function InvoicesPage() {
  const [invoices, clients, products, settings, user] = await Promise.all([
    getInvoices(),
    getClients(),
    getProducts(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin';

  const statusColors = {
    Paid: 'bg-green-500/20 text-green-700',
    Unpaid: 'bg-red-500/20 text-red-700',
    'Partially Paid': 'bg-yellow-500/20 text-yellow-700',
    Cancelled: 'bg-gray-500/20 text-gray-600',
  }

  const statusTranslations: { [key: string]: string } = {
    Paid: 'Payée',
    Unpaid: 'Impayée',
    'Partially Paid': 'Partiellement Payée',
    Cancelled: 'Annulée',
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factures"
        actions={canEdit ? <InvoiceForm clients={clients} products={products} settings={settings} /> : undefined}
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
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
                const isCancelledOrPaid = invoice.status === 'Cancelled' || invoice.status === 'Paid';
                return (
                <TableRow key={invoice.id} className={cn(invoice.status === 'Cancelled' && 'bg-muted/50 text-muted-foreground')}>
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
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <RecordPaymentButton invoice={invoice} settings={settings} />
                        <EditInvoiceForm invoice={invoice} clients={clients} products={products} settings={settings} />
                        <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={isCancelledOrPaid} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
