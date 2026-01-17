
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import type { PaymentHistoryItem, Client, Settings } from '@/lib/types';
import { format } from 'date-fns';
import { PaymentHistoryReportDialog } from './PaymentHistoryReportDialog';
import Link from 'next/link';

type PaymentHistoryProps = {
  history: PaymentHistoryItem[];
  client: Client;
  settings: Settings;
};

export function PaymentHistory({ history, client, settings }: PaymentHistoryProps) {
  if (history.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique des Règlements</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">Aucun paiement enregistré pour ce client.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-emerald-500/10 border-emerald-500/20 text-emerald-800">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Historique des Règlements</CardTitle>
          <CardDescription className="text-current/70">Liste de tous les paiements enregistrés pour {client.name}.</CardDescription>
        </div>
        <PaymentHistoryReportDialog history={history} client={client} settings={settings} />
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="md:hidden space-y-3 max-h-[600px] overflow-y-auto">
          {history.map((item, index) => (
            <div key={`${item.payment.id}-${index}`} className="rounded-lg border bg-card text-card-foreground p-3 text-sm">
              <div className="flex justify-between items-center mb-2">
                <Link href={`/invoices/${item.invoiceId}`} className="font-semibold text-primary hover:underline">
                  {item.invoiceNumber}
                </Link>
                <div className="font-bold text-emerald-900">
                  {formatCurrency(item.payment.amount, settings.currency)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Date:</strong> {format(new Date(item.payment.date), 'dd/MM/yyyy')}</p>
                <p><strong>Méthode:</strong> {item.payment.method}</p>
                {item.payment.notes && <p><strong>Notes:</strong> {item.payment.notes}</p>}
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block border rounded-md max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Facture N°</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item, index) => (
                <TableRow key={`${item.payment.id}-${index}`}>
                  <TableCell>{format(new Date(item.payment.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Link href={`/invoices/${item.invoiceId}`} className="text-primary hover:underline">
                      {item.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{item.payment.method}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.payment.notes}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.payment.amount, settings.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
