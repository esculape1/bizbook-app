
'use server';

import { z } from 'zod';
import { addQuote, getClients, getProducts } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { QuoteItem } from '@/lib/types';

const quoteItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
});

const quoteSchema = z.object({
  clientId: z.string(),
  date: z.date(),
  expiryDate: z.date(),
  items: z.array(quoteItemSchema),
  vat: z.coerce.number(),
  discount: z.coerce.number(),
});

export async function createQuote(formData: unknown) {
  const validatedFields = quoteSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer le devis.',
    };
  }
  
  try {
    const { clientId, date, expiryDate, items, vat, discount } = validatedFields.data;
    
    const clients = await getClients();
    const products = await getProducts();

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      return { message: 'Client non trouvé.' };
    }

    const quoteItems: QuoteItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      return {
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        total: item.quantity * product.unitPrice,
      };
    });

    const subTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;

    await addQuote({
      clientId,
      clientName: client.name,
      date: date.toISOString(),
      expiryDate: expiryDate.toISOString(),
      items: quoteItems,
      subTotal,
      vat,
      vatAmount,
      discount,
      discountAmount,
      totalAmount,
      status: 'Draft',
    });
    revalidatePath('/devis');
    return {};
  } catch (error) {
    console.error('Failed to create quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer le devis.';
    return { message };
  }
}
