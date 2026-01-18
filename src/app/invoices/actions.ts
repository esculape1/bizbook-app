
'use server';

import { z } from 'zod';
import {
  addInvoice,
  getClients,
  getProducts,
  updateInvoice as updateInvoiceInDB,
  getInvoiceById,
  updateProduct,
  getInvoices,
} from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { InvoiceItem, Invoice } from '@/lib/types';
import { getSession } from '@/lib/session';

const invoiceItemSchemaForCreate = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  purchasePrice: z.coerce.number(),
  total: z.coerce.number(),
});

const createInvoiceSchema = z.object({
  invoiceNumberSuffix: z.string().min(1, { message: "Le numéro de facture est requis." }),
  clientId: z.string(),
  clientName: z.string(),
  date: z.date(),
  dueDate: z.date(),
  items: z.array(invoiceItemSchemaForCreate),
  vat: z.coerce.number(),
  discount: z.coerce.number(),
  retenue: z.coerce.number().min(0).default(0),
});

const updateInvoiceItemSchema = z.object({
    productId: z.string(),
    productName: z.string(),
    reference: z.string(),
    quantity: z.coerce.number(),
    unitPrice: z.coerce.number(),
    total: z.coerce.number(),
    purchasePrice: z.coerce.number(),
});

const updateInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Le numéro de facture est requis."),
    clientId: z.string(),
    date: z.date(),
    dueDate: z.date(),
    items: z.array(updateInvoiceItemSchema),
    vat: z.coerce.number(),
    discount: z.coerce.number(),
    retenue: z.coerce.number().min(0).default(0),
});


export async function createInvoice(formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = createInvoiceSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Certains champs sont invalides. Impossible de créer la facture.',
    };
  }

  try {
    const { invoiceNumberSuffix, clientId, clientName, date, dueDate, items, vat, discount, retenue } = validatedFields.data;
    
    const [products, allInvoices] = await Promise.all([
        getProducts(),
        getInvoices(),
    ]);

    const currentYear = 2026;
    const invoiceNumber = `FACT-${currentYear}-${invoiceNumberSuffix}`;

    // Check for duplicate invoice number
    if (allInvoices.some(inv => inv.invoiceNumber === invoiceNumber)) {
        return { message: `Le numéro de facture ${invoiceNumber} existe déjà.` };
    }
    
    const invoiceItems: InvoiceItem[] = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      
      if (product.quantityInStock < item.quantity) {
          return {
              message: `Stock insuffisant pour ${product.name}. Stock actuel: ${product.quantityInStock}, demandé: ${item.quantity}.`,
          };
      }
      
      if (item.unitPrice < (product.purchasePrice ?? 0)) {
        return {
          message: `Le prix de vente pour ${product.name} ne peut être inférieur au prix d'achat.`,
        };
      }

      invoiceItems.push({
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      });
    }


    const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;
    const retenueAmount = totalAfterDiscount * (retenue / 100);
    const netAPayer = totalAmount - retenueAmount;


    // 1. Create invoice
    await addInvoice({
      invoiceNumber: invoiceNumber,
      clientId,
      clientName: clientName,
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
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

    // 2. Update stock
    for (const item of invoiceItems) {
        const product = products.find(p => p.id === item.productId)!;
        const newStock = product.quantityInStock - item.quantity;
        await updateProduct(item.productId, { quantityInStock: newStock });
    }

    // 3. Revalidate tags
    revalidateTag('invoices');
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to create invoice:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer la facture.';
    return { message };
  }
}

export async function updateInvoice(id: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = updateInvoiceSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour la facture.',
    };
  }

  try {
    const { clientId, date, dueDate, items, vat, discount, invoiceNumber, retenue } = validatedFields.data;
    
    const originalInvoice = await getInvoiceById(id);
    if (!originalInvoice) {
        return { message: 'Facture originale non trouvée.' };
    }
    if (originalInvoice.status === 'Paid' || originalInvoice.status === 'Cancelled') {
        return { message: 'Les factures payées ou annulées ne peuvent pas être modifiées.' };
    }

    const clients = await getClients();
    const products = await getProducts();

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      return { message: 'Client non trouvé.' };
    }

    // --- Stock management ---
    const productsToUpdate: { [productId: string]: number } = {};
    for (const product of products) {
        productsToUpdate[product.id] = product.quantityInStock;
    }
    for (const item of originalInvoice.items) {
        if (productsToUpdate[item.productId] !== undefined) {
            productsToUpdate[item.productId] += item.quantity;
        }
    }
    for (const item of items) {
        const availableStock = productsToUpdate[item.productId];
        const product = products.find(p => p.id === item.productId);
        if (availableStock === undefined || availableStock < item.quantity) {
            return {
                message: `Stock insuffisant pour ${product?.name}. Stock disponible: ${availableStock ?? 0}, demandé: ${item.quantity}.`
            }
        }
        productsToUpdate[item.productId] -= item.quantity;
    }
    
    const invoiceItems: InvoiceItem[] = [];
    for (const item of items) {
        const product = products.find(p => p.id === item.productId)!;
        
        if (item.unitPrice < (product.purchasePrice ?? 0)) {
            throw new Error(`Le prix de vente pour ${product.name} ne peut être inférieur au prix d'achat.`);
        }
        
        invoiceItems.push({
            productId: item.productId,
            productName: product.name,
            reference: product.reference,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
        });
    }

    const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;
    const retenueAmount = totalAfterDiscount * (retenue / 100);
    const netAPayer = totalAmount - retenueAmount;

    // Retain original status, as it's not editable from this form anymore
    const status = originalInvoice.status;

    const invoiceData: Partial<Omit<Invoice, 'id'>> = {
      invoiceNumber,
      clientId,
      clientName: client.name,
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
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
    }

    await updateInvoiceInDB(id, invoiceData);

    for (const productId in productsToUpdate) {
        const originalProduct = products.find(p => p.id === productId)!;
        if (originalProduct.quantityInStock !== productsToUpdate[productId]) {
              await updateProduct(productId, { quantityInStock: productsToUpdate[productId] });
        }
    }

    revalidateTag('invoices');
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to update invoice:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour la facture.';
    return { message };
  }
}

export async function cancelInvoice(id: string) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  try {
    const invoiceToCancel = await getInvoiceById(id);
    if (!invoiceToCancel) {
      throw new Error("Facture non trouvée pour l'annulation.");
    }

    if (invoiceToCancel.status === 'Cancelled') {
        return { success: false, message: 'Cette facture est déjà annulée.' };
    }
    
    // Restore stock only if the invoice was not already cancelled
    const products = await getProducts();
    for (const item of invoiceToCancel.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.quantityInStock + item.quantity;
        await updateProduct(item.productId, { quantityInStock: newStock });
      }
    }
    
    // Update invoice status to 'Cancelled' and reset paid amount
    await updateInvoiceInDB(id, { status: 'Cancelled' });

    revalidateTag('invoices');
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error("Échec de l'annulation de la facture:", error);
    const message = error instanceof Error ? error.message : "Erreur de la base de données: Impossible d'annuler la facture.";
    return {
      success: false,
      message,
    };
  }
}
