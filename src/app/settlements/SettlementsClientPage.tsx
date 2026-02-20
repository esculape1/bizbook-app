
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
import { Loader2, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { getUnpaidInvoicesForClient, processMultipleInvoicePayments, getPaymentHistoryForClient } from './actions';
import type { Client, Invoice, Settings, PaymentHistoryItem } from '@/lib/types';
import { ClientPicker } from '@/components/ClientPicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
    if (!selectedClient || selectedInvoiceIds.size === 0) return;

    startProcessing(async () => {
      const result = await processMultipleInvoicePayments({
        clientId: selectedClient.id,
        invoiceIds: Array.from(selectedInvoiceIds),
        ...data,
      });

      if (result.success) {
        toast({ title: "Règlement enregistré" });
        const [unpaidInvoices, history] = await Promise.all([
            getUnpaidInvoicesForClient(selectedClient.id),
            getPaymentHistoryForClient(selectedClient.id),
        ]);
        setInvoices(unpaidInvoices);
        setPaymentHistory(history);
        setSelectedInvoiceIds(new Set());
        form.reset({
            ...data,
            paymentAmount: 0,
            paymentNotes: '',
        });
      } else {
        toast({ variant: "destructive", title: "Erreur", description: result.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" /> Encaisser un règlement
          </CardTitle>
          <CardDescription>Sélectionnez un client pour voir ses factures impayées (calculées sur le Net à Payer).</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientPicker
            clients={clients}
            onClientSelect={handleClientSelect}
            selectedClientName={selectedClient?.name || "Sélectionner un client"}
          />
        </CardContent>
      </Card>

      {selectedClient && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Factures Impayées ({invoices.length})</CardTitle>
              <div className="flex justify-between font-bold text-sm">
                <span>Total dû net: {formatCurrency(totalDueForAll, settings.currency)}</span>
                <span className="text-primary">Sélection: {formatCurrency(totalDueOnSelected, settings.currency)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox checked={selectedInvoiceIds.size === invoices.length && invoices.length > 0} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead>Facture</TableHead>
                      <TableHead className="text-right">Reste dû net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">Aucune facture impayée.</TableCell>
                        </TableRow>
                    ) : invoices.map(invoice => (
                      <TableRow key={invoice.id} onClick={() => handleInvoiceSelect(invoice.id)} className="cursor-pointer">
                        <TableCell><Checkbox checked={selectedInvoiceIds.has(invoice.id)} /></TableCell>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency((invoice.netAPayer ?? invoice.totalAmount) - (invoice.amountPaid || 0), settings.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Détails du paiement</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="paymentAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant à encaisser ({settings.currency})</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Méthode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={PAYMENT_METHODS.CASH}>Espèces</SelectItem>
                          <SelectItem value={PAYMENT_METHODS.TRANSFER}>Virement</SelectItem>
                          <SelectItem value={PAYMENT_METHODS.CHECK}>Chèque</SelectItem>
                          <SelectItem value={PAYMENT_METHODS.OTHER}>Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isProcessing || selectedInvoiceIds.size === 0}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Enregistrer le règlement'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
      {selectedClient && <PaymentHistory history={paymentHistory} client={selectedClient} settings={settings} />}
    </div>
  );
}
