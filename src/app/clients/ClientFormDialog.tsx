
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
import { Textarea } from '@/components/ui/textarea';
import { createClient, updateClient } from './actions';
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

interface ClientFormDialogProps {
    client?: Client;
    children: ReactNode;
    onFormSubmit?: () => void;
}

export function ClientFormDialog({ client, children, onFormSubmit }: ClientFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isEditMode = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: isEditMode ? {
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        ifu: client.ifu || '',
        rccm: client.rccm || '',
        taxRegime: client.taxRegime || '',
    } : {
        name: '',
        email: '',
        phone: '',
        address: '',
        ifu: '',
        rccm: '',
        taxRegime: '',
    },
  });

  const onSubmit = (data: ClientFormValues) => {
    startTransition(async () => {
      const action = isEditMode ? updateClient(client.id, data) : createClient(data);
      const result = await action;

      if (result?.message) {
        toast({
          variant: "destructive",
          title: `Erreur lors de la ${isEditMode ? 'mise à jour' : 'création'}`,
          description: result.message,
        });
      } else {
        toast({
          title: `Client ${isEditMode ? 'mis à jour' : 'ajouté'}`,
          description: `Le client a été ${isEditMode ? 'modifié' : 'enregistré'} avec succès.`,
        });
        form.reset();
        setIsOpen(false);
        onFormSubmit?.();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier les informations du client' : 'Ajouter un nouveau client'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </form>
          </Form>
        </div>
        <DialogFooter className="border-t pt-4 px-6 pb-6">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" form="client-form" disabled={isPending}>
            {isPending ? 'Enregistrement...' : `Enregistrer ${isEditMode ? 'les modifications' : 'le client'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
