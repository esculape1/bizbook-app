
'use client';

import type { Invoice, Settings } from "@/lib/types";
import { parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

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

  return (
    <Card className="border-none shadow-premium bg-card/50 overflow-hidden">
        <CardHeader className="bg-rose-500/10 border-b border-rose-500/10 py-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500 text-white">
                    <AlertCircle className="size-5" />
                </div>
                <div>
                    <CardTitle className="text-xl font-bold text-rose-900">Alertes de Recouvrement</CardTitle>
                    <CardDescription className="text-rose-700/70">Clients ayant des factures impayées après échéance</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
            {clientsWithOverdue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Aucune facture échue. Excellent suivi !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {clientsWithOverdue.map((client, index) => (
                        <Card 
                            key={client.clientId} 
                            className={cn(
                                "shadow-md transition-all duration-300 border-2 border-transparent cursor-default",
                                "hover:border-rose-500/50 hover:shadow-lg hover:scale-[1.02] group",
                                cardColors[index % cardColors.length]
                            )}
                        >
                           <CardContent className="p-4">
                               <div className="flex justify-between items-start">
                                   <div className="flex-1 mr-2 min-w-0">
                                       <p className="font-bold text-sm text-current truncate uppercase tracking-tight group-hover:text-rose-700">
                                           {client.clientName}
                                       </p>
                                       <p className="text-xl font-extrabold text-destructive whitespace-nowrap mt-1">
                                           {formatCurrency(client.totalDue, settings.currency)}
                                       </p>
                                   </div>
                                   <Badge variant="destructive" className="flex-shrink-0 font-black px-2.5">
                                       {client.count}
                                   </Badge>
                               </div>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );
}
