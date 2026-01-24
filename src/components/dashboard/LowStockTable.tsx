import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LowStockTable({ products }: { products: Product[] }) {
  const lowStockProducts = products.filter(p => p.quantityInStock <= p.reorderPoint);

  return (
    <Card className="bg-primary/5 h-full">
        <CardHeader className="text-center">
            <CardTitle>Alerte de Stock Faible</CardTitle>
        </CardHeader>
        <CardContent>
            {lowStockProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center py-12">Aucun produit en stock faible. Bon travail !</p>
                </div>
            ) : (
                <div className="overflow-auto max-h-80 pr-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {lowStockProducts.map((product) => (
                            <div key={product.id} className="p-2 rounded-lg border border-primary/30 bg-card text-primary shadow-sm flex flex-col justify-center items-center text-center">
                                <p className="text-sm font-medium leading-tight truncate w-full" title={product.name}>{product.name}</p>
                                <Badge variant="default" className="mt-1">
                                    Stock: {product.quantityInStock}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
