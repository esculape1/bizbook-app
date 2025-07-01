
import 'server-only';
import { cookies } from 'next/headers';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'session';

export async function getSession(): Promise<User | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);
    // Basic validation to ensure the object has the expected shape
    if (sessionData.id && sessionData.name && sessionData.email && sessionData.role) {
      return sessionData as User;
    }
    return null;
  } catch (error) {
    // Malformed cookie
    console.error("Failed to parse session cookie:", error);
    return null;
  }
}
