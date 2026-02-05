
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getExpenses, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { formatCurrency, cn } from "@/lib/utils";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import type { Expense } from "@/lib/types";
import { format, getYear, getMonth, set } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExpenseCategoryDetailsDialog } from "./ExpenseCategoryDetailsDialog";
import { AppLayout } from "@/app/AppLayout";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet, Calendar, ArrowDownRight, MoreHorizontal, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

type CategoryExpense = {
  category: string;
  total: number;
  expenses: Expense[];
};

type GroupedExpenses = {
  [key: string]: {
    expensesByCategory: CategoryExpense[];
    total: number;
    displayMonth: string;
    allExpensesInGroup: Expense[];
  };
};

const getFiscalMonthKey = (date: Date): string => {
  let year = getYear(date);
  let month = getMonth(date); // 0-11
  if (date.getDate() >= 25) {
    const nextMonthDate = new Date(year, month + 1, 1);
    month = getMonth(nextMonthDate);
    year = getYear(nextMonthDate);
  }
  return `${year}-${(month + 1).toString().padStart(2, '0')}`;
};

async function ExpensesContent() {
  const [expenses, settings, user] = await Promise.all([
    getExpenses(),
    getSettings(),
    getSession()
  ]);

  if (!user || !settings) {
    return null;
  }

  const canEdit = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const expenseDate = new Date(expense.date);
    const monthKey = getFiscalMonthKey(expenseDate);
    
    if (!acc[monthKey]) {
      const year = parseInt(monthKey.split('-')[0], 10);
      const month = parseInt(monthKey.split('-')[1], 10) - 1;
      const displayDate = set(new Date(), { year, month, date: 1 });
      acc[monthKey] = {
        expensesByCategory: [],
        total: 0,
        displayMonth: format(displayDate, 'MMMM yyyy', { locale: fr }),
        allExpensesInGroup: [],
      };
    }
    
    acc[monthKey].allExpensesInGroup.push(expense);
    let categoryEntry = acc[monthKey].expensesByCategory.find(e => e.category === expense.category);
    if (!categoryEntry) {
      categoryEntry = { category: expense.category, total: 0, expenses: [] };
      acc[monthKey].expensesByCategory.push(categoryEntry);
    }
    
    categoryEntry.total += expense.amount;
    categoryEntry.expenses.push(expense);
    acc[monthKey].total += expense.amount;
    
    return acc;
  }, {} as GroupedExpenses);

  const sortedGroupKeys = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));
  
  const cardColors = [
      "bg-sky-500/5 border-sky-200 text-sky-900",
      "bg-emerald-500/5 border-emerald-200 text-emerald-900",
      "bg-amber-500/5 border-amber-200 text-amber-900",
      "bg-rose-500/5 border-rose-200 text-rose-900",
      "bg-violet-500/5 border-violet-200 text-violet-900",
      "bg-indigo-500/5 border-indigo-200 text-indigo-900",
  ];

  return (
    <div className="flex flex-col gap-6">
      {sortedGroupKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-3xl bg-card/50">
          <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground">Aucune dépense</h3>
          <p className="text-xs text-muted-foreground mt-1">Enregistrez vos premières dépenses pour suivre votre rentabilité.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedGroupKeys.map((monthKey, index) => {
                const group = groupedExpenses[monthKey];
                const year = parseInt(monthKey.split('-')[0], 10);
                const month = parseInt(monthKey.split('-')[1], 10) - 1;
                
                let fromDate = set(new Date(), { year, month: month - 1, date: 25 });
                let toDate = set(new Date(), { year, month, date: 24 });
                
                const fromDateDisplay = format(fromDate, 'd MMM', { locale: fr });
                const toDateDisplay = format(toDate, 'd MMM yyyy', { locale: fr });

                return (
                    <Card key={monthKey} className={cn(
                        "flex flex-col border shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden", 
                        cardColors[index % cardColors.length]
                    )}>
                        <CardHeader className="p-4 pb-3 relative space-y-0">
                            <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 opacity-60" />
                                        <CardTitle className="capitalize text-lg font-black tracking-tight leading-none">{group.displayMonth}</CardTitle>
                                    </div>
                                    <CardDescription className="text-current/60 font-bold text-[9px] uppercase tracking-wider">
                                        {fromDateDisplay} - {toDateDisplay}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-white/50 border-current/10 font-black text-[8px] h-5 px-1.5">
                                    {group.allExpensesInGroup.length} OP.
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow px-2 py-0">
                            <div className="space-y-0.5">
                                {group.expensesByCategory
                                    .sort((a,b) => b.total - a.total)
                                    .map((expCat) => (
                                    <div key={expCat.category} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/40 transition-colors group/item">
                                        <div className="flex items-center gap-2">
                                            {canEdit ? (
                                              <ExpenseCategoryDetailsDialog 
                                                expenses={expCat.expenses}
                                                category={expCat.category}
                                                displayMonth={group.displayMonth}
                                                settings={settings}
                                              />
                                            ) : (
                                                <div className="p-1 rounded-lg bg-current/5"><MoreHorizontal className="size-3 opacity-40" /></div>
                                            )}
                                            <span className="font-bold text-xs uppercase tracking-tight truncate max-w-[100px]">{expCat.category}</span>
                                        </div>
                                        <span className="font-black text-xs whitespace-nowrap">{formatCurrency(expCat.total, settings.currency)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="mt-auto border-t border-current/10 p-4 py-3 bg-current/[0.02]">
                           <div className="w-full flex justify-between items-center">
                                <div className="space-y-0">
                                    <p className="text-[8px] font-black uppercase tracking-[0.1em] opacity-50 leading-none">Total Mensuel</p>
                                    <p className="text-lg font-black tracking-tighter">{formatCurrency(group.total, settings.currency)}</p>
                                </div>
                                <div className="p-1.5 rounded-xl bg-current/10 shrink-0">
                                    <ArrowDownRight className="size-4 opacity-60" />
                                </div>
                           </div>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
      )}
    </div>
  );
}

export default async function ExpensesPage() {
  const [user, settings] = await Promise.all([getSession(), getSettings()]);

  if (!user || !settings) {
    redirect('/login');
  }

  const canEdit = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  return (
    <AppLayout 
      user={user} 
      settings={settings}
    >
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Wallet className="size-6 text-primary" />
                    Gestion des Dépenses
                </h1>
                <p className="text-muted-foreground text-xs font-medium">Suivez et catégorisez vos sorties de fonds mensuelles.</p>
            </div>
            {canEdit && (
              <ExpenseFormDialog currency={settings.currency}>
                <Button className="h-10 px-5 font-black uppercase tracking-tight shadow-lg shadow-primary/10 active:scale-95 transition-all text-xs">
                  <PlusCircle className="mr-2 size-4" />
                  Nouvelle Dépense
                </Button>
              </ExpenseFormDialog>
            )}
        </div>
      <ExpensesContent />
    </AppLayout>
  );
}
