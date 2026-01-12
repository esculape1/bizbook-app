
import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';
import { getSession } from '@/lib/session';
import { AppLayout } from '@/components/AppLayout';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

async function SettingsContent() {
  const [settings, user] = await Promise.all([
    getSettings(),
    getSession()
  ]);

  return <SettingsForm initialSettings={settings} userRole={user?.role} />;
}


export default async function SettingsPage() {
  const [user, settings] = await Promise.all([getSession(), getSettings()]);

  if (!user || !settings) {
    redirect('/login');
  }

  return (
    <AppLayout user={user} settings={settings} pageHeader={<PageHeader title="Paramètres" />}>
      <SettingsContent />
    </AppLayout>
  );
}
