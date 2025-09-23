
import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import InvoicesList from "./InvoicesList";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
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
