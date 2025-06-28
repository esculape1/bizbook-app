import { getInvoiceById, getClientById, getSettings } from "@/lib/data";
import { notFound } from 'next/navigation';
import { InvoiceViewer } from "../InvoiceViewer";
import { PageHeader } from "@/components/PageHeader";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    notFound();
  }

  const client = await getClientById(invoice.clientId);
  if (!client) {
      // This should not happen if data is consistent, but good to handle
      notFound();
  }

  const settings = await getSettings();

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
