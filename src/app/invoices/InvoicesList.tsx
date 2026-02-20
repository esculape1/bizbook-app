
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
                {filteredInvoices.map((invoice) => {
                const client = initialClients.find(c => c.id === invoice.clientId);
                const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
                return (
                    <Card key={invoice.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <CardTitle className="text-base truncate">
                                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">{invoice.invoiceNumber}</Link>
                                    </CardTitle>
                                    <CardDescription className="truncate">{invoice.clientName}</CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(invoice.status)}>{INVOICE_STATUS_TRANSLATIONS[invoice.status]}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                            <div className="flex justify-between"><span>TOTAL TTC:</span><span className="font-bold">{formatCurrency(invoice.totalAmount, initialSettings.currency)}</span></div>
                            <div className="flex justify-between"><span>SOLDE DÛ:</span><span className="font-bold text-destructive">{formatCurrency(amountDue, initialSettings.currency)}</span></div>
                        </CardContent>
                        {client && canManageInvoices && (
                            <CardFooter className="flex items-center justify-end gap-1 p-2 bg-muted/50 border-t mt-auto">
                                <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} />
                                <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />
                                <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={invoice.status === 'Cancelled' || invoice.status === 'Paid'} />
                            </CardFooter>
                        )}
                    </Card>
                )})}
            </div>

            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Facture</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Total TTC</TableHead>
                                <TableHead className="text-right">Solde Dû</TableHead>
                                {canManageInvoices && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((invoice) => {
                                const client = initialClients.find(c => c.id === invoice.clientId);
                                const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
                                return (
                                    <TableRow key={invoice.id}>
                                        <TableCell><Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">{invoice.invoiceNumber}</Link></TableCell>
                                        <TableCell>{invoice.clientName}</TableCell>
                                        <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(invoice.status)}>{INVOICE_STATUS_TRANSLATIONS[invoice.status]}</Badge></TableCell>
                                        <TableCell className="text-right">{formatCurrency(invoice.totalAmount, initialSettings.currency)}</TableCell>
                                        <TableCell className="text-right text-destructive font-bold">{formatCurrency(amountDue, initialSettings.currency)}</TableCell>
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
