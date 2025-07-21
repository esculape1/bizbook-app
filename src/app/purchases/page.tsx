
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPurchases, getSuppliers, getProducts, getSettings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { PurchaseForm } from "./PurchaseForm";
import { EditPurchaseForm } from "./EditPurchaseForm";
import { CancelPurchaseButton } from "./CancelPurchaseButton";
import { getSession } from "@/lib/session";
import type { Purchase } from "@/lib/types";
import { PackageSearch } from "lucide-react";

export default async function PurchasesPage() {
  const [purchases, suppliers, products, settings, user] = await Promise.all([
    getPurchases(),
    getSuppliers(),
    getProducts(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin';

  const totalPendingAmount = purchases
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const getStatusVariant = (status: Purchase['status']): "success" | "warning" | "destructive" | "outline" => {
    switch (status) {
      case 'Received':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
      default:
        return 'outline';
    }
  }

  const statusTranslations: { [key in Purchase['status']]: string } = {
    Pending: 'En attente',
    Received: 'Reçu',
    Cancelled: 'Annulé',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
            <PageHeader title="Achats" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            {totalPendingAmount > 0 && (
                <div className="flex-1 md:flex-none p-3 rounded-lg bg-gradient-to-r from-lime-200 via-lime-300 to-lime-400 text-lime-900 shadow-md flex items-center gap-3">
                    <PackageSearch className="h-6 w-6" />
                    <div className="text-right">
                        <div className="text-sm font-medium">Achats en attente</div>
                        <div className="text-lg font-bold">{formatCurrency(totalPendingAmount, settings.currency)}</div>
                    </div>
                </div>
            )}
            {canEdit && <PurchaseForm suppliers={suppliers} products={products} settings={settings} />}
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Achat</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant Total</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const isCancelled = purchase.status === 'Cancelled';
                const itemNames = purchase.items.map(item => item.productName).join(', ');
                return (
                <TableRow key={purchase.id} className={cn(isCancelled && 'bg-muted/50 text-muted-foreground')}>
                  <TableCell className="font-medium">
                    {purchase.purchaseNumber}
                  </TableCell>
                  <TableCell>{purchase.supplierName}</TableCell>
                  <TableCell>{new Date(purchase.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{itemNames}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(purchase.status)}>
                      {statusTranslations[purchase.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(purchase.totalAmount, settings.currency)}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <EditPurchaseForm purchase={purchase} suppliers={suppliers} products={products} settings={settings} />
                        <CancelPurchaseButton id={purchase.id} purchaseNumber={purchase.purchaseNumber} disabled={isCancelled} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
