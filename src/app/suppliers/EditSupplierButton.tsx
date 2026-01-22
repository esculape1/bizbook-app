import { getClients } from "@/lib/data";
import ClientsList from "./ClientsList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { ClientFormDialog } from "./ClientFormDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ROLES } from "@/lib/constants";

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

  const canEdit = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Clients</h1>
            {canEdit && (
              <ClientFormDialog>
                <Button>
                  <PlusCircle className="mr-2" />
                  Ajouter un client
                </Button>
              </ClientFormDialog>
            )}
        </div>
      <ClientsList clients={clients} userRole={user?.role} />
    </AppLayout>
  );
}