
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice } from "@/lib/types";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverdueInvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  const overdueInvoices = invoices.filter(inv =>
    (inv.status === 'Unpaid' || inv.status === 'Partially Paid') &&
    parseISO(inv.dueDate) < today
  );

  return (
    <Card className="lg:col-span-2 bg-yellow-500/5">
        <CardHeader className="text-center">
            <CardTitle>Factures Échues</CardTitle>
        </CardHeader>
        <CardContent>
            {overdueInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-12 pb-12">Aucune facture échue. Excellent suivi !</p>
            ) : (
                <div className="overflow-auto max-h-80">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Facture</TableHead>
                        <TableHead className="text-right">Échue depuis</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {overdueInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                            <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                                {invoice.invoiceNumber}
                            </Link>
                        </TableCell>
                        <TableCell className="text-right text-destructive font-medium">
                            {formatDistanceToNow(parseISO(invoice.dueDate), { addSuffix: true, locale: fr })}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
