
import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import InvoicesList from "./InvoicesList";
import { AppLayout } from "@/components/AppLayout";
import { redirect } from "next/navigation";
import { InvoiceForm } from "./InvoiceForm";

export const dynamic = 'force-dynamic';

async function InvoicesDataWrapper() {
    const [invoices, clients, products, settings, user] = await Promise.all([
        getInvoices(),
        getClients(),
        getProducts(),
        getSettings(),
        getSession()
    ]);

    if (!settings || !user) {
        // Handle case where essential data is missing, maybe show a loading or error state
        return <div>Chargement des données essentielles...</div>;
    }

    return (
        <InvoicesList 
            initialInvoices={invoices} 
            initialClients={clients} 
            initialProducts={products} 
            initialSettings={settings} 
            user={user} 
        />
    );
}


export default async function InvoicesPage() {
    const [user, settings, clients, products] = await Promise.all([
      getSession(), 
      getSettings(),
      getClients(),
      getProducts()
    ]);

    if (!user || !settings) {
        redirect('/login');
    }
    
    const canEdit = user.role === 'Admin' || user.role === 'SuperAdmin';

    return (
        <AppLayout 
          user={user} 
          settings={settings}
        >
             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Factures</h1>
                {canEdit ? <InvoiceForm clients={clients} products={products} settings={settings} /> : undefined}
            </div>
            <InvoicesDataWrapper />
        </AppLayout>
    );
}
