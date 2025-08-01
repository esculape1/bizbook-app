
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
import { updatePurchase } from './actions';
import type { Supplier, Product, Settings, Purchase } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  productName: z.string(),
  reference: z.string(),
  quantity: z.coerce.number().min(1, "Qté > 0"),
});

const updatePurchaseSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  date: z.date({ required_error: "Date requise" }),
  items: z.array(purchaseItemSchema).min(1, "Ajoutez au moins un produit."),
  status: z.enum(['Pending', 'Received', 'Cancelled']),
  premierVersement: z.coerce.number().min(0).default(0),
  deuxiemeVersement: z.coerce.number().min(0).default(0),
  transportCost: z.coerce.number().min(0).default(0),
  otherFees: z.coerce.number().min(0).default(0),
});

type PurchaseFormValues = z.infer<typeof updatePurchaseSchema>;

type EditPurchaseFormProps = {
  purchase: Purchase;
  suppliers: Supplier[];
  products: Product[];
  settings: Settings;
};

export function EditPurchaseForm({ purchase, suppliers, products, settings }: EditPurchaseFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(updatePurchaseSchema),
    defaultValues: {
      ...purchase,
      date: new Date(purchase.date),
      premierVersement: purchase.premierVersement || 0,
      deuxiemeVersement: purchase.deuxiemeVersement || 0,
      transportCost: purchase.transportCost || 0,
      otherFees: purchase.otherFees || 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  const watchedPremierVersement = useWatch({ control: form.control, name: 'premierVersement' });
  const watchedDeuxiemeVersement = useWatch({ control: form.control, name: 'deuxiemeVersement' });
  const watchedTransportCost = useWatch({ control: form.control, name: 'transportCost' });
  const watchedOtherFees = useWatch({ control: form.control, name: 'otherFees' });

  const totalAmount = (watchedPremierVersement || 0) + (watchedDeuxiemeVersement || 0) + (watchedTransportCost || 0) + (watchedOtherFees || 0);

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.reference`, product.reference);
      form.setValue(`items.${index}.quantity`, 1);
    }
  };

  const onSubmit = (data: PurchaseFormValues) => {
    startTransition(async () => {
      const result = await updatePurchase(purchase.id, purchase.purchaseNumber, data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur de mise à jour",
          description: result.message,
        });
      } else {
        toast({
          title: "Achat mis à jour",
          description: "L'achat a été mis à jour avec succès.",
        });
        setIsOpen(false);
      }
    });
  };
  
  const statusTranslations: { [key in Purchase['status']]: string } = {
    Pending: 'En attente',
    Received: 'Reçu',
    Cancelled: 'Annulé',
  }
  
  const isEditDisabled = purchase.status === 'Cancelled';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Modifier l'achat" disabled={isEditDisabled}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl flex flex-col h-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Modifier l'achat {purchase.purchaseNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-6 px-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {Object.entries(statusTranslations).map(([key, value]) => (
                                <SelectItem key={key} value={key as Purchase['status']}>{value}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
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
                        <TableHead className="w-4/5">Produit</TableHead>
                        <TableHead>Qté</TableHead>
                        <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((item, index) => (
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
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: '', reference: '', quantity: 1 })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un article
                </Button>
                <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 w-full md:w-auto flex-grow">
                    <FormField
                        control={form.control}
                        name="premierVersement"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Premier Versement</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deuxiemeVersement"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deuxième Versement</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="transportCost"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coût du Transport</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="otherFees"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Autres Frais</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                </div>
                <div className="w-full md:w-[320px] space-y-2 text-sm bg-muted/50 p-4 rounded-md">
                    <h3 className="font-bold mb-2">Résumé du Coût Global</h3>
                    <div className="flex justify-between">
                        <span>Premier versement:</span>
                        <span>{formatCurrency(watchedPremierVersement || 0, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Deuxième versement:</span>
                        <span>{formatCurrency(watchedDeuxiemeVersement || 0, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Coût du transport:</span>
                        <span>{formatCurrency(watchedTransportCost || 0, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Autres frais:</span>
                        <span>{formatCurrency(watchedOtherFees || 0, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Total Achat:</span>
                        <span>{formatCurrency(totalAmount, settings.currency)}</span>
                    </div>
                </div>
                </div>
            </div>
            <DialogFooter className="border-t pt-4 mt-auto">
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
