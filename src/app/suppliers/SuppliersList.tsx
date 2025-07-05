
'use client';

import type { Supplier, User } from '@/lib/types';
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupplierForm } from "./SupplierForm";
import { DeleteSupplierButton } from "./DeleteSupplierButton";
import { EditSupplierButton } from "./EditSupplierButton";

export default function SuppliersList({ suppliers, userRole }: { suppliers: Supplier[], userRole: User['role'] | undefined }) {
  const canEdit = userRole === 'Admin';
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fournisseurs"
        actions={canEdit ? <SupplierForm /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
