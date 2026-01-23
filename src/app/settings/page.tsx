
import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';
import { getSession } from '@/lib/session';
import { AppLayout } from '@/app/AppLayout';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

async function SettingsContent() {
  const [settings, user] = await Promise.all([
    getSettings(),
    getSession()
  ]);

  if (!settings) {
      return null; // Or some error/loading state
  }

  return <SettingsForm initialSettings={settings} userRole={user?.role} />;
}


export default async function SettingsPage() {
  const [user, settings] = await Promise.all([getSession(), getSettings()]);

  if (!user || !settings) {
    redirect('/login');
  }

  if (user.role !== ROLES.SUPER_ADMIN) {
    redirect('/');
  }

  return (
    <AppLayout user={user} settings={settings}>
      <SettingsContent />
    </AppLayout>
  );
}
