
import { getSuppliers } from "@/lib/data";
import SuppliersList from "./SuppliersList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { SupplierForm } from "./SupplierForm";

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
  
  const canEdit = user.role === 'Admin' || user.role === 'SuperAdmin';

  return (
    <AppLayout 
      user={user} 
      settings={settings}
      pageHeader={<PageHeader title="Fournisseurs" actions={canEdit ? <SupplierForm /> : undefined} />}
    >
      <SuppliersList suppliers={suppliers} userRole={user?.role} />
    </AppLayout>
  );
}
