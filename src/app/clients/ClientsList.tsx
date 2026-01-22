
'use client';

import type { Client, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteClientButton } from "./DeleteClientButton";
import { ClientFormDialog } from "./ClientFormDialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, MapPin, Phone, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLES, CLIENT_STATUS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export default function ClientsList({ clients, userRole }: { clients: Client[], userRole: User['role'] | undefined }) {
  const canEdit = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
  
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
      {/* Mobile View - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:hidden">
        {clients.map((client, index) => (
          <Card key={client.id} className={cn("flex flex-col", cardColors[index % cardColors.length])}>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription className="text-current/70">{client.taxRegime || 'Statut fiscal non spécifié'}</CardDescription>
                  </div>
                  <Badge variant={client.status === CLIENT_STATUS.ACTIVE ? 'success' : 'outline'} className="ml-2 shrink-0">
                      {client.status}
                  </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm">
                {client.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {client.phone}</p>}
                {client.email && <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0" /> {client.email}</p>}
                {client.address && <p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-1" /> {client.address}</p>}
                {client.ifu && <p><strong>IFU:</strong> {client.ifu}</p>}
                {client.rccm && <p><strong>RCCM:</strong> {client.rccm}</p>}
            </CardContent>
            {canEdit && (
                <div className="flex items-center justify-end p-2 border-t mt-auto">
                    <ClientFormDialog client={client}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </ClientFormDialog>
                    <DeleteClientButton id={client.id} name={client.name} />
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
                          <Badge variant={client.status === CLIENT_STATUS.ACTIVE ? 'success' : 'outline'}>
                            {client.status}
                          </Badge>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <ClientFormDialog client={client}>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </ClientFormDialog>
                              <DeleteClientButton id={client.id} name={client.name} />
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
