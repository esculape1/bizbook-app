import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQuotes, getClients, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuoteForm } from "./QuoteForm";
import { formatCurrency } from "@/lib/utils";
import { getSession } from "@/lib/session";

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
        title="Devis"
        actions={canEdit ? <QuoteForm clients={clients} products={products} settings={settings} /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Devis</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
