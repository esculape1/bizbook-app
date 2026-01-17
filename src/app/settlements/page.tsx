
import { getClients, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/components/AppLayout";
import { redirect } from "next/navigation";
import { SettlementsClientPage } from "./SettlementsClientPage";

export const dynamic = 'force-dynamic';

export default async function SettlementsPage() {
  const [user, settings, clients] = await Promise.all([
    getSession(),
    getSettings(),
    getClients(),
  ]);

  if (!user || !settings) {
    redirect('/login');
  }

  const canSettle = user.role === 'Admin' || user.role === 'SuperAdmin';
  if (!canSettle) {
    // Or show a disabled page
    redirect('/');
  }

  return (
    <AppLayout
      user={user}
      settings={settings}
    >
      <SettlementsClientPage clients={clients} settings={settings} />
    </AppLayout>
  );
}
