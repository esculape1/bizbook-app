
'use server';

import { z } from 'zod';
import { addClient, deleteClient as deleteClientFromDB, updateClient as updateClientInDB } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

const clientSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Email invalide." }).or(z.literal('')),
  phone: z.string().min(1, { message: "Le contact est requis." }),
  address: z.string().min(1, { message: "L'adresse est requise." }),
  ifu: z.string().min(1, { message: "L'IFU est requis." }),
  rccm: z.string().min(1, { message: "Le RCCM est requis." }),
  taxRegime: z.string().min(1, { message: "Le régime fiscal est requis." }),
});

type NewClient = z.infer<typeof clientSchema>;

export async function createClient(data: NewClient) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
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
    revalidatePath('/clients');
    revalidatePath('/invoices');
    return {}; // Indique le succès
  } catch (error) {
    console.error('Failed to create client:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer le client.';
    return { message };
  }
}

export async function updateClient(id: string, data: NewClient) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
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
    revalidatePath('/clients');
    revalidatePath('/invoices'); // Client name might be displayed on invoices page
    return {}; // Indique le succès
  } catch (error) {
    console.error('Failed to update client:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour le client.';
    return { message };
  }
}

export async function deleteClient(id: string) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }
    
  try {
    await deleteClientFromDB(id);
    revalidatePath('/clients');
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
