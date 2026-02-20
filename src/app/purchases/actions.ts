
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import {
  addPurchase,
  getSuppliers,
  getProducts,
  updatePurchase as updatePurchaseInDB,
  getPurchaseById,
  updateProduct,
} from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { PurchaseItem, Purchase, Product } from '@/lib/types';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  productName: z.string(),
  reference: z.string(),
  quantity: z.coerce.number().min(1, "Qté > 0"),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  date: z.date({ required_error: "Date requise" }),
  items: z.array(purchaseItemSchema).min(1, "Ajoutez au moins un produit."),
  premierVersement: z.coerce.number().min(0).default(0),
  deuxiemeVersement: z.coerce.number().min(0).default(0),
  transportCost: z.coerce.number().min(0).default(0),
  otherFees: z.coerce.number().min(0).default(0),
});

export async function createPurchase(formData: unknown) {
  const session = await getSession();
  if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = purchaseSchema.safeParse(formData);
  if (!validatedFields.success) return { message: 'Champs invalides.' };

  try {
    const { supplierId, date, items, transportCost, otherFees, premierVersement, deuxiemeVersement } = validatedFields.data;
    const suppliers = await getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return { message: 'Fournisseur non trouvé.' };
    
    const purchaseItems: PurchaseItem[] = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        reference: item.reference,
        quantity: item.quantity,
    }));

    const totalAmount = premierVersement + deuxiemeVersement + transportCost + otherFees;

    // Le purchaseNumber est généré automatiquement par addPurchase dans lib/data.ts
    await addPurchase({
        supplierId,
        supplierName: supplier.name,
        date: date.toISOString(),
        items: purchaseItems,
        premierVersement,
        deuxiemeVersement,
        transportCost,
        otherFees,
        totalAmount,
        status: 'Pending',
    });

    revalidateTag('purchases');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to create purchase:', error);
    return { message: 'Erreur technique lors de la création de l\'achat.' };
  }
}

export async function updatePurchase(id: string, purchaseNumber: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = purchaseSchema.safeParse(formData);
  if (!validatedFields.success) return { message: 'Champs invalides.' };

  try {
    const { supplierId, date, items, transportCost, otherFees, premierVersement, deuxiemeVersement } = validatedFields.data;
    const suppliers = await getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return { message: 'Fournisseur non trouvé.' };

    const purchaseItems: PurchaseItem[] = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        reference: item.reference,
        quantity: item.quantity,
    }));

    const totalAmount = premierVersement + deuxiemeVersement + transportCost + otherFees;

    await updatePurchaseInDB(id, {
        purchaseNumber,
        supplierId,
        supplierName: supplier.name,
        date: date.toISOString(),
        items: purchaseItems,
        premierVersement,
        deuxiemeVersement,
        transportCost,
        otherFees,
        totalAmount,
    });

    revalidateTag('purchases');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to update purchase:', error);
    return { message: 'Erreur technique lors de la mise à jour.' };
  }
}

export async function receivePurchase(id: string) {
    const session = await getSession();
    if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
      return { message: "Action non autorisée." };
    }
  
    try {
      const purchase = await getPurchaseById(id);
      if (!purchase || purchase.status === 'Received') return { message: 'Invalide.' };
  
      const products = await getProducts();
      for (const item of purchase.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = product.quantityInStock + item.quantity;
          await updateProduct(item.productId, { quantityInStock: newStock });
        }
      }

      await updatePurchaseInDB(id, { status: 'Received' });
      revalidateTag('purchases');
      revalidateTag('products');
      revalidateTag('dashboard-stats');
      return { success: true };
    } catch (error) {
      console.error('Failed to receive purchase:', error);
      return { success: false, message: "Erreur lors de la réception." };
    }
}

export async function cancelPurchase(id: string) {
  const session = await getSession();
  if (session?.role !== ROLES.ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
    return { message: "Action non autorisée." };
  }

  try {
    const purchase = await getPurchaseById(id);
    if (!purchase) return { message: "Achat non trouvé." };

    // Si l'achat a été réceptionné, il faut retirer les quantités du stock
    if (purchase.status === 'Received') {
        const products = await getProducts();
        for (const item of purchase.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const newStock = Math.max(0, product.quantityInStock - item.quantity);
                await updateProduct(item.productId, { quantityInStock: newStock });
            }
        }
    }

    await updatePurchaseInDB(id, { status: 'Cancelled' });
    revalidateTag('purchases');
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel purchase:', error);
    return { success: false, message: "Erreur technique lors de l'annulation." };
  }
}
