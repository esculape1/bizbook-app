
import { getSuppliers } from "@/lib/data";
import SuppliersList from "./SuppliersList";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { getSettings } from "@/lib/data";
import { redirect } from "next/navigation";
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
    >
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Fournisseurs</h1>
            {canEdit ? <SupplierForm /> : undefined}
        </div>
      <SuppliersList suppliers={suppliers} userRole={user?.role} />
    </AppLayout>
  );
}
