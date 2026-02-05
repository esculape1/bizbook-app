import { PageHeader } from "@/components/PageHeader";
import { getQuotes, getClients, getProducts, getSettings } from "@/lib/data";
import { QuoteForm } from "./QuoteForm";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { QuotesList } from "./QuotesList";

export const dynamic = 'force-dynamic';

export default async function DevisPage() {
  const [user, settings, clients, products, quotes] = await Promise.all([
    getSession(), 
    getSettings(),
    getClients(),
    getProducts(),
    getQuotes()
  ]);

  if (!user || !settings) {
    redirect('/login');
  }
  
  const canEdit = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;

  const headerActions = canEdit ? (
    <QuoteForm clients={clients} products={products} settings={settings} />
  ) : undefined;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
      <QuotesList 
        quotes={quotes}
        clients={clients}
        products={products}
        settings={settings}
        user={user}
        headerActions={headerActions}
      />
    </AppLayout>
  );
}
