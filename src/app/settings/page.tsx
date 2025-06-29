import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const user = await getSession();
  if (user?.role !== 'Admin') {
    redirect('/');
  }

  const settings = await getSettings();

  return <SettingsForm initialSettings={settings} />;
}
