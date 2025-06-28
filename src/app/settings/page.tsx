import { getSettings } from '@/lib/data';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const settings = await getSettings();

  return <SettingsForm initialSettings={settings} />;
}
