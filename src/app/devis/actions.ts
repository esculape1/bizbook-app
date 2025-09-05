
'use server';

import { z } from 'zod';
import { addQuote, getClients, getProducts, updateQuote as updateQuoteInDB, deleteQuote as deleteQuoteFromDB, getQuoteById, addInvoice, updateProduct, getInvoices } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Quote, QuoteItem, InvoiceItem } from '@/lib/types';
import { getSession } from '@/lib/session';

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
  date: z.date({ required_error: "Date requise" }),
  expiryDate: z.date({ required_error: "Date d'expiration requise" }),
  items: z.array(quoteItemSchema).min(1, "Ajoutez au moins un produit."),
  vat: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});

const updateQuoteSchema = quoteSchema.extend({
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined']),
});


export async function createQuote(formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = quoteSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer la proforma.',
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
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
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
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer la proforma.';
    return { message };
  }
}

export async function updateQuote(id: string, quoteNumber: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = updateQuoteSchema.safeParse(formData);

  if (!validatedFields.success) {
      console.log(validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour la proforma.',
    };
  }
  
  try {
    const { clientId, date, expiryDate, items, vat, discount, status } = validatedFields.data;
    
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
    if (status === 'Accepted' && originalQuote.status !== 'Accepted') {
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

    // The unitPrice from the form (item.unitPrice) is now correctly used.
    const quoteItems: QuoteItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      return {
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice, // Use the price from the submitted form data
        total: item.quantity * item.unitPrice, // Recalculate total with the submitted price
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

    // Create invoice if status changed to 'Accepted'
    if (status === 'Accepted' && originalQuote.status !== 'Accepted') {
      // Use the unit prices from the accepted quote, not the default product prices
      const invoiceItems: InvoiceItem[] = quoteItems.map(item => ({ 
          productId: item.productId,
          productName: item.productName,
          reference: item.reference,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Important: use the price from the quote
          total: item.total,
      }));
      
      // Get the next sequential invoice number
      const allInvoices = await getInvoices();
      const currentYear = new Date().getFullYear().toString();
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
      
      const newInvoiceNumber = `${yearPrefix}${newInvoiceSuffix.toString().padStart(3, '0')}`;

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

      revalidatePath('/invoices');
      revalidatePath('/products');
      revalidatePath('/');
    }


    revalidatePath('/devis');
    return {};
  } catch (error) {
    console.error('Failed to update quote:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour la proforma.';
    return { message };
  }
}


export async function deleteQuote(id: string) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }
    
  try {
    await deleteQuoteFromDB(id);
    revalidatePath('/devis');
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
