
import { getClients, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { SettlementsClientPage } from "./SettlementsClientPage";
import { ROLES } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export default async function SettlementsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const [settings, clients] = await Promise.all([
    getSettings(user.organizationId),
    getClients(user.organizationId),
  ]);

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
