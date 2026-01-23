
'use client';

import { useState, useMemo, useTransition } from 'react';
import type { Client, Product, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { MinusCircle, PlusCircle, Search, Send } from 'lucide-react';
import { submitClientOrder } from './actions';
import { useToast } from '@/hooks/use-toast';

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
      // If new quantity is 0, we can remove it from the state to keep it clean
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
      // The server action only needs the ID and quantity for security.
      // The rest of the data (name, price) will be fetched on the server.
      return {
        productId,
        quantity,
      };
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
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-24">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Portail de Commande Express</CardTitle>
          <CardDescription className="text-lg">
            Bonjour, <span className="font-bold text-primary">{client.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un produit par nom ou référence..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-3">
        {filteredProducts.map(product => (
          <Card key={product.id} className="flex items-center p-3">
            <div className="flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">Réf: {product.reference}</p>
              <p className="font-bold text-primary">{formatCurrency(product.unitPrice, settings.currency)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive rounded-full" 
                onClick={() => handleQuantityChange(product.id, -1)}
                disabled={!quantities[product.id]}
              >
                <MinusCircle />
              </Button>
              <span className="font-bold text-xl w-8 text-center">{quantities[product.id] || 0}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary rounded-full" 
                onClick={() => handleQuantityChange(product.id, 1)}
              >
                <PlusCircle />
              </Button>
            </div>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucun produit ne correspond à votre recherche.</p>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-3xl mx-auto">
          <Button 
            className="w-full text-lg h-14" 
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
