
'use server';

import { z } from 'zod';
import { addProduct, updateProduct as updateProductInDB, deleteProduct as deleteProductFromDB } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

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
  if (session?.role !== 'Admin') {
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
    revalidatePath('/products');
    revalidatePath('/'); // For the dashboard low stock table
    revalidatePath('/invoices'); // Products are needed for new invoices
    return {}; // Indicates success
  } catch (error) {
    console.error('Failed to create product:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer le produit.';
    return { message };
  }
}

export async function updateProduct(id: string, formData: unknown) {
    const session = await getSession();
    if (session?.role !== 'Admin') {
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
        revalidatePath('/products');
        revalidatePath('/');
        revalidatePath('/invoices');
        return {};
    } catch (error) {
        console.error('Failed to update product:', error);
        const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour le produit.';
        return { message };
    }
}

export async function deleteProduct(id: string) {
    const session = await getSession();
    if (session?.role !== 'Admin') {
      return { message: "Action non autorisée." };
    }
    
    try {
        await deleteProductFromDB(id);
        revalidatePath('/products');
        revalidatePath('/');
        revalidatePath('/invoices');
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
