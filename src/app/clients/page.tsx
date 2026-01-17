
import { getClients } from "@/lib/data";
import ClientsList from "./ClientsList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { ClientForm } from "./ClientForm";

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

  const canEdit = user.role === 'Admin' || user.role === 'SuperAdmin';

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Clients</h1>
            {canEdit ? <ClientForm /> : undefined}
        </div>
      <ClientsList clients={clients} userRole={user?.role} />
    </AppLayout>
  );
}
