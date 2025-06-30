
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { auth, db } from '@/lib/firebase-admin';
import { clearSession } from '@/lib/session';
import { cookies } from 'next/headers';

const completeSignUpSchema = z.object({
  uid: z.string().min(1, { message: "L'UID est requis." }),
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  email: z.string().email({ message: 'Adresse email invalide.' }),
});

/**
 * Cette action est appelée APRÈS que l'utilisateur a été créé côté client avec l'Auth SDK.
 * Son rôle est de créer le document utilisateur correspondant dans Firestore.
 */
export async function completeSignUp(userData: { uid: string, name: string, email: string }) {
  const validatedFields = completeSignUpSchema.safeParse(userData);

  if (!validatedFields.success) {
    // Si les données sont invalides, on supprime l'utilisateur qui vient d'être créé pour éviter un compte orphelin.
    if(userData.uid) {
      await auth.deleteUser(userData.uid).catch(e => console.error("Échec du nettoyage de l'utilisateur auth:", e));
    }
    return { error: "Données utilisateur invalides. Impossible de finaliser l'inscription." };
  }

  const { uid, name, email } = validatedFields.data;

  try {
    const userDoc = {
      name,
      email,
      role: 'User' // Rôle par défaut pour tout nouvel utilisateur
    };
    await db.collection('users').doc(uid).set(userDoc);
    
  } catch (error: any) {
    console.error("Erreur lors de la création du document utilisateur dans Firestore:", error);
    // En cas d'échec, on supprime l'utilisateur pour qu'il puisse réessayer.
    await auth.deleteUser(uid).catch(e => console.error("Échec du nettoyage de l'utilisateur auth:", e));
    return { error: 'Une erreur est survenue lors de la création de votre profil. Veuillez réessayer.' };
  }
  
  // Si tout réussit, on redirige vers la page de connexion.
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
    return {};
  } catch (error) {
    console.error("Erreur de création de session:", error);
    return { error: "Impossible de créer la session. Veuillez réessayer." };
  }
}

export async function signOut() {
  await clearSession();
  redirect('/login');
}
