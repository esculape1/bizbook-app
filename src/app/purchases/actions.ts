
'use server';

import { z } from 'zod';
import {
  addPurchase,
  getSuppliers,
  getProducts,
  updatePurchase as updatePurchaseInDB,
  getPurchaseById,
  updateProduct,
} from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { PurchaseItem, Purchase } from '@/lib/types';
import { getSession } from '@/lib/session';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  productName: z.string(),
  reference: z.string(),
  quantity: z.coerce.number().min(1, "Qté > 0"),
  purchasePrice: z.coerce.number().min(0, "Prix invalide"),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  date: z.date({ required_error: "Date requise" }),
  items: z.array(purchaseItemSchema).min(1, "Ajoutez au moins un produit."),
});

const updatePurchaseSchema = purchaseSchema.extend({
  status: z.enum(['Pending', 'Received', 'Cancelled']),
});

export async function createPurchase(formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = purchaseSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: 'Champs invalides. Impossible de créer l\'achat.' };
  }

  try {
    const { supplierId, date, items } = validatedFields.data;
    
    const suppliers = await getSuppliers();
    const products = await getProducts();

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
      return { message: 'Fournisseur non trouvé.' };
    }
    
    const purchaseItems: PurchaseItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      return {
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        total: item.quantity * item.purchasePrice,
      };
    });

    const subTotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);

    await addPurchase({
      supplierId,
      supplierName: supplier.name,
      date: date.toISOString(),
      items: purchaseItems,
      subTotal,
      totalAmount: subTotal,
      status: 'Pending',
    });

    revalidatePath('/purchases');
    revalidatePath('/products');
    return {};
  } catch (error) {
    console.error('Failed to create purchase:', error);
    const message = error instanceof Error ? error.message : 'Erreur DB: Impossible de créer l\'achat.';
    return { message };
  }
}

export async function updatePurchase(id: string, purchaseNumber: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = updatePurchaseSchema.safeParse(formData);

  if (!validatedFields.success) {
    return { message: 'Champs invalides. Impossible de mettre à jour l\'achat.' };
  }

  try {
    const { supplierId, date, items, status } = validatedFields.data;
    
    const originalPurchase = await getPurchaseById(id);
    if (!originalPurchase) {
      return { message: 'Achat original non trouvé.' };
    }

    const suppliers = await getSuppliers();
    const products = await getProducts();
    const supplier = suppliers.find(c => c.id === supplierId);
    if (!supplier) {
      return { message: 'Fournisseur non trouvé.' };
    }

    const purchaseItems: PurchaseItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouvé: ${item.productId}`);
      return {
        productId: item.productId,
        productName: product.name,
        reference: product.reference,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        total: item.quantity * item.purchasePrice,
      };
    });

    const subTotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);

    const purchaseData: Omit<Purchase, 'id'> = {
      purchaseNumber,
      supplierId,
      supplierName: supplier.name,
      date: date.toISOString(),
      items: purchaseItems,
      subTotal,
      totalAmount: subTotal,
      status,
    };

    await updatePurchaseInDB(id, purchaseData);

    // --- Stock Management ---
    const stockWasUpdated = originalPurchase.status === 'Received';
    const stockWillBeUpdated = status === 'Received';

    if (stockWasUpdated && !stockWillBeUpdated) { // Reverting stock
      for (const item of originalPurchase.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateProduct(item.productId, { quantityInStock: product.quantityInStock - item.quantity });
        }
      }
    } else if (!stockWasUpdated && stockWillBeUpdated) { // Applying stock
      for (const item of purchaseItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateProduct(item.productId, { quantityInStock: product.quantityInStock + item.quantity });
        }
      }
    } else if (stockWasUpdated && stockWillBeUpdated) { // Adjusting stock
      for (const newItem of purchaseItems) {
        const originalItem = originalPurchase.items.find(i => i.productId === newItem.productId);
        const quantityDiff = newItem.quantity - (originalItem?.quantity || 0);
        
        const product = products.find(p => p.id === newItem.productId);
        if (product) {
          await updateProduct(newItem.productId, { quantityInStock: product.quantityInStock + quantityDiff });
        }
      }
    }

    revalidatePath('/purchases');
    revalidatePath('/products');
    revalidatePath('/');
    return {};
  } catch (error) {
    console.error('Failed to update purchase:', error);
    const message = error instanceof Error ? error.message : 'Erreur DB: Impossible de mettre à jour l\'achat.';
    return { message };
  }
}

export async function cancelPurchase(id: string) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

  try {
    const purchaseToCancel = await getPurchaseById(id);
    if (!purchaseToCancel) {
      throw new Error("Achat non trouvé pour l'annulation.");
    }
    
    if (purchaseToCancel.status === 'Received') {
      const products = await getProducts();
      for (const item of purchaseToCancel.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = product.quantityInStock - item.quantity;
          await updateProduct(item.productId, { quantityInStock: newStock });
        }
      }
    }
    
    await updatePurchaseInDB(id, { status: 'Cancelled' });

    revalidatePath('/purchases');
    revalidatePath('/products');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Échec de l'annulation de l'achat:", error);
    const message = error instanceof Error ? error.message : "Erreur DB: Impossible d'annuler l'achat.";
    return { success: false, message };
  }
}
