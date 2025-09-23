
'use client';

import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { InvoiceForm } from "./InvoiceForm";
import Link from "next/link";
import { EditInvoiceForm } from "./EditInvoiceForm";
import { CancelInvoiceButton } from "./DeleteInvoiceButton";
import { RecordPaymentButton } from "./RecordPaymentButton";
import type { Invoice, Client, Product, Settings, User } from "@/lib/types";
import { ShippingLabelsDialog } from "./ShippingLabelsDialog";
import { Separator } from "@/components/ui/separator";
import { CreditCard, FileX, Pencil } from "lucide-react";

type InvoicesListProps = {
    initialInvoices: Invoice[];
    initialClients: Client[];
    initialProducts: Product[];
    initialSettings: Settings;
    user: User;
};

export default function InvoicesList({ initialInvoices, initialClients, initialProducts, initialSettings, user }: InvoicesListProps) {
    const canEdit = user?.role === 'Admin' || user?.role === 'SuperAdmin';

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

    const statusTranslations: { [key: string]: string } = {
        Paid: 'Payée',
        Unpaid: 'Impayée',
        'Partially Paid': 'Partiellement Payée',
        Cancelled: 'Annulée',
    };
    
    const cardColors = [
        "bg-sky-500/10 border-sky-500/20 text-sky-800",
        "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
        "bg-amber-500/10 border-amber-500/20 text-amber-800",
        "bg-rose-500/10 border-rose-500/20 text-rose-800",
        "bg-violet-500/10 border-violet-500/20 text-violet-800",
        "bg-teal-500/10 border-teal-500/20 text-teal-800",
    ];

    return (
        <div className="flex flex-col gap-6">
        <div className="md:hidden flex flex-col items-center gap-4 mb-4">
            <h2 className="text-3xl font-bold tracking-tight">Factures</h2>
            {canEdit && <InvoiceForm clients={initialClients} products={initialProducts} settings={initialSettings} />}
        </div>
        <div className="hidden md:block">
            <PageHeader
                title="Factures"
                actions={canEdit ? <InvoiceForm clients={initialClients} products={initialProducts} settings={initialSettings} /> : undefined}
            />
        </div>
        
        {/* Mobile View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {initialInvoices.map((invoice, index) => {
            const client = initialClients.find(c => c.id === invoice.clientId);
            const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
            const isLocked = invoice.status === 'Cancelled' || invoice.status === 'Paid';
            const cardColorClass = invoice.status === 'Cancelled' ? 'bg-muted/50 text-muted-foreground' : cardColors[index % cardColors.length];
            
            return (
                <Card key={invoice.id} className={cn("flex flex-col shadow-md border", cardColorClass)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>
                                <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                                    {invoice.invoiceNumber}
                                </Link>
                                </CardTitle>
                                <CardDescription className="font-bold text-current/80">{invoice.clientName}</CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(invoice.status)}>{statusTranslations[invoice.status]}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                        <Separator />
                        <div className="flex justify-between items-center text-base pt-2">
                            <span>Total:</span>
                            <span className="font-bold">{formatCurrency(invoice.totalAmount, initialSettings.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                            <span className="text-destructive">Dû:</span>
                            <span className="font-bold text-destructive">{formatCurrency(amountDue > 0 ? amountDue : 0, initialSettings.currency)}</span>
                        </div>
                    </CardContent>
                    {client && (
                        <CardFooter className="flex items-center justify-end gap-1 p-2 border-t mt-auto">
                            {!isLocked && <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} asTextButton={false} />}
                            <RecordPaymentButton invoice={invoice} settings={initialSettings} />
                            <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />
                            <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={isLocked} />
                        </CardFooter>
                    )}
                </Card>
            )
            })}
        </div>

        {/* Desktop View */}
        <Card className="hidden md:block">
            <CardContent className="pt-6">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant Total</TableHead>
                    <TableHead className="text-right">Montant Dû</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {initialInvoices.map((invoice) => {
                    const client = initialClients.find(c => c.id === invoice.clientId);
                    const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
                    const isLocked = invoice.status === 'Cancelled' || invoice.status === 'Paid';
                    return (
                    <TableRow key={invoice.id} className={cn(invoice.status === 'Cancelled' && 'bg-muted/50 text-muted-foreground')}>
                    <TableCell className="font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                        {invoice.invoiceNumber}
                        </Link>
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(invoice.status)}>
                        {statusTranslations[invoice.status] || invoice.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.totalAmount, initialSettings.currency)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">{formatCurrency(amountDue > 0 ? amountDue : 0, initialSettings.currency)}</TableCell>
                    {client && (
                        <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                            {!isLocked && <ShippingLabelsDialog invoice={invoice} client={client} settings={initialSettings} asTextButton={false} />}
                            {canEdit && <RecordPaymentButton invoice={invoice} settings={initialSettings} />}
                            {canEdit && <EditInvoiceForm invoice={invoice} clients={initialClients} products={initialProducts} settings={initialSettings} />}
                            {canEdit && <CancelInvoiceButton id={invoice.id} invoiceNumber={invoice.invoiceNumber} disabled={isLocked} />}
                        </div>
                        </TableCell>
                    )}
                    </TableRow>
                )})}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </div>
    );
}
