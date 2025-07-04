
'use server';

import { z } from 'zod';
import { updateSettings } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import type { Settings } from '@/lib/types';

export const settingsSchema = z.object({
  companyName: z.string().min(1, { message: "Le nom de l'entreprise est requis." }),
  legalName: z.string().min(1, { message: "La raison sociale est requise." }),
  managerName: z.string().min(1, { message: "Le nom du gérant est requis." }),
  companyAddress: z.string().min(1, { message: "L'adresse est requise." }),
  companyPhone: z.string().min(1, { message: "Le téléphone est requis." }),
  companyIfu: z.string().min(1, { message: "L'IFU est requis." }),
  companyRccm: z.string().min(1, { message: "Le RCCM est requis." }),
  currency: z.enum(['EUR', 'USD', 'GBP', 'XOF']),
  logoUrl: z.string().optional(),
  invoiceNumberFormat: z.enum(['YEAR-NUM', 'PREFIX-YEAR-NUM', 'PREFIX-NUM']),
  invoiceTemplate: z.enum(['modern', 'classic', 'simple', 'detailed']),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export async function saveSettings(formData: SettingsFormValues) {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { success: false, message: "Action non autorisée." };
  }
  
  try {
    const validatedData = settingsSchema.parse(formData);
    await updateSettings(validatedData);
    
    revalidatePath('/settings');
    revalidatePath('/invoices');
    revalidatePath('/devis');
    revalidatePath('/'); // For dashboard and templates using settings
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    
    if (error instanceof z.ZodError) {
        return { success: false, message: "Les données sont invalides." };
    }

    const message = error instanceof Error ? error.message : "Erreur lors de la sauvegarde.";
    return { success: false, message };
  }
}
