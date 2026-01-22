
'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { createExpense, updateExpense } from './actions';
import type { Expense, Settings } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

const expenseSchema = z.object({
  date: z.date({ required_error: "La date est requise." }),
  description: z.string().min(1, { message: "La description est requise." }),
  category: z.nativeEnum(EXPENSE_CATEGORIES, { required_error: "La catégorie est requise." }),
  amount: z.coerce.number().positive({ message: "Le montant doit être positif." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormDialogProps {
  expense?: Expense;
  currency: Settings['currency'];
  children: ReactNode;
}

export function ExpenseFormDialog({ expense, currency, children }: ExpenseFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isEditMode = !!expense;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEditMode ? {
      ...expense,
      date: new Date(expense.date),
    } : {
      date: new Date(),
      description: '',
      amount: 0,
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    startTransition(async () => {
      const action = isEditMode ? updateExpense(expense.id, data) : createExpense(data);
      const result = await action;

      if (result?.message) {
        toast({
          variant: "destructive",
          title: `Erreur`,
          description: result.message,
        });
      } else {
        toast({
          title: `Dépense ${isEditMode ? 'mise à jour' : 'ajoutée'}`,
          description: `La dépense a été ${isEditMode ? 'modifiée' : 'enregistrée'}.`,
        });
        form.reset();
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier une dépense' : 'Ajouter une nouvelle dépense'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fournitures de bureau" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Montant ({currency})</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EXPENSE_CATEGORIES).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date de la dépense</FormLabel>
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
          </form>
        </Form>
        <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" form="expense-form" disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
