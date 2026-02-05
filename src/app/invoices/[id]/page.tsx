
import { getInvoiceById, getClientById, getSettings } from "@/lib/data";
import { notFound, redirect } from 'next/navigation';
import { InvoiceViewer } from "../InvoiceViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AppLayout } from "@/app/AppLayout";
import { getSession } from "@/lib/session";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [invoice, user, settings] = await Promise.all([
    getInvoiceById(id),
    getSession(),
    getSettings()
  ]);

  if (!user || !settings) {
    redirect('/login');
  }

  if (!invoice) {
    notFound();
  }

  const client = await getClientById(invoice.clientId);
  
  if (!client) {
      return (
        <AppLayout user={user} settings={settings}>
            <div className="flex flex-col gap-6 p-4">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de Données</AlertTitle>
                <AlertDescription>
                    Le client associé à cette facture (ID: {invoice.clientId}) n'a pas été trouvé. Il a peut-être été supprimé. La facture ne peut pas être affichée.
                </AlertDescription>
            </Alert>
            </div>
        </AppLayout>
      )
  }

  return (
    <AppLayout user={user} settings={settings}>
      <div className="flex flex-col gap-6">
        <InvoiceViewer invoice={invoice} client={client} settings={settings} />
      </div>
    </AppLayout>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
    const invoice = await getInvoiceById(params.id);
    return {
        title: `Facture ${invoice?.invoiceNumber || 'Inconnue'}`,
    }
}
