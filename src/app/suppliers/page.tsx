
import { getSuppliers, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import SuppliersList from "./SuppliersList";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ROLES } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const [suppliers, settings] = await Promise.all([
    getSuppliers(user.organizationId),
    getSettings(user.organizationId),
  ]);
  
  const canEdit = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;

  const headerActions = canEdit ? (
    <SupplierFormDialog>
      <Button>
        <PlusCircle className="mr-2" />
        Ajouter un fournisseur
      </Button>
    </SupplierFormDialog>
  ) : undefined;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
      <SuppliersList 
        suppliers={suppliers} 
        userRole={user?.role} 
        headerActions={headerActions}
      />
    </AppLayout>
  );
}
