'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';
import { getUserByEmail, updateUserPassword } from '@/lib/data';
import bcrypt from 'bcrypt';
import { ROLES } from '@/lib/constants';

export type State = {
  message?: string;
};

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$.*/;

export async function signIn(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Email et mot de passe sont requis.' };
  }

  try {
    const userRecord = await getUserByEmail(email);

    if (!userRecord || !userRecord.password) {
      return { message: 'Aucun utilisateur trouvé ou mot de passe non configuré.' };
    }
    
    let passwordMatch = false;

    // Check if the stored password is a bcrypt hash
    if (BCRYPT_HASH_REGEX.test(userRecord.password)) {
      // It's a hash, use bcrypt.compare
      passwordMatch = await bcrypt.compare(password, userRecord.password);
    } else {
      // It's likely a plaintext password from before the migration
      passwordMatch = userRecord.password === password;

      if (passwordMatch) {
        // Plaintext match successful, so let's hash and update the password in the DB for future logins
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await updateUserPassword(userRecord.id, hashedPassword);
          console.log(`Mot de passe mis à jour pour l'utilisateur ${email}`);
        } catch (hashError) {
          console.error("Échec de la mise à jour du mot de passe après la migration:", hashError);
          // We can still let the user log in, but log the failure to update.
        }
      }
    }

    if (!passwordMatch) {
      return { message: 'Mot de passe incorrect.' };
    }
    
    const authenticatedUser: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role || ROLES.USER,
    };

    const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionPayload = {
      ...authenticatedUser,
      expiresAt: Date.now() + expiresInMs,
    };
    const sessionData = JSON.stringify(sessionPayload);

    cookies().set('session', sessionData, {
        maxAge: expiresInMs / 1000, // maxAge is in seconds
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
