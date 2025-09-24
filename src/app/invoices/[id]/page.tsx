
import { getInvoiceById, getClientById, getSettings } from "@/lib/data";
import { notFound } from 'next/navigation';
import { InvoiceViewer } from "../InvoiceViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  // Fetch settings and client concurrently after we know the invoice exists.
  const [settings, client] = await Promise.all([
    getSettings(),
    getClientById(invoice.clientId)
  ]);
  
  // This check is important. If the client is not found, we should not proceed to render.
  // Instead, we show a helpful error message.
  if (!client) {
      return (
        <div className="flex flex-col gap-6 p-4">
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur de Données</AlertTitle>
              <AlertDescription>
                Le client associé à cette facture (ID: {invoice.clientId}) n'a pas été trouvé. Il a peut-être été supprimé. La facture ne peut pas être affichée.
              </AlertDescription>
          </Alert>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <InvoiceViewer invoice={invoice} client={client} settings={settings} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
    const invoice = await getInvoiceById(params.id);
    return {
        title: `Facture ${invoice?.invoiceNumber || 'Inconnue'}`,
    }
}
