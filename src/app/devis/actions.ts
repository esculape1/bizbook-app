
'use server';

import { z } from 'zod';
import { addQuote, getClients, getProducts, updateQuote as updateQuoteInDB, deleteQuote as deleteQuoteFromDB, getQuoteById } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Quote, QuoteItem } from '@/lib/types';
import { getSession } from '@/lib/session';

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

const updateQuoteSchema = quoteSchema.extend({
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined']),
});


export async function createQuote(formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

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

export async function updateQuote(id: string, quoteNumber: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = updateQuoteSchema.safeParse(formData);

  if (!validatedFields.success) {
      console.log(validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour le devis.',
    };
  }
  
  try {
    const { clientId, date, expiryDate, items, vat, discount, status } = validatedFields.data;
    
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

    await updateQuoteInDB(id, {
      quoteNumber,
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
      status,
    });
    revalidatePath('/devis');
    return {};
  } catch (error) {
    console.error('Failed to update quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour le devis.';
    return { message };
  }
}


export async function deleteQuote(id: string) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }
    
  try {
    await deleteQuoteFromDB(id);
    revalidatePath('/devis');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de supprimer le devis.';
    return {
      success: false,
      message,
    };
  }
}
