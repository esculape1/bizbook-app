
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

// Hardcoded user credentials
const users = {
  admin: {
    email: 'admin@bizbook.com',
    password: 'password',
    user: { id: 'admin-01', name: 'Administrateur', email: 'admin@bizbook.com', role: 'Admin' } as User,
  },
  user: {
    email: 'user@bizbook.com',
    password: 'password',
    user: { id: 'user-01', name: 'Utilisateur de démo', email: 'user@bizbook.com', role: 'User' } as User,
  },
};

export async function signIn(prevState: { error: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email et mot de passe sont requis.' };
  }

  const adminUser = users.admin;
  const standardUser = users.user;

  let authenticatedUser: User | null = null;

  if (email.toLowerCase() === adminUser.email && password === adminUser.password) {
    authenticatedUser = adminUser.user;
  } else if (email.toLowerCase() === standardUser.email && password === standardUser.password) {
    authenticatedUser = standardUser.user;
  }

  if (authenticatedUser) {
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
  } else {
    return { error: 'Email ou mot de passe incorrect.' };
  }
}

export async function signOut() {
  cookies().delete('session');
  redirect('/login');
}
