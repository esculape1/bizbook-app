
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export type State = {
  message?: string;
};

/**
 * LOGIN : Crée un cookie de session
 */
export async function signIn(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email === 'demo@bizbook.com' && password === '123') {
    cookies().set('bizbook_session', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/');
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
