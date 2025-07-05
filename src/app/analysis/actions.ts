
'use server';

import { getSession } from '@/lib/session';
import { analyzeBusinessData } from '@/ai/flows/business-analysis-flow';

export async function askAI(query: string): Promise<{ status: 'success', response: string } | { status: 'error', error: string }> {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { status: 'error', error: 'Action non autorisée.' };
  }
  
  if (!query) {
    return { status: 'error', error: "La question ne peut pas être vide." };
  }

  try {
    const response = await analyzeBusinessData(query);
    return { status: 'success', response };
  } catch (e: any) {
    console.error("AI analysis failed:", e);
    // Provide a more user-friendly error message
    const errorMessage = e.message.includes('permission') 
      ? "L'agent IA n'a pas la permission d'accéder aux ressources nécessaires. Veuillez vérifier la configuration."
      : "L'analyse par IA a rencontré une erreur. Veuillez réessayer.";
    return { status: 'error', error: errorMessage };
  }
}
