
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { EditInvoiceForm } from "./EditInvoiceForm";
import { CancelInvoiceButton } from "./DeleteInvoiceButton";
import type { Invoice, Client, Product, Settings, User } from "@/lib/types";
import { ShippingLabelsDialog } from "./ShippingLabelsDialog";
import { Separator } from "@/components/ui/separator";
import { ROLES, INVOICE_STATUS_TRANSLATIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, User as UserIcon, Calendar, Activity, DollarSign, Settings2 } from "lucide-react";

type InvoicesListProps = {
    initialInvoices: Invoice[];
    initialClients: Client[];
    initialProducts: Product[];
    initialSettings: Settings;
    user: User;
    headerActions?: React.ReactNode;
};

export default function InvoicesList({ initialInvoices, initialClients, initialProducts, initialSettings, user, headerActions }: InvoicesListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const canManageInvoices = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN || user?.role === ROLES.USER;

    const filteredInvoices = initialInvoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusVariant = (status: Invoice['status']): "success" | "warning" | "destructive" | "outline" => {
        switch (status) {
        case 'Paid':
            return 'success';
        case 'Partially Paid':
            return 'warning';
        case 'Unpaid':
            return 'destructive';
        case 'Cancelled':
        default:
            return 'outline';
        }
    }

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
                        placeholder="Rechercher une facture ou un client..."
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
                {filteredInvoices.map((invoice, index) => {
                const client = initialClients.find(c => c.id === invoice.clientId);
                const netToPay = invoice.netAPayer ?? invoice.totalAmount;
                const amountDue = netToPay - (invoice.amountPaid || 0);
                const isLocked = invoice.status === 'Cancelled' || invoice.status === 'Paid';
                const cardColorClass = invoice.status === 'Cancelled' ? 'bg-muted/50 text-muted-foreground' : cardColors[index % cardColors.length];
                
                return (
                    <Card key={invoice.id} className={cn("flex flex-col shadow-md border-2", cardColorClass)}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <CardTitle>
                                    <Link href={`/invoices/${invoice.id}`} className="hover:underline text-lg font-black uppercase tracking-tight">
                                        {invoice.invoiceNumber}
                                    </Link>
                                    </CardTitle>
                                    <CardDescription className="font-bold text-current/80 truncate">{invoice.clientName}</CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(invoice.status)} className="shrink-0 font-black">
                                    {INVOICE_STATUS_TRANSLATIONS[invoice.status]}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-xs">
                            <p className="flex items-center gap-2"><Calendar className="size-3 opacity-70" /> {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                            <Separator className="my-2 opacity-20" />
                            <div className="flex justify-between items-center text-sm pt-1">
                                <span className="font-bold opacity-70">TOTAL NET:</span>
                                <span className="font-black text-lg">{formatCurrency(netToPay, initialSettings.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-destructive font-bold">RESTE À PAYER:</span>
                                <span className="font-bold text-destructive">{formatCurrency(amountDue > 0.01 ? amountDue : 0, initialSettings.currency)}</span>
                            </div>
                        </CardContent>
                        {client && canManageInvoices && (
                            <CardFooter className="flex items-center justify-end gap-1 p-2 bg-black/5 border-t mt-auto">
                                <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} asTextButton={false} />
                                <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />
                                <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={isLocked} />
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
                                                <FileText className="size-4" />
                                                N° Facture
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-4 w-[200px]">
                                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                                                <UserIcon className="size-4" />
                                                Client
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-4">
                                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                                                <Calendar className="size-4" />
                                                Date
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
                                                Net à Payer
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right py-4">
                                            <div className="flex items-center justify-end gap-2 text-primary font-black uppercase text-[11px] tracking-widest">
                                                <DollarSign className="size-4" />
                                                Solde Dû
                                            </div>
                                        </TableHead>
                                        {canManageInvoices && (
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
                                    {filteredInvoices.map((invoice) => {
                                        const client = initialClients.find(c => c.id === invoice.clientId);
                                        const netToPay = invoice.netAPayer ?? invoice.totalAmount;
                                        const amountDue = netToPay - (invoice.amountPaid || 0);
                                        const isLocked = invoice.status === 'Cancelled' || invoice.status === 'Paid';
                                        return (
                                            <TableRow key={invoice.id} className={cn(
                                                "group transition-all hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary",
                                                invoice.status === 'Cancelled' && 'bg-muted/50 text-muted-foreground'
                                            )}>
                                                <TableCell className="font-extrabold text-sm uppercase tracking-tight">
                                                    <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                                                        {invoice.invoiceNumber}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <p className="font-bold text-[11px] uppercase text-muted-foreground line-clamp-2 leading-snug" title={invoice.clientName}>
                                                        {invoice.clientName}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-xs">{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(invoice.status)} className="font-black px-2.5">
                                                        {INVOICE_STATUS_TRANSLATIONS[invoice.status] || invoice.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-black">{formatCurrency(netToPay, initialSettings.currency)}</TableCell>
                                                <TableCell className="text-right font-black text-destructive">{formatCurrency(amountDue > 0.01 ? amountDue : 0, initialSettings.currency)}</TableCell>
                                                {canManageInvoices && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {client && <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} asTextButton={false} />}
                                                            {client && <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />}
                                                            <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={isLocked} />
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
