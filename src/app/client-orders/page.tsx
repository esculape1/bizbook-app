
import { getClientOrders, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { ClientOrdersList } from "./ClientOrdersList";
import { ROLES } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export default async function ClientOrdersPage() {
  const [user, settings, orders] = await Promise.all([
    getSession(),
    getSettings(),
    getClientOrders(),
  ]);

  if (!user || !settings) {
    redirect('/login');
  }

  const canAccess = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER;
  if (!canAccess) {
    redirect('/');
  }

  return (
    <AppLayout
      user={user}
      settings={settings}
    >
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Commandes Clients</h1>
        </div>
      <ClientOrdersList orders={orders} settings={settings} />
    </AppLayout>
  );
}
