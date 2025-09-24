

import { getInvoiceById, getClientById, getSettings } from "@/lib/data";
import { notFound } from 'next/navigation';
import { InvoiceViewer } from "../InvoiceViewer";
import { PageHeader } from "@/components/PageHeader";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [invoice, settings] = await Promise.all([
    getInvoiceById(id),
    getSettings()
  ]);

  if (!invoice) {
    notFound();
  }

  const client = await getClientById(invoice.clientId);
  // This check is important. If the client is not found, we should not proceed.
  if (!client) {
      return (
        <div>
          <PageHeader title={`Facture ${invoice.invoiceNumber}`} />
          <p className="text-destructive text-center">Erreur: Le client associé à cette facture (ID: {invoice.clientId}) n'a pas été trouvé. La facture ne peut pas être affichée.</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Facture ${invoice.invoiceNumber}`} />
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
