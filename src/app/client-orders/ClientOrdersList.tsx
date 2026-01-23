
'use client';

import { useState, useTransition } from 'react';
import type { ClientOrder, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCheck, Clock, FileSignature, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { convertOrderToInvoice } from './actions';
import { Badge } from '@/components/ui/badge';
import { CLIENT_ORDER_STATUS, CLIENT_ORDER_STATUS_TRANSLATIONS } from '@/lib/constants';

type ClientOrdersListProps = {
  orders: ClientOrder[];
  settings: Settings;
};

const cardColors = [
    "bg-sky-500/10 border-sky-500/20 text-sky-800",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
    "bg-amber-500/10 border-amber-500/20 text-amber-800",
    "bg-rose-500/10 border-rose-500/20 text-rose-800",
    "bg-violet-500/10 border-violet-500/20 text-violet-800",
    "bg-teal-500/10 border-teal-500/20 text-teal-800",
];

function ConvertButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleConvert = () => {
        startTransition(async () => {
            const result = await convertOrderToInvoice(orderId);
            if (result.success) {
                toast({
                    title: "Conversion réussie !",
                    description: "La commande a été convertie en facture et le stock a été mis à jour.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Erreur de conversion",
                    description: result.message || "Une erreur est survenue.",
                });
            }
        });
    };

    return (
        <Button onClick={handleConvert} disabled={isPending} size="sm">
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conversion...
                </>
            ) : (
                <>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Convertir en Facture
                </>
            )}
        </Button>
    );
}

export function ClientOrdersList({ orders, settings }: ClientOrdersListProps) {
  const pendingOrders = orders.filter(o => o.status === CLIENT_ORDER_STATUS.PENDING);
  const processedOrders = orders.filter(o => o.status === CLIENT_ORDER_STATUS.PROCESSED);

  const getStatusVariant = (status: ClientOrder['status']): "success" | "warning" | "destructive" | "outline" => {
    switch (status) {
      case 'Processed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
      default:
        return 'outline';
    }
  }


  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground">Aucune commande client</h3>
        <p className="text-sm text-muted-foreground mt-2">Lorsque les clients passeront des commandes via leur QR code, elles apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Clock className="text-amber-500" /> Commandes en attente</h2>
            <div className="space-y-4">
                {pendingOrders.length > 0 ? pendingOrders.map((order, index) => (
                    <Card key={order.id} className={cn("shadow-lg", cardColors[index % cardColors.length])}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{order.orderNumber}</CardTitle>
                                <Badge variant={getStatusVariant(order.status)}>{CLIENT_ORDER_STATUS_TRANSLATIONS[order.status]}</Badge>
                            </div>
                            <CardDescription className="text-current/70 !mt-2">
                                <span className="font-semibold text-current">{order.clientName}</span> - {new Date(order.date).toLocaleString('fr-FR')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible>
                                <AccordionItem value="items">
                                    <AccordionTrigger>{order.items.length} article(s) - Total: {formatCurrency(order.totalAmount, settings.currency)}</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="list-disc pl-5 text-sm text-current/80 space-y-1">
                                            {order.items.map(item => (
                                                <li key={item.productId}>
                                                    {item.productName} (x{item.quantity})
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter>
                            <ConvertButton orderId={order.id} />
                        </CardFooter>
                    </Card>
                )) : (
                    <p className="text-muted-foreground text-center py-8">Aucune commande en attente.</p>
                )}
            </div>
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><CheckCheck className="text-emerald-500" /> Commandes traitées</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                 {processedOrders.length > 0 ? processedOrders.map((order) => (
                    <Card key={order.id} className="bg-muted/60">
                        <CardHeader className="p-4">
                             <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{order.orderNumber}</p>
                                    <p className="text-xs text-muted-foreground">{order.clientName}</p>
                                </div>
                                <Badge variant={getStatusVariant(order.status)}>{CLIENT_ORDER_STATUS_TRANSLATIONS[order.status]}</Badge>
                            </div>
                        </CardHeader>
                    </Card>
                 )) : (
                    <p className="text-muted-foreground text-center py-8">Aucune commande traitée pour le moment.</p>
                 )}
            </div>
        </div>
    </div>
  );
}
