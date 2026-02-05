
import { getPurchases, getSuppliers, getProducts, getSettings, getSession } from "@/lib/data";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { PurchasesList } from "./PurchasesList";
import { PurchaseForm } from "./PurchaseForm";
import { PackageSearch } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const [user, settings, suppliers, products, purchases] = await Promise.all([
    getSession(), 
    getSettings(),
    getSuppliers(),
    getProducts(),
    getPurchases()
  ]);

  if (!user || !settings) {
    redirect('/login');
  }
  
  const canEdit = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
  
  const totalPendingAmount = purchases
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const headerActions = (
    <>
      {totalPendingAmount > 0 && (
          <div className="hidden md:flex p-2 px-4 rounded-xl bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 shadow-sm items-center gap-3 border border-amber-300/50">
              <PackageSearch className="h-5 w-5 text-amber-600" />
              <div className="text-right leading-tight">
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-70">Achats en attente</div>
                  <div className="text-sm font-black">{formatCurrency(totalPendingAmount, settings.currency)}</div>
              </div>
          </div>
      )}
      {canEdit && <PurchaseForm suppliers={suppliers} products={products} settings={settings} />}
    </>
  );

  return (
    <AppLayout user={user} settings={settings}>
      <PurchasesList 
        user={user} 
        purchases={purchases} 
        suppliers={suppliers} 
        products={products} 
        settings={settings}
        headerActions={headerActions}
      />
    </AppLayout>
  );
}
