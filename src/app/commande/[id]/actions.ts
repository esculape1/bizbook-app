'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getClientById, getProducts } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { ClientOrderItem } from '@/lib/types';
import { redirect } from 'next/navigation';

const clientOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const clientOrderSchema = z.object({
  clientId: z.string(),
  items: z.array(clientOrderItemSchema).min(1, "La commande doit contenir au moins un article."),
});

type ClientOrderPayload = z.infer<typeof clientOrderSchema>;

export async function submitClientOrder(payload: ClientOrderPayload): Promise<{ message: string } | void> {
  const validatedPayload = clientOrderSchema.safeParse(payload);

  if (!validatedPayload.success) {
    return { message: 'Les données de la commande sont invalides.' };
  }

  const { clientId, items } = validatedPayload.data;
  let newOrderId: string;

  try {
    const supabase = createClient();
    
    const [client, allProducts] = await Promise.all([
      getClientById(clientId),
      getProducts()
    ]);

    if (!client) {
      return { message: 'Client non trouvé.' };
    }

    const orderItems: ClientOrderItem[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = allProducts.find(p => p.id === item.productId);
      if (!product) {
        return { message: `Le produit avec l'ID ${item.productId} n'a pas été trouvé.` };
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
    const currentYear = new Date().getFullYear();
    const prefix = `CMD-${currentYear}-`;

    const { data: latestOrders } = await supabase
      .from('client_orders')
      .select('order_number')
      .gte('order_number', prefix)
      .lt('order_number', `CMD-${currentYear + 1}-`)
      .order('order_number', { ascending: false })
      .limit(1);

    let latestNumber = 0;
    if (latestOrders && latestOrders.length > 0) {
      const numberPart = latestOrders[0].order_number.split('-')[2];
      if (numberPart) {
        latestNumber = parseInt(numberPart, 10);
      }
    }
    const newOrderNumber = `${prefix}${(latestNumber + 1).toString().padStart(4, '0')}`;

    // Create the order in client_orders table
    const { data: newOrder, error } = await supabase
      .from('client_orders')
      .insert({
        order_number: newOrderNumber,
        client_id: client.id,
        client_name: client.name,
        date: new Date().toISOString(),
        items: orderItems,
        total_amount: totalAmount,
        status: 'Pending',
      })
      .select('id')
      .single();

    if (error) throw error;
    newOrderId = newOrder.id;

    revalidateTag('client-orders');
    
  } catch (error) {
    console.error('Failed to submit client order:', error);
    const message = error instanceof Error ? error.message : "Une erreur interne est survenue lors de la soumission de la commande.";
    return { message };
  }

  redirect(`/commande/succes/${newOrderId}`);
}
