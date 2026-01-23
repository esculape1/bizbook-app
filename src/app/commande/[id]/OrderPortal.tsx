'use client';

import { useState, useMemo, useTransition } from 'react';
import type { Client, Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { Minus, Plus, Search, Send, ShoppingCart } from 'lucide-react';
import { submitClientOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const cardColors = [
  "bg-sky-100 border-sky-200 text-sky-900 dark:bg-sky-900/40 dark:border-sky-800 dark:text-sky-200",
  "bg-emerald-100 border-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-200",
  "bg-amber-100 border-amber-200 text-amber-900 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-200",
  "bg-rose-100 border-rose-200 text-rose-900 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-200",
  "bg-violet-100 border-violet-200 text-violet-900 dark:bg-violet-900/40 dark:border-violet-800 dark:text-violet-200",
  "bg-teal-100 border-teal-200 text-teal-900 dark:bg-teal-900/40 dark:border-teal-800 dark:text-teal-200",
];

type OrderPortalProps = {
  client: Client;
  products: Product[];
  settings: Settings;
};

export function OrderPortal({ client, products, settings }: OrderPortalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
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

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const orderItems = useMemo(() => {
    return Object.entries(quantities).map(([productId, quantity]) => {
      return { productId, quantity };
    });
  }, [quantities]);

  const totalItemsInCart = Object.values(quantities).reduce((sum, q) => sum + q, 0);

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
      const result = await submitClientOrder({
        clientId: client.id,
        items: orderItems,
      });

      if (result.success) {
        toast({
          title: 'Commande envoyée !',
          description: 'Votre demande de commande a bien été reçue.',
        });
        setQuantities({});
        setSearchTerm('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message || 'Une erreur est survenue.',
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-28">
      <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader className="flex flex-row items-center gap-4">
          {settings.logoUrl ? (
            <Image src={settings.logoUrl} alt="Logo" width={48} height={48} className="rounded-md" data-ai-hint="logo"/>
          ) : (
             <div className="p-3 rounded-lg bg-primary/20 text-primary">
                <ShoppingCart className="h-6 w-6"/>
            </div>
          )}
          <div>
            <CardTitle className="text-3xl">
              Bonjour, <span className="font-bold text-primary">{client.name}</span>
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
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
              <div className="flex items-center gap-3 w-full justify-center bg-background/50 rounded-full p-1 shadow-inner">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive rounded-full h-8 w-8" 
                  onClick={() => handleQuantityChange(product.id, -1)}
                  disabled={!quantities[product.id]}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-xl w-10 text-center text-foreground">{quantities[product.id] || 0}</span>
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
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto">
          <Button 
            className="w-full text-lg h-16 shadow-lg" 
            size="lg"
            onClick={handleSubmit} 
            disabled={isPending || totalItemsInCart === 0}
          >
            <Send className="mr-3 h-5 w-5" />
            {isPending ? 'Envoi en cours...' : `Envoyer la commande (${totalItemsInCart} articles)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
