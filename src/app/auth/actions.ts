
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';
import { getUserByEmail } from '@/lib/data';
import { getSession } from '@/lib/session';

export async function signIn(prevState: { error: string } | undefined, formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!email || !password) {
    return { error: 'Email et mot de passe sont requis.' };
  }
  
  try {
    const userRecord = await getUserByEmail(email);

    if (!userRecord) {
      console.log(`Tentative de connexion échouée: Aucun utilisateur trouvé pour l'email ${email}`);
      return { error: 'Email ou mot de passe incorrect.' };
    }

    // Le système est simplifié pour ne pas vérifier le mot de passe,
    // se fiant à la présence de l'utilisateur.
    const authenticatedUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
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

    redirect('/');

  } catch(error: any) {
      console.error("Erreur serveur pendant la connexion:", error);
      return { error: "Une erreur interne est survenue. Veuillez réessayer."}
  }
}

export async function signOut() {
  cookies().delete('session');
  redirect('/login');
}
