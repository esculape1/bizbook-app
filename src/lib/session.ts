import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from './types';
import { ROLES } from './constants';

export async function getSession(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch profile with organization info using admin client
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('full_name, role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('Profile not found for user:', user.id);
      return null;
    }

    return {
      id: user.id,
      name: profile.full_name,
      email: user.email || '',
      role: (profile.role as typeof ROLES[keyof typeof ROLES]) || ROLES.USER,
      organizationId: profile.organization_id,
    };
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}
