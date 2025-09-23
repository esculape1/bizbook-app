
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
import { revalidatePath } from 'next/cache';
import type { InvoiceItem, Invoice, Payment } from '@/lib/types';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/session';

const invoiceItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(), // This is the manually entered price from the form
  purchasePrice: z.coerce.number(), // For validation
  total: z.coerce.number(),
});

const createInvoiceSchema = z.object({
  invoiceNumberSuffix: z.string().min(1, { message: "Le numéro de facture est requis." }),
  clientId: z.string(),
  clientName: z.string(),
  date: z.date(),
  dueDate: z.date(),
  items: z.array(invoiceItemSchema),
  vat: z.coerce.number(),
  discount: z.coerce.number(),
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
    const { invoiceNumberSuffix, clientId, clientName, date, dueDate, items, vat, discount } = validatedFields.data;
    
    const [products, allInvoices] = await Promise.all([
        getProducts(),
        getInvoices(),
    ]);

    const currentYear = new Date().getFullYear();
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
        unitPrice: item.unitPrice, // CRITICAL FIX: Use the user-provided price from the form
        total: item.quantity * item.unitPrice, // Recalculate total with the correct price
      });
    }


    const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;


    // 1. Create invoice
    await addInvoice({
      invoiceNumber: invoiceNumber, // Use combined invoice number
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

    // 3. Revalidate paths
    revalidatePath('/invoices');
    revalidatePath('/'); // For dashboard
    revalidatePath('/products');
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
    const { clientId, date, dueDate, items, vat, discount, invoiceNumber } = validatedFields.data;
    
    const originalInvoice = await getInvoiceById(id);
    if (!originalInvoice) {
        return { message: 'Facture originale non trouvée.' };
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
    }

    await updateInvoiceInDB(id, invoiceData);

    for (const productId in productsToUpdate) {
        const originalProduct = products.find(p => p.id === productId)!;
        if (originalProduct.quantityInStock !== productsToUpdate[productId]) {
              await updateProduct(productId, { quantityInStock: productsToUpdate[productId] });
        }
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    revalidatePath('/');
    revalidatePath('/products');
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
    
    // Restore stock if the invoice is not already cancelled or paid
    if (invoiceToCancel.status !== 'Cancelled') {
      const products = await getProducts();
      for (const item of invoiceToCancel.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = product.quantityInStock + item.quantity;
          await updateProduct(item.productId, { quantityInStock: newStock });
        }
      }
    }
    
    // Update invoice status to 'Cancelled' and reset paid amount
    await updateInvoiceInDB(id, { status: 'Cancelled', amountPaid: 0 });

    revalidatePath('/invoices');
    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/invoices/${id}`);
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

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif."),
  date: z.date(),
  method: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre']),
  notes: z.string().optional(),
});

export async function recordPayment(invoiceId: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = paymentSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible d\'enregistrer le paiement.',
    };
  }

  try {
    const { amount, date, method, notes } = validatedFields.data;
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return { message: 'Facture non trouvée.' };
    }

    const newPayment: Payment = {
      id: randomUUID(),
      date: date.toISOString(),
      amount,
      method,
      notes: notes || '',
    };

    const existingPayments = invoice.payments || [];
    const updatedPayments = [...existingPayments, newPayment];
    const newAmountPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus: Invoice['status'] = 'Partially Paid';
    if (newAmountPaid >= invoice.totalAmount) {
      newStatus = 'Paid';
    } else if (newAmountPaid <= 0) {
      newStatus = 'Unpaid';
    }

    await updateInvoiceInDB(invoiceId, {
      amountPaid: newAmountPaid,
      payments: updatedPayments,
      status: newStatus,
    });
    
    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/'); // Dashboard
    return {}; // Success

  } catch (error) {
    console.error('Failed to record payment:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible d\'enregistrer le paiement.';
    return { message };
  }
}
