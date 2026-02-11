'use server';

import { z } from 'zod';
import { addProduct, updateProduct as updateProductInDB, deleteProduct as deleteProductFromDB } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

const productSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  reference: z.string().min(1, { message: "La reference est requise." }),
  category: z.string().min(1, { message: "La categorie est requise." }),
  purchasePrice: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  quantityInStock: z.coerce.number().min(0),
  reorderPoint: z.coerce.number().min(0),
  safetyStock: z.coerce.number().min(0),
});

export async function createProduct(formData: unknown) {
  const session = await getSession();
  if (!session) return { message: "Action non autorisee." };
  const validatedFields = productSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: 'Certains champs sont invalides.' };
  }
  try {
    await addProduct(validatedFields.data, session.organizationId);
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to create product:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { message };
  }
}

export async function updateProduct(id: string, formData: unknown) {
  const session = await getSession();
  if (!session) return { message: "Action non autorisee." };
  const validatedFields = productSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: 'Certains champs sont invalides.' };
  }
  try {
    await updateProductInDB(id, validatedFields.data);
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    revalidateTag('invoices');
    return {};
  } catch (error) {
    console.error('Failed to update product:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { message };
  }
}

export async function deleteProduct(id: string) {
  const session = await getSession();
  if (!session || session.role !== ROLES.SUPER_ADMIN) {
    return { message: "Action non autorisee." };
  }
  try {
    await deleteProductFromDB(id);
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    revalidateTag('invoices');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete product:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { success: false, message };
  }
}
