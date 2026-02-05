
import { getClients, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { SettlementsClientPage } from "./SettlementsClientPage";
import { ROLES } from "@/lib/constants";

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

  const canSettle = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
  if (!canSettle) {
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
