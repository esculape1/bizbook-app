
'use client';

import type { Invoice, Settings } from "@/lib/types";
import { parseISO } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type OverdueClientInfo = {
  clientId: string;
  clientName: string;
  count: number;
  totalDue: number;
};

export function OverdueInvoicesTable({ invoices, settings }: { invoices: Invoice[], settings: Settings }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = invoices.filter(inv =>
    (inv.status === 'Unpaid' || inv.status === 'Partially Paid') &&
    parseISO(inv.dueDate) < today
  );

  const overdueByClient = overdueInvoices.reduce((acc, invoice) => {
    const clientId = invoice.clientId;
    if (!acc[clientId]) {
      acc[clientId] = {
        clientId: clientId,
        clientName: invoice.clientName,
        count: 0,
        totalDue: 0,
      };
    }
    acc[clientId].count++;
    const netToPay = invoice.netAPayer ?? invoice.totalAmount;
    acc[clientId].totalDue += (netToPay - (invoice.amountPaid || 0));
    return acc;
  }, {} as Record<string, OverdueClientInfo>);
  
  const clientsWithOverdue = Object.values(overdueByClient).sort((a, b) => b.totalDue - a.totalDue);

  const cardColors = [
    "bg-rose-500/10 border-rose-500/20 text-rose-900",
    "bg-amber-500/10 border-amber-500/20 text-amber-900",
    "bg-violet-500/10 border-violet-500/20 text-violet-900",
    "bg-sky-500/10 border-sky-500/20 text-sky-900",
    "bg-teal-500/10 border-teal-500/20 text-teal-900",
  ];

  if (clientsWithOverdue.length === 0) {
    return (
        <p className="text-sm text-muted-foreground text-center py-8">Aucune facture échue. Excellent suivi !</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clientsWithOverdue.map((client, index) => (
            <Card key={client.clientId} className={cn("shadow-md transition-transform hover:scale-105", cardColors[index % cardColors.length])}>
               <CardContent className="p-4">
                   <div className="flex justify-between items-start">
                       <div className="flex-1 mr-2">
                           <p className="font-bold text-sm text-current truncate">{client.clientName}</p>
                           <p className="text-xl font-extrabold text-destructive">{formatCurrency(client.totalDue, settings.currency)}</p>
                       </div>
                       <Badge variant="destructive" className="flex-shrink-0">{client.count} {client.count > 1 ? 'factures' : 'facture'}</Badge>
                   </div>
               </CardContent>
            </Card>
        ))}
    </div>
  );
}
