
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { DollarSign, Users, Box, Receipt, Wallet, AlertTriangle } from "lucide-react";
import { getDashboardStats, getProducts, getInvoices, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { OverdueInvoicesTable } from "@/components/dashboard/OverdueInvoicesTable";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    // These calls are now optimized with server-side caching
    const [stats, products, invoices, settings] = await Promise.all([
      getDashboardStats(),
      getProducts(),
      getInvoices(),
      getSettings(),
    ]);
    return { stats, products, invoices, settings, error: null };
  } catch (error: any) {
    console.error("Erreur de récupération des données du tableau de bord:", error);
    return { 
      stats: null, 
      products: [], 
      invoices: [], 
      settings: null, 
      error: error.message || "Une erreur inconnue est survenue." 
    };
  }
}


export default async function DashboardPage() {
  const { stats, products, invoices, settings, error } = await getDashboardData();
  
  if (error || !settings || !stats) {
    return (
       <Alert variant="destructive" className="mt-10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur de connexion à la base de données</AlertTitle>
        <AlertDescription>
          <p>Impossible de récupérer les données de l'application. Cela peut être dû à un problème de connexion ou à un dépassement des quotas d'utilisation de Firebase.</p>
          <p className="mt-2 text-xs">Détail de l'erreur : {error}</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 border rounded-lg p-4 bg-gradient-to-r from-primary/5 via-card to-primary/5 shadow-inner">
          {/* Left spacer for desktop */}
          <div className="hidden md:block md:flex-1"></div>

          {/* Title (centered) */}
          <div className="text-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider">Tableau de bord</h1>
          </div>
          
          {/* Date/Time (right aligned on desktop) */}
          <div className="md:flex-1 md:text-right">
              <DateTimeDisplay />
          </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
          title="Chiffre d'affaires" 
          value={formatCurrency(stats.totalRevenue, settings.currency)} 
          icon={<DollarSign />} 
          description="Total des paiements reçus"
          className="bg-green-500/10 text-green-700 border-green-500/20"
        />
        <StatCard 
          title="Total Dépenses" 
          value={formatCurrency(stats.totalExpenses, settings.currency)} 
          icon={<Wallet />}
          description="Total des dépenses enregistrées"
          className="bg-red-500/10 text-red-700 border-red-500/20"
        />
        <StatCard 
          title="Clients Actifs" 
          value={stats.activeClients.toString()} 
          icon={<Users />}
          description={`${stats.totalClients} clients au total`}
          className="bg-blue-500/10 text-blue-700 border-blue-500/20"
        />
        <StatCard 
          title="Produits en Stock" 
          value={stats.productCount.toString()} 
          icon={<Box />}
          description="Nombre de références uniques"
          className="bg-orange-500/10 text-orange-700 border-orange-500/20"
        />
        <StatCard 
          title="Total Impayé" 
          value={formatCurrency(stats.totalDue, settings.currency)} 
          icon={<Receipt />}
          description={`${stats.unpaidInvoicesCount} factures non soldées`}
          className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card className="bg-muted/30 h-full">
                <CardHeader className="text-center">
                    <CardTitle>Aperçu des Ventes</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesChart invoices={invoices} products={products} currency={settings.currency} />
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <OverdueInvoicesTable invoices={invoices} />
          <LowStockTable products={products} />
        </div>
      </div>
    </div>
  );
}
