
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/data';

export type State = {
  message?: string;
};

/**
 * LOGIN : Vérifie les identifiants dans la collection 'users' de Firestore
 */
export async function signIn(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await getUserByEmail(email);

    // Vérification stricte contre votre base Firestore
    if (user && user.password === password) {
      cookies().set('bizbook_session', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      redirect('/');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Auth error:', error);
    return { message: 'Une erreur est survenue lors de la connexion.' };
  }

  return { message: 'Identifiants invalides.' };
}

/**
 * LOGOUT : Supprime le cookie de session
 */
export async function signOut() {
  cookies().delete('bizbook_session');
  redirect('/login');
}
