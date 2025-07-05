
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
    
    const errorString = (e.message || '').toLowerCase();
    if (errorString.includes('api key') || errorString.includes('permission denied') || errorString.includes('authentication')) {
        return { status: 'error', error: "Erreur d'authentification de l'IA. Assurez-vous que la clé API Gemini est valide et correctement configurée dans le fichier .env." };
    }
    
    return { status: 'error', error: "L'analyse par IA a rencontré une erreur. Veuillez réessayer." };
  }
}
