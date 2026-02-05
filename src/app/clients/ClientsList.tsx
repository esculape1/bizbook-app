'use client';

import { useState } from 'react';
import type { Client, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteClientButton } from "./DeleteClientButton";
import { ClientFormDialog } from "./ClientFormDialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Pencil, 
  QrCode, 
  Building2, 
  ShieldCheck, 
  FileCheck, 
  Search, 
  Contact, 
  FileBadge, 
  Activity, 
  Settings2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLES, CLIENT_STATUS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientQRCodeDialog } from './ClientQRCodeDialog';

export default function ClientsList({ 
  clients, 
  userRole,
  headerActions
}: { 
  clients: Client[], 
  userRole: User['role'] | undefined,
  headerActions?: React.ReactNode
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const canEdit = userRole === ROLES.SUPER_ADMIN || userRole === ROLES.USER;
  
  const filteredClients = clients
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Rechercher un client ou une entreprise..."
            className="pl-10 h-10 bg-card shadow-sm border-primary/10 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50">
          <Building2 className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">Aucun client enregistré</h3>
          <p className="text-sm text-muted-foreground mt-2">Commencez par ajouter votre premier client pour piloter votre activité.</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50 text-center">
          <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Aucun résultat pour "{searchTerm}"</p>
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {filteredClients.map((client, index) => (
              <Card key={client.id} className={cn("flex flex-col border-2 transition-all shadow-md", cardColors[index % cardColors.length])}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-extrabold break-words uppercase tracking-tight">{client.name}</CardTitle>
                          <CardDescription className="text-current/70 text-xs font-bold mt-1">
                            {client.taxRegime || '-'}
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
                      <TableHeader className="bg-muted/50 border-b-2 border-primary/10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[250px] py-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                              <Building2 className="size-4" />
                              Client / Entreprise
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
                              <FileBadge className="size-4" />
                              Informations Fiscales
                            </div>
                          </TableHead>
                          <TableHead className="py-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                              <MapPin className="size-4" />
                              Localisation
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px] text-center py-4">
                            <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                              <Activity className="size-4" />
                              Statut
                            </div>
                          </TableHead>
                          {canEdit && (
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
                        {filteredClients.map((client) => (
                          <TableRow key={client.id} className="group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary">
                            <TableCell className="max-w-[250px]">
                              <div className="flex items-start gap-3">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black mt-0.5">
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-extrabold text-sm text-foreground uppercase tracking-tight leading-snug line-clamp-2" title={client.name}>
                                    {client.name}
                                  </p>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
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
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate max-w-[180px]" title={client.email}>
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
                              <div className="flex items-start gap-2 max-w-[180px]">
                                <MapPin className="size-3 text-rose-500 shrink-0 mt-0.5" />
                                <span className="text-xs text-muted-foreground line-clamp-2">{client.address || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={client.status === CLIENT_STATUS.ACTIVE ? 'success' : 'outline'} className="font-black px-2.5">
                                {client.status === CLIENT_STATUS.ACTIVE ? 'ACTIF' : 'INACTIF'}
                              </Badge>
                            </TableCell>
                            {canEdit && (
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <ClientQRCodeDialog client={client}>
                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10" title="QR Code">
                                      <QrCode className="size-4 text-primary" />
                                    </Button>
                                  </ClientQRCodeDialog>
                                  <ClientFormDialog client={client}>
                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-amber-100" title="Modifier">
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
        </>
      )}
    </div>
  );
}
