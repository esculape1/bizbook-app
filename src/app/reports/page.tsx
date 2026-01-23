
import { getClients, getSettings } from '@/lib/data';
import { ReportGenerator } from './ReportGenerator';
import { AppLayout } from '@/app/AppLayout';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

async function ReportsContent() {
  const [clients, settings] = await Promise.all([
    getClients(),
    getSettings()
  ]);
  
  if (!settings) {
      return null;
  }
  
  return <ReportGenerator clients={clients} settings={settings} />;
}

export default async function ReportsPage() {
  const [user, settings] = await Promise.all([getSession(), getSettings()]);

  if (!user || !settings) {
    redirect('/login');
  }

  if (user.role !== ROLES.SUPER_ADMIN) {
    redirect('/');
  }

  return (
    <AppLayout user={user} settings={settings}>
      <h1 className="text-2xl font-bold">Rapports</h1>
      <ReportsContent />
    </AppLayout>
  );
}
