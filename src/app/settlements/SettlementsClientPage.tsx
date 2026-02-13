
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
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, CreditCard, Wallet, Banknote } from 'lucide-react';
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
import { PAYMENT_METHODS } from '@/lib/constants';

const settlementSchema = z.object({
  paymentAmount: z.coerce.number().positive("Le montant doit être positif."),
  paymentDate: z.date({ required_error: "La date est requise." }),
  paymentMethod: z.enum([PAYMENT_METHODS.CASH, PAYMENT_METHODS.TRANSFER, PAYMENT_METHODS.CHECK, PAYMENT_METHODS.OTHER], { required_error: "La méthode est requise." }),
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
      paymentMethod: PAYMENT_METHODS.CASH,
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
      const netToPay = inv.netAPayer ?? inv.totalAmount;
      const due = netToPay - (inv.amountPaid || 0);
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
    if (selectedInvoiceIds.size === invoices.length && invoices.length > 0) {
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
        // Rafraîchissement des données localement
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
            paymentMethod: PAYMENT_METHODS.CASH,
            paymentNotes: '',
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
      <Card className="bg-indigo-500/5 border-indigo-100 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <CreditCard className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-indigo-900">Encaissements Clients</CardTitle>
              <CardDescription className="text-indigo-700/70 font-medium">Enregistrez les règlements basés sur le Net à Payer.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <ClientPicker
              clients={clients}
              onClientSelect={handleClientSelect}
              selectedClientName={selectedClient?.name || "Cliquer pour sélectionner un client..."}
            />
          </div>
        </CardContent>
      </Card>

      {isFetchingInvoices && (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold animate-pulse">Chargement du dossier...</p>
        </div>
      )}

      {selectedClient && !isFetchingInvoices && (
        <>
            <div className="flex flex-col lg:flex-row gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-full lg:flex-[2]">
                <Card className="bg-amber-500/10 border-amber-500/20 text-amber-800 shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-amber-500 text-white">
                            <Banknote className="size-5" />
                        </div>
                        <CardTitle className="font-black uppercase tracking-tight">Factures Impayées</CardTitle>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-amber-500/10">
                        <span>Solde Net dû: <span className="text-destructive font-black text-lg">{formatCurrency(totalDueForAll, settings.currency)}</span></span>
                        <Badge variant="outline" className="bg-white/50 border-amber-200">
                            Sélection: {formatCurrency(totalDueOnSelected, settings.currency)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-xl bg-white/40 backdrop-blur-sm max-h-[500px] overflow-auto custom-scrollbar shadow-inner">
                    <Table>
                        <TableHeader className="sticky top-0 bg-amber-500/10 z-10">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px]">
                            <Checkbox
                                checked={selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === invoices.length}
                                onCheckedChange={handleSelectAll}
                                className="rounded-full"
                                disabled={invoices.length === 0}
                            />
                            </TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-amber-900">N° Facture</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-amber-900 text-right">Reste Net à Payer</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {invoices.length > 0 ? invoices.map(invoice => {
                            const netToPay = invoice.netAPayer ?? invoice.totalAmount;
                            const due = netToPay - (invoice.amountPaid || 0);
                            const isSelected = selectedInvoiceIds.has(invoice.id);
                            return (
                            <TableRow 
                                key={invoice.id} 
                                className={cn(
                                    "cursor-pointer transition-all border-l-4 border-l-transparent",
                                    isSelected ? "bg-amber-500/5 border-l-amber-500" : "hover:bg-white/20"
                                )} 
                                onClick={() => handleInvoiceSelect(invoice.id)}
                            >
                                <TableCell>
                                <Checkbox
                                    checked={isSelected}
                                    className="rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                </TableCell>
                                <TableCell className="font-black text-sm uppercase tracking-tight">{invoice.invoiceNumber}</TableCell>
                                <TableCell className="text-right font-black text-destructive">{formatCurrency(due, settings.currency)}</TableCell>
                            </TableRow>
                            );
                        }) : (
                            <TableRow>
                            <TableCell colSpan={3} className="text-center h-32 italic text-muted-foreground">Aucune facture impayée.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
                </Card>
              </div>

              <div className="w-full lg:flex-1">
                <Card className="bg-sky-500/10 border-sky-500/20 text-sky-800 shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-600 text-white">
                            <Wallet className="size-5" />
                        </div>
                        <CardTitle className="font-black uppercase tracking-tight">Règlement</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                        control={form.control}
                        name="paymentAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-black uppercase text-[10px] tracking-wider text-sky-900">Montant ({settings.currency})</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} className="h-12 text-lg font-black bg-white border-sky-200" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-black uppercase text-[10px] tracking-wider text-sky-900">Méthode</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-11 bg-white border-sky-200 font-bold">
                                    <SelectValue placeholder="Sélectionner" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={PAYMENT_METHODS.CASH}>Espèces</SelectItem>
                                    <SelectItem value={PAYMENT_METHODS.TRANSFER}>Virement bancaire</SelectItem>
                                    <SelectItem value={PAYMENT_METHODS.CHECK}>Chèque</SelectItem>
                                    <SelectItem value={PAYMENT_METHODS.OTHER}>Autre</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full h-14 text-lg font-black shadow-lg" disabled={isProcessing || selectedInvoiceIds.size === 0}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Valider'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="pt-4">
                <PaymentHistory 
                    history={paymentHistory} 
                    client={selectedClient} 
                    settings={settings}
                />
            </div>
        </>
      )}
    </div>
  );
}
