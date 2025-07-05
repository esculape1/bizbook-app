
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQuotes, getClients, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { QuoteForm } from "./QuoteForm";
import { formatCurrency } from "@/lib/utils";
import { getSession } from "@/lib/session";
import type { Quote } from "@/lib/types";
import { EditQuoteForm } from "./EditQuoteForm";
import { DeleteQuoteButton } from "./DeleteQuoteButton";
import { QuoteViewerDialog } from "./QuoteViewerDialog";


export default async function DevisPage() {
  const [quotes, clients, products, settings, user] = await Promise.all([
    getQuotes(),
    getClients(),
    getProducts(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin';

  const getStatusVariant = (status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'): "outline" | "default" | "success" | "destructive" => {
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
  }

  const statusTranslations = {
    Draft: 'Brouillon',
    Sent: 'Envoyé',
    Accepted: 'Accepté',
    Declined: 'Refusé',
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Proforma"
        actions={canEdit ? <QuoteForm clients={clients} products={products} settings={settings} /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Proforma</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
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
                      {statusTranslations[quote.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(quote.totalAmount, settings.currency)}</TableCell>
                  {canEdit && client && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <QuoteViewerDialog quote={quote} client={client} settings={settings} />
                        <EditQuoteForm quote={quote} clients={clients} products={products} settings={settings} />
                        <DeleteQuoteButton id={quote.id} quoteNumber={quote.quoteNumber} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
