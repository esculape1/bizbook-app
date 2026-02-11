'use server';

import { z } from 'zod';
import {
  addPurchase, getSuppliers, getProducts, updatePurchase as updatePurchaseInDB,
  getPurchaseById, updateProduct,
} from '@/lib/data';
import { revalidateTag } from 'next/cache';
import type { PurchaseItem, Purchase } from '@/lib/types';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

const purchaseItemSchema = z.object({
  productId: z.string().min(1), productName: z.string(), reference: z.string(),
  quantity: z.coerce.number().min(1),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1), date: z.date({ required_error: "Date requise" }),
  items: z.array(purchaseItemSchema).min(1), premierVersement: z.coerce.number().min(0).default(0),
  deuxiemeVersement: z.coerce.number().min(0).default(0), transportCost: z.coerce.number().min(0).default(0),
  otherFees: z.coerce.number().min(0).default(0),
});

export async function createPurchase(formData: unknown) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const orgId = session.organizationId;
  const validatedFields = purchaseSchema.safeParse(formData);
  if (!validatedFields.success) return { message: 'Champs invalides.' };

  try {
    const { supplierId, date, items, transportCost, otherFees, premierVersement, deuxiemeVersement } = validatedFields.data;
    const suppliers = await getSuppliers(orgId);
    const products = await getProducts(orgId);
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return { message: 'Fournisseur non trouve.' };

    const purchaseItems: PurchaseItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouve: ${item.productId}`);
      return { productId: item.productId, productName: product.name, reference: product.reference, quantity: item.quantity };
    });

    const totalAmount = premierVersement + deuxiemeVersement + transportCost + otherFees;
    await addPurchase({
      purchaseNumber: '', supplierId, supplierName: supplier.name, date: date.toISOString(),
      items: purchaseItems, premierVersement, deuxiemeVersement, transportCost, otherFees,
      totalAmount, status: 'Pending',
    }, orgId);

    revalidateTag('purchases'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to create purchase:', error);
    return { message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}

export async function updatePurchase(id: string, purchaseNumber: string, formData: unknown) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const orgId = session.organizationId;
  const validatedFields = purchaseSchema.safeParse(formData);
  if (!validatedFields.success) return { message: 'Champs invalides.' };

  try {
    const { supplierId, date, items, premierVersement, deuxiemeVersement, transportCost, otherFees } = validatedFields.data;
    const [originalPurchase, suppliers] = await Promise.all([getPurchaseById(id), getSuppliers(orgId)]);
    if (!originalPurchase) return { message: 'Achat non trouve.' };
    if (originalPurchase.status === 'Cancelled') return { message: 'Achats annules non modifiables.' };

    const supplier = suppliers.find(c => c.id === supplierId);
    if (!supplier) return { message: 'Fournisseur non trouve.' };

    const products = await getProducts(orgId);
    const purchaseItems: PurchaseItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Produit non trouve: ${item.productId}`);
      return { productId: item.productId, productName: product.name, reference: product.reference, quantity: item.quantity };
    });

    const totalAmount = premierVersement + deuxiemeVersement + transportCost + otherFees;
    await updatePurchaseInDB(id, {
      purchaseNumber, supplierId, supplierName: supplier.name, date: date.toISOString(),
      items: purchaseItems, premierVersement, deuxiemeVersement, transportCost, otherFees, totalAmount,
    });

    revalidateTag('purchases');
    return {};
  } catch (error) {
    console.error('Failed to update purchase:', error);
    return { message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}

export async function receivePurchase(id: string) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const orgId = session.organizationId;

  try {
    const purchase = await getPurchaseById(id);
    if (!purchase) return { message: 'Achat non trouve.' };
    if (purchase.status === 'Received') return { message: 'Deja receptionne.' };
    if (purchase.status === 'Cancelled') return { message: 'Annule, non receptionnable.' };

    const products = await getProducts(orgId);
    await updatePurchaseInDB(id, { status: 'Received' });

    const totalItemsInPurchase = purchase.items.reduce((sum, i) => sum + i.quantity, 0);
    for (const item of purchase.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newQuantity = product.quantityInStock + item.quantity;
        const updateData: Partial<{ quantityInStock: number; purchasePrice: number }> = { quantityInStock: newQuantity };
        if (totalItemsInPurchase > 0) {
          const landedCost = purchase.totalAmount / totalItemsInPurchase;
          const newItemsValue = landedCost * item.quantity;
          const oldStockValue = (product.purchasePrice || 0) * product.quantityInStock;
          const newTotalStock = product.quantityInStock + item.quantity;
          if (newTotalStock > 0) {
            const newAvgPrice = (oldStockValue + newItemsValue) / newTotalStock;
            if (isFinite(newAvgPrice) && newAvgPrice > 0) updateData.purchasePrice = newAvgPrice;
          }
        }
        await updateProduct(item.productId, updateData);
      }
    }

    revalidateTag('purchases'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error('Failed to receive purchase:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}

export async function cancelPurchase(id: string) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  try {
    const purchaseToCancel = await getPurchaseById(id);
    if (!purchaseToCancel) throw new Error("Achat non trouve.");
    if (purchaseToCancel.status === 'Cancelled') return { success: false, message: 'Deja annule.' };
    await updatePurchaseInDB(id, { status: 'Cancelled' });
    revalidateTag('purchases'); revalidateTag('products'); revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel purchase:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Erreur de base de donnees.' };
  }
}
