'use client';

import { useState } from 'react';
import type { Quote, Client, Product, Settings, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { QUOTE_STATUS, QUOTE_STATUS_TRANSLATIONS, ROLES } from "@/lib/constants";
import { EditQuoteForm } from "./EditQuoteForm";
import { DeleteQuoteButton } from "./DeleteQuoteButton";
import { QuoteViewerDialog } from "./QuoteViewerDialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileClock, User as UserIcon, Calendar, Activity, DollarSign, Settings2 } from "lucide-react";

type QuotesListProps = {
  quotes: Quote[];
  clients: Client[];
  products: Product[];
  settings: Settings;
  user: User;
  headerActions?: React.ReactNode;
};

export function QuotesList({ quotes, clients, products, settings, user, headerActions }: QuotesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const canEdit = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;

  const filteredQuotes = quotes.filter(q => 
    q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: Quote['status']): "outline" | "default" | "success" | "destructive" => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Declined':
        return 'destructive';
      case 'Sent':
        return 'default';
      case 'Draft':
      default:
        return 'outline';
    }
  };

  const cardColors = [
    "bg-sky-500/10 border-sky-500/20 text-sky-800",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
    "bg-amber-500/10 border-amber-500/20 text-amber-800",
    "bg-rose-500/10 border-rose-500/20 text-rose-800",
    "bg-violet-500/10 border-violet-500/20 text-violet-800",
    "bg-teal-500/10 border-teal-500/20 text-teal-800",
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Barre de Recherche et Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une proforma ou un client..."
            className="pl-10 h-10 bg-card shadow-sm border-primary/10 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {filteredQuotes.map((quote, index) => {
          const client = clients.find(c => c.id === quote.clientId);
          return (
            <Card key={quote.id} className={cn("flex flex-col border-2 shadow-md", cardColors[index % cardColors.length])}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">{quote.quoteNumber}</CardTitle>
                    <CardDescription className="font-bold text-current/80 truncate">{quote.clientName}</CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(quote.status)} className="shrink-0 font-black">
                    {QUOTE_STATUS_TRANSLATIONS[quote.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-xs">
                <p className="flex items-center gap-2"><Calendar className="size-3 opacity-70" /> {new Date(quote.date).toLocaleDateString('fr-FR')}</p>
                <Separator className="my-2 opacity-20" />
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-bold opacity-70">TOTAL:</span>
                  <span className="font-black text-lg">{formatCurrency(quote.totalAmount, settings.currency)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-end gap-1 p-2 bg-black/5 border-t mt-auto">
                {client && <QuoteViewerDialog quote={quote} client={client} settings={settings} />}
                {canEdit && client && <EditQuoteForm quote={quote} clients={clients} products={products} settings={settings} />}
                {canEdit && <DeleteQuoteButton id={quote.id} quoteNumber={quote.quoteNumber} />}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:flex flex-1 flex-col min-h-0 border-none shadow-premium bg-card/50 overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-grow">
            <div className="p-6">
              <Table>
                <TableHeader className="bg-muted/50 border-b-2 border-primary/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <FileClock className="size-4" />
                        N° Proforma
                      </div>
                    </TableHead>
                    <TableHead className="py-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <UserIcon className="size-4" />
                        Client
                      </div>
                    </TableHead>
                    <TableHead className="py-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <Calendar className="size-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <Activity className="size-4" />
                        Statut
                      </div>
                    </TableHead>
                    <TableHead className="text-right py-4">
                      <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <DollarSign className="size-4" />
                        Montant
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[150px] py-4">
                      <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <Settings2 className="size-4" />
                        Actions
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => {
                    const client = clients.find(c => c.id === quote.clientId);
                    return (
                      <TableRow key={quote.id} className="group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary">
                        <TableCell className="font-extrabold text-sm uppercase tracking-tight">
                          {quote.quoteNumber}
                        </TableCell>
                        <TableCell className="font-bold text-xs uppercase text-muted-foreground">
                          {quote.clientName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(quote.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusVariant(quote.status)} className="font-black px-2.5">
                            {QUOTE_STATUS_TRANSLATIONS[quote.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-primary">
                          {formatCurrency(quote.totalAmount, settings.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {client && <QuoteViewerDialog quote={quote} client={client} settings={settings} />}
                            {canEdit && client && <EditQuoteForm quote={quote} clients={clients} products={products} settings={settings} />}
                            {canEdit && <DeleteQuoteButton id={quote.id} quoteNumber={quote.quoteNumber} />}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
