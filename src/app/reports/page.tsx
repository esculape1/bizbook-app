import { getClients, getSettings } from '@/lib/data';
import { ReportGenerator } from './ReportGenerator';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const user = await getSession();
  if (user?.role !== 'Admin') {
    redirect('/');
  }
  
  const [clients, settings] = await Promise.all([
    getClients(),
    getSettings()
  ]);

  return <ReportGenerator clients={clients} settings={settings} />;
}
