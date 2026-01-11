
'use server';

import { z } from 'zod';
import { addSupplier, deleteSupplier as deleteSupplierFromDB, updateSupplier as updateSupplierInDB } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';

const supplierSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Email invalide." }).or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

type NewSupplier = z.infer<typeof supplierSchema>;

export async function createSupplier(data: NewSupplier) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = supplierSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer le fournisseur.',
    };
  }

  try {
    await addSupplier(validatedFields.data);
    revalidateTag('suppliers');
    return {};
  } catch (error) {
    console.error('Failed to create supplier:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer le fournisseur.';
    return { message };
  }
}

export async function updateSupplier(id: string, data: NewSupplier) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = supplierSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour le fournisseur.',
    };
  }

  try {
    await updateSupplierInDB(id, validatedFields.data);
    revalidateTag('suppliers');
    return {};
  } catch (error) {
    console.error('Failed to update supplier:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour le fournisseur.';
    return { message };
  }
}

export async function deleteSupplier(id: string) {
  const session = await getSession();
  if (session?.role !== 'Admin' && session?.role !== 'SuperAdmin') {
    return { message: "Action non autorisée." };
  }
    
  try {
    await deleteSupplierFromDB(id);
    revalidateTag('suppliers');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de supprimer le fournisseur.';
    return {
      success: false,
      message,
    };
  }
}
