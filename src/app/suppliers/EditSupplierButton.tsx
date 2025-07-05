
'use client';

import { useState, useTransition } from 'react';
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
import { Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { updateSupplier } from './actions';
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from '@/lib/types';

const supplierSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Email invalide." }).or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export function EditSupplierButton({ supplier }: { supplier: Supplier }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
    },
  });

  const onSubmit = (data: SupplierFormValues) => {
    startTransition(async () => {
      const result = await updateSupplier(supplier.id, data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la mise à jour",
          description: result.message,
        });
      } else {
        toast({
          title: "Fournisseur mis à jour",
          description: "Les informations du fournisseur ont été modifiées.",
        });
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le fournisseur</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom / Entreprise</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du fournisseur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personne à contacter (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Téléphone (Optionnel)</FormLabel>
                      <FormControl>
                      <Input placeholder="Numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Adresse complète" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
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
