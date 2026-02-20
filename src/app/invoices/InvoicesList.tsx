
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
import { ROLES, INVOICE_STATUS_TRANSLATIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type InvoicesListProps = {
    initialInvoices: Invoice[];
    initialClients: Client[];
    initialProducts: Product[];
    initialSettings: Settings;
    user: User;
    headerActions?: React.ReactNode;
};

const cardColors = [
    "bg-sky-500/10 border-sky-500/20 text-sky-800",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
    "bg-amber-500/10 border-amber-500/20 text-amber-800",
    "bg-rose-500/10 border-rose-500/20 text-rose-800",
    "bg-violet-500/10 border-violet-500/20 text-violet-800",
    "bg-teal-500/10 border-teal-500/20 text-teal-800",
];

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

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une facture..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">{headerActions}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {filteredInvoices.map((invoice, index) => {
                const client = initialClients.find(c => c.id === invoice.clientId);
                const netToPay = invoice.netAPayer ?? invoice.totalAmount;
                const amountDue = netToPay - (invoice.amountPaid || 0);
                return (
                    <Card key={invoice.id} className={cn("flex flex-col border-2 shadow-md", cardColors[index % cardColors.length])}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <CardTitle className="text-base truncate font-black uppercase tracking-tight">
                                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">{invoice.invoiceNumber}</Link>
                                    </CardTitle>
                                    <CardDescription className="truncate font-bold text-current/70">{invoice.clientName}</CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(invoice.status)} className="font-black px-2 py-0.5">
                                    {INVOICE_STATUS_TRANSLATIONS[invoice.status]}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-xs">
                            <div className="flex justify-between font-medium"><span>NET À PAYER:</span><span className="font-black">{formatCurrency(netToPay, initialSettings.currency)}</span></div>
                            <div className="flex justify-between font-medium"><span>SOLDE DÛ:</span><span className={cn("font-black", amountDue > 0.05 ? "text-destructive" : "text-emerald-700")}>{formatCurrency(amountDue > 0.05 ? amountDue : 0, initialSettings.currency)}</span></div>
                        </CardContent>
                        {client && canManageInvoices && (
                            <CardFooter className="flex items-center justify-end gap-1 p-2 bg-black/5 border-t mt-auto">
                                <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} />
                                <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />
                                <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={invoice.status === 'Cancelled' || invoice.status === 'Paid'} />
                            </CardFooter>
                        )}
                    </Card>
                )})}
            </div>

            <Card className="hidden md:block border-none shadow-premium bg-card/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b-2 border-primary/10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-primary">N° Facture</TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-primary">Client</TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-primary">Date</TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-primary text-center">Statut</TableHead>
                                <TableHead className="text-right font-black uppercase text-[11px] tracking-widest text-primary">Net à Payer</TableHead>
                                <TableHead className="text-right font-black uppercase text-[11px] tracking-widest text-primary">Solde Dû</TableHead>
                                {canManageInvoices && <TableHead className="text-right font-black uppercase text-[11px] tracking-widest text-primary">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((invoice) => {
                                const client = initialClients.find(c => c.id === invoice.clientId);
                                const netToPay = invoice.netAPayer ?? invoice.totalAmount;
                                const amountDue = netToPay - (invoice.amountPaid || 0);
                                return (
                                    <TableRow key={invoice.id} className="group hover:bg-primary/5 transition-colors">
                                        <TableCell className="font-extrabold uppercase tracking-tight"><Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">{invoice.invoiceNumber}</Link></TableCell>
                                        <TableCell className="font-bold text-xs uppercase text-muted-foreground">{invoice.clientName}</TableCell>
                                        <TableCell className="text-xs">{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell className="text-center"><Badge variant={getStatusVariant(invoice.status)} className="font-black px-2.5">{INVOICE_STATUS_TRANSLATIONS[invoice.status]}</Badge></TableCell>
                                        <TableCell className="text-right font-black text-foreground">{formatCurrency(netToPay, initialSettings.currency)}</TableCell>
                                        <TableCell className={cn("text-right font-black", amountDue > 0.05 ? "text-destructive" : "text-emerald-600")}>{formatCurrency(amountDue > 0.05 ? amountDue : 0, initialSettings.currency)}</TableCell>
                                        {canManageInvoices && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {client && <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} />}
                                                    {client && <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />}
                                                    <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={invoice.status === 'Cancelled' || invoice.status === 'Paid'} />
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
