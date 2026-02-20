
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { DollarSign, Users, Box, Receipt, Wallet } from "lucide-react";
import { getProducts, getInvoices, getSettings, getExpenses, getClients, calculateDashboardStats } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { OverdueInvoicesTable } from "@/components/dashboard/OverdueInvoicesTable";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { set, getYear, getMonth } from 'date-fns';
import { db } from '@/lib/firebase-admin';
import type { Invoice, Expense } from '@/lib/types';

export const dynamic = 'force-dynamic';

const getFiscalStartDate = () => {
  const now = new Date();
  let year = getYear(now);
  let month = getMonth(now); // 0-11
  
  // Si on est avant le 25 du mois, l'exercice a commencé le 25 du mois précédent
  if (now.getDate() < 25) {
    const prevMonthDate = new Date(year, month - 1, 25);
    return prevMonthDate;
  }
  
  // Sinon l'exercice a commencé le 25 de ce mois
  return new Date(year, month, 25);
};

export default async function DashboardPage() {
  const fiscalStart = getFiscalStartDate();
  const startIso = fiscalStart.toISOString();

  // Optimisation : On ne lit que les documents de l'exercice fiscal en cours
  const [invSnap, expSnap, clients, products, settings] = await Promise.all([
    db.collection('invoices').where('date', '>=', startIso).get(),
    db.collection('expenses').where('date', '>=', startIso).get(),
    getClients(),
    getProducts(),
    getSettings()
  ]);

  const invoices = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  const expenses = expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

  const stats = calculateDashboardStats(invoices, expenses, clients, products);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Tableau de Bord</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Exercice fiscal depuis le 25 du mois
            </p>
          </div>
          <DateTimeDisplay />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="CA (Net à Payer)" value={formatCurrency(stats.totalRevenue, settings.currency)} icon={<DollarSign />} className="bg-emerald-600 text-white" description="Période en cours" />
        <StatCard title="Dépenses" value={formatCurrency(stats.totalExpenses, settings.currency)} icon={<Wallet />} className="bg-rose-600 text-white" description="Période en cours" />
        <StatCard title="Clients Actifs" value={stats.activeClients.toString()} icon={<Users />} className="bg-sky-600 text-white" />
        <StatCard title="Produits" value={stats.productCount.toString()} icon={<Box />} className="bg-amber-600 text-white" />
        <StatCard title="Total Impayé Net" value={formatCurrency(stats.totalDue, settings.currency)} icon={<Receipt />} className="bg-indigo-600 text-white" description="Global" />
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
