
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { DollarSign, Users, Box, Receipt, Wallet } from "lucide-react";
import { getClients, getProducts, getInvoices, getExpenses, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { OverdueInvoicesTable } from "@/components/dashboard/OverdueInvoicesTable";

export default async function DashboardPage() {
  const [clients, products, invoices, expenses, settings] = await Promise.all([
    getClients(),
    getProducts(),
    getInvoices(),
    getExpenses(),
    getSettings(),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.totalAmount - (inv.amountPaid || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center border rounded-lg p-4">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
          title="Chiffre d'affaires" 
          value={formatCurrency(totalRevenue, settings.currency)} 
          icon={<DollarSign />} 
          description="Total des paiements reçus"
          className="bg-green-500/10 text-green-700 border-green-500/20"
        />
        <StatCard 
          title="Total Dépenses" 
          value={formatCurrency(totalExpenses, settings.currency)} 
          icon={<Wallet />}
          description="Total des dépenses enregistrées"
          className="bg-red-500/10 text-red-700 border-red-500/20"
        />
        <StatCard 
          title="Clients Actifs" 
          value={clients.filter(c => c.status === 'Active').length.toString()} 
          icon={<Users />}
          description={`${clients.length} clients au total`}
          className="bg-blue-500/10 text-blue-700 border-blue-500/20"
        />
        <StatCard 
          title="Produits en Stock" 
          value={products.length.toString()} 
          icon={<Box />}
          description="Nombre de références uniques"
          className="bg-orange-500/10 text-orange-700 border-orange-500/20"
        />
        <StatCard 
          title="Total Impayé" 
          value={formatCurrency(totalDue, settings.currency)} 
          icon={<Receipt />}
          description={`${invoices.filter(i => i.status !== 'Paid').length} factures non soldées`}
          className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-muted/30">
          <CardHeader className="text-center">
            <CardTitle>Aperçu des Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart invoices={invoices} products={products} currency={settings.currency} />
          </CardContent>
        </Card>
        
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <OverdueInvoicesTable invoices={invoices} />
          <LowStockTable products={products} />
        </div>

      </div>
    </div>
  );
}
