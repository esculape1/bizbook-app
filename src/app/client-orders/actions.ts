
'use server';

import { db } from '@/lib/firebase-admin';
import { getInvoices, addInvoice, updateProduct, updateClientOrder } from '@/lib/data';
import { getSession } from '@/lib/session';
import { ROLES, CLIENT_ORDER_STATUS } from '@/lib/constants';
import { revalidateTag } from 'next/cache';
import type { ClientOrder, InvoiceItem } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function convertOrderToInvoice(orderId: string): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
    return { success: false, message: "Action non autorisée." };
  }

  if (!db) {
    return { success: false, message: "La connexion à la base de données a échoué." };
  }

  const orderRef = db.collection('clientOrders').doc(orderId);

  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Commande non trouvée." };
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as ClientOrder;

    if (order.status !== CLIENT_ORDER_STATUS.PENDING) {
      return { success: false, message: `Cette commande a déjà le statut "${order.status}".` };
    }

    // Map ClientOrderItems to InvoiceItems
    const invoiceItems: InvoiceItem[] = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      reference: item.reference,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    // Generate the next sequential invoice number
    const allInvoices = await getInvoices();
    const currentYear = new Date().getFullYear();
    const yearPrefix = `FACT-${currentYear}-`;

    const latestInvoiceForYear = allInvoices
      .filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith(yearPrefix))
      .sort((a, b) => {
        const numA = parseInt(a.invoiceNumber.replace(yearPrefix, ''), 10);
        const numB = parseInt(b.invoiceNumber.replace(yearPrefix, ''), 10);
        return numB - numA;
      })[0];
      
    let newInvoiceSuffix = 1;
    if (latestInvoiceForYear) {
        const lastSuffix = parseInt(latestInvoiceForYear.invoiceNumber.replace(yearPrefix, ''), 10);
        if (!isNaN(lastSuffix)) {
            newInvoiceSuffix = lastSuffix + 1;
        }
    }
    
    const newInvoiceNumber = `${yearPrefix}${newInvoiceSuffix.toString().padStart(4, '0')}`;

    // Create the new invoice
    await addInvoice({
      invoiceNumber: newInvoiceNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      date: new Date().toISOString(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      items: invoiceItems,
      subTotal: order.totalAmount,
      vat: 0,
      vatAmount: 0,
      discount: 0,
      discountAmount: 0,
      totalAmount: order.totalAmount,
      retenue: 0,
      retenueAmount: 0,
      netAPayer: order.totalAmount,
      status: 'Unpaid',
      amountPaid: 0,
      payments: [],
    });

    // Update stock for each product
    for (const item of order.items) {
      const productRef = db.collection('products').doc(item.productId);
      await productRef.update({
        quantityInStock: FieldValue.increment(-item.quantity)
      });
    }

    // Update order status to 'Processed'
    await updateClientOrder(orderId, { status: CLIENT_ORDER_STATUS.PROCESSED });
    
    revalidateTag('client-orders');
    revalidateTag('invoices');
    revalidateTag('products');
    revalidateTag('dashboard-stats');

    return { success: true };

  } catch (error) {
    console.error('Failed to convert order to invoice:', error);
    const message = error instanceof Error ? error.message : "Une erreur interne est survenue.";
    return { success: false, message };
  }
}

export async function cancelClientOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
    return { success: false, message: "Action non autorisée." };
  }

  try {
    if (!db) throw new Error("La connexion à la base de données a échoué.");
    
    const orderRef = db.collection('clientOrders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Commande non trouvée." };
    }

    const orderData = orderDoc.data() as ClientOrder;
    if (orderData.status !== CLIENT_ORDER_STATUS.PENDING) {
      return { success: false, message: `Cette commande ne peut pas être annulée car son statut est "${orderData.status}".` };
    }

    await updateClientOrder(orderId, { status: CLIENT_ORDER_STATUS.CANCELLED });
    
    revalidateTag('client-orders');

    return { success: true };

  } catch (error) {
    console.error('Failed to cancel client order:', error);
    const message = error instanceof Error ? error.message : "Une erreur interne est survenue.";
    return { success: false, message };
  }
}
