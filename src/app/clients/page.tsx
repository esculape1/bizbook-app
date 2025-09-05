
import { getClients } from "@/lib/data";
import ClientsList from "./ClientsList";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const clients = await getClients();
  const user = await getSession();

  return <ClientsList clients={clients} userRole={user?.role} />;
}
