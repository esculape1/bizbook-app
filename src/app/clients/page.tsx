import { getClients } from "@/lib/data";
import ClientsList from "./ClientsList";

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientsList clients={clients} />;
}
