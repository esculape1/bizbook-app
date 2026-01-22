
'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import type { Product } from '@/lib/types';
import { createProduct, updateProduct } from './actions';

const productSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  reference: z.string().min(1, { message: "La référence est requise." }),
  category: z.string().min(1, { message: "La catégorie est requise." }),
  purchasePrice: z.coerce.number().min(0, { message: "Le prix d'achat doit être positif." }),
  unitPrice: z.coerce.number().min(0, { message: "Le prix doit être positif." }),
  quantityInStock: z.coerce.number().min(0, { message: "La quantité doit être positive." }),
  reorderPoint: z.coerce.number().min(0, { message: "Le point de commande doit être positif." }),
  safetyStock: z.coerce.number().min(0, { message: "Le stock de sécurité doit être positif." }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  product?: Product;
  children: ReactNode;
}

export function ProductFormDialog({ product, children }: ProductFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isEditMode = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: isEditMode ? {
      ...product,
      purchasePrice: product.purchasePrice ?? 0,
    } : {
      name: '',
      reference: '',
      category: '',
      purchasePrice: 0,
      unitPrice: 0,
      quantityInStock: 0,
      reorderPoint: 0,
      safetyStock: 0,
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    startTransition(async () => {
      const action = isEditMode ? updateProduct(product.id, data) : createProduct(data);
      const result = await action;

      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        });
      } else {
        toast({
          title: `Produit ${isEditMode ? 'mis à jour' : 'ajouté'}`,
          description: `Le produit a été ${isEditMode ? 'modifié' : 'enregistré'} avec succès.`,
        });
        form.reset();
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du produit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence</FormLabel>
                      <FormControl>
                        <Input placeholder="Référence" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl>
                      <Input placeholder="Catégorie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d'Achat</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de Vente</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quantityInStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qté en Stock</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reorderPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Point de Cde.</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="safetyStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Sécu.</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" form="product-form" disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
