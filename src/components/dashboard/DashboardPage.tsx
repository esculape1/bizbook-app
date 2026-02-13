
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { DollarSign, Users, Box, Receipt, Wallet, AlertTriangle, TrendingUp } from "lucide-react";
import { getProducts, getInvoices, getSettings, getExpenses, getClients, calculateDashboardStats } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { OverdueInvoicesTable } from "@/components/dashboard/OverdueInvoicesTable";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    let fiscalYearStartDate: Date;

    // Calcul de la date de début d'exercice (25 Décembre de l'année précédente)
    if (now.getMonth() < 11 || (now.getMonth() === 11 && now.getDate() < 25)) {
      fiscalYearStartDate = new Date(currentYear - 1, 11, 25, 0, 0, 0, 0);
    } else {
      fiscalYearStartDate = new Date(currentYear, 11, 25, 0, 0, 0, 0);
    }

    const startDateIso = fiscalYearStartDate.toISOString();

    // On récupère tout en UNE SEULE FOIS avec filtrage Firestore pour les dépenses
    const [invoices, expenses, clients, products, settings] = await Promise.all([
      getInvoices(), // On garde tout pour les alertes de recouvrement historiques
      getExpenses(startDateIso), // Filtrage à la source pour les quotas
      getClients(),
      getProducts(),
      getSettings(),
    ]);

    // Calcul des stats localement pour économiser les lectures
    const stats = calculateDashboardStats(invoices, expenses, clients, products, startDateIso);

    return { stats, products, invoices, settings, startDateIso, error: null };
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return { stats: null, products: [], invoices: [], settings: null, startDateIso: '', error: error.message };
  }
}

export default async function DashboardPage() {
  const { stats, products, invoices, settings, startDateIso, error } = await getDashboardData();
  
  if (error || !settings || !stats) {
    return (
       <Alert variant="destructive" className="mt-10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error || "Impossible de charger les données."}</AlertDescription>
      </Alert>
    )
  }

  const currentYear = new Date().getFullYear();
  const invoicesForFiscalYear = invoices.filter(inv => inv.date >= startDateIso);

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Tableau de Bord</h1>
              <p className="text-muted-foreground mt-1">Exercice fiscal débuté le 25 Déc. {currentYear - 1}</p>
          </div>
          <div className="glass-card border px-6 py-3 rounded-2xl shadow-premium">
              <DateTimeDisplay />
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Chiffre d'affaires" 
          value={formatCurrency(stats.totalRevenue, settings.currency)} 
          icon={<DollarSign className="size-6" />} 
          description="NET (APRÈS RETENUE)"
          className="bg-emerald-600 text-white"
        />
        <StatCard 
          title="Total Dépenses" 
          value={formatCurrency(stats.totalExpenses, settings.currency)} 
          icon={<Wallet className="size-6" />}
          description="SUR L'EXERCICE"
          className="bg-rose-600 text-white"
        />
        <StatCard 
          title="Clients Actifs" 
          value={stats.activeClients.toString()} 
          icon={<Users className="size-6" />}
          description="PORTEFEUILLE"
          className="bg-sky-600 text-white"
        />
        <StatCard 
          title="Produits" 
          value={stats.productCount.toString()} 
          icon={<Box className="size-6" />}
          description="RÉFÉRENCES"
          className="bg-amber-600 text-white"
        />
        <StatCard 
          title="Total Impayé" 
          value={formatCurrency(stats.totalDue, settings.currency)} 
          icon={<Receipt className="size-6" />}
          description="RESTE À PAYER"
          className="bg-indigo-600 text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card className="shadow-premium border-none h-full bg-card/50 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10 py-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary text-white">
                            <TrendingUp className="size-5" />
                        </div>
                        <CardTitle className="text-xl font-bold text-primary">Ventes de l'Exercice</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <SalesChart invoices={invoicesForFiscalYear} currency={settings.currency} />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <LowStockTable products={products} />
        </div>
      </div>
      <OverdueInvoicesTable invoices={invoices} settings={settings} />
    </div>
  );
}
