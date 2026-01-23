
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQuotes, getClients, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { QuoteForm } from "./QuoteForm";
import { formatCurrency, cn } from "@/lib/utils";
import { getSession } from "@/lib/session";
import type { Quote } from "@/lib/types";
import { EditQuoteForm } from "./EditQuoteForm";
import { DeleteQuoteButton } from "./DeleteQuoteButton";
import { QuoteViewerDialog } from "./QuoteViewerDialog";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { ROLES, QUOTE_STATUS, QUOTE_STATUS_TRANSLATIONS } from "@/lib/constants";

export const dynamic = 'force-dynamic';

async function DevisContent() {
  const [quotes, clients, products, settings, user] = await Promise.all([
    getQuotes(),
    getClients(),
    getProducts(),
    getSettings(),
    getSession()
  ]);

  if (!user || !settings) {
    return null;
  }

  const canEdit = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.USER;

  const getStatusVariant = (status: Quote['status']): "outline" | "default" | "success" | "destructive" => {
    switch (status) {
      case QUOTE_STATUS.ACCEPTED:
        return 'success';
      case QUOTE_STATUS.DECLINED:
        return 'destructive';
      case QUOTE_STATUS.SENT:
        return 'default';
      case QUOTE_STATUS.DRAFT:
      default:
        return 'outline';
    }
  }

  return (
    <>
      {/* Mobile View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {quotes.map((quote) => {
          const client = clients.find(c => c.id === quote.clientId);
          return (
            <Card key={quote.id} className="flex flex-col">
              <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{quote.quoteNumber}</CardTitle>
                      <CardDescription>{quote.clientName}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(quote.status)}>{QUOTE_STATUS_TRANSLATIONS[quote.status]}</Badge>
                  </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(quote.date).toLocaleDateString('fr-FR')}</p>
                <Separator />
                <div className="flex justify-between items-center text-base pt-2">
                    <span>Total:</span>
                    <span className="font-bold">{formatCurrency(quote.totalAmount, settings.currency)}</span>
                </div>
              </CardContent>
              {client && (
                 <CardFooter className="flex items-center justify-end gap-2">
                    <QuoteViewerDialog quote={quote} client={client} settings={settings} />
                    {canEdit && <EditQuoteForm quote={quote} clients={clients} products={products} settings={settings} />}
                    {canEdit && <DeleteQuoteButton id={quote.id} quoteNumber={quote.quoteNumber} />}
                 </CardFooter>
              )}
            </Card>
          )
        })}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Proforma</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => {
                const client = clients.find(c => c.id === quote.clientId);
                return (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                  <TableCell>{quote.clientName}</TableCell>
                  <TableCell>{new Date(quote.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(quote.status)}>
                      {QUOTE_STATUS_TRANSLATIONS[quote.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(quote.totalAmount, settings.currency)}</TableCell>
                  {client && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <QuoteViewerDialog quote={quote} client={client} settings={settings} />
                        {canEdit && <EditQuoteForm quote={quote} clients={clients} products={products} settings={settings} />}
                        {canEdit && <DeleteQuoteButton id={quote.id} quoteNumber={quote.quoteNumber} />}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}


export default async function DevisPage() {
  const [user, settings, clients, products] = await Promise.all([
    getSession(), 
    getSettings(),
    getClients(),
    getProducts(),
  ]);

  if (!user || !settings) {
    redirect('/login');
  }
  
  const canEdit = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
      <PageHeader>
        {canEdit ? <QuoteForm clients={clients} products={products} settings={settings} /> : undefined}
      </PageHeader>
      <DevisContent />
    </AppLayout>
  );
}
