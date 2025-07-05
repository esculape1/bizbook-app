
'use server';

import { getSession } from '@/lib/session';
import { analyzeBusinessData } from '@/ai/flows/business-analysis-flow';

export async function askAI(query: string): Promise<{ status: 'success', response: string } | { status: 'error', error: string }> {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { status: 'error', error: 'Action non autorisée.' };
  }
  
  // Explicit check for the API key in the production environment (like Vercel)
  if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_API_KEY) {
    console.error("La variable d'environnement GOOGLE_API_KEY n'est pas définie en production.");
    return { status: 'error', error: "La clé API de l'assistant IA n'est pas configurée sur le serveur. Veuillez l'ajouter dans les variables d'environnement de votre projet sur Vercel." };
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
        return { status: 'error', error: "Erreur d'authentification de l'IA. Assurez-vous que la clé API Gemini est valide et correctement configurée dans le fichier .env (pour le développement local) ou dans les variables d'environnement de Vercel (pour l'application en ligne)." };
    }
    
    return { status: 'error', error: "L'analyse par IA a rencontré une erreur. Veuillez réessayer." };
  }
}
