
'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { createQuote } from './actions';
import type { Client, Product, Settings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductPicker } from '@/components/ProductPicker';
import { ClientPicker } from '@/components/ClientPicker';

const quoteItemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  productName: z.string(),
  quantity: z.coerce.number().min(1, "Qté > 0"),
  unitPrice: z.coerce.number().min(0, "Prix invalide"),
  reference: z.string(),
  total: z.coerce.number(),
});

const quoteSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  clientName: z.string(),
  date: z.date({ required_error: "Date requise" }),
  expiryDate: z.date({ required_error: "Date d'expiration requise" }),
  items: z.array(quoteItemSchema).min(1, "Ajoutez au moins un produit."),
  vat: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

type QuoteFormProps = {
  clients: Client[];
  products: Product[];
  settings: Settings;
};

export function QuoteForm({ clients, products, settings }: QuoteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientId: '',
      clientName: '',
      date: new Date(),
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [],
      vat: 0,
      discount: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  });
  
  const watchedDiscount = useWatch({ control: form.control, name: 'discount' });
  const watchedVat = useWatch({ control: form.control, name: 'vat' });
  const selectedClientName = useWatch({ control: form.control, name: 'clientName' });

  const subTotal = watchedItems.reduce((acc, item) => {
    const calculatedTotal = (item.unitPrice || 0) * (item.quantity || 0);
    if (form.getValues(`items.${watchedItems.indexOf(item)}.total`) !== calculatedTotal) {
        form.setValue(`items.${watchedItems.indexOf(item)}.total`, calculatedTotal);
    }
    return acc + calculatedTotal;
  }, 0);
  
  const discountAmount = subTotal * (watchedDiscount / 100);
  const totalAfterDiscount = subTotal - discountAmount;
  const vatAmount = totalAfterDiscount * (watchedVat / 100);
  const totalAmount = totalAfterDiscount + vatAmount;

  const handleProductSelect = (product: Product, index: number) => {
    update(index, {
        ...watchedItems[index],
        productId: product.id,
        productName: product.name,
        unitPrice: product.unitPrice,
        reference: product.reference,
        quantity: watchedItems[index].quantity || 1,
        total: product.unitPrice * (watchedItems[index].quantity || 1)
    });
  };

  const handleClientSelect = (client: Client) => {
    form.setValue('clientId', client.id);
    form.setValue('clientName', client.name);
  }

  const onSubmit = (data: QuoteFormValues) => {
    startTransition(async () => {
      const result = await createQuote(data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la création",
          description: result.message,
        });
      } else {
        toast({
          title: "Proforma créée",
          description: "La nouvelle proforma a été enregistrée.",
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
          Créer une proforma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle proforma</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <ClientPicker
                      clients={clients}
                      onClientSelect={handleClientSelect}
                      selectedClientName={selectedClientName || "Sélectionner un client"}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date de la proforma</FormLabel>
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
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date d'expiration</FormLabel>
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
              <h3 className="text-lg font-medium">Produits / Services</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/5">Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix U.</TableHead>
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
                      const itemTotal = (watchedItems[index]?.unitPrice || 0) * (watchedItems[index]?.quantity || 0);

                      return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <ProductPicker 
                            products={products}
                            onProductSelect={(product) => handleProductSelect(product, index)}
                            selectedProductName={item.productName}
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
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                               <FormItem>
                                 <FormControl>
                                   <Input type="number" step="0.01" className="w-24"/>
                                 </FormControl>
                                 <FormMessage/>
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
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: 'Sélectionner un produit', quantity: 1, unitPrice: 0, reference: '', total: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un article
              </Button>
              <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full md:w-64">
                    <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remise (%)</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="vat"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>TVA (%)</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                </div>
                <div className="w-full md:w-[280px] space-y-2 text-sm bg-muted/50 p-4 rounded-md">
                    <div className="flex justify-between">
                        <span>Sous-total:</span>
                        <span>{formatCurrency(subTotal, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Remise ({watchedDiscount}%):</span>
                        <span>-{formatCurrency(discountAmount, settings.currency)}</span>
                    </div>
                     <div className="flex justify-between text-muted-foreground">
                        <span>TVA ({watchedVat}%):</span>
                        <span>+{formatCurrency(vatAmount, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(totalAmount, settings.currency)}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement...' : 'Enregistrer la proforma'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
