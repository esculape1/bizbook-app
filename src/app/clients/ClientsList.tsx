
'use client';

import type { Client, User } from '@/lib/types';
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientForm } from "./ClientForm";
import { DeleteClientButton } from "./DeleteClientButton";
import { EditClientButton } from "./EditClientButton";

export default function ClientsList({ clients, userRole }: { clients: Client[], userRole: User['role'] | undefined }) {
  const canEdit = userRole === 'Admin' || userRole === 'SuperAdmin';
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        actions={canEdit ? <ClientForm /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom / Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>IFU</TableHead>
                <TableHead>RCCM</TableHead>
                <TableHead>Statut</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.address}</TableCell>
                  <TableCell>{client.ifu}</TableCell>
                  <TableCell>{client.rccm}</TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'Active' ? 'success' : 'outline'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <EditClientButton client={client} />
                        <DeleteClientButton id={client.id} name={client.name} />
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
