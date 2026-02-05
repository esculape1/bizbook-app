'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { ReportData, Client, Settings } from '@/lib/types';
import { addDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { generateReport } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, PieChart, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const ReportDisplay = dynamic(() => import('./ReportDisplay').then((mod) => mod.ReportDisplay), {
  ssr: false,
  loading: () => (
    <div className="space-y-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <Card className="border-none shadow-premium bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-1.5">
                <Filter className="size-3" /> Période d'analyse
              </label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
            </div>
            
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Client concerné</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full h-10 font-bold">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">Tous les clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Statut des factures</label>
              <Select value={invoiceStatus} onValueChange={setInvoiceStatus as (value: string) => void}>
                <SelectTrigger className="w-full h-10 font-bold">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les factures</SelectItem>
                  <SelectItem value="paid">Payées uniquement</SelectItem>
                  <SelectItem value="unpaid">Impayées (partiel inclus)</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
                onClick={handleGenerateReport} 
                className="w-full md:w-auto h-10 px-8 font-black uppercase tracking-tight shadow-lg shadow-primary/20 active:scale-95 transition-all" 
                disabled={isPending}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération...
                    </>
                ) : (
                    <>
                        <PieChart className="mr-2 h-4 w-4" />
                        Générer le rapport
                    </>
                )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isPending && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
            <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      )}

      {reportData && !isPending && (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
            <ReportDisplay data={reportData} currency={settings.currency} settings={settings} client={selectedClientObject} />
        </div>
      )}
    </div>
  );
}
