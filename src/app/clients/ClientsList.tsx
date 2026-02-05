
'use client';

import type { Client, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteClientButton } from "./DeleteClientButton";
import { ClientFormDialog } from "./ClientFormDialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, MapPin, Phone, Pencil, QrCode, Building2, Contact2, ShieldCheck, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLES, CLIENT_STATUS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ClientQRCodeDialog } from './ClientQRCodeDialog';

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

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50">
        <Building2 className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-xl font-bold text-muted-foreground">Aucun client enregistré</h3>
        <p className="text-sm text-muted-foreground mt-2">Commencez par ajouter votre premier client pour piloter votre activité.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Mobile View - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {clients.map((client, index) => (
          <Card key={client.id} className={cn("flex flex-col border-2 transition-all shadow-md", cardColors[index % cardColors.length])}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-extrabold truncate uppercase tracking-tight">{client.name}</CardTitle>
                      <CardDescription className="text-current/70 text-xs font-bold mt-1">
                        {client.taxRegime || 'Régime non spécifié'}
                      </CardDescription>
                  </div>
                  <Badge variant={client.status === CLIENT_STATUS.ACTIVE ? 'success' : 'outline'} className="ml-2 shrink-0 font-black">
                      {client.status}
                  </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                <div className="space-y-1">
                    {client.phone && <p className="flex items-center gap-2 font-medium"><Phone className="h-3.5 w-3.5 shrink-0 opacity-70" /> {client.phone}</p>}
                    {client.email && <p className="flex items-center gap-2 font-medium truncate"><Mail className="h-3.5 w-3.5 shrink-0 opacity-70" /> {client.email}</p>}
                </div>
                {client.address && (
                    <div className="flex items-start gap-2 text-xs opacity-80 italic">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{client.address}</span>
                    </div>
                )}
                {(client.ifu || client.rccm) && (
                    <div className="pt-2 border-t border-current/10 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <div>IFU: <span className="opacity-70">{client.ifu || '-'}</span></div>
                        <div>RCCM: <span className="opacity-70">{client.rccm || '-'}</span></div>
                    </div>
                )}
            </CardContent>
            {canEdit && (
                <div className="flex items-center justify-end p-2 bg-black/5 border-t mt-auto gap-1">
                    <ClientQRCodeDialog client={client}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" title="Générer QR Code">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </ClientQRCodeDialog>
                    <ClientFormDialog client={client}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50" title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </ClientFormDialog>
                    <DeleteClientButton id={client.id} name={client.name} />
                </div>
            )}
          </Card>
        ))}
      </div>

      {/* Desktop View - Premium Table */}
      <Card className="hidden md:flex flex-1 flex-col min-h-0 border-none shadow-premium bg-card/50 overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-grow">
            <div className="p-6">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px] font-bold uppercase text-[11px] tracking-widest">Client / Entreprise</TableHead>
                      <TableHead className="font-bold uppercase text-[11px] tracking-widest">Coordonnées</TableHead>
                      <TableHead className="font-bold uppercase text-[11px] tracking-widest">Informations Fiscales</TableHead>
                      <TableHead className="font-bold uppercase text-[11px] tracking-widest">Localisation</TableHead>
                      <TableHead className="w-[100px] text-center font-bold uppercase text-[11px] tracking-widest">Statut</TableHead>
                      {canEdit && <TableHead className="text-right font-bold uppercase text-[11px] tracking-widest w-[150px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id} className="group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-sm text-foreground uppercase tracking-tight truncate" title={client.name}>
                                {client.name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 truncate">
                                {client.taxRegime || 'Régime Normal'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.phone && (
                              <div className="flex items-center gap-2 text-xs font-semibold">
                                <Phone className="size-3 text-emerald-500" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate max-w-[200px]" title={client.email}>
                                <Mail className="size-3 text-sky-500" />
                                <span>{client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="grid grid-cols-1 gap-1 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="size-3 text-amber-500" />
                              <span className="text-muted-foreground uppercase tracking-wider">IFU:</span>
                              <span className="text-foreground">{client.ifu || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileCheck className="size-3 text-indigo-500" />
                              <span className="text-muted-foreground uppercase tracking-wider">RCCM:</span>
                              <span className="text-foreground">{client.rccm || '-'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2 max-w-[200px]">
                            <MapPin className="size-3 text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground line-clamp-2">{client.address || 'Non spécifiée'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={client.status === CLIENT_STATUS.ACTIVE ? 'success' : 'outline'} className="font-black px-2.5">
                            {client.status === CLIENT_STATUS.ACTIVE ? 'ACTIF' : 'INACTIF'}
                          </Badge>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ClientQRCodeDialog client={client}>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white hover:shadow-sm" title="QR Code">
                                  <QrCode className="size-4 text-primary" />
                                </Button>
                              </ClientQRCodeDialog>
                              <ClientFormDialog client={client}>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white hover:shadow-sm" title="Modifier">
                                  <Pencil className="size-4 text-amber-600" />
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
