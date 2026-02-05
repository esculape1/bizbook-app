
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
      <Card className="bg-indigo-500/5 border-indigo-100 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <CreditCard className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-indigo-900">Nouvel Encaissement</CardTitle>
              <CardDescription className="text-indigo-700/70 font-medium">Sélectionnez un client pour voir ses factures impayées et enregistrer un règlement.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <ClientPicker
              clients={clients}
              onClientSelect={handleClientSelect}
              selectedClientName={selectedClient?.name || "Cliquer ici pour sélectionner un client..."}
            />
          </div>
        </CardContent>
      </Card>

      {isFetchingInvoices && (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold animate-pulse">Récupération du dossier client...</p>
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
                        <CardTitle className="font-black uppercase tracking-tight">Factures pour {selectedClient.name}</CardTitle>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-amber-500/10">
                        <span>Solde total dû: <span className="text-destructive font-black text-lg">{formatCurrency(totalDueForAll, settings.currency)}</span></span>
                        <Badge variant="outline" className="bg-white/50 border-amber-200">
                            Sélection: {formatCurrency(totalDueOnSelected, settings.currency)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden">
                        <div className="flex items-center justify-end px-1 pb-2">
                            <Button variant="link" size="sm" onClick={handleSelectAll} disabled={invoices.length === 0} className="font-bold">
                                {selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === invoices.length ? 'Tout Désélectionner' : 'Tout Sélectionner'}
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {invoices.length > 0 ? invoices.map(invoice => {
                            const due = invoice.totalAmount - invoice.amountPaid;
                            const isSelected = selectedInvoiceIds.has(invoice.id);
                            return (
                            <div 
                                key={invoice.id} 
                                className={cn(
                                    "flex items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer",
                                    isSelected ? "bg-white border-primary shadow-md scale-[1.02]" : "bg-white/50 border-transparent hover:border-amber-200"
                                )} 
                                onClick={() => handleInvoiceSelect(invoice.id)}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleInvoiceSelect(invoice.id)}
                                    className="rounded-full size-5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm uppercase tracking-tight">{invoice.invoiceNumber}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-destructive">{formatCurrency(due, settings.currency)}</p>
                                </div>
                            </div>
                            );
                        }) : (
                            <p className="text-center text-muted-foreground py-10 italic">Aucune facture impayée pour ce client.</p>
                        )}
                        </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block border rounded-xl bg-white/40 backdrop-blur-sm max-h-[500px] overflow-auto custom-scrollbar shadow-inner">
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
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-amber-900">Date</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-amber-900">Montant Dû</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {invoices.length > 0 ? invoices.map(invoice => {
                            const due = invoice.totalAmount - invoice.amountPaid;
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
                                <TableCell className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right font-black text-destructive">{formatCurrency(due, settings.currency)}</TableCell>
                            </TableRow>
                            );
                        }) : (
                            <TableRow>
                            <TableCell colSpan={4} className="text-center h-32 italic text-muted-foreground">Aucune facture impayée pour ce client.</TableCell>
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
                        <CardTitle className="font-black uppercase tracking-tight">Enregistrer le Paiement</CardTitle>
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
                            <FormLabel className="font-black uppercase text-[10px] tracking-wider text-sky-900">Montant à encaisser ({settings.currency})</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} className="h-12 text-lg font-black bg-white border-sky-200 focus-visible:ring-sky-500" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="paymentDate"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="font-black uppercase text-[10px] tracking-wider text-sky-900">Date du paiement</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant={"outline"} className={cn("w-full h-11 pl-3 text-left font-bold bg-white border-sky-200", !field.value && "text-muted-foreground")}>
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
                                    <FormLabel className="font-black uppercase text-[10px] tracking-wider text-sky-900">Méthode de paiement</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11 bg-white border-sky-200 font-bold">
                                        <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Espèces" className="font-medium">Espèces</SelectItem>
                                        <SelectItem value="Virement bancaire" className="font-medium">Virement bancaire</SelectItem>
                                        <SelectItem value="Chèque" className="font-medium">Chèque</SelectItem>
                                        <SelectItem value="Autre" className="font-medium">Autre</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="paymentNotes"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-black uppercase text-[10px] tracking-wider text-sky-900">Notes & Références</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Ex: Réf. de transaction, Chèque N°..." {...field} className="bg-white border-sky-200 resize-none h-20" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full h-14 text-lg font-black shadow-lg shadow-sky-200 transition-all active:scale-95" disabled={isProcessing || selectedInvoiceIds.size === 0}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Validation...
                                </>
                            ) : 'Valider le règlement'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
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
