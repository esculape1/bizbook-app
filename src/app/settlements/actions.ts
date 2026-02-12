
'use server';

import { z } from 'zod';
import { getInvoices } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import type { Invoice, Payment, PaymentHistoryItem } from '@/lib/types';
import { randomUUID } from 'crypto';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ROLES } from '@/lib/constants';

export async function getUnpaidInvoicesForClient(clientId: string): Promise<Invoice[]> {
  const allInvoices = await getInvoices();
  return allInvoices
    .filter(inv => 
      inv.clientId === clientId && (inv.status === 'Unpaid' || inv.status === 'Partially Paid')
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getPaymentHistoryForClient(clientId: string): Promise<PaymentHistoryItem[]> {
  const allInvoices = await getInvoices();
  // Handle cases where `payments` might not be an array on older documents.
  const clientInvoices = allInvoices.filter(inv => inv.clientId === clientId && Array.isArray(inv.payments) && inv.payments.length > 0);

  const paymentHistory: PaymentHistoryItem[] = [];

  clientInvoices.forEach(invoice => {
    invoice.payments.forEach(payment => {
      paymentHistory.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        payment: payment,
      });
    });
  });

  // Sort by payment date, most recent first
  return paymentHistory.sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());
}


const settlementPayloadSchema = z.object({
  clientId: z.string(),
  invoiceIds: z.array(z.string()).min(1, "Au moins une facture doit être sélectionnée."),
  paymentAmount: z.coerce.number().positive("Le montant du paiement doit être positif."),
  paymentDate: z.date(),
  paymentMethod: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre']),
  paymentNotes: z.string().optional(),
});

type SettlementPayload = z.infer<typeof settlementPayloadSchema>;

export async function processMultipleInvoicePayments(payload: SettlementPayload): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
    return { success: false, message: "Action non autorisée." };
  }

  const validatedPayload = settlementPayloadSchema.safeParse(payload);
  if (!validatedPayload.success) {
    return { success: false, message: "Données de paiement invalides." };
  }
  
  const { clientId, invoiceIds, paymentAmount, paymentDate, paymentMethod, paymentNotes } = validatedPayload.data;

  try {
    if (!db) {
        throw new Error("La connexion à la base de données a échoué.");
    }
    const batch = db.batch();
    
    // Fetch and verify all selected invoices
    const invoiceRefs = invoiceIds.map(id => db.collection('invoices').doc(id));
    const invoiceDocs = await db.getAll(...invoiceRefs);
    
    const invoicesToSettle: Invoice[] = invoiceDocs
      .map(doc => {
          const data = doc.data();
          if (!data) return null;
          return { id: doc.id, ...data } as Invoice;
      })
      .filter((inv): inv is Invoice => inv !== null && inv.clientId === clientId && (inv.status === 'Unpaid' || inv.status === 'Partially Paid'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (invoicesToSettle.length !== invoiceIds.length) {
      return { success: false, message: "Certaines factures sélectionnées sont invalides ou n'appartiennent pas au client." };
    }
    
    const totalDueOnSelected = invoicesToSettle.reduce((sum, inv) => {
        const netToPay = inv.netAPayer ?? inv.totalAmount;
        return sum + (netToPay - (inv.amountPaid || 0));
    }, 0);
    
    if (paymentAmount > totalDueOnSelected + 0.01) { // Add small tolerance for float issues
        return { success: false, message: `Le montant du paiement (${paymentAmount}) dépasse le total dû (${totalDueOnSelected}) des factures sélectionnées.` };
    }

    let amountToApply = paymentAmount;

    for (const invoice of invoicesToSettle) {
        if (amountToApply <= 0) break;

        const invoiceRef = db.collection('invoices').doc(invoice.id);
        const netToPay = invoice.netAPayer ?? invoice.totalAmount;
        const dueOnInvoice = netToPay - (invoice.amountPaid || 0);
        const paymentForThisInvoice = Math.min(amountToApply, dueOnInvoice);

        if (paymentForThisInvoice > 0) {
            const newAmountPaid = (invoice.amountPaid || 0) + paymentForThisInvoice;
            // The status becomes 'Paid' if the total paid reaches the Net à Payer
            const newStatus: Invoice['status'] = newAmountPaid >= netToPay - 0.01 ? 'Paid' : 'Partially Paid';
            
            const newPayment: Payment = {
                id: randomUUID(),
                date: paymentDate.toISOString(),
                amount: paymentForThisInvoice,
                method: paymentMethod,
                notes: paymentNotes || '',
            };

            batch.update(invoiceRef, {
                amountPaid: newAmountPaid,
                status: newStatus,
                payments: FieldValue.arrayUnion(newPayment)
            });

            amountToApply -= paymentForThisInvoice;
        }
    }

    await batch.commit();

    revalidateTag('invoices');
    revalidateTag('dashboard-stats');
    revalidateTag('settlements');

    return { success: true };

  } catch (error) {
    console.error("Failed to process settlement:", error);
    const message = error instanceof Error ? error.message : "Une erreur est survenue lors du traitement du règlement.";
    return { success: false, message };
  }
}
