import { getInvoices, getClients, getProducts, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import InvoicesList from "./InvoicesList";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { InvoiceForm } from "./InvoiceForm";
import { ROLES } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const user = await getSession();
    if (!user) redirect('/login');

    const [settings, clients, products, invoices] = await Promise.all([
      getSettings(user.organizationId),
      getClients(user.organizationId),
      getProducts(user.organizationId),
      getInvoices(user.organizationId),
    ]);
    
    const canManageInvoices = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.USER;

    const headerActions = canManageInvoices ? (
        <InvoiceForm clients={clients} products={products} settings={settings} />
    ) : undefined;

    return (
        <AppLayout 
          user={user} 
          settings={settings}
        >
          <InvoicesList 
            initialInvoices={invoices} 
            initialClients={clients} 
            initialProducts={products} 
            initialSettings={settings} 
            user={user}
            headerActions={headerActions}
          />
        </AppLayout>
    );
}
