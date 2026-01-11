
import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import InvoicesList from "./InvoicesList";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

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
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <InvoicesDataWrapper />
        </Suspense>
    );
}
