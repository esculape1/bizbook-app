
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User, UserWithPassword } from '@/lib/types';
import { getUserByEmail } from '@/lib/data';
import bcrypt from 'bcryptjs';

export async function signIn(prevState: { error: string } | undefined, formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!email || !password) {
    return { error: 'Email et mot de passe sont requis.' };
  }
  
  const userRecord: UserWithPassword | null = await getUserByEmail(email);

  if (!userRecord || !userRecord.password) {
      return { error: 'Email ou mot de passe incorrect.' };
  }
  
  const passwordMatches = await bcrypt.compare(password, userRecord.password);
  
  if (passwordMatches) {
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
  } else {
    return { error: 'Email ou mot de passe incorrect.' };
  }
}

export async function signOut() {
  cookies().delete('session');
  redirect('/login');
}
