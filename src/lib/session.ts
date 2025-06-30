import 'server-only';
import { cookies } from 'next/headers';
import { auth, db } from './firebase-admin';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'session';

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
    const userDocRef = db.collection('users').doc(decodedClaims.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // User document doesn't exist. The cookie is stale.
      return null;
    }

    const userData = userDoc.data();
    if (!userData) {
      return null;
    }

    return {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
  } catch (error) {
    // The cookie is invalid (expired, malformed, etc.).
    // We will not delete it here to avoid side effects.
    // The middleware will handle redirection on the next protected route access.
    return null;
  }
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
