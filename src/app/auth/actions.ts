
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User, UserWithPassword } from '@/lib/types';
import { getUserByEmail } from '@/lib/data';

export async function signIn(prevState: { error: string } | undefined, formData: FormData) {
  const email = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!email || !password) {
    return { error: 'Email et mot de passe sont requis.' };
  }

  // Find user in the database by email
  const userRecord: UserWithPassword | null = await getUserByEmail(email);

  // Check if user exists and password matches
  if (userRecord && userRecord.password === password) {
    // This is the user object we want to store in the session (without the password)
    const authenticatedUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
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
  } else {
    return { error: 'Email ou mot de passe incorrect.' };
  }
}

export async function signOut() {
  cookies().delete('session');
  redirect('/login');
}
