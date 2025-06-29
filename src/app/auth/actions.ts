'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { auth, db } from '@/lib/firebase-admin';
import { clearSession } from '@/lib/session';
import { cookies } from 'next/headers';

const signUpSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  email: z.string().email({ message: 'Adresse email invalide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

export async function signUp(formData: unknown) {
  const validatedFields = signUpSchema.safeParse(formData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    return { error: `Validation échouée: ${errorMessages}` };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const userCredential = await auth.createUser({ email, password, displayName: name });
    const userDoc = {
      name,
      email,
      role: 'User' // Assign 'User' as the default role
    };
    await db.collection('users').doc(userCredential.uid).set(userDoc);
    
    // NOTE: We no longer automatically sign in the user.
    // This simplifies the flow and avoids the previous bug.
    // The user will be redirected to the login page to sign in themselves.
    
  } catch (error: any) {
    console.error("Erreur d'inscription:", error);
    if (error.code === 'auth/email-already-exists') {
      return { error: 'Cette adresse email est déjà utilisée.' };
    }
    return { error: 'Une erreur est survenue lors de l\'inscription.' };
  }
  
  redirect('/login');
}

export async function signIn(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
  } catch (error) {
    console.error("Erreur de création de session:", error);
    return { error: "Impossible de créer la session. Veuillez réessayer." };
  }
}

export async function signOut() {
  await clearSession();
  redirect('/login');
}
