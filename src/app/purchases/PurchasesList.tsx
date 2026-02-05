
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { EditPurchaseForm } from "./EditPurchaseForm";
import { CancelPurchaseButton } from "./CancelPurchaseButton";
import type { Purchase, User, Supplier, Product, Settings } from "@/lib/types";
import { 
  ShoppingCart, 
  Search, 
  User as UserIcon, 
  Calendar, 
  Box, 
  Activity, 
  DollarSign, 
  Settings2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ReceivePurchaseButton } from "./ReceivePurchaseButton";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { ScrollArea } from '@/components/ui/scroll-area';

export function PurchasesList({ 
  user, 
  purchases, 
  suppliers, 
  products, 
  settings,
  headerActions
}: { 
  user: User, 
  purchases: Purchase[], 
  suppliers: Supplier[], 
  products: Product[], 
  settings: Settings,
  headerActions?: React.ReactNode
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const canEdit = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;

  const filteredPurchases = purchases.filter(p => 
    p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="flex flex-col h-full gap-6">
      {/* Barre de Recherche et Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un achat ou fournisseur..."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {filteredPurchases.map((purchase, index) => {
           const itemNames = purchase.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
           const cardColorClass = purchase.status === 'Cancelled' ? 'bg-muted/50 text-muted-foreground' : cardColors[index % cardColors.length];

          return (
            <Card key={purchase.id} className={cn("flex flex-col shadow-md border-2", cardColorClass)}>
              <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <CardTitle className="text-lg font-black uppercase tracking-tight">{purchase.purchaseNumber}</CardTitle>
                      <CardDescription className="font-bold text-current/80 truncate">{purchase.supplierName}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(purchase.status)} className="shrink-0 font-black">
                      {statusTranslations[purchase.status]}
                    </Badge>
                  </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-xs">
                <p className="flex items-center gap-2"><Calendar className="size-3 opacity-70" /> {new Date(purchase.date).toLocaleDateString('fr-FR')}</p>
                <div className="flex items-start gap-2 bg-black/5 p-2 rounded-lg mt-2">
                  <Box className="size-3 mt-0.5 opacity-70 shrink-0" />
                  <p className="line-clamp-2 italic">{itemNames}</p>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-bold opacity-70">TOTAL:</span>
                    <span className="font-black text-lg">{formatCurrency(purchase.totalAmount, settings.currency)}</span>
                </div>
              </CardContent>
              {canEdit && (
                 <CardFooter className="flex items-center justify-end gap-1 p-2 bg-black/5 border-t mt-auto">
                    {purchase.status === 'Pending' && <ReceivePurchaseButton purchaseId={purchase.id} purchaseNumber={purchase.purchaseNumber} />}
                    {purchase.status === 'Received' && <Button size="sm" variant="success" className="h-8 text-[10px] font-black uppercase" disabled>Reçu</Button>}
                    <EditPurchaseForm purchase={purchase} suppliers={suppliers} products={products} settings={settings} userRole={user.role} />
                    <CancelPurchaseButton id={purchase.id} purchaseNumber={purchase.purchaseNumber} purchaseStatus={purchase.status} userRole={user.role} />
                 </CardFooter>
              )}
            </Card>
          )
        })}
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
                        <ShoppingCart className="size-4" />
                        N° Achat
                      </div>
                    </TableHead>
                    <TableHead className="py-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <UserIcon className="size-4" />
                        Fournisseur
                      </div>
                    </TableHead>
                    <TableHead className="py-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <Calendar className="size-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="py-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <Box className="size-4" />
                        Articles
                      </div>
                    </TableHead>
                    <TableHead className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <Activity className="size-4" />
                        Statut
                      </div>
                    </TableHead>
                    <TableHead className="text-right py-4">
                      <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                        <DollarSign className="size-4" />
                        Montant Total
                      </div>
                    </TableHead>
                    {canEdit && (
                      <TableHead className="text-right w-[180px] py-4">
                        <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                          <Settings2 className="size-4" />
                          Actions
                        </div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => {
                    const itemNames = purchase.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                    return (
                    <TableRow key={purchase.id} className={cn(
                      "group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary",
                      purchase.status === 'Cancelled' && 'bg-muted/50 text-muted-foreground'
                    )}>
                      <TableCell className="font-extrabold text-sm uppercase tracking-tight">
                        {purchase.purchaseNumber}
                      </TableCell>
                      <TableCell className="font-bold text-xs uppercase text-muted-foreground">{purchase.supplierName}</TableCell>
                      <TableCell className="text-xs">{new Date(purchase.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-[10px] italic text-muted-foreground truncate max-w-[200px]" title={itemNames}>{itemNames}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(purchase.status)} className="font-black px-2.5">
                          {statusTranslations[purchase.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-primary">{formatCurrency(purchase.totalAmount, settings.currency)}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {purchase.status === 'Pending' && <ReceivePurchaseButton purchaseId={purchase.id} purchaseNumber={purchase.purchaseNumber}/>}
                            {purchase.status === 'Received' && <Badge variant="success" className="h-7 text-[9px] font-black uppercase">Réceptionné</Badge>}
                            <EditPurchaseForm purchase={purchase} suppliers={suppliers} products={products} settings={settings} userRole={user.role} />
                            <CancelPurchaseButton id={purchase.id} purchaseNumber={purchase.purchaseNumber} purchaseStatus={purchase.status} userRole={user.role} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
