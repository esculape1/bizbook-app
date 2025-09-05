
import { getSuppliers } from "@/lib/data";
import SuppliersList from "./SuppliersList";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  const user = await getSession();

  return <SuppliersList suppliers={suppliers} userRole={user?.role} />;
}
