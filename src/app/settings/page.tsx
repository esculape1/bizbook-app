
import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';
import { getSession } from '@/lib/session';
import { AppLayout } from '@/app/AppLayout';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  if (user.role !== ROLES.SUPER_ADMIN) {
    redirect('/');
  }

  const settings = await getSettings(user.organizationId);

  return (
    <AppLayout user={user} settings={settings}>
      <SettingsForm initialSettings={settings} userRole={user.role} />
    </AppLayout>
  );
}
