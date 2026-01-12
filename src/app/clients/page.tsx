
import { getClients } from "@/lib/data";
import ClientsList from "./ClientsList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const [clients, user, settings] = await Promise.all([
    getClients(),
    getSession(),
    getSettings(),
  ]);

  if (!user || !settings) {
    redirect('/login');
  }

  return (
    <AppLayout user={user} settings={settings}>
      <ClientsList clients={clients} userRole={user?.role} />
    </AppLayout>
  );
}
