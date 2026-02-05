'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductFormDialog } from "./ProductFormDialog";
import { DeleteProductButton } from "./DeleteProductButton";
import { ProductQrCodeDialog } from "./ProductQrCodeDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Search, Box, Hash, Layers, Wallet, DollarSign, PackageSearch, Settings2 } from "lucide-react";
import { ROLES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import type { Product, Settings, User } from '@/lib/types';

export function ProductsList({ 
  products, 
  settings, 
  user,
  headerActions
}: { 
  products: Product[], 
  settings: Settings, 
  user: User,
  headerActions?: React.ReactNode
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const canManageProducts = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.USER;
  const canViewPrices = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.USER;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Barre de Recherche et Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit, référence ou catégorie..."
            className="pl-10 h-10 bg-card shadow-sm border-primary/10 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
                const isLowStock = product.quantityInStock <= product.reorderPoint;
                return (
                <Card key={product.id} className={cn("flex flex-col shadow-md border-2", isLowStock ? 'border-rose-500/30 bg-rose-50/50' : 'border-primary/10')}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-black uppercase tracking-tight break-words">{product.name}</CardTitle>
                          <CardDescription className="text-xs font-bold text-muted-foreground mt-1">REF: {product.reference}</CardDescription>
                        </div>
                        <Badge variant={isLowStock ? 'destructive' : 'success'} className="shrink-0 font-black">
                          {product.quantityInStock}
                        </Badge>
                      </div>
                    </CardHeader>
                    {canViewPrices && (
                        <CardContent className="flex-grow space-y-2 text-xs pt-0">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                              <Layers className="size-3" />
                              <span className="font-bold uppercase tracking-wider">{product.category}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Prix Achat</p>
                                  <p className="font-bold text-sm text-amber-700 whitespace-nowrap">{formatCurrency(product.purchasePrice || 0, settings.currency)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Prix Vente</p>
                                  <p className="font-black text-sm text-primary whitespace-nowrap">{formatCurrency(product.unitPrice, settings.currency)}</p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                    {canManageProducts && (
                      <CardFooter className="flex items-center justify-end p-2 bg-black/5 border-t mt-auto gap-1">
                          <ProductQrCodeDialog product={product} settings={settings} />
                          <ProductFormDialog product={product}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50">
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
      <Card className="hidden md:flex flex-1 flex-col min-h-0 border-none shadow-premium bg-card/50 overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-grow">
            <div className="p-6">
                <Table>
                  <TableHeader className="bg-muted/50 border-b-2 border-primary/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-4">
                        <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                          <Box className="size-4" />
                          Désignation
                        </div>
                      </TableHead>
                      <TableHead className="py-4">
                        <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                          <Hash className="size-4" />
                          Référence
                        </div>
                      </TableHead>
                      <TableHead className="py-4">
                        <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                          <Layers className="size-4" />
                          Catégorie
                        </div>
                      </TableHead>
                      {canViewPrices && (
                        <>
                          <TableHead className="text-right py-4">
                            <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest whitespace-nowrap">
                              <Wallet className="size-4" />
                              P. Achat
                            </div>
                          </TableHead>
                          <TableHead className="text-right py-4">
                            <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest whitespace-nowrap">
                              <DollarSign className="size-4" />
                              P. Vente
                            </div>
                          </TableHead>
                        </>
                      )}
                      <TableHead className="text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                          <PackageSearch className="size-4" />
                          Stock
                        </div>
                      </TableHead>
                      {canManageProducts && (
                        <TableHead className="text-right w-[150px] py-4">
                          <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                            <Settings2 className="size-4" />
                            Actions
                          </div>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className={cn(
                        "group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary",
                        product.quantityInStock <= product.reorderPoint && "bg-rose-50/30 hover:border-l-rose-500"
                      )}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "size-9 rounded-lg flex items-center justify-center font-black uppercase shrink-0 text-xs",
                              product.quantityInStock <= product.reorderPoint ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"
                            )}>
                              {product.name.charAt(0)}
                            </div>
                            <span className="font-extrabold text-sm uppercase tracking-tight">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-[11px] text-muted-foreground uppercase">{product.reference}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0">
                            {product.category}
                          </Badge>
                        </TableCell>
                        {canViewPrices && (
                          <>
                            <TableCell className="text-right font-bold text-amber-700 whitespace-nowrap">{formatCurrency(product.purchasePrice || 0, settings.currency)}</TableCell>
                            <TableCell className="text-right font-black text-primary whitespace-nowrap">{formatCurrency(product.unitPrice, settings.currency)}</TableCell>
                          </>
                        )}
                        <TableCell className="text-center">
                          <Badge variant={product.quantityInStock <= product.reorderPoint ? 'destructive' : 'success'} className="font-black px-3">
                            {product.quantityInStock}
                          </Badge>
                        </TableCell>
                        {canManageProducts && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ProductQrCodeDialog product={product} settings={settings} />
                              <ProductFormDialog product={product}>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-amber-100" title="Modifier">
                                  <Pencil className="size-4 text-amber-600" />
                                </Button>
                              </ProductFormDialog>
                              <DeleteProductButton id={product.id} name={product.name} />
                            </div>
                          </TableCell>
                        )}
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
