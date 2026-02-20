
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { DollarSign, Users, Box, Receipt, Wallet } from "lucide-react";
import { getProducts, getSettings, getClients, calculateDashboardStats } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { OverdueInvoicesTable } from "@/components/dashboard/OverdueInvoicesTable";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { db } from '@/lib/firebase-admin';
import type { Invoice, Expense } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Calcul du début de l'exercice fiscal annuel.
 * L'exercice 2026 commence le 25 décembre 2025 et finit le 24 décembre 2026.
 */
const getFiscalStartDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  // Le 25 Décembre de l'année en cours
  const cutoffThisYear = new Date(year, 11, 25); // 11 = Décembre (0-indexed)
  
  // Si on est avant le 25 décembre, l'exercice a commencé le 25 décembre de l'année dernière
  if (now < cutoffThisYear) {
    return new Date(year - 1, 11, 25);
  }
  
  // Sinon, un nouvel exercice vient de commencer le 25 décembre de cette année
  return cutoffThisYear;
};

export default async function DashboardPage() {
  const fiscalStart = getFiscalStartDate();
  const startIso = fiscalStart.toISOString();

  // Optimisation : On ne lit que les documents de l'exercice fiscal annuel en cours
  const [invSnap, expSnap, clients, products, settings] = await Promise.all([
    db.collection('invoices').where('date', '>=', startIso).get(),
    db.collection('expenses').where('date', '>=', startIso).get(),
    getClients(),
    getProducts(),
    getSettings()
  ]);

  if (!settings) return null;

  const invoices = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  const expenses = expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

  const stats = calculateDashboardStats(invoices, expenses, clients, products);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Tableau de Bord</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Exercice Annuel (depuis le {fiscalStart.toLocaleDateString('fr-FR')})
            </p>
          </div>
          <DateTimeDisplay />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard title="CA (Net à Payer)" value={formatCurrency(stats.totalRevenue, settings.currency)} icon={<DollarSign />} className="bg-emerald-600 text-white" description="Exercice en cours" />
        <StatCard title="Dépenses" value={formatCurrency(stats.totalExpenses, settings.currency)} icon={<Wallet />} className="bg-rose-600 text-white" description="Exercice en cours" />
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
