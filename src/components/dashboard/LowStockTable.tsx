
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, PackageX, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export function LowStockTable({ products }: { products: Product[] }) {
  const lowStockProducts = products
    .filter(p => p.quantityInStock <= p.reorderPoint)
    .sort((a, b) => a.quantityInStock - b.quantityInStock);

  return (
    <Card className="h-full border-none shadow-premium bg-card/50 overflow-hidden">
        <CardHeader className="bg-amber-500/10 border-b border-amber-500/10 py-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-white">
                    <AlertTriangle className="size-5" />
                </div>
                <div>
                    <CardTitle className="text-xl font-bold text-amber-900">Stocks Critiques</CardTitle>
                    <CardDescription className="text-amber-700/70">Produits à réapprovisionner</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                    <PackageSearch className="size-6" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Tout est sous contrôle ! Aucun produit en stock faible.</p>
                </div>
            ) : (
                <div className="overflow-auto max-h-[400px] divide-y divide-border">
                    {lowStockProducts.map((product) => {
                        const isOutOfStock = product.quantityInStock === 0;
                        return (
                            <div key={product.id} className={cn(
                                "flex items-center justify-between p-4 transition-colors hover:bg-muted/30",
                                isOutOfStock ? "bg-rose-50/30" : ""
                            )}>
                                <div className="flex-1 min-w-0 mr-4">
                                    <p className="font-bold text-sm text-foreground truncate uppercase tracking-tight" title={product.name}>
                                        {product.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                                        RÉF: {product.reference}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Stock</p>
                                        <Badge 
                                            variant={isOutOfStock ? "destructive" : "warning"}
                                            className={cn(
                                                "font-black text-sm px-3",
                                                isOutOfStock ? "animate-pulse" : ""
                                            )}
                                        >
                                            {product.quantityInStock}
                                        </Badge>
                                    </div>
                                    {isOutOfStock && (
                                        <PackageX className="size-5 text-rose-500 shrink-0" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </CardContent>
    </Card>
  );
}
