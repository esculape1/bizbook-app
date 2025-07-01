import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';
import { getSession } from '@/lib/session';

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([
    getSettings(),
    getSession()
  ]);

  return <SettingsForm initialSettings={settings} userRole={user?.role} />;
}
