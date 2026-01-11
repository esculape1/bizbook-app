
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, CreditCard } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { recordPayment } from './actions';
import type { Invoice, Settings } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

type RecordPaymentButtonProps = {
  invoice: Invoice;
  settings: Settings;
};

export function RecordPaymentButton({ invoice, settings }: RecordPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);

  const paymentSchema = z.object({
    amount: z.coerce
      .number()
      .positive("Le montant doit être positif.")
      .max(amountDue, `Le montant ne peut pas dépasser le solde dû de ${formatCurrency(amountDue, settings.currency)}`),
    date: z.date({ required_error: "La date est requise." }),
    method: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre'], { required_error: "La méthode est requise." }),
    notes: z.string().optional(),
  });

  type PaymentFormValues = z.infer<typeof paymentSchema>;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: amountDue > 0 ? Number(amountDue.toFixed(2)) : 0,
      date: new Date(),
      method: 'Espèces',
      notes: '',
    },
  });
  
  const isActionDisabled = invoice.status === 'Cancelled' || invoice.status === 'Paid';

  const onSubmit = (data: PaymentFormValues) => {
    startTransition(async () => {
      const result = await recordPayment(invoice.id, data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        });
      } else {
        toast({
          title: "Paiement enregistré",
          description: `Le paiement pour la facture ${invoice.invoiceNumber} a été ajouté.`,
        });
        setIsOpen(false);
        form.reset({
          amount: 0,
          date: new Date(),
          method: 'Espèces',
          notes: ''
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isActionDisabled} title={isActionDisabled ? "Facture soldée ou annulée" : "Enregistrer un paiement"}>
          <CreditCard className={cn("h-6 w-6", !isActionDisabled && "text-green-600")} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <div className='text-sm text-muted-foreground text-left pt-2'>
            <p>Facture: <strong>{invoice.invoiceNumber}</strong></p>
            <p>Montant total: {formatCurrency(invoice.totalAmount, settings.currency)}</p>
            <p>Montant dû: <span className="font-bold text-destructive">{formatCurrency(amountDue, settings.currency)}</span></p>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant payé</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date du paiement</FormLabel>
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
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Méthode de paiement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une méthode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Virement bancaire">Virement bancaire</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Réf. de transaction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
