import { getProducts, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { PageHeader } from "@/components/PageHeader";
import { StockInventoryReport } from "./StockInventoryReport";
import { ProductFormDialog } from "./ProductFormDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ProductsList } from "./ProductsList";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [user, settings, products] = await Promise.all([
    getSession(), 
    getSettings(),
    getProducts()
  ]);

  if (!user || !settings) {
    redirect('/login');
  }
  
  const canManageProducts = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;
  
  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
      <PageHeader>
        <StockInventoryReport products={products} settings={settings} />
        {canManageProducts && (
          <ProductFormDialog>
            <Button>
              <PlusCircle className="mr-2" />
              Ajouter un produit
            </Button>
          </ProductFormDialog>
        )}
      </PageHeader>
      <ProductsList products={products} settings={settings} user={user} />
    </AppLayout>
  );
}