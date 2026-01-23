
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
    // If anything is wrong, the session is considered invalid.
    if (
      !sessionData.expiresAt ||
      sessionData.expiresAt < Date.now() ||
      !sessionData.id ||
      !sessionData.name ||
      !sessionData.email ||
      !sessionData.role
    ) {
      // Don't delete the cookie here. The middleware is responsible for that.
      // Just return null to signify an invalid session.
      console.warn("Session cookie found but it is invalid or expired.");
      return null;
    }

    // If all checks pass, the session is valid. Return only the user data.
    const { id, name, email, phone, role } = sessionData;
    return { id, name, email, phone, role };
    
  } catch (error) {
    // If parsing fails, the cookie is malformed and thus invalid.
    console.error("Failed to parse session cookie:", error);
    // Don't delete the cookie here. The middleware will handle it.
    return null;
  }
}
