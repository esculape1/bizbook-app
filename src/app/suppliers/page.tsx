
import { getSuppliers } from "@/lib/data";
import SuppliersList from "./SuppliersList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ROLES } from "@/lib/constants";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const [suppliers, user, settings] = await Promise.all([
    getSuppliers(),
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
        <PageHeader>
            {canEdit && (
              <SupplierFormDialog>
                <Button>
                  <PlusCircle className="mr-2" />
                  Ajouter un fournisseur
                </Button>
              </SupplierFormDialog>
            )}
        </PageHeader>
      <SuppliersList suppliers={suppliers} userRole={user?.role} />
    </AppLayout>
  );
}
