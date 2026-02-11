'use server';

import { z } from 'zod';
import { getInvoices, updateInvoice } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import type { Invoice, Payment, PaymentHistoryItem } from '@/lib/types';
import { randomUUID } from 'crypto';
import { ROLES } from '@/lib/constants';

export async function getUnpaidInvoicesForClient(clientId: string): Promise<Invoice[]> {
  const session = await getSession();
  if (!session) return [];
  const allInvoices = await getInvoices(session.organizationId);
  return allInvoices
    .filter(inv => inv.clientId === clientId && (inv.status === 'Unpaid' || inv.status === 'Partially Paid'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getPaymentHistoryForClient(clientId: string): Promise<PaymentHistoryItem[]> {
  const session = await getSession();
  if (!session) return [];
  const allInvoices = await getInvoices(session.organizationId);
  const clientInvoices = allInvoices.filter(inv => inv.clientId === clientId && Array.isArray(inv.payments) && inv.payments.length > 0);
  const paymentHistory: PaymentHistoryItem[] = [];
  clientInvoices.forEach(invoice => {
    invoice.payments.forEach(payment => {
      paymentHistory.push({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, payment });
    });
  });
  return paymentHistory.sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());
}

const settlementPayloadSchema = z.object({
  clientId: z.string(),
  invoiceIds: z.array(z.string()).min(1),
  paymentAmount: z.coerce.number().positive(),
  paymentDate: z.date(),
  paymentMethod: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre']),
  paymentNotes: z.string().optional(),
});

type SettlementPayload = z.infer<typeof settlementPayloadSchema>;

export async function processMultipleInvoicePayments(payload: SettlementPayload): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { success: false, message: "Action non autorisee." };
  }
  const validatedPayload = settlementPayloadSchema.safeParse(payload);
  if (!validatedPayload.success) return { success: false, message: "Donnees invalides." };

  const { clientId, invoiceIds, paymentAmount, paymentDate, paymentMethod, paymentNotes } = validatedPayload.data;

  try {
    const allInvoices = await getInvoices(session.organizationId);
    const invoicesToSettle = allInvoices
      .filter(inv => invoiceIds.includes(inv.id) && inv.clientId === clientId && (inv.status === 'Unpaid' || inv.status === 'Partially Paid'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (invoicesToSettle.length !== invoiceIds.length) {
      return { success: false, message: "Certaines factures sont invalides." };
    }

    const totalDueOnSelected = invoicesToSettle.reduce((sum, inv) => sum + (inv.totalAmount - (inv.amountPaid || 0)), 0);
    if (paymentAmount > totalDueOnSelected + 0.001) {
      return { success: false, message: `Le montant depasse le total du (${totalDueOnSelected}).` };
    }

    let amountToApply = paymentAmount;
    for (const invoice of invoicesToSettle) {
      if (amountToApply <= 0) break;
      const dueOnInvoice = invoice.totalAmount - (invoice.amountPaid || 0);
      const paymentForThis = Math.min(amountToApply, dueOnInvoice);
      if (paymentForThis > 0) {
        const newAmountPaid = (invoice.amountPaid || 0) + paymentForThis;
        const newStatus: Invoice['status'] = newAmountPaid >= invoice.totalAmount - 0.001 ? 'Paid' : 'Partially Paid';
        const newPayment: Payment = {
          id: randomUUID(), date: paymentDate.toISOString(), amount: paymentForThis,
          method: paymentMethod, notes: paymentNotes || '',
        };
        await updateInvoice(invoice.id, {
          amountPaid: newAmountPaid, status: newStatus, payments: [...(invoice.payments || []), newPayment],
        });
        amountToApply -= paymentForThis;
      }
    }

    revalidateTag('invoices'); revalidateTag('dashboard-stats'); revalidateTag('settlements');
    return { success: true };
  } catch (error) {
    console.error("Failed to process settlement:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur de traitement.' };
  }
}
