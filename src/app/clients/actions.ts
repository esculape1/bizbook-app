
'use server';

import { z } from 'zod';
import { addClient, deleteClient as deleteClientFromDB, updateClient as updateClientInDB } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';

const clientSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Email invalide." }).or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ifu: z.string().optional(),
  rccm: z.string().optional(),
  taxRegime: z.string().optional(),
});

type NewClient = z.infer<typeof clientSchema>;

export async function createClient(data: NewClient) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = clientSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer le client.',
    };
  }

  try {
    await addClient(validatedFields.data);
    revalidateTag('clients');
    revalidateTag('dashboard-stats');
    return {}; // Indique le succès
  } catch (error) {
    console.error('Failed to create client:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer le client.';
    return { message };
  }
}

export async function updateClient(id: string, data: NewClient) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }

  const validatedFields = clientSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour le client.',
    };
  }

  try {
    await updateClientInDB(id, validatedFields.data);
    revalidateTag('clients');
    revalidateTag('dashboard-stats');
    revalidateTag('invoices'); // Client name might be displayed on invoices page
    return {}; // Indique le succès
  } catch (error) {
    console.error('Failed to update client:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour le client.';
    return { message };
  }
}

export async function deleteClient(id: string) {
  const session = await getSession();
  if (session?.role !== ROLES.SUPER_ADMIN && session?.role !== ROLES.USER) {
    return { message: "Action non autorisée." };
  }
    
  try {
    await deleteClientFromDB(id);
    revalidateTag('clients');
    revalidateTag('dashboard-stats');
    revalidateTag('invoices');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete client:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de supprimer le client.';
    return {
      success: false,
      message,
    };
  }
}
