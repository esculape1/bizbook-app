'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getUnpaidInvoicesForClient, processMultipleInvoicePayments, getPaymentHistoryForClient } from './actions';
import type { Client, Invoice, Settings, PaymentHistoryItem } from '@/lib/types';
import { ClientPicker } from '@/components/ClientPicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { PaymentHistory } from './PaymentHistory';

const settlementSchema = z.object({
  paymentAmount: z.coerce.number().positive("Le montant doit être positif."),
  paymentDate: z.date({ required_error: "La date est requise." }),
  paymentMethod: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre'], { required_error: "La méthode est requise." }),
  paymentNotes: z.string().optional(),
});

type SettlementFormValues = z.infer<typeof settlementSchema>;

export function SettlementsClientPage({ clients, settings }: { clients: Client[], settings: Settings }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [isFetchingInvoices, startFetchingInvoices] = useTransition();
  const [isProcessing, startProcessing] = useTransition();
  const { toast } = useToast();

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      paymentAmount: 0,
      paymentDate: new Date(),
      paymentMethod: 'Espèces',
      paymentNotes: '',
    },
  });

  useEffect(() => {
    if (selectedClient) {
      startFetchingInvoices(async () => {
        const [unpaidInvoices, history] = await Promise.all([
          getUnpaidInvoicesForClient(selectedClient.id),
          getPaymentHistoryForClient(selectedClient.id),
        ]);
        setInvoices(unpaidInvoices);
        setPaymentHistory(history);
        setSelectedInvoiceIds(new Set());
        form.setValue('paymentAmount', 0);
      });
    } else {
      setInvoices([]);
      setPaymentHistory([]);
      setSelectedInvoiceIds(new Set());
      form.setValue('paymentAmount', 0);
    }
  }, [selectedClient, form]);

  const { totalDueOnSelected, totalDueForAll } = useMemo(() => {
    let totalDueOnSelected = 0;
    let totalDueForAll = 0;
    invoices.forEach(inv => {
      const due = inv.totalAmount - inv.amountPaid;
      totalDueForAll += due;
      if (selectedInvoiceIds.has(inv.id)) {
        totalDueOnSelected += due;
      }
    });
    return { totalDueOnSelected, totalDueForAll };
  }, [invoices, selectedInvoiceIds]);

  useEffect(() => {
    form.setValue('paymentAmount', Number(totalDueOnSelected.toFixed(2)));
  }, [totalDueOnSelected, form]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const newSelectedIds = new Set(selectedInvoiceIds);
    if (newSelectedIds.has(invoiceId)) {
      newSelectedIds.delete(invoiceId);
    } else {
      newSelectedIds.add(invoiceId);
    }
    setSelectedInvoiceIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.size === invoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(invoices.map(inv => inv.id)));
    }
  };

  const onSubmit = (data: SettlementFormValues) => {
    if (!selectedClient || selectedInvoiceIds.size === 0) {
      toast({
        variant: "destructive",
        title: "Sélection requise",
        description: "Veuillez sélectionner un client et au moins une facture.",
      });
      return;
    }

    startProcessing(async () => {
      const result = await processMultipleInvoicePayments({
        clientId: selectedClient.id,
        invoiceIds: Array.from(selectedInvoiceIds),
        ...data,
      });

      if (result.success) {
        toast({
          title: "Règlement enregistré",
          description: "Le paiement a été appliqué avec succès.",
        });
        // Refetch invoices and history for the client
        startFetchingInvoices(async () => {
            const [unpaidInvoices, history] = await Promise.all([
                getUnpaidInvoicesForClient(selectedClient.id),
                getPaymentHistoryForClient(selectedClient.id),
            ]);
            setInvoices(unpaidInvoices);
            setPaymentHistory(history);
            setSelectedInvoiceIds(new Set());
            form.reset({
                paymentAmount: 0,
                paymentDate: new Date(),
                paymentMethod: 'Espèces',
                paymentNotes: '',
            });
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvel Encaissement</CardTitle>
          <CardDescription>Sélectionnez un client pour voir ses factures impayées et enregistrer un règlement.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientPicker
            clients={clients}
            onClientSelect={handleClientSelect}
            selectedClientName={selectedClient?.name || "Sélectionner un client"}
          />
        </CardContent>
      </Card>

      {isFetchingInvoices && (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {selectedClient && !isFetchingInvoices && (
        <>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="w-full lg:flex-[2]">
                <Card className="bg-amber-500/10 border-amber-500/20 text-amber-800">
                <CardHeader>
                    <CardTitle>Factures pour {selectedClient.name}</CardTitle>
                    <div className="flex justify-between items-center text-sm text-current/70">
                    <span>Solde total dû: <span className="font-bold text-destructive">{formatCurrency(totalDueForAll, settings.currency)}</span></span>
                    <span>Sélection: <span className="font-bold text-primary">{formatCurrency(totalDueOnSelected, settings.currency)}</span></span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md max-h-[500px] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-10">
                        <TableRow>
                            <TableHead className="w-[50px]">
                            <Checkbox
                                checked={selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === invoices.length}
                                onCheckedChange={handleSelectAll}
                                aria-label="Tout sélectionner"
                            />
                            </TableHead>
                            <TableHead>N° Facture</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Montant Dû</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {invoices.length > 0 ? invoices.map(invoice => {
                            const due = invoice.totalAmount - invoice.amountPaid;
                            return (
                            <TableRow key={invoice.id} data-state={selectedInvoiceIds.has(invoice.id) && "selected"}>
                                <TableCell>
                                <Checkbox
                                    checked={selectedInvoiceIds.has(invoice.id)}
                                    onCheckedChange={() => handleInvoiceSelect(invoice.id)}
                                    aria-label={`Sélectionner la facture ${invoice.invoiceNumber}`}
                                />
                                </TableCell>
                                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(due, settings.currency)}</TableCell>
                            </TableRow>
                            );
                        }) : (
                            <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">Aucune facture impayée pour ce client.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
                </Card>
              </div>

              <div className="w-full lg:flex-1">
                <Card className="bg-sky-500/10 border-sky-500/20 text-sky-800">
                <CardHeader>
                    <CardTitle>Enregistrer le Paiement</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="paymentAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Montant à encaisser</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="paymentDate"
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
                            name="paymentMethod"
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
                            name="paymentNotes"
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
                        <Button type="submit" className="w-full" disabled={isProcessing || selectedInvoiceIds.size === 0}>
                        {isProcessing ? 'Enregistrement...' : 'Valider le règlement'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
                </Card>
              </div>
            </div>
            <PaymentHistory 
                history={paymentHistory} 
                client={selectedClient} 
                settings={settings}
            />
        </>
      )}
    </div>
  );
}
