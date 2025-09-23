
'use client';

import type { Supplier, User } from '@/lib/types';
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupplierForm } from "./SupplierForm";
import { DeleteSupplierButton } from "./DeleteSupplierButton";
import { EditSupplierButton } from "./EditSupplierButton";
import { Mail, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SuppliersList({ suppliers, userRole }: { suppliers: Supplier[], userRole: User['role'] | undefined }) {
  const canEdit = userRole === 'Admin' || userRole === 'SuperAdmin';
  
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
      <PageHeader
        title="Fournisseurs"
        actions={canEdit ? <SupplierForm /> : undefined}
      />
      
      {/* Mobile View - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:hidden">
        {suppliers.map((supplier, index) => (
          <Card key={supplier.id} className={cn("flex flex-col", cardColors[index % cardColors.length])}>
            <CardHeader>
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm">
                {supplier.contactPerson && <p className="flex items-center gap-2"><UserIcon className="h-4 w-4 shrink-0" /> {supplier.contactPerson}</p>}
                {supplier.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {supplier.phone}</p>}
                {supplier.email && <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0" /> {supplier.email}</p>}
                {supplier.address && <p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-1" /> {supplier.address}</p>}
            </CardContent>
            {canEdit && (
                <div className="flex items-center justify-end p-2 border-t mt-auto">
                    <EditSupplierButton supplier={supplier} />
                    <DeleteSupplierButton id={supplier.id} name={supplier.name} />
                </div>
            )}
          </Card>
        ))}
      </div>

      {/* Desktop View - Table */}
      <Card className="hidden md:flex flex-1 flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0">
         <ScrollArea className="flex-grow">
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom / Entreprise</TableHead>
                    <TableHead>Personne à contacter</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <EditSupplierButton supplier={supplier} />
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
    </div>
  );
}
