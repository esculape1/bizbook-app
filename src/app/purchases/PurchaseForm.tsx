
'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { createPurchase } from './actions';
import type { Supplier, Product, Settings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  productName: z.string(),
  reference: z.string(),
  quantity: z.coerce.number().min(1, "Qté > 0"),
  purchasePrice: z.coerce.number().min(0, "Prix invalide"),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  date: z.date({ required_error: "Date requise" }),
  items: z.array(purchaseItemSchema).min(1, "Ajoutez au moins un produit."),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

type PurchaseFormProps = {
  suppliers: Supplier[];
  products: Product[];
  settings: Settings;
};

export function PurchaseForm({ suppliers, products, settings }: PurchaseFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      date: new Date(),
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const subTotal = watchedItems.reduce((acc, item) => {
    return acc + (item.purchasePrice || 0) * (item.quantity || 0);
  }, 0);
  const totalAmount = subTotal; // No VAT or discount for purchases for now

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.reference`, product.reference);
      form.setValue(`items.${index}.quantity`, 1);
      form.setValue(`items.${index}.purchasePrice`, product.purchasePrice || 0);
    }
  };

  const onSubmit = (data: PurchaseFormValues) => {
    startTransition(async () => {
      const result = await createPurchase(data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la création",
          description: result.message,
        });
      } else {
        toast({
          title: "Achat créé",
          description: "Le nouvel achat a été enregistré.",
        });
        form.reset();
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2" />
          Ajouter un achat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Créer un nouvel achat</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un fournisseur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date de l'achat</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? (format(field.value, 'PPP', { locale: fr })) : (<span>Choisir une date</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Articles</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/5">Produit</TableHead>
                      <TableHead>Qté</TableHead>
                      <TableHead>Prix d'Achat U.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucun produit ajouté.
                        </TableCell>
                      </TableRow>
                    )}
                    {fields.map((item, index) => {
                      const itemTotal = (watchedItems[index]?.purchasePrice || 0) * (watchedItems[index]?.quantity || 0);

                      return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <Select onValueChange={(value) => { field.onChange(value); handleProductChange(value, index); }} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un produit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <Input type="number" {...field} className="w-20" />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                           <FormField
                            control={form.control}
                            name={`items.${index}.purchasePrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" {...field} step="0.01" className="w-24"/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(itemTotal, settings.currency)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: '', reference: '', quantity: 1, purchasePrice: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un article
              </Button>
              <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
            </div>
            
            <div className="flex justify-end">
                <div className="w-full md:w-[280px] space-y-2 text-sm bg-muted/50 p-4 rounded-md">
                    <div className="flex justify-between font-bold text-base">
                        <span>Total:</span>
                        <span>{formatCurrency(totalAmount, settings.currency)}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement...' : 'Enregistrer l\'achat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
