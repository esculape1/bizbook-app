
import 'server-only';
import { cookies } from 'next/headers';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'session';

export async function getSession(): Promise<User | null> {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);
    // Basic validation to ensure the object has the expected shape
    if (sessionData.id && sessionData.name && sessionData.email && sessionData.role) {
      return sessionData as User;
    }
    return null;
  } catch (error) {
    // This can happen if cookies() is called in a context that is not fully dynamic (e.g., during build).
    // Instead of crashing the server, we log it and return null, which is a safe default.
    console.error("Error in getSession (this may be expected during build):", error instanceof Error ? error.message : String(error));
    return null;
  }
}
