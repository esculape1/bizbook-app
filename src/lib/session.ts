
import 'server-only';
import { cookies } from 'next/headers';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'session';

export async function getSession(): Promise<User | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);

  // If the cookie doesn't exist or its value is an empty string, there's no session.
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);
    // Basic validation to ensure the object has the expected shape
    if (sessionData && sessionData.id && sessionData.name && sessionData.email && sessionData.role) {
      return sessionData as User;
    }
    // The parsed data is not a valid user object, so we treat it as no session.
    return null;
  } catch (error) {
    // If parsing fails, the cookie is invalid. Log the error and clear the cookie to prevent future errors.
    console.error("Failed to parse session cookie, deleting it:", error);
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }
}
