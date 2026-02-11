
import { getClients, getSettings } from '@/lib/data';
import { ReportGenerator } from './ReportGenerator';
import { AppLayout } from '@/app/AppLayout';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  if (user.role !== ROLES.SUPER_ADMIN) {
    redirect('/');
  }

  const [clients, settings] = await Promise.all([
    getClients(user.organizationId),
    getSettings(user.organizationId),
  ]);

  return (
    <AppLayout user={user} settings={settings}>
      <ReportGenerator clients={clients} settings={settings} />
    </AppLayout>
  );
}
