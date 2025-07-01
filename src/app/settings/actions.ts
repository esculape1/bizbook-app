
'use server';

import { z } from 'zod';
import { updateSettings } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

const settingsSchema = z.object({
  companyName: z.string().min(1, { message: "Le nom de l'entreprise est requis." }),
  legalName: z.string().min(1, { message: "La raison sociale est requise." }),
  managerName: z.string().min(1, { message: "Le nom du gérant est requis." }),
  companyAddress: z.string().min(1, { message: "L'adresse est requise." }),
  companyPhone: z.string().min(1, { message: "Le téléphone est requis." }),
  companyIfu: z.string().min(1, { message: "L'IFU est requis." }),
  companyRccm: z.string().min(1, { message: "Le RCCM est requis." }),
  currency: z.enum(['EUR', 'USD', 'GBP', 'XOF']),
  logo: z.any().optional(),
  invoiceNumberFormat: z.enum(['YEAR-NUM', 'PREFIX-YEAR-NUM', 'PREFIX-NUM']),
  invoiceTemplate: z.enum(['modern', 'classic', 'simple', 'detailed']),
});

export async function saveSettings(formData: z.infer<typeof settingsSchema>) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { success: false, message: "Action non autorisée." };
  }
  
  try {
    const { logo, ...settingsToSave } = formData;
    
    // In a real app, you would handle file upload here and get a URL.
    // For this mock, we don't change the logo URL.

    await updateSettings(settingsToSave);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    const message = error instanceof Error ? error.message : "Erreur lors de la sauvegarde.";
    return { success: false, message };
  }
}
