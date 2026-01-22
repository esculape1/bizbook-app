
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

    // Validate the session data structure and expiration.
    // If anything is wrong, delete the cookie and return null.
    if (
      !sessionData.expiresAt ||
      sessionData.expiresAt < Date.now() ||
      !sessionData.id ||
      !sessionData.name ||
      !sessionData.email ||
      !sessionData.role
    ) {
      cookies().delete(SESSION_COOKIE_NAME);
      return null;
    }

    // If all checks pass, the session is valid. Return only the user data.
    const { id, name, email, phone, role } = sessionData;
    return { id, name, email, phone, role };
    
  } catch (error) {
    // If parsing fails, the cookie is invalid. Log the error and clear it.
    console.error("Failed to parse session cookie, deleting it:", error);
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }
}
