
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
import { PageHeader } from "@/components/PageHeader";

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

  const canEdit = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
      <PageHeader>
        {canEdit && (
          <ClientFormDialog>
            <Button>
              <PlusCircle className="mr-2" />
              Ajouter un client
            </Button>
          </ClientFormDialog>
        )}
      </PageHeader>
      <ClientsList clients={clients} userRole={user?.role} />
    </AppLayout>
  );
}
