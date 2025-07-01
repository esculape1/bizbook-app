'use client';

import { useState, useTransition } from 'react';
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { saveSettings } from './actions';
import type { Settings, User } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const settingsSchema = z.object({
  companyName: z.string().min(1, { message: "Le nom de l'entreprise est requis." }),
  legalName: z.string().min(1, { message: "La raison sociale est requise." }),
  managerName: z.string().min(1, { message: "Le nom du gérant est requis." }),
  companyAddress: z.string().min(1, { message: "L'adresse est requise." }),
  companyPhone: z.string().min(1, { message: "Le téléphone est requis." }),
  companyIfu: z.string().min(1, { message: "L'IFU est requis." }),
  companyRccm: z.string().min(1, { message: "Le RCCM est requis." }),
  currency: z.enum(['EUR', 'USD', 'GBP', 'XOF']),
  logo: z.any().optional(),
  invoiceNumberFormat: z.enum(['YEAR-NUM', 'PREFIX-YEAR-NUM', 'PREFIX-NUM']),
  invoiceTemplate: z.enum(['modern', 'classic', 'simple', 'detailed']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ initialSettings, userRole }: { initialSettings: Settings, userRole: User['role'] | undefined }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl || "https://placehold.co/80x80.png");

  const canEdit = userRole === 'Admin';

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: initialSettings.companyName,
      legalName: initialSettings.legalName,
      managerName: initialSettings.managerName,
      companyAddress: initialSettings.companyAddress,
      companyPhone: initialSettings.companyPhone,
      companyIfu: initialSettings.companyIfu,
      companyRccm: initialSettings.companyRccm,
      currency: initialSettings.currency,
      invoiceNumberFormat: initialSettings.invoiceNumberFormat,
      invoiceTemplate: initialSettings.invoiceTemplate,
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        form.setError("logo", { type: "manual", message: "Le fichier ne doit pas dépasser 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        form.clearErrors("logo");
      };
      reader.readAsDataURL(file);
      form.setValue("logo", file);
    }
  }

  const onSubmit = (data: SettingsFormValues) => {
    startTransition(async () => {
      const result = await saveSettings(data);
      if (result.success) {
        toast({
          title: "Paramètres enregistrés",
          description: "Vos modifications ont été sauvegardées avec succès.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de la sauvegarde.",
        });
      }
    });
  };
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Paramètres" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>Mettez à jour les informations de votre entreprise et le logo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <fieldset disabled={!canEdit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Dénomination de l'entreprise</FormLabel>
                          <FormControl>
                          <Input placeholder="Votre nom commercial" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="legalName"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Raison sociale</FormLabel>
                          <FormControl>
                          <Input placeholder="Votre raison sociale" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="managerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du Gérant</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom complet du signataire" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Localisation / Adresse</FormLabel>
                      <FormControl>
                      <Textarea placeholder="Adresse complète de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                      <Input placeholder="Numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <div className="grid grid-cols-2 gap-6">
                  <FormField
                  control={form.control}
                  name="companyIfu"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>N° IFU</FormLabel>
                      <FormControl>
                          <Input placeholder="Numéro IFU de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="companyRccm"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>N° RCCM</FormLabel>
                      <FormControl>
                          <Input placeholder="Numéro RCCM de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo de l'entreprise</FormLabel>
                      <div className="flex items-center gap-4">
                        {logoPreview && <Image 
                            src={logoPreview} 
                            alt="Aperçu du logo"
                            width={80} 
                            height={80} 
                            className="rounded-md bg-muted object-cover"
                            data-ai-hint="logo"
                        />}
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleLogoChange}
                            className="max-w-xs"
                            disabled={!canEdit}
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Téléchargez un nouveau logo. Il sera affiché sur vos factures. (Max 2MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>Gérez les préférences de devise, de facturation, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset disabled={!canEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Devise</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une devise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                              <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                              <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                              <SelectItem value="XOF">XOF (F.CFA) - Franc CFA</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Devise utilisée dans toute l'application.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceNumberFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format de numérotation</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PREFIX-YEAR-NUM">FACT-AAAA-NNN</SelectItem>
                              <SelectItem value="YEAR-NUM">AAAA-NNN</SelectItem>
                              <SelectItem value="PREFIX-NUM">FACT-NNN</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Format des numéros de facture.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceTemplate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modèle de facture</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un modèle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="modern">Moderne</SelectItem>
                              <SelectItem value="classic">Classique</SelectItem>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="detailed">Détaillé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Apparence visuelle de la facture.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </fieldset>
            </CardContent>
          </Card>
          
          {canEdit && (
            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
