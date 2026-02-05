
'use client';

import { useState } from 'react';
import type { Supplier, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteSupplierButton } from "./DeleteSupplierButton";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { 
  Mail, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Pencil, 
  Building2, 
  Search, 
  Contact, 
  Settings2,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROLES } from '@/lib/constants';

export default function SuppliersList({ 
  suppliers, 
  userRole,
  headerActions
}: { 
  suppliers: Supplier[], 
  userRole: User['role'] | undefined,
  headerActions?: React.ReactNode
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const canEdit = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
  
  const filteredSuppliers = suppliers
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

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
            placeholder="Rechercher un fournisseur ou contact..."
            className="pl-10 h-10 bg-card shadow-sm border-primary/10 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50">
          <Building2 className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">Aucun fournisseur enregistré</h3>
          <p className="text-sm text-muted-foreground mt-2">Ajoutez vos partenaires pour gérer vos approvisionnements.</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50 text-center">
          <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Aucun résultat pour "{searchTerm}"</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {filteredSuppliers.map((supplier, index) => (
              <Card key={supplier.id} className={cn("flex flex-col border-2 transition-all shadow-md", cardColors[index % cardColors.length])}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-extrabold uppercase tracking-tight break-words">{supplier.name}</CardTitle>
                  {supplier.contactPerson && <CardDescription className="text-current/70 font-bold">{supplier.contactPerson}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                    {supplier.phone && <p className="flex items-center gap-2 font-medium"><Phone className="h-3.5 w-3.5 opacity-70" /> {supplier.phone}</p>}
                    {supplier.email && <p className="flex items-center gap-2 font-medium truncate"><Mail className="h-3.5 w-3.5 opacity-70" /> {supplier.email}</p>}
                    {supplier.address && <p className="flex items-start gap-2 text-xs opacity-80 italic"><MapPin className="h-3.5 w-3.5 mt-0.5" /> {supplier.address}</p>}
                </CardContent>
                {canEdit && (
                    <div className="flex items-center justify-end p-2 bg-black/5 border-t mt-auto gap-1">
                        <SupplierFormDialog supplier={supplier}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </SupplierFormDialog>
                        <DeleteSupplierButton id={supplier.id} name={supplier.name} />
                    </div>
                )}
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <Card className="hidden md:flex flex-1 flex-col min-h-0 border-none shadow-premium bg-card/50 overflow-hidden">
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-grow">
                <div className="p-6">
                  <Table>
                    <TableHeader className="bg-muted/50 border-b-2 border-primary/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px] py-4">
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                            <Building2 className="size-4" />
                            Fournisseur
                          </div>
                        </TableHead>
                        <TableHead className="py-4">
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                            <UserIcon className="size-4" />
                            Contact
                          </div>
                        </TableHead>
                        <TableHead className="py-4">
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                            <Contact className="size-4" />
                            Coordonnées
                          </div>
                        </TableHead>
                        <TableHead className="py-4">
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                            <MapPin className="size-4" />
                            Adresse
                          </div>
                        </TableHead>
                        {canEdit && (
                          <TableHead className="text-right w-[120px] py-4">
                            <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                              <Settings2 className="size-4" />
                              Actions
                            </div>
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id} className="group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase shrink-0">
                                {supplier.name.charAt(0)}
                              </div>
                              <span className="font-extrabold text-sm uppercase tracking-tight">{supplier.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-muted-foreground">{supplier.contactPerson || '-'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {supplier.phone && (
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <Phone className="size-3 text-emerald-500" />
                                  <span>{supplier.phone}</span>
                                </div>
                              )}
                              {supplier.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Mail className="size-3 text-sky-500" />
                                  <span>{supplier.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2 max-w-[200px]">
                              <MapPin className="size-3 text-rose-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground line-clamp-2">{supplier.address || '-'}</span>
                            </div>
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <SupplierFormDialog supplier={supplier}>
                                  <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-amber-100" title="Modifier">
                                    <Pencil className="size-4 text-amber-600" />
                                  </Button>
                                </SupplierFormDialog>
                                <DeleteSupplierButton id={supplier.id} name={supplier.name} />
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
        </>
      )}
    </div>
  );
}
