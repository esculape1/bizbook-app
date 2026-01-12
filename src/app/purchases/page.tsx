
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { ReceivePurchaseButton } from "./ReceivePurchaseButton";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { redirect } from "next/navigation";


export const dynamic = 'force-dynamic';

async function PurchasesContent() {
  const [purchases, suppliers, products, settings, user] = await Promise.all([
    getPurchases(),
    getSuppliers(),
    getProducts(),
    getSettings(),
    getSession()
  ]);

  if (!user) {
    return null; // or a loading/error state
  }

  const canEdit = user?.role === 'Admin' || user?.role === 'SuperAdmin';

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
  
  const cardColors = [
    "bg-sky-500/10 border-sky-500/20 text-sky-800",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
    "bg-amber-500/10 border-amber-500/20 text-amber-800",
    "bg-rose-500/10 border-rose-500/20 text-rose-800",
    "bg-violet-500/10 border-violet-500/20 text-violet-800",
    "bg-teal-500/10 border-teal-500/20 text-teal-800",
  ];


  return (
    <>
      <PageHeader
        title="Achats"
        actions={
          <div className="flex items-center gap-2">
            {totalPendingAmount > 0 && (
              <div className="hidden md:flex p-2 rounded-lg bg-gradient-to-r from-lime-200 via-lime-300 to-lime-400 text-lime-900 shadow-sm items-center gap-2">
                  <PackageSearch className="h-5 w-5" />
                  <div className="text-right">
                      <div className="text-xs font-medium">Achats en attente</div>
                      <div className="text-base font-bold">{formatCurrency(totalPendingAmount, settings.currency)}</div>
                  </div>
              </div>
            )}
            {canEdit && <PurchaseForm suppliers={suppliers} products={products} settings={settings} />}
          </div>
        }
      />
      
      {/* Mobile View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {purchases.map((purchase, index) => {
           const isLocked = purchase.status !== 'Pending';
           const itemNames = purchase.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
           const cardColorClass = purchase.status === 'Cancelled' ? 'bg-muted/50 text-muted-foreground' : cardColors[index % cardColors.length];

          return (
            <Card key={purchase.id} className={cn("flex flex-col shadow-md border", cardColorClass)}>
              <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{purchase.purchaseNumber}</CardTitle>
                      <CardDescription className="font-bold text-current/80">{purchase.supplierName}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(purchase.status)}>{statusTranslations[purchase.status]}</Badge>
                  </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(purchase.date).toLocaleDateString('fr-FR')}</p>
                <p className="text-xs text-muted-foreground truncate" title={itemNames}><strong>Articles:</strong> {itemNames}</p>
                <Separator />
                <div className="flex justify-between items-center text-base pt-2">
                    <span>Total:</span>
                    <span className="font-bold">{formatCurrency(purchase.totalAmount, settings.currency)}</span>
                </div>
              </CardContent>
              {canEdit && (
                 <CardFooter className="flex items-center justify-end gap-1 p-2 bg-blue-950/10 border-t mt-auto">
                    {purchase.status === 'Pending' && <ReceivePurchaseButton purchaseId={purchase.id} purchaseNumber={purchase.purchaseNumber} disabled={isLocked} />}
                    {purchase.status === 'Received' && <Button size="sm" variant="success" className="h-8 text-xs" disabled>Reçu</Button>}
                    <EditPurchaseForm purchase={purchase} suppliers={suppliers} products={products} settings={settings} />
                    <CancelPurchaseButton id={purchase.id} purchaseNumber={purchase.purchaseNumber} disabled={purchase.status === 'Received' || purchase.status === 'Cancelled'} />
                 </CardFooter>
              )}
            </Card>
          )
        })}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
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
                const itemNames = purchase.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                return (
                <TableRow key={purchase.id} className={cn(purchase.status === 'Cancelled' && 'bg-muted/50 text-muted-foreground')}>
                  <TableCell className="font-medium">
                    {purchase.purchaseNumber}
                  </TableCell>
                  <TableCell>{purchase.supplierName}</TableCell>
                  <TableCell>{new Date(purchase.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-xs" title={itemNames}>{itemNames}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(purchase.status)}>
                      {statusTranslations[purchase.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(purchase.totalAmount, settings.currency)}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {purchase.status === 'Pending' && <ReceivePurchaseButton purchaseId={purchase.id} purchaseNumber={purchase.purchaseNumber}/>}
                        {purchase.status === 'Received' && <Button size="sm" variant="success" className="h-8 text-xs" disabled>Reçu</Button>}
                        <EditPurchaseForm purchase={purchase} suppliers={suppliers} products={products} settings={settings} />
                        <CancelPurchaseButton id={purchase.id} purchaseNumber={purchase.purchaseNumber} disabled={purchase.status === 'Received' || purchase.status === 'Cancelled'} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}


export default async function PurchasesPage() {
  const [user, settings] = await Promise.all([getSession(), getSettings()]);

  if (!user || !settings) {
    redirect('/login');
  }

  return (
    <AppLayout user={user} settings={settings}>
      <PurchasesContent />
    </AppLayout>
  );
}
