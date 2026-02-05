
'use server';

import { z } from 'zod';
import { addQuote, getClients, getProducts, updateQuote as updateQuoteInDB, deleteQuote as deleteQuoteFromDB, getQuoteById, addInvoice, updateProduct, getInvoices, getNextInvoiceNumber } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { QuoteItem, InvoiceItem } from '@/lib/types';
import { getSession } from '@/lib/session';
import { QUOTE_STATUS, ROLES } from '@/lib/constants';

const quoteItemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  productName: z.string(),
  quantity: z.coerce.number().min(1, "Qté > 0"),
  unitPrice: z.coerce.number().min(0, "Prix invalide"),
  reference: z.string(),
  total: z.coerce.number(),
});

const quoteSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  clientName: z.string(),
  date: z.date({ required_error: "Date requise" }),
  expiryDate: z.date({ required_error: "Date d'expiration requise" }),
  items: z.array(quoteItemSchema).min(1, "Ajoutez au moins un produit."),
  vat: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  retenue: z.coerce.number().min(0).default(0),
});

const updateQuoteSchema = quoteSchema.extend({
    status: z.nativeEnum(QUOTE_STATUS),
});


export async function createQuote(formData: unknown) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = quoteSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer la proforma.',
    };
  }
  
  try {
    const { clientId, clientName, date, expiryDate, items, vat, discount, retenue } = validatedFields.data;
    
    const products = await getProducts();

    const quoteItems: QuoteItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      return {
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      };
    });

    const subTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;
    const retenueAmount = totalAfterDiscount * (retenue / 100);
    const netAPayer = totalAmount - retenueAmount;

    await addQuote({
      clientId,
      clientName: clientName,
      date: date.toISOString(),
      expiryDate: expiryDate.toISOString(),
      items: quoteItems,
      subTotal,
      vat,
      vatAmount,
      discount,
      discountAmount,
      totalAmount,
      retenue,
      retenueAmount,
      netAPayer,
      status: QUOTE_STATUS.DRAFT,
    });
    revalidateTag('quotes');
    return {};
  } catch (error) {
    console.error('Failed to create quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer la proforma.';
    return { message };
  }
}

export async function updateQuote(id: string, quoteNumber: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = updateQuoteSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour la proforma.',
    };
  }
  
  try {
    const { clientId, date, expiryDate, items, vat, discount, status, retenue } = validatedFields.data;
    
    const originalQuote = await getQuoteById(id);
    if (!originalQuote) {
        return { message: 'Proforma originale non trouvée.' };
    }

    const clients = await getClients();
    const products = await getProducts();

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      return { message: 'Client non trouvé.' };
    }

    // Pre-emptive stock check if status is changing to 'Accepted'
    if (status === QUOTE_STATUS.ACCEPTED && originalQuote.status !== QUOTE_STATUS.ACCEPTED) {
      for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          if (!product) {
              return { message: `Produit avec ID ${item.productId} non trouvé.` };
          }
          if (product.quantityInStock < item.quantity) {
              return { message: `Impossible d'accepter la proforma. Stock insuffisant pour ${product.name}. Stock: ${product.quantityInStock}, Demandé: ${item.quantity}.` };
          }
      }
    }

    const quoteItems: QuoteItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      return {
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice, 
        total: item.quantity * item.unitPrice,
      };
    });

    const subTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;
    const retenueAmount = totalAfterDiscount * (retenue / 100);
    const netAPayer = totalAmount - retenueAmount;

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
      retenue,
      retenueAmount,
      netAPayer,
      status,
    });

    // Create invoice if status changed to 'Accepted'
    if (status === QUOTE_STATUS.ACCEPTED && originalQuote.status !== QUOTE_STATUS.ACCEPTED) {
      const invoiceItems: InvoiceItem[] = quoteItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          reference: item.reference,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          purchasePrice: product?.purchasePrice ?? 0,
        };
      });
      
      const newInvoiceNumber = await getNextInvoiceNumber();

      // Create invoice
      await addInvoice({
        invoiceNumber: newInvoiceNumber,
        clientId,
        clientName: client.name,
        date: new Date().toISOString(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        items: invoiceItems,
        subTotal,
        vat,
        vatAmount,
        discount,
        discountAmount,
        totalAmount,
        retenue,
        retenueAmount,
        netAPayer,
        status: 'Unpaid',
        amountPaid: 0,
        payments: [],
      });

      // Update stock
      for (const item of invoiceItems) {
        const product = products.find(p => p.id === item.productId)!;
        const newStock = product.quantityInStock - item.quantity;
        await updateProduct(item.productId, { quantityInStock: newStock });
      }

      revalidateTag('invoices');
      revalidateTag('products');
      revalidateTag('dashboard-stats');
    }

    revalidateTag('quotes');
    return {};
  } catch (error) {
    console.error('Failed to update quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour la proforma.';
    return { message };
  }
}


export async function deleteQuote(id: string) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }
    
  try {
    await deleteQuoteFromDB(id);
    revalidateTag('quotes');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de supprimer la proforma.';
    return {
      success: false,
      message,
    };
  }
}
