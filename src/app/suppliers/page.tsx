
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
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Fournisseurs</h1>
            {canEdit && (
              <SupplierFormDialog>
                <Button>
                  <PlusCircle className="mr-2" />
                  Ajouter un fournisseur
                </Button>
              </SupplierFormDialog>
            )}
        </div>
      <SuppliersList suppliers={suppliers} userRole={user?.role} />
    </AppLayout>
  );
}
