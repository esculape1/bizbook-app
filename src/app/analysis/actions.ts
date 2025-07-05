
'use server';

import { getSession } from '@/lib/session';

export async function askAI(query: string): Promise<{ response: string; error?: undefined } | { error: string; response?: undefined }> {
  const session = await getSession();
  if (session?.role !== 'Admin') {
    return { error: 'Action non autorisée.' };
  }

  // TODO: Implement the actual Genkit flow call here.
  // For now, this is a placeholder.
  console.log(`Received query for AI: "${query}"`);

  // Simulate a delay to mimic AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  const placeholderResponse = `Je suis l'assistant IA de BizBook. Ma connexion avec les données réelles n'est pas encore établie. Votre question était : "${query}"`;
  
  return { response: placeholderResponse };
}
