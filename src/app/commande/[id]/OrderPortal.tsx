
'use client';

import { useState, useMemo, useTransition } from 'react';
import type { Client, Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, MessageSquare, Minus, Plus, PlusCircle, Search, Send, ShoppingCart, Trash2 } from 'lucide-react';
import { submitClientOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const cardColors = [
  "bg-sky-500/10 border-sky-500/20 text-sky-800",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
  "bg-amber-500/10 border-amber-500/20 text-amber-800",
  "bg-rose-500/10 border-rose-500/20 text-rose-800",
  "bg-violet-500/10 border-violet-500/20 text-violet-800",
  "bg-teal-500/10 border-teal-500/20 text-teal-800",
];

type EnrichedProduct = Product & { quantity: number; total: number };

type OrderPortalProps = { 
  client: Client; 
  products: Product[]; 
  settings: Settings; 
};

function SuccessView({
    order,
    settings,
    client,
    onNewOrder,
    whatsappLink,
}: {
    order: { orderNumber: string; totalAmount: number };
    settings: Settings;
    client: Client;
    onNewOrder: () => void;
    whatsappLink: string;
}) {
    const prefilledMessage = `Bonjour, je viens de passer la commande N° ${order.orderNumber} d'un montant de ${formatCurrency(order.totalAmount, settings.currency)}. Merci.`;
    const finalWhatsAppLink = `${whatsappLink}&text=${encodeURIComponent(prefilledMessage)}`;
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-emerald-500/50 bg-emerald-500/10">
                <CardHeader className="items-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                    <CardTitle className="text-2xl font-bold text-emerald-800">Commande envoyée !</CardTitle>
                    <CardDescription className="text-emerald-700/80">Votre commande a été reçue avec succès.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-background/50 rounded-lg text-left text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Client:</span>
                            <span className="font-semibold">{client.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">N° Commande:</span>
                            <span className="font-semibold">{order.orderNumber}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Montant Total:</span>
                            <span className="font-semibold">{formatCurrency(order.totalAmount, settings.currency)}</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Cliquez sur le bouton ci-dessous pour nous notifier rapidement sur WhatsApp.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                     <Button asChild className="w-full h-12 bg-green-500 hover:bg-green-600 text-white">
                         <a
                            href={finalWhatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                         >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Notifier sur WhatsApp
                        </a>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={onNewOrder}>
                       <PlusCircle className="mr-2 h-4 w-4" />
                       Passer une autre commande
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export function OrderPortal({ client, products, settings }: OrderPortalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [successfulOrder, setSuccessfulOrder] = useState<{ orderNumber: string; totalAmount: number; } | null>(null);
  const { toast } = useToast();

  const handleQuantityChange = (productId: string, change: number) => {
    setQuantities(prev => {
      const currentQuantity = prev[productId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      if (newQuantity === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQuantity };
    });
  };
  
  const handleRemoveItem = (productId: string) => {
    setQuantities(prev => {
        const { [productId]: _, ...rest } = prev;
        return rest;
    });
  };

  const handleQuantityInputChange = (productId: string, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      setQuantities(prev => {
        if (newQuantity === 0) {
          const { [productId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [productId]: newQuantity };
      });
    } else if (value === '') {
      setQuantities(prev => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const orderItems = useMemo((): EnrichedProduct[] => {
    return Object.entries(quantities)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        if (!product || quantity <= 0) return null;
        return {
          ...product,
          quantity,
          total: product.unitPrice * quantity,
        };
      })
      .filter((item): item is EnrichedProduct => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [quantities, products]);

  const { totalItemsInCart, orderTotal } = useMemo(() => {
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
    return { totalItemsInCart: totalItems, orderTotal: totalAmount };
  }, [orderItems]);
  
  const handleSubmit = () => {
    if (orderItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Panier vide',
        description: 'Veuillez ajouter des articles avant de soumettre.',
      });
      return;
    }

    startTransition(async () => {
      const payloadItems = orderItems.map(item => ({ productId: item.id, quantity: item.quantity }));
      const result = await submitClientOrder({
        clientId: client.id,
        items: payloadItems,
      });

      if (result.success) {
        toast({
          title: 'Commande envoyée !',
          description: 'Votre demande de commande a bien été reçue.',
        });
        setSheetOpen(false); // Close the sheet immediately
        setSuccessfulOrder({
          orderNumber: result.orderNumber,
          totalAmount: result.totalAmount,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message || 'Une erreur est survenue.',
        });
      }
    });
  };

  const handleNewOrder = () => {
      setSuccessfulOrder(null);
      setQuantities({});
      setSearchTerm('');
  };

  const whatsappLink = "https://wa.me/message/YZS5BF6UL4G3K1";

  if (successfulOrder) {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <SuccessView
            order={successfulOrder}
            settings={settings}
            client={client}
            onNewOrder={handleNewOrder}
            whatsappLink={whatsappLink}
          />
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-28">
      <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary to-sky-400 text-white overflow-hidden">
        <CardHeader className="relative p-6">
            {settings.logoUrl && (
                <Image 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    width={40} 
                    height={40} 
                    className="absolute top-4 right-4 rounded-md opacity-80" 
                    data-ai-hint="logo"
                />
            )}
            <div className="pr-12">
                <CardTitle className="text-4xl font-bold drop-shadow-md">
                    Bonjour, <span className="font-extrabold">{client.name}</span>
                </CardTitle>
                <CardDescription className="text-lg text-white/90 mt-1">
                    Portail de Commande Express
                </CardDescription>
            </div>
        </CardHeader>
      </Card>
      
      <div className="sticky top-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit par nom ou référence..."
            className="pl-10 w-full shadow-md h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <Card 
            key={product.id} 
            className={cn(
              "flex flex-col justify-between transition-all duration-300",
              cardColors[index % cardColors.length],
              quantities[product.id] > 0 ? 'ring-2 ring-primary ring-offset-background scale-105 shadow-2xl' : 'hover:shadow-lg hover:-translate-y-1'
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">{product.name}</CardTitle>
              <CardDescription className="text-xs text-current/80">Réf: {product.reference}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-extrabold text-xl text-current">{formatCurrency(product.unitPrice, settings.currency)}</p>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2 w-full justify-center bg-background/50 rounded-full p-1 shadow-inner">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive rounded-full h-8 w-8" 
                  onClick={() => handleQuantityChange(product.id, -1)}
                  disabled={!quantities[product.id]}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  className="w-14 h-9 text-center font-bold text-lg border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  value={quantities[product.id] || ''}
                  placeholder="0"
                  onChange={(e) => handleQuantityInputChange(product.id, e.target.value)}
                  min="0"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary rounded-full h-8 w-8" 
                  onClick={() => handleQuantityChange(product.id, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-16">
            <p>Aucun produit ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
                <div className="max-w-4xl mx-auto">
                <Button 
                    className="w-full text-lg h-16 shadow-lg" 
                    size="lg"
                    disabled={totalItemsInCart === 0}
                >
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    Voir mon panier ({totalItemsInCart}) - {formatCurrency(orderTotal, settings.currency)}
                </Button>
                </div>
            </div>
        </SheetTrigger>
        <SheetContent className="sm:max-w-lg w-full flex flex-col">
            <SheetHeader>
                <SheetTitle>Résumé de votre commande</SheetTitle>
                <SheetDescription>Vérifiez vos articles avant de confirmer.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                {orderItems.length > 0 ? (
                    <div className="space-y-4 py-4">
                        {orderItems.map((item, index) => (
                            <div key={item.id} className={cn("flex items-center gap-4 p-4 rounded-lg", cardColors[index % cardColors.length])}>
                                <div className="flex-1 space-y-1">
                                    <p className="font-bold text-current">{item.name}</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 bg-white/60 rounded-md">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleQuantityChange(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                            <span className="w-6 text-center text-sm font-bold text-current">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => handleQuantityChange(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                        <p className="text-sm text-current/80">{formatCurrency(item.unitPrice, settings.currency)} / unité</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-current">{formatCurrency(item.total, settings.currency)}</p>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 mt-1 text-destructive/80 hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Votre panier est vide.</p>
                    </div>
                )}
            </div>
            <SheetFooter className="border-t -mx-6 px-6 pt-6">
                <div className="w-full space-y-4">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(orderTotal, settings.currency)}</span>
                    </div>
                     <Button 
                        className="w-full text-lg h-14" 
                        size="lg"
                        onClick={handleSubmit} 
                        disabled={isPending || orderItems.length === 0}
                    >
                        <Send className="mr-3 h-5 w-5" />
                        {isPending ? 'Envoi en cours...' : 'Confirmer et envoyer'}
                    </Button>
                </div>
            </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
