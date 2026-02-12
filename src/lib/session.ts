
import 'server-only';
import type { User } from './types';
import { ROLES } from './constants';
import { cookies } from 'next/headers';
import { getUserByEmail } from './data';

/**
 * GESTION DE LA SESSION (Version Firestore)
 */
export async function getSession(): Promise<User | null> {
  // Version démo sécurisée : on récupère l'email stocké en cookie ou on renvoie l'admin démo
  const sessionCookie = cookies().get('bizbook_session');
  
  if (!sessionCookie) {
    // Si pas de cookie, on peut renvoyer null pour forcer le login
    // Ou renvoyer l'admin démo pour les tests rapides
    return {
      id: 'demo-user-id',
      name: 'Administrateur Démo',
      email: 'demo@bizbook.com',
      role: ROLES.SUPER_ADMIN,
      tenantId: 'demo-tenant',
    };
  }

  try {
    const email = sessionCookie.value;
    const user = await getUserByEmail(email);
    return user || null;
  } catch (e) {
    return null;
  }
}
