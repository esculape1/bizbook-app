'use client';

import { useState, useTransition } from 'react';
import type { ClientOrder, Settings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle2, Timer, FileSignature, Loader2, Ban, History, PackageSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { convertOrderToInvoice } from './actions';
import { Badge } from '@/components/ui/badge';
import { CLIENT_ORDER_STATUS, CLIENT_ORDER_STATUS_TRANSLATIONS } from '@/lib/constants';
import { CancelClientOrderButton } from './CancelClientOrderButton';

type ClientOrdersListProps = {
  orders: ClientOrder[];
  settings: Settings;
};

const cardColors = [
    "bg-sky-500/10 border-sky-500/20 text-sky-800 hover:border-sky-500/50",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 hover:border-emerald-500/50",
    "bg-amber-500/10 border-amber-500/20 text-amber-800 hover:border-amber-500/50",
    "bg-rose-500/10 border-rose-500/20 text-rose-800 hover:border-rose-500/50",
    "bg-violet-500/10 border-violet-500/20 text-violet-800 hover:border-violet-500/50",
    "bg-teal-500/10 border-teal-500/20 text-teal-800 hover:border-teal-500/50",
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
        <Button onClick={handleConvert} disabled={isPending} size="sm" className="font-bold">
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conversion...
                </>
            ) : (
                <>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Facturer
                </>
            )}
        </Button>
    );
}

export function ClientOrdersList({ orders, settings }: ClientOrdersListProps) {
  const pendingOrders = orders.filter(o => o.status === CLIENT_ORDER_STATUS.PENDING);
  const processedOrders = orders.filter(o => o.status === CLIENT_ORDER_STATUS.PROCESSED);
  const cancelledOrders = orders.filter(o => o.status === CLIENT_ORDER_STATUS.CANCELLED);

  const getStatusVariant = (status: ClientOrder['status']): "success" | "warning" | "destructive" | "outline" => {
    switch (status) {
      case 'Processed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  }


  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50">
        <PackageSearch className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-xl font-bold text-muted-foreground">Aucune commande client</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">Les commandes passées par vos clients via leur QR code apparaîtront instantanément ici.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Section Commandes en Attente */}
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Timer className="size-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Commandes en attente</h2>
            </div>
            
            <div className="space-y-4">
                {pendingOrders.length > 0 ? pendingOrders.map((order, index) => (
                    <Card key={order.id} className={cn(
                        "group shadow-md border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl", 
                        cardColors[index % cardColors.length]
                    )}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">{order.orderNumber}</CardTitle>
                                    <CardDescription className="text-current/70 font-bold mt-1 uppercase text-xs">
                                        {order.clientName}
                                    </CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(order.status)} className="shrink-0 font-black px-3 py-1">
                                    {CLIENT_ORDER_STATUS_TRANSLATIONS[order.status]}
                                </Badge>
                            </div>
                            <p className="text-[10px] font-bold opacity-60 mt-2">
                                REÇUE LE {new Date(order.date).toLocaleString('fr-FR')}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="border-t border-current/10">
                                <AccordionItem value="items" className="border-none">
                                    <AccordionTrigger className="hover:no-underline py-3 text-sm font-bold">
                                        <span>{order.items.length} article(s) • <span className="text-lg">{formatCurrency(order.totalAmount, settings.currency)}</span></span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="bg-white/40 rounded-xl p-3 space-y-2">
                                            {order.items.map(item => (
                                                <div key={item.productId} className="flex justify-between items-center text-xs">
                                                    <span className="font-medium">{item.productName}</span>
                                                    <span className="font-black px-2 py-0.5 rounded-md bg-black/5">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between pt-2 border-t border-current/5 bg-black/5">
                            <ConvertButton orderId={order.id} />
                            <CancelClientOrderButton orderId={order.id} orderNumber={order.orderNumber} />
                        </CardFooter>
                    </Card>
                )) : (
                    <Card className="border-dashed bg-muted/30">
                        <CardContent className="py-10 text-center text-muted-foreground font-medium italic">
                            Aucune commande en attente pour le moment.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>

        {/* Section Historique */}
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <History className="size-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Historique</h2>
            </div>

            <div className="space-y-8">
                {/* Commandes Traitées */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                        <CheckCircle2 className="size-4" /> 
                        Commandes traitées
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {processedOrders.length > 0 ? processedOrders.map((order) => (
                            <Card key={order.id} className="group bg-card transition-all duration-200 hover:bg-emerald-50/50 hover:border-emerald-200 shadow-sm border-emerald-100">
                                <CardHeader className="p-4">
                                     <div className="flex justify-between items-center">
                                        <div className="min-w-0">
                                            <p className="font-black text-sm uppercase tracking-tight">{order.orderNumber}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{order.clientName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-xs text-emerald-700">{formatCurrency(order.totalAmount, settings.currency)}</p>
                                            <Badge variant="success" className="h-5 text-[9px] font-black uppercase mt-1">TRAITÉ</Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                         )) : (
                            <p className="text-muted-foreground text-center py-8 text-sm italic border rounded-xl bg-muted/10">Aucune commande traitée.</p>
                         )}
                    </div>
                </div>

                {/* Commandes Annulées */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                        <Ban className="size-4" /> 
                        Commandes annulées
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {cancelledOrders.length > 0 ? cancelledOrders.map((order) => (
                           <Card key={order.id} className="group bg-muted/30 opacity-70 transition-all hover:opacity-100 border-dashed border-rose-200">
                               <CardHeader className="p-4">
                                    <div className="flex justify-between items-center">
                                       <div className="min-w-0">
                                           <p className="font-black text-sm uppercase tracking-tight text-muted-foreground line-through">{order.orderNumber}</p>
                                           <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{order.clientName}</p>
                                       </div>
                                       <Badge variant="destructive" className="h-5 text-[9px] font-black uppercase">ANNULÉ</Badge>
                                   </div>
                               </CardHeader>
                           </Card>
                        )) : (
                           <p className="text-muted-foreground text-center py-8 text-sm italic border rounded-xl bg-muted/10">Aucune commande annulée.</p>
                        )}
                   </div>
                </div>
            </div>
        </div>
    </div>
  );
}