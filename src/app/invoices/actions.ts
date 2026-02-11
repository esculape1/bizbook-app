'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  addInvoice, getClients, getProducts, updateInvoice as updateInvoiceInDB,
  getInvoiceById, updateProduct, getNextInvoiceNumber,
} from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { InvoiceItem, Invoice } from '@/lib/types';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

const invoiceItemSchemaForCreate = z.object({
  productId: z.string(), productName: z.string(), quantity: z.coerce.number(),
  unitPrice: z.coerce.number(), purchasePrice: z.coerce.number(), total: z.coerce.number(),
});

const createInvoiceSchema = z.object({
  invoiceNumberSuffix: z.string().min(1, { message: "Le numero de facture est requis." }),
  clientId: z.string(), clientName: z.string(), date: z.date(), dueDate: z.date(),
  items: z.array(invoiceItemSchemaForCreate), vat: z.coerce.number(),
  discount: z.coerce.number(), retenue: z.coerce.number().min(0).default(0),
});

const updateInvoiceItemSchema = z.object({
  productId: z.string(), productName: z.string(), reference: z.string(),
  quantity: z.coerce.number(), unitPrice: z.coerce.number(), total: z.coerce.number(),
  purchasePrice: z.coerce.number(),
});

const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1), clientId: z.string(), date: z.date(), dueDate: z.date(),
  items: z.array(updateInvoiceItemSchema), vat: z.coerce.number(),
  discount: z.coerce.number(), retenue: z.coerce.number().min(0).default(0),
});

export async function createInvoice(formData: unknown) {
  const session = await getSession();
  if (!session) return { message: "Action non autorisee." };
  const orgId = session.organizationId;

  const validatedFields = createInvoiceSchema.safeParse(formData);
  if (!validatedFields.success) return { message: 'Champs invalides.' };

  try {
    const { invoiceNumberSuffix, clientId, clientName, date, dueDate, items, vat, discount, retenue } = validatedFields.data;
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `FACT-${currentYear}-${invoiceNumberSuffix}`;

    const admin = createAdminClient();
    const { data: existingInvoice } = await admin
      .from('invoices').select('id').eq('invoice_number', invoiceNumber)
      .eq('organization_id', orgId).limit(1).maybeSingle();
    if (existingInvoice) return { message: `Le numero ${invoiceNumber} existe deja.` };

    const products = await getProducts(orgId);
    const invoiceItems: InvoiceItem[] = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouve: ${item.productId}`);
      if (product.quantityInStock < item.quantity) {
        return { message: `Stock insuffisant pour ${product.name}. Stock: ${product.quantityInStock}, demande: ${item.quantity}.` };
      }
      invoiceItems.push({
        productId: item.productId, productName: product.name, reference: product.reference,
        quantity: item.quantity, unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice, purchasePrice: product.purchasePrice ?? 0,
      });
    }

    const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;
    const retenueAmount = totalAfterDiscount * (retenue / 100);
    const netAPayer = totalAmount - retenueAmount;

    await addInvoice({
      invoiceNumber, clientId, clientName, date: date.toISOString(), dueDate: dueDate.toISOString(),
      items: invoiceItems, subTotal, vat, vatAmount, discount, discountAmount, totalAmount,
      retenue, retenueAmount, netAPayer, status: 'Unpaid', amountPaid: 0, payments: [],
    }, orgId);

    for (const item of invoiceItems) {
      const product = products.find(p => p.id === item.productId)!;
      await updateProduct(item.productId, { quantityInStock: product.quantityInStock - item.quantity });
    }

    revalidateTag('invoices'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return { message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}

export async function updateInvoice(id: string, formData: unknown) {
  const session = await getSession();
  if (!session) return { message: "Action non autorisee." };
  const orgId = session.organizationId;

  const validatedFields = updateInvoiceSchema.safeParse(formData);
  if (!validatedFields.success) return { message: 'Champs invalides.' };

  try {
    const { clientId, date, dueDate, items, vat, discount, invoiceNumber, retenue } = validatedFields.data;
    const originalInvoice = await getInvoiceById(id);
    if (!originalInvoice) return { message: 'Facture non trouvee.' };
    if (originalInvoice.status === 'Paid' || originalInvoice.status === 'Cancelled') {
      return { message: 'Les factures payees ou annulees ne peuvent pas etre modifiees.' };
    }

    const clients = await getClients(orgId);
    const products = await getProducts(orgId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return { message: 'Client non trouve.' };

    const productsToUpdate: { [productId: string]: number } = {};
    for (const product of products) productsToUpdate[product.id] = product.quantityInStock;
    for (const item of originalInvoice.items) {
      if (productsToUpdate[item.productId] !== undefined) productsToUpdate[item.productId] += item.quantity;
    }
    for (const item of items) {
      const avail = productsToUpdate[item.productId];
      if (avail === undefined || avail < item.quantity) {
        const product = products.find(p => p.id === item.productId);
        return { message: `Stock insuffisant pour ${product?.name}. Disponible: ${avail ?? 0}, demande: ${item.quantity}.` };
      }
      productsToUpdate[item.productId] -= item.quantity;
    }

    const invoiceItems: InvoiceItem[] = items.map(item => ({
      productId: item.productId, productName: item.productName, reference: item.reference,
      quantity: item.quantity, unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice, purchasePrice: item.purchasePrice,
    }));

    const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subTotal * (discount / 100);
    const totalAfterDiscount = subTotal - discountAmount;
    const vatAmount = totalAfterDiscount * (vat / 100);
    const totalAmount = totalAfterDiscount + vatAmount;
    const retenueAmount = totalAfterDiscount * (retenue / 100);
    const netAPayer = totalAmount - retenueAmount;

    await updateInvoiceInDB(id, {
      invoiceNumber, clientId, clientName: client.name, date: date.toISOString(),
      dueDate: dueDate.toISOString(), items: invoiceItems, subTotal, vat, vatAmount,
      discount, discountAmount, totalAmount, retenue, retenueAmount, netAPayer,
    });

    for (const productId in productsToUpdate) {
      const orig = products.find(p => p.id === productId)!;
      if (orig.quantityInStock !== productsToUpdate[productId]) {
        await updateProduct(productId, { quantityInStock: productsToUpdate[productId] });
      }
    }

    revalidateTag('invoices'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return { message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}

export async function cancelInvoice(id: string) {
  const session = await getSession();
  if (!session) return { message: "Action non autorisee." };
  const orgId = session.organizationId;

  try {
    const invoiceToCancel = await getInvoiceById(id);
    if (!invoiceToCancel) throw new Error("Facture non trouvee.");
    if (invoiceToCancel.status === 'Cancelled') return { success: false, message: 'Deja annulee.' };

    const products = await getProducts(orgId);
    for (const item of invoiceToCancel.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) await updateProduct(item.productId, { quantityInStock: product.quantityInStock + item.quantity });
    }

    await updateInvoiceInDB(id, { status: 'Cancelled' });
    revalidateTag('invoices'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel invoice:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}
