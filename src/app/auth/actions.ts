'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ROLES } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export type State = {
  message?: string;
};

// ─── SIGN IN ────────────────────────────────────────────────────────────
export async function signIn(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Email et mot de passe sont requis.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: 'Email ou mot de passe incorrect.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

// ─── SIGN UP (with license code) ────────────────────────────────────────
export async function signUp(prevState: State | undefined, formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const companyName = formData.get('companyName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const licenseCode = (formData.get('licenseCode') as string)?.trim();
  const inviteToken = (formData.get('inviteToken') as string)?.trim() || null;

  if (!fullName || !email || !password) {
    return { message: 'Tous les champs obligatoires doivent etre remplis.' };
  }

  if (password.length < 6) {
    return { message: 'Le mot de passe doit comporter au moins 6 caracteres.' };
  }

  const admin = createAdminClient();

  // ── If invite token is provided, join an existing organization ──
  if (inviteToken) {
    const { data: invitation, error: invErr } = await admin
      .from('invitations')
      .select('*')
      .eq('token', inviteToken)
      .eq('used', false)
      .single();

    if (invErr || !invitation) {
      return { message: 'Lien d\'invitation invalide ou expire.' };
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return { message: 'Ce lien d\'invitation a expire.' };
    }

    // Create Supabase Auth user
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://' + new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.replace('.supabase.co', '.vercel.app') : ''}/`,
      },
    });

    if (authError || !authData.user) {
      return { message: authError?.message || 'Erreur lors de la creation du compte.' };
    }

    // Create profile linked to the invitation's organization
    const { error: profileErr } = await admin.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role: ROLES.USER,
      organization_id: invitation.organization_id,
    });

    if (profileErr) {
      return { message: 'Erreur lors de la creation du profil: ' + profileErr.message };
    }

    // Mark invitation as used
    await admin.from('invitations').update({ used: true }).eq('id', invitation.id);

    revalidatePath('/', 'layout');
    redirect('/');
  }

  // ── Normal signup: requires a license code and creates a new organization ──
  if (!licenseCode || !companyName) {
    return { message: 'Le code de licence et le nom de l\'entreprise sont requis pour creer un nouveau compte.' };
  }

  // Validate license
  const { data: license, error: licErr } = await admin
    .from('licenses')
    .select('*')
    .eq('code', licenseCode)
    .eq('is_used', false)
    .single();

  if (licErr || !license) {
    return { message: 'Code de licence invalide ou deja utilise.' };
  }

  // Create organization
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({ name: companyName, license_code: licenseCode })
    .select('id')
    .single();

  if (orgErr || !org) {
    return { message: 'Erreur lors de la creation de l\'organisation.' };
  }

  // Mark license as used
  await admin
    .from('licenses')
    .update({ is_used: true, used_by_org_id: org.id })
    .eq('id', license.id);

  // Create default settings for the organization
  await admin.from('settings').insert({
    id: `settings_${org.id}`,
    organization_id: org.id,
    company_name: companyName,
    legal_name: companyName,
    manager_name: fullName,
  });

  // Create Supabase Auth user
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://' + new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.replace('.supabase.co', '.vercel.app') : ''}/`,
    },
  });

  if (authError || !authData.user) {
    // Cleanup: delete org if auth fails
    await admin.from('settings').delete().eq('organization_id', org.id);
    await admin.from('organizations').delete().eq('id', org.id);
    await admin.from('licenses').update({ is_used: false, used_by_org_id: null }).eq('id', license.id);
    return { message: authError?.message || 'Erreur lors de la creation du compte.' };
  }

  // Create profile as SuperAdmin of the new organization
  const { error: profileErr } = await admin.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName,
    email,
    role: ROLES.SUPER_ADMIN,
    organization_id: org.id,
  });

  if (profileErr) {
    return { message: 'Compte cree mais erreur de profil: ' + profileErr.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

// ─── SIGN OUT ───────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ─── CREATE INVITATION ──────────────────────────────────────────────────
export async function createInvitation(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Non authentifie.' };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== ROLES.SUPER_ADMIN && profile.role !== ROLES.ADMIN)) {
    return { message: 'Vous n\'avez pas les droits pour inviter des membres.' };
  }

  // Generate a random invite token
  const token = crypto.randomUUID();

  const { error } = await admin.from('invitations').insert({
    organization_id: profile.organization_id,
    token,
    invited_by: user.id,
    email: email || null,
  });

  if (error) {
    return { message: 'Erreur lors de la creation de l\'invitation: ' + error.message };
  }

  // Return the invite link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return { 
    message: `Lien d'invitation cree: ${baseUrl}/signup?invite=${token}` 
  };
}
