import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/app/AppLayout';
import { ROLES } from '@/lib/constants';
import { getTeamMembers, getInvitations } from './actions';
import { TeamDashboard } from './TeamDashboard';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  if (user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.ADMIN) {
    redirect('/');
  }

  const [settings, { members }, { invitations }] = await Promise.all([
    getSettings(user.organizationId),
    getTeamMembers(),
    getInvitations(),
  ]);

  return (
    <AppLayout user={user} settings={settings}>
      <TeamDashboard
        members={members}
        invitations={invitations}
        currentUser={user}
      />
    </AppLayout>
  );
}
