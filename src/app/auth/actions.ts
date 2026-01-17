
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';
import { getUserByPhoneNumber } from '@/lib/data';
import { admin } from '@/lib/firebase-admin';

export async function verifyAndCreateSession(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (!decodedToken.phone_number) {
      return { success: false, error: 'Le jeton d\'authentification est invalide ou ne contient pas de numéro de téléphone.' };
    }
    
    const phoneNumber = decodedToken.phone_number;
    
    const userRecord = await getUserByPhoneNumber(phoneNumber);
    
    if (!userRecord) {
      console.log(`Tentative de connexion échouée: Aucun utilisateur trouvé pour le numéro ${phoneNumber}`);
      return { success: false, error: 'Ce numéro de téléphone n\'est pas autorisé à accéder à cette application.' };
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
    
    return { success: true };

  } catch(error: any) {
      console.error("Erreur serveur pendant la vérification du jeton:", error);
      return { success: false, error: "Une erreur interne est survenue. Veuillez réessayer."}
  }
}

export async function signOut() {
  cookies().delete('session');
  redirect('/login');
}
