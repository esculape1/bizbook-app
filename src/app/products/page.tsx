import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { ProductForm } from "./ProductForm";
import { EditProductButton } from "./EditProductButton";
import { DeleteProductButton } from "./DeleteProductButton";
import { getSession } from "@/lib/session";

export default async function ProductsPage() {
  const [products, settings, user] = await Promise.all([
    getProducts(),
    getSettings(),
    getSession(),
  ]);

  const canEdit = user?.role === 'Admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Produits"
        actions={canEdit ? <ProductForm /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix d'Achat</TableHead>
                <TableHead className="text-right">Prix de Vente</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Point de Cde.</TableHead>
                <TableHead className="text-right">Stock Sécu.</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className={product.quantityInStock <= product.reorderPoint ? 'bg-red-500/10' : ''}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.reference}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.purchasePrice || 0, settings.currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.unitPrice, settings.currency)}</TableCell>
                  <TableCell className="text-right">{product.quantityInStock}</TableCell>
                  <TableCell className="text-right">{product.reorderPoint}</TableCell>
                  <TableCell className="text-right">{product.safetyStock}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <EditProductButton product={product} />
                        <DeleteProductButton id={product.id} name={product.name} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
