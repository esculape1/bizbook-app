
'use server';

import { z } from 'zod';
import { addExpense, updateExpense as updateExpenseInDB, deleteExpense as deleteExpenseFromDB } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

const expenseSchema = z.object({
  date: z.date({ required_error: "La date est requise." }),
  description: z.string().min(1, { message: "La description est requise." }),
  category: z.string().min(1, { message: "La catégorie est requise." }),
  amount: z.coerce.number().positive({ message: "Le montant doit être positif." }),
});

export async function createExpense(formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = expenseSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de créer la dépense.',
    };
  }
  
  const { date, ...rest } = validatedFields.data;

  try {
    await addExpense({
        ...rest,
        date: date.toISOString(),
    });
    revalidatePath('/expenses');
    revalidatePath('/'); // For the dashboard
    revalidatePath('/reports'); // For the reports
    return {}; // Indicates success
  } catch (error) {
    console.error('Failed to create expense:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de créer la dépense.';
    return { message };
  }
}

export async function updateExpense(id: string, formData: unknown) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { message: "Action non autorisée." };
  }

  const validatedFields = expenseSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      message: 'Certains champs sont invalides. Impossible de mettre à jour la dépense.',
    };
  }

  const { date, ...rest } = validatedFields.data;

  try {
    await updateExpenseInDB(id, {
        ...rest,
        date: date.toISOString(),
    });
    revalidatePath('/expenses');
    revalidatePath('/'); // For the dashboard
    revalidatePath('/reports'); // For the reports
    return {}; // Indicates success
  } catch (error) {
    console.error('Failed to update expense:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de mettre à jour la dépense.';
    return { message };
  }
}

export async function deleteExpense(id: string) {
    const session = await getSession();
    if (session?.role !== 'Admin') {
      return { message: "Action non autorisée." };
    }
    
    try {
        await deleteExpenseFromDB(id);
        revalidatePath('/expenses');
        revalidatePath('/');
        revalidatePath('/reports');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete expense:', error);
        const message = error instanceof Error ? error.message : 'Erreur de la base de données: Impossible de supprimer la dépense.';
        return {
          success: false,
          message,
        };
    }
}
