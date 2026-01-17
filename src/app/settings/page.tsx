
import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';
import { getSession } from '@/lib/session';
import { AppLayout } from '@/components/AppLayout';
import { redirect } from 'next/navigation';

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

  return (
    <AppLayout user={user} settings={settings}>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      <SettingsContent />
    </AppLayout>
  );
}
