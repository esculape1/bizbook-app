
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';
import { getUserByEmail } from '@/lib/data';

export type State = {
  message?: string;
};

export async function signIn(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Email et mot de passe sont requis.' };
  }

  try {
    const userRecord = await getUserByEmail(email);

    if (!userRecord) {
      return { message: 'Aucun utilisateur trouvé avec cet email.' };
    }
    
    // IMPORTANT: Ceci est une comparaison en texte clair et N'EST PAS SÉCURISÉ.
    // C'est une mesure temporaire. À remplacer par une comparaison de hash de mot de passe (ex: avec bcrypt).
    if (userRecord.password !== password) {
      return { message: 'Mot de passe incorrect.' };
    }
    
    const authenticatedUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role || 'User',
    };

    const sessionData = JSON.stringify(authenticatedUser);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    cookies().set('session', sessionData, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });
    
  } catch(error: any) {
      console.error("Erreur serveur pendant la connexion:", error);
      return { message: "Une erreur interne est survenue. Veuillez réessayer."}
  }

  redirect('/');
}

export async function signOut() {
  cookies().delete('session');
  redirect('/login');
}
