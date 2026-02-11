'use server';

import { z } from 'zod';
import { addExpense, updateExpense as updateExpenseInDB, deleteExpense as deleteExpenseFromDB } from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { getSession } from '@/lib/session';
import { EXPENSE_CATEGORIES, ROLES } from '@/lib/constants';

const expenseSchema = z.object({
  date: z.date({ required_error: "La date est requise." }),
  description: z.string().min(1, { message: "La description est requise." }),
  category: z.nativeEnum(EXPENSE_CATEGORIES, { required_error: "La categorie est requise." }),
  amount: z.coerce.number().positive({ message: "Le montant doit etre positif." }),
});

export async function createExpense(formData: unknown) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const validatedFields = expenseSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: 'Certains champs sont invalides.' };
  }
  const { date, ...rest } = validatedFields.data;
  try {
    await addExpense({ ...rest, date: date.toISOString() }, session.organizationId);
    revalidateTag('expenses');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to create expense:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { message };
  }
}

export async function updateExpense(id: string, formData: unknown) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  const validatedFields = expenseSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { message: 'Certains champs sont invalides.' };
  }
  const { date, ...rest } = validatedFields.data;
  try {
    await updateExpenseInDB(id, { ...rest, date: date.toISOString() });
    revalidateTag('expenses');
    revalidateTag('dashboard-stats');
    return {};
  } catch (error) {
    console.error('Failed to update expense:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { message };
  }
}

export async function deleteExpense(id: string) {
  const session = await getSession();
  if (!session || (session.role !== ROLES.ADMIN && session.role !== ROLES.SUPER_ADMIN)) {
    return { message: "Action non autorisee." };
  }
  try {
    await deleteExpenseFromDB(id);
    revalidateTag('expenses');
    revalidateTag('dashboard-stats');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete expense:', error);
    const message = error instanceof Error ? error.message : 'Erreur de la base de donnees.';
    return { success: false, message };
  }
}
