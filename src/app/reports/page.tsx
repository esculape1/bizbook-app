
import { getClients, getSettings } from '@/lib/data';
import { ReportGenerator } from './ReportGenerator';
import { AppLayout } from '@/components/AppLayout';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

async function ReportsContent() {
  const [clients, settings] = await Promise.all([
    getClients(),
    getSettings()
  ]);
  
  return <ReportGenerator clients={clients} settings={settings} />;
}

export default async function ReportsPage() {
  const [user, settings] = await Promise.all([getSession(), getSettings()]);

  if (!user || !settings) {
    redirect('/login');
  }

  return (
    <AppLayout user={user} settings={settings} pageHeader={<PageHeader title="Rapports" />}>
      <ReportsContent />
    </AppLayout>
  );
}
