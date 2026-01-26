
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { getClientById, getProducts } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { ClientOrderItem } from '@/lib/types';

// The schema now only accepts the essential data from the client.
// Price and product name will be fetched on the server for security.
const clientOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const clientOrderSchema = z.object({
  clientId: z.string(),
  items: z.array(clientOrderItemSchema).min(1, "La commande doit contenir au moins un article."),
});

type ClientOrderPayload = z.infer<typeof clientOrderSchema>;

export async function submitClientOrder(payload: ClientOrderPayload): Promise<{ success: true; orderNumber: string; totalAmount: number; } | { success: false; message?: string }> {
  const validatedPayload = clientOrderSchema.safeParse(payload);

  if (!validatedPayload.success) {
    return { success: false, message: 'Les données de la commande sont invalides.' };
  }

  const { clientId, items } = validatedPayload.data;

  try {
    if (!db) throw new Error("La connexion à la base de données a échoué.");
    
    // Fetch all necessary data from the server to build a secure order object.
    const [client, allProducts] = await Promise.all([
      getClientById(clientId),
      getProducts()
    ]);

    if (!client) {
      return { success: false, message: 'Client non trouvé.' };
    }

    const orderItems: ClientOrderItem[] = [];
    let totalAmount = 0;

    // Re-construct the order items on the server to ensure data integrity (especially price).
    for (const item of items) {
      const product = allProducts.find(p => p.id === item.productId);
      if (!product) {
        // This should not happen if the frontend is in sync, but it's a good safeguard.
        return { success: false, message: `Le produit avec l'ID ${item.productId} n'a pas été trouvé.` };
      }
      const itemTotal = product.unitPrice * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        total: itemTotal,
      });
      totalAmount += itemTotal;
    }

    // Generate a unique, sequential order number for the current year.
    const ordersCol = db.collection('clientOrders');
    const currentYear = new Date().getFullYear();
    const prefix = `CMD-${currentYear}-`;
    const q = ordersCol.where('orderNumber', '>=', prefix).where('orderNumber', '<', `CMD-${currentYear + 1}-`).orderBy('orderNumber', 'desc').limit(1);
    const latestOrderSnap = await q.get();
    
    let latestNumber = 0;
    if (!latestOrderSnap.empty) {
      const lastOrder = latestOrderSnap.docs[0].data();
      const numberPart = lastOrder.orderNumber.split('-')[2];
      if (numberPart) {
        latestNumber = parseInt(numberPart, 10);
      }
    }
    const newOrderNumber = `${prefix}${(latestNumber + 1).toString().padStart(4, '0')}`;

    // Create the final order document in the new 'clientOrders' collection.
    await ordersCol.add({
      orderNumber: newOrderNumber,
      clientId: client.id,
      clientName: client.name,
      date: new Date().toISOString(),
      items: orderItems,
      totalAmount,
      status: 'Pending', // Initial status is 'Pending'
    });

    // Revalidate the tag for client orders so the admin interface can update.
    revalidateTag('client-orders');
    
    return { success: true, orderNumber: newOrderNumber, totalAmount };

  } catch (error) {
    console.error('Failed to submit client order:', error);
    const message = error instanceof Error ? error.message : "Une erreur interne est survenue lors de la soumission de la commande.";
    return { success: false, message };
  }
}
