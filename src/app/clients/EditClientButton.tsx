
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
import { updateClient } from './actions';
import { useToast } from "@/hooks/use-toast";
import type { Client } from '@/lib/types';

const clientSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Email invalide." }).or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ifu: z.string().optional(),
  rccm: z.string().optional(),
  taxRegime: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function EditClientButton({ client }: { client: Client }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      ifu: client.ifu || '',
      rccm: client.rccm || '',
      taxRegime: client.taxRegime || '',
    },
  });

  const onSubmit = (data: ClientFormValues) => {
    startTransition(async () => {
      const result = await updateClient(client.id, data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la mise à jour",
          description: result.message,
        });
      } else {
        toast({
          title: "Client mis à jour",
          description: "Les informations du client ont été modifiées avec succès.",
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
          <DialogTitle>Modifier les informations du client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom / Entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du client" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contact (Optionnel)</FormLabel>
                        <FormControl>
                        <Input placeholder="Numéro de téléphone" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taxRegime"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Régime Fiscal (Optionnel)</FormLabel>
                        <FormControl>
                        <Input placeholder="Régime fiscal" {...field} />
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
                  <FormLabel>Adresse / Localisation (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Adresse complète du client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ifu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° IFU (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro IFU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rccm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° RCCM (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro RCCM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
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
