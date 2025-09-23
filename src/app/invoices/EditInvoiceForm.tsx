
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
import { CalendarIcon, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { updateInvoice } from './actions';
import type { Client, Product, Settings, Invoice, InvoiceItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EditInvoiceFormProps = {
  invoice: Invoice;
  clients: Client[];
  products: Product[];
  settings: Settings;
};

export function EditInvoiceForm({ invoice, clients, products, settings }: EditInvoiceFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const invoiceItemSchema = z.object({
    productId: z.string().min(1, "Produit requis"),
    productName: z.string(),
    reference: z.string(),
    quantity: z.coerce.number().min(1, "Qté > 0"),
    unitPrice: z.coerce.number().min(0),
    total: z.coerce.number(),
    purchasePrice: z.coerce.number(),
  });

  const invoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Le numéro de facture est requis."),
    clientId: z.string().min(1, "Client requis"),
    date: z.date({ required_error: "Date requise" }),
    dueDate: z.date({ required_error: "Date d'échéance requise" }),
    items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins un produit.")
      .superRefine((items, ctx) => {
          items.forEach((item, index) => {
              if (item.unitPrice < item.purchasePrice) {
                  ctx.addIssue({
                      path: [`${index}`, 'unitPrice'],
                      message: `>= ${formatCurrency(item.purchasePrice, settings.currency)}`,
                      code: z.ZodIssueCode.custom,
                  });
              }
          });
      }),
    vat: z.coerce.number().min(0).default(0),
    discount: z.coerce.number().min(0).default(0),
  });

  type InvoiceFormValues = z.infer<typeof invoiceSchema>;


  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      ...invoice,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
      items: invoice.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          purchasePrice: product?.purchasePrice ?? 0,
        }
      }),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedDiscount = useWatch({ control: form.control, name: 'discount' });
  const watchedVat = useWatch({ control: form.control, name: 'vat' });

  const subTotal = watchedItems.reduce((acc, item) => {
    return acc + (item.unitPrice || 0) * (item.quantity || 0);
  }, 0);
  
  const discountAmount = subTotal * (watchedDiscount / 100);
  const totalAfterDiscount = subTotal - discountAmount;
  const vatAmount = totalAfterDiscount * (watchedVat / 100);
  const totalAmount = totalAfterDiscount + vatAmount;

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.unitPrice`, product.unitPrice);
      form.setValue(`items.${index}.quantity`, 1);
      form.setValue(`items.${index}.reference`, product.reference);
      form.setValue(`items.${index}.purchasePrice`, product.purchasePrice ?? 0);
    }
  };

  const onSubmit = (data: InvoiceFormValues) => {
    startTransition(async () => {
      const result = await updateInvoice(invoice.id, data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la mise à jour",
          description: result.message,
        });
      } else {
        toast({
          title: "Facture mise à jour",
          description: "Les informations de la facture ont été modifiées.",
        });
        setIsOpen(false);
      }
    });
  };
  
  const isEditDisabled = invoice.status === 'Cancelled' || invoice.status === 'Paid';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isEditDisabled}>
          <Pencil className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Modifier la facture {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto px-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de facture</FormLabel>
                     <FormControl>
                        <Input placeholder="FACT-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
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
                    <FormLabel>Date de facturation</FormLabel>
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date d'échéance</FormLabel>
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
                    {fields.map((item, index) => {
                      const itemTotal = (watchedItems[index]?.unitPrice || 0) * (watchedItems[index]?.quantity || 0);
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
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                               <FormItem>
                                 <FormControl>
                                   <Input type="number" {...field} step="0.01" className="w-24"/>
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
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: '', quantity: 1, unitPrice: 0, reference: '', total: 0, purchasePrice: 0 })}>
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

            <DialogFooter className="sticky bottom-0 bg-background/95 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
