import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

export function LowStockTable({ products }: { products: Product[] }) {
  const lowStockProducts = products.filter(p => p.quantityInStock <= p.reorderPoint);

  if (lowStockProducts.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun produit en stock faible. Bon travail !</p>
  }

  return (
    <div className="overflow-auto max-h-80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produit</TableHead>
            <TableHead className="text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="text-destructive border-destructive/20">
                    {product.quantityInStock}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
