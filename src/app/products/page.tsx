
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getSettings } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductFormDialog } from "./ProductFormDialog";
import { DeleteProductButton } from "./DeleteProductButton";
import { getSession } from "@/lib/session";
import { StockInventoryReport } from "./StockInventoryReport";
import { ProductQrCodeDialog } from "./ProductQrCodeDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil } from "lucide-react";
import { ROLES } from "@/lib/constants";

export const dynamic = 'force-dynamic';


async function ProductsContent() {
  const [products, settings, user] = await Promise.all([
    getProducts(),
    getSettings(),
    getSession(),
  ]);

  if (!user || !settings) {
    return null;
  }

  const canManageProducts = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const canViewPrices = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
                const isLowStock = product.quantityInStock <= product.reorderPoint;
                return (
                <Card key={product.id} className={cn("flex flex-col shadow-md", isLowStock ? 'border-red-500/50 bg-red-500/10' : 'border-slate-300 bg-card')}>
                    <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>Réf: {product.reference}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end">
                        <Badge variant={!isLowStock ? 'success' : 'destructive'}>
                            Stock: {product.quantityInStock}
                        </Badge>
                        </div>
                    </div>
                    </CardHeader>
                    {canViewPrices && (
                        <CardContent className="flex-grow space-y-2 text-sm pt-0">
                            <p>Catégorie: <strong>{product.category}</strong></p>
                            <div className="flex justify-between items-center text-base pt-2">
                                <span>P.Achat:</span>
                                <span className="font-semibold">{formatCurrency(product.purchasePrice || 0, settings.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base">
                                <span>P.Vente:</span>
                                <span className="font-bold">{formatCurrency(product.unitPrice, settings.currency)}</span>
                            </div>
                        </CardContent>
                    )}
                    {canManageProducts && (
                      <CardFooter className="flex items-center justify-end p-2 bg-blue-950/10 border-t mt-auto">
                          <ProductQrCodeDialog product={product} settings={settings} />
                          <ProductFormDialog product={product}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </ProductFormDialog>
                          <DeleteProductButton id={product.id} name={product.name} />
                      </CardFooter>
                    )}
                </Card>
                )
            })}
        </div>
      </div>


      {/* Desktop View */}
      <Card className="hidden md:flex flex-1 flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-grow">
            <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Catégorie</TableHead>
                      {canViewPrices && <TableHead className="text-right">Prix d'Achat</TableHead>}
                      {canViewPrices && <TableHead className="text-right">Prix de Vente</TableHead>}
                      <TableHead className="text-right">Quantité</TableHead>
                      {canViewPrices && <TableHead className="text-right">Point de Cde.</TableHead>}
                      {canViewPrices && <TableHead className="text-right">Stock Sécu.</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={product.quantityInStock <= product.reorderPoint ? 'bg-red-500/10' : ''}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.reference}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        {canViewPrices && <TableCell className="text-right">{formatCurrency(product.purchasePrice || 0, settings.currency)}</TableCell>}
                        {canViewPrices && <TableCell className="text-right">{formatCurrency(product.unitPrice, settings.currency)}</TableCell>}
                        <TableCell className="text-right font-bold">{product.quantityInStock}</TableCell>
                        {canViewPrices && <TableCell className="text-right">{product.reorderPoint}</TableCell>}
                        {canViewPrices && <TableCell className="text-right">{product.safetyStock}</TableCell>}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <ProductQrCodeDialog product={product} settings={settings} />
                            {canManageProducts && (
                              <ProductFormDialog product={product}>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </ProductFormDialog>
                            )}
                            {canManageProducts && <DeleteProductButton id={product.id} name={product.name} />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}


export default async function ProductsPage() {
  const [user, settings, products] = await Promise.all([
    getSession(), 
    getSettings(),
    getProducts()
  ]);

  if (!user || !settings) {
    redirect('/login');
  }
  
  const canManageProducts = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
  
  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Produits</h1>
            <div className="flex items-center gap-2">
                 <StockInventoryReport products={products} settings={settings} />
                {canManageProducts && (
                  <ProductFormDialog>
                    <Button>
                      <PlusCircle className="mr-2" />
                      Ajouter un produit
                    </Button>
                  </ProductFormDialog>
                )}
            </div>
        </div>
      <ProductsContent />
    </AppLayout>
  );
}
