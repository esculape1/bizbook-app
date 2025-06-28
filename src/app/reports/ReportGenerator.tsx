'use client';

import { useState, useTransition } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { ReportData, Client, Settings } from '@/lib/types';
import { ReportDisplay } from './ReportDisplay';
import { addDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { generateReport } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

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
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateReport = () => {
    startTransition(async () => {
      setReportData(null); // Clear previous report
      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient?.name || 'Tous les clients';
      const result = await generateReport(dateRange, clientId, clientName);
      
      if ('error' in result) {
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
          {reportData && !isPending && <ReportDisplay data={reportData} currency={settings.currency} />}

        </CardContent>
      </Card>
    </div>
  );
}
