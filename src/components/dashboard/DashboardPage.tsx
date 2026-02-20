
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { DollarSign, Users, Box, Receipt, Wallet } from "lucide-react";
import { getProducts, getInvoices, getSettings, getExpenses, getClients, calculateDashboardStats } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { OverdueInvoicesTable } from "@/components/dashboard/OverdueInvoicesTable";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [invoices, expenses, clients, products, settings] = await Promise.all([
    getInvoices(),
    getExpenses(),
    getClients(),
    getProducts(),
    getSettings()
  ]);

  const stats = calculateDashboardStats(invoices, expenses, clients, products);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <DateTimeDisplay />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="Chiffre d'affaires" value={formatCurrency(stats.totalRevenue, settings.currency)} icon={<DollarSign />} className="bg-emerald-500 text-white" />
        <StatCard title="Dépenses" value={formatCurrency(stats.totalExpenses, settings.currency)} icon={<Wallet />} className="bg-rose-500 text-white" />
        <StatCard title="Clients Actifs" value={stats.activeClients.toString()} icon={<Users />} className="bg-sky-500 text-white" />
        <StatCard title="Produits" value={stats.productCount.toString()} icon={<Box />} className="bg-amber-500 text-white" />
        <StatCard title="Total Impayé" value={formatCurrency(stats.totalDue, settings.currency)} icon={<Receipt />} className="bg-indigo-500 text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart invoices={invoices} currency={settings.currency} />
        </div>
        <div className="lg:col-span-1">
          <LowStockTable products={products} />
        </div>
      </div>
      <OverdueInvoicesTable invoices={invoices} settings={settings} />
    </div>
  );
}
