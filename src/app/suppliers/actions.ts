'use server';

import { z } from 'zod';
import { addSupplier, deleteSupplier as deleteSupplierFromDB, updateSupplier as updateSupplierInDB } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

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
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const validatedFields = supplierSchema.safeParse(data);
  if (!validatedFields.success) {
    return { message: 'Certains champs sont invalides.' };
  }
  try {
    await addSupplier(validatedFields.data, session.organizationId);
    revalidateTag('suppliers');
    return {};
  } catch (error) {
    console.error('Failed to create supplier:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { message };
  }
}

export async function updateSupplier(id: string, data: NewSupplier) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const validatedFields = supplierSchema.safeParse(data);
  if (!validatedFields.success) {
    return { message: 'Certains champs sont invalides.' };
  }
  try {
    await updateSupplierInDB(id, validatedFields.data);
    revalidateTag('suppliers');
    return {};
  } catch (error) {
    console.error('Failed to update supplier:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { message };
  }
}

export async function deleteSupplier(id: string) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  try {
    await deleteSupplierFromDB(id);
    revalidateTag('suppliers');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { success: false, message };
  }
}
