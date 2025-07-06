
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LowStockTable({ products }: { products: Product[] }) {
  const lowStockProducts = products.filter(p => p.quantityInStock <= p.reorderPoint);

  return (
    <Card className="bg-destructive/5">
        <CardHeader className="text-center">
            <CardTitle>Alerte de Stock Faible</CardTitle>
        </CardHeader>
        <CardContent>
            {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-12 pb-12">Aucun produit en stock faible. Bon travail !</p>
            ) : (
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
            )}
        </CardContent>
    </Card>
  );
}
