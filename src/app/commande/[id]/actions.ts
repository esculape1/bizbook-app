
'use server';

import { z } from 'zod';

const clientOrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
});

const clientOrderSchema = z.object({
  clientId: z.string(),
  items: z.array(clientOrderItemSchema).min(1),
});

type ClientOrderPayload = z.infer<typeof clientOrderSchema>;

export async function submitClientOrder(payload: ClientOrderPayload): Promise<{ success: boolean; message?: string }> {
  const validatedPayload = clientOrderSchema.safeParse(payload);

  if (!validatedPayload.success) {
    return { success: false, message: 'Les données de la commande sont invalides.' };
  }

  const { clientId, items } = validatedPayload.data;

  // In the next step, we will save this to a new 'clientOrders' collection in Firestore.
  // For now, we just log it to confirm the data is received correctly.
  console.log('--- NOUVELLE DEMANDE DE COMMANDE ---');
  console.log('Client ID:', clientId);
  console.log('Articles commandés:');
  console.table(items);
  console.log('------------------------------------');

  // This is a placeholder response. In the future, this will be replaced with real database logic.
  return { success: true };
}
