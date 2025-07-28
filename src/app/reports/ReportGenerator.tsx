
'use client';

import { useState, useTransition } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { ReportData, Client, Settings, Invoice } from '@/lib/types';
import { addDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { generateReport } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const ReportDisplay = dynamic(() => import('./ReportDisplay').then((mod) => mod.ReportDisplay), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
  )
});

type ReportGeneratorProps = {
    clients: Client[];
    settings: Settings;
}

export function ReportGenerator({ clients, settings }: ReportGeneratorProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [clientId, setClientId] = useState<string>('all');
  const [invoiceStatus, setInvoiceStatus] = useState<'all' | 'paid' | 'unpaid' | 'cancelled'>('all');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateReport = () => {
    startTransition(async () => {
      setReportData(null); // Clear previous report
      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient?.name || 'Tous les clients';
      const result = await generateReport(dateRange, clientId, clientName, invoiceStatus);
      
      if (!result) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Le rapport n'a pas pu être généré.",
        });
        setReportData(null);
      } else if ('error' in result) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: result.error,
        });
        setReportData(null);
      } else {
        setReportData(result);
      }
    });
  };

  const selectedClientObject = clients.find(c => c.id === clientId) || null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Rapports" />
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-1 block">Période</label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-1 block">Client</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-1 block">Statut Facture</label>
              <Select value={invoiceStatus} onValueChange={setInvoiceStatus as (value: string) => void}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="unpaid">Impayées (partiel inclus)</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-5">
              <Button onClick={handleGenerateReport} className="w-full md:w-auto" disabled={isPending}>
                {isPending ? 'Génération...' : 'Générer le rapport'}
              </Button>
            </div>
          </div>

          {isPending && (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
          )}
          {reportData && !isPending && <ReportDisplay data={reportData} currency={settings.currency} settings={settings} client={selectedClientObject} />}

        </CardContent>
      </Card>
    </div>
  );
}
