'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import type { Profile, Invitation } from '@/lib/types';

export async function getTeamMembers(): Promise<{ members: Profile[]; error?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN)) {
    return { members: [], error: 'Non autorise.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, role, organization_id, created_at')
    .eq('organization_id', session.organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    return { members: [], error: error.message };
  }

  return {
    members: (data || []).map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      organizationId: row.organization_id,
      createdAt: row.created_at,
    })),
  };
}

export async function getInvitations(): Promise<{ invitations: Invitation[]; error?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN)) {
    return { invitations: [], error: 'Non autorise.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('invitations')
    .select('*')
    .eq('organization_id', session.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return { invitations: [], error: error.message };
  }

  return {
    invitations: (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      token: row.token,
      invitedBy: row.invited_by,
      email: row.email,
      used: row.used,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    })),
  };
}

export async function updateMemberRole(
  memberId: string,
  newRole: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (!session || session.role !== ROLES.SUPER_ADMIN) {
    return { success: false, message: 'Seul le SuperAdmin peut modifier les roles.' };
  }

  if (memberId === session.id) {
    return { success: false, message: 'Vous ne pouvez pas modifier votre propre role.' };
  }

  const validRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER];
  if (!validRoles.includes(newRole as any)) {
    return { success: false, message: 'Role invalide.' };
  }

  const admin = createAdminClient();

  // Verify member belongs to the same organization
  const { data: member } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', memberId)
    .single();

  if (!member || member.organization_id !== session.organizationId) {
    return { success: false, message: 'Membre non trouve dans votre organisation.' };
  }

  const { error } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/team');
  return { success: true };
}

export async function removeMember(
  memberId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (!session || session.role !== ROLES.SUPER_ADMIN) {
    return { success: false, message: 'Seul le SuperAdmin peut supprimer des membres.' };
  }

  if (memberId === session.id) {
    return { success: false, message: 'Vous ne pouvez pas vous supprimer vous-meme.' };
  }

  const admin = createAdminClient();

  // Verify member belongs to the same organization
  const { data: member } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', memberId)
    .single();

  if (!member || member.organization_id !== session.organizationId) {
    return { success: false, message: 'Membre non trouve dans votre organisation.' };
  }

  // Delete profile (auth user remains but without a profile, they can't access)
  const { error } = await admin
    .from('profiles')
    .delete()
    .eq('id', memberId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/team');
  return { success: true };
}

export async function createInviteLink(
  email?: string
): Promise<{ success: boolean; link?: string; message?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN)) {
    return { success: false, message: "Vous n'avez pas les droits pour inviter des membres." };
  }

  const admin = createAdminClient();
  const token = crypto.randomUUID();

  const { error } = await admin.from('invitations').insert({
    organization_id: session.organizationId,
    token,
    invited_by: session.id,
    email: email || null,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = `${baseUrl}/signup?invite=${token}`;

  revalidatePath('/team');
  return { success: true, link };
}

export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getSession();
  if (!session || (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN)) {
    return { success: false, message: 'Non autorise.' };
  }

  const admin = createAdminClient();

  // Verify invitation belongs to same org
  const { data: invitation } = await admin
    .from('invitations')
    .select('organization_id')
    .eq('id', invitationId)
    .single();

  if (!invitation || invitation.organization_id !== session.organizationId) {
    return { success: false, message: 'Invitation non trouvee.' };
  }

  const { error } = await admin
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/team');
  return { success: true };
}
