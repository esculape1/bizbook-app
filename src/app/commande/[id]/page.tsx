
import { getClientById, getProducts, getSettings } from "@/lib/data";
import { notFound } from 'next/navigation';
import { OrderPortal } from "./OrderPortal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [client, products, settings] = await Promise.all([
    getClientById(id),
    getProducts(),
    getSettings()
  ]);

  if (!client) {
    notFound();
  }

  if (!settings) {
    return (
        <div className="flex h-screen items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de l'Application</AlertTitle>
                <AlertDescription>
                    Impossible de charger les paramètres de l'application. Le portail de commande est temporairement indisponible.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <OrderPortal client={client} products={products} settings={settings} />
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
    const client = await getClientById(params.id);
    if (!client) {
        return {
            title: "Client non trouvé",
        }
    }
    return {
        title: `Commande pour ${client.name}`,
    }
}
