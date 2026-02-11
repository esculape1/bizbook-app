'use server';

import { addInvoice, updateProduct, updateClientOrder, getProducts, getNextInvoiceNumber, getClientOrderById } from '@/lib/data';
import { getSession } from '@/lib/session';
import { ROLES, CLIENT_ORDER_STATUS } from '@/lib/constants';
import { revalidateTag } from 'next/cache';
import type { InvoiceItem } from '@/lib/types';

export async function convertOrderToInvoice(orderId: string): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.USER)) {
    return { success: false, message: "Action non autorisee." };
  }
  const orgId = session.organizationId;

  try {
    const [order, allProducts] = await Promise.all([getClientOrderById(orderId), getProducts(orgId)]);
    if (!order) return { success: false, message: "Commande non trouvee." };
    if (order.status !== CLIENT_ORDER_STATUS.PENDING) return { success: false, message: `Statut: "${order.status}".` };

    const invoiceItems: InvoiceItem[] = order.items.map(item => {
      const product = allProducts.find(p => p.id === item.productId);
      return {
        productId: item.productId, productName: item.productName, reference: item.reference,
        quantity: item.quantity, unitPrice: item.unitPrice, total: item.total,
        purchasePrice: product?.purchasePrice ?? 0,
      };
    });

    const newInvoiceNumber = await getNextInvoiceNumber(orgId);
    await addInvoice({
      invoiceNumber: newInvoiceNumber, clientId: order.clientId, clientName: order.clientName,
      date: new Date().toISOString(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      items: invoiceItems, subTotal: order.totalAmount, vat: 0, vatAmount: 0,
      discount: 0, discountAmount: 0, totalAmount: order.totalAmount,
      retenue: 0, retenueAmount: 0, netAPayer: order.totalAmount,
      status: 'Unpaid', amountPaid: 0, payments: [],
    }, orgId);

    for (const item of order.items) {
      const product = allProducts.find(p => p.id === item.productId);
      if (product) await updateProduct(item.productId, { quantityInStock: product.quantityInStock - item.quantity });
    }

    await updateClientOrder(orderId, { status: CLIENT_ORDER_STATUS.PROCESSED });
    revalidateTag('client-orders'); revalidateTag('invoices'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error('Failed to convert order:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur interne.' };
  }
}

export async function cancelClientOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.USER)) {
    return { success: false, message: "Action non autorisee." };
  }
  try {
    const order = await getClientOrderById(orderId);
    if (!order) return { success: false, message: "Commande non trouvee." };
    if (order.status !== CLIENT_ORDER_STATUS.PENDING) return { success: false, message: `Statut: "${order.status}".` };
    await updateClientOrder(orderId, { status: CLIENT_ORDER_STATUS.CANCELLED });
    revalidateTag('client-orders');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel order:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur interne.' };
  }
}
