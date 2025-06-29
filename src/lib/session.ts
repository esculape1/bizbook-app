import 'server-only';
import { cookies } from 'next/headers';
import { auth, db } from './firebase-admin';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'session';

export async function getSession(): Promise<User | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const userDocRef = db.collection('users').doc(decodedClaims.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      name: userData?.name,
      email: userData?.email,
      role: userData?.role,
    };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    // Clear the invalid cookie
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
