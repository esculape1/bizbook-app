import { getClients, getSettings } from '@/lib/data';
import { ReportGenerator } from './ReportGenerator';

export default async function ReportsPage() {
  const clients = await getClients();
  const settings = await getSettings();

  return <ReportGenerator clients={clients} settings={settings} />;
}
