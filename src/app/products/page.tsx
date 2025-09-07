
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { ProductForm } from "./ProductForm";
import { EditProductButton } from "./EditProductButton";
import { DeleteProductButton } from "./DeleteProductButton";
import { getSession } from "@/lib/session";
import { StockInventoryReport } from "./StockInventoryReport";
import { ProductQrCodeDialog } from "./ProductQrCodeDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, settings, user] = await Promise.all([
    getProducts(),
    getSettings(),
    getSession(),
  ]);

  const canManageProducts = user?.role === 'SuperAdmin';
  const canViewPrices = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Produits"
        actions={
          <div className="flex items-center gap-2">
            <StockInventoryReport products={products} settings={settings} />
            {canManageProducts ? <ProductForm /> : null}
          </div>
        }
      />
      <Card className="flex-1 flex flex-col min-h-0">
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
                        <TableCell className="text-right">{product.quantityInStock}</TableCell>
                        {canViewPrices && <TableCell className="text-right">{product.reorderPoint}</TableCell>}
                        {canViewPrices && <TableCell className="text-right">{product.safetyStock}</TableCell>}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <ProductQrCodeDialog product={product} settings={settings} />
                            {canManageProducts && <EditProductButton product={product} />}
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
    </div>
  );
}
