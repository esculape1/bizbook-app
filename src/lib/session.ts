
import 'server-only';
import type { User } from './types';
import { cookies } from 'next/headers';
import { getUserByEmail } from './data';

/**
 * GESTION DE LA SESSION (Version Firestore)
 * L'accès est désormais strictement lié aux utilisateurs en base de données.
 */
export async function getSession(): Promise<User | null> {
  const sessionCookie = cookies().get('bizbook_session');
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const email = sessionCookie.value;
    const user = await getUserByEmail(email);
    return user || null;
  } catch (e) {
    return null;
  }
}
