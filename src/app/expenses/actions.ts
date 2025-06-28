
'use server';

import { z } from 'zod';
import { addExpense } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const expenseSchema = z.object({
  date: z.date({ required_error: "La date est requise." }),
  description: z.string().min(1, { message: "La description est requise." }),
  category: z.string().min(1, { message: "La catégorie est requise." }),
  amount: z.coerce.number().positive({ message: "Le montant doit être positif." }),
});

export async function createExpense(formData: unknown) {
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
