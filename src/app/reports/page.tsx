
import { getClients, getSettings } from '@/lib/data';
import { ReportGenerator } from './ReportGenerator';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [clients, settings] = await Promise.all([
    getClients(),
    getSettings()
  ]);

  return <ReportGenerator clients={clients} settings={settings} />;
}
