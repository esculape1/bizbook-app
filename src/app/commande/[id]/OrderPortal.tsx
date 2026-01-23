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
  "bg-sky-500/10 border-sky-500/20 text-sky-800",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
  "bg-amber-500/10 border-amber-500/20 text-amber-800",
  "bg-rose-500/10 border-rose-500/20 text-rose-800",
  "bg-violet-500/10 border-violet-500/20 text-violet-800",
  "bg-teal-500/10 border-teal-500/20 text-teal-800",
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

  const handleQuantityInputChange = (productId: string, value: string) => {
    const newQuantity = parseInt(value, 10);
    // Allow setting quantity to 0 by typing
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      setQuantities(prev => {
        if (newQuantity === 0) {
          const { [productId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [productId]: newQuantity };
      });
    } else if (value === '') {
      // When user clears the input, remove from quantities
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
      <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary to-sky-400 text-white overflow-hidden">
        <CardHeader className="relative p-6">
            {settings.logoUrl ? (
                <Image 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    width={40} 
                    height={40} 
                    className="absolute top-4 right-4 rounded-md opacity-80" 
                    data-ai-hint="logo"
                />
            ) : (
                <div className="absolute top-4 right-4 p-2 rounded-lg bg-white/20">
                    <ShoppingCart className="h-5 w-5"/>
                </div>
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
