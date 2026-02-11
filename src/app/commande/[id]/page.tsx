

import { getClientById, getProducts, getSettings } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from 'next/navigation';
import { OrderPortal } from "./OrderPortal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getClientOrgId(clientId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('clients').select('organization_id').eq('id', clientId).single();
  return data?.organization_id || null;
}

export default async function OrderPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const client = await getClientById(id);
  if (!client) {
    notFound();
  }

  // Get orgId from client record for public portal
  const orgId = await getClientOrgId(id);
  if (!orgId) {
    notFound();
  }

  const [products, settings] = await Promise.all([
    getProducts(orgId),
    getSettings(orgId)
  ]);

  if (!settings) {
    return (
        <div className="flex h-screen items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{"Erreur de l'Application"}</AlertTitle>
                <AlertDescription>
                    {"Impossible de charger les parametres de l'application. Le portail de commande est temporairement indisponible."}
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
