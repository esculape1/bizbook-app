
import { getClients } from "@/lib/data";
import ClientsList from "./ClientsList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/app/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { ClientFormDialog } from "./ClientFormDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ROLES } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const [clients, settings] = await Promise.all([
    getClients(user.organizationId),
    getSettings(user.organizationId),
  ]);

  const canEdit = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;

  const headerActions = canEdit ? (
    <ClientFormDialog>
      <Button>
        <PlusCircle className="mr-2" />
        Ajouter un client
      </Button>
    </ClientFormDialog>
  ) : undefined;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
      <ClientsList 
        clients={clients} 
        userRole={user?.role} 
        headerActions={headerActions}
      />
    </AppLayout>
  );
}
