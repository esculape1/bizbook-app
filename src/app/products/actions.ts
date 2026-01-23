
'use server';

import { z } from 'zod';
import { addProduct, updateProduct as updateProductInDB, deleteProduct as deleteProductFromDB } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

const productSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  reference: z.string().min(1, { message: "La référence est requise." }),
  category: z.string().min(1, { message: "La catégorie est requise." }),
  purchasePrice: z.coerce.number().min(0, { message: "Le prix d'achat doit être positif." }),
  unitPrice: z.coerce.number().min(0, { message: "Le prix doit être positif." }),
  quantityInStock: z.coerce.number().min(0, { message: "La quantité doit être positive." }),
  reorderPoint: z.coerce.number().min(0, { message: "Le point de commande doit être positif." }),
  safetyStock: z.coerce.number().min(0, { message: "Le stock de sécurité doit être positif." }),
});

export async function createProduct(formData: unknown) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = productSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer le produit.',
    };
  }

  try {
    await addProduct(validatedFields.data);
    revalidateTag('products');
    revalidateTag('dashboard-stats');
    return {}; // Indicates success
  } catch (error) {
    console.error('Failed to create product:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer le produit.';
    return { message };
  }
}

export async function updateProduct(id: string, formData: unknown) {
    const session = await getSession();
    if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.ADMIN && session?.role !== ROLES.USER) {
      return { message: "Action non autorisée." };
    }
    
    const validatedFields = productSchema.safeParse(formData);

    if (!validatedFields.success) {
        return {
        message: 'Certains champs sont invalides. Impossible de mettre à jour le produit.',
        };
    }

    try {
        await updateProductInDB(id, validatedFields.data);
        revalidateTag('products');
        revalidateTag('dashboard-stats');
        revalidateTag('invoices');
        return {};
    } catch (error) {
        console.error('Failed to update product:', error);
        const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour le produit.';
        return { message };
    }
}

export async function deleteProduct(id: string) {
    const session = await getSession();
    if (session?.role !== ROLES.SUPER_ADMIN) {
      return { message: "Action non autorisée. Seul le SuperAdmin peut supprimer des produits." };
    }
    
    try {
        await deleteProductFromDB(id);
        revalidateTag('products');
        revalidateTag('dashboard-stats');
        revalidateTag('invoices');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete product:', error);
        const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de supprimer le produit.';
        return {
          success: false,
          message,
        };
    }
}
