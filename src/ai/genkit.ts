
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_API_KEY) {
  console.warn(
    "AVERTISSEMENT: La variable d'environnement GOOGLE_API_KEY n'est pas définie. L'assistant IA ne pourra pas fonctionner."
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
});
