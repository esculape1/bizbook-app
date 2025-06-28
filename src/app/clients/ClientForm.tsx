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
import { PlusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from './actions';
import { useToast } from "@/hooks/use-toast";

const clientSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Email invalide." }).or(z.literal('')),
  phone: z.string().min(1, { message: "Le contact est requis." }),
  address: z.string().min(1, { message: "L'adresse est requise." }),
  ifu: z.string().min(1, { message: "L'IFU est requis." }),
  rccm: z.string().min(1, { message: "Le RCCM est requis." }),
  taxRegime: z.string().min(1, { message: "Le régime fiscal est requis." }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function ClientForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
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
      const result = await createClient(data);
      if (result?.message) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la création",
          description: result.message,
        });
      } else {
        toast({
          title: "Client ajouté",
          description: "Le nouveau client a été enregistré avec succès.",
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
          Ajouter un client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
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
                    <FormLabel>Email</FormLabel>
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
                        <FormLabel>Contact</FormLabel>
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
                        <FormLabel>Régime Fiscal</FormLabel>
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
                  <FormLabel>Adresse / Localisation</FormLabel>
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
                    <FormLabel>N° IFU</FormLabel>
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
                    <FormLabel>N° RCCM</FormLabel>
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
                {isPending ? 'Enregistrement...' : 'Enregistrer le client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
