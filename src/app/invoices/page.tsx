

import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { InvoiceForm } from "./InvoiceForm";
import Link from "next/link";
import { EditInvoiceForm } from "./EditInvoiceForm";
import { CancelInvoiceButton } from "./DeleteInvoiceButton";
import { RecordPaymentButton } from "./RecordPaymentButton";
import { getSession } from "@/lib/session";
import type { Invoice } from "@/lib/types";
import { ShippingLabelsDialog } from "./ShippingLabelsDialog";

export default async function InvoicesPage() {
  const [invoices, clients, products, settings, user] = await Promise.all([
    getInvoices(),
    getClients(),
    getProducts(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin' || user?.role === 'SuperAdmin';

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const client = clients.find(c => c.id === invoice.clientId);
                const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
                const isCancelled = invoice.status === 'Cancelled';
                return (
                <TableRow key={invoice.id} className={cn(isCancelled && 'bg-muted/50 text-muted-foreground')}>
                  <TableCell className="font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {statusTranslations[invoice.status] || invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount, settings.currency)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{formatCurrency(amountDue > 0 ? amountDue : 0, settings.currency)}</TableCell>
                  {client && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        {!isCancelled && <ShippingLabelsDialog invoice={invoice} client={client} settings={settings} asTextButton={false} />}
                        {canEdit && <RecordPaymentButton invoice={invoice} settings={settings} />}
                        {canEdit && <EditInvoiceForm invoice={invoice} clients={clients} products={products} settings={settings} />}
                        {canEdit && <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={isCancelled} />}
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
