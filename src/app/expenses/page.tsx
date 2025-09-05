
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getExpenses, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { formatCurrency, cn } from "@/lib/utils";
import { ExpenseForm } from "./ExpenseForm";
import type { Expense } from "@/lib/types";
import { format, subMonths, getDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExpenseCategoryDetailsDialog } from "./ExpenseCategoryDetailsDialog";

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
  if (getDate(date) >= 25) {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return format(nextMonth, 'yyyy-MM');
  }
  return format(date, 'yyyy-MM');
};

export default async function ExpensesPage() {
  const [expenses, settings, user] = await Promise.all([
    getExpenses(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const expenseDate = new Date(expense.date);
    const monthKey = getFiscalMonthKey(expenseDate);
    
    if (!acc[monthKey]) {
      const displayDate = new Date(monthKey + '-01');
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
      "bg-sky-500/10 border-sky-500/20 text-sky-800",
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-800",
      "bg-amber-500/10 border-amber-500/20 text-amber-800",
      "bg-rose-500/10 border-rose-500/20 text-rose-800",
      "bg-violet-500/10 border-violet-500/20 text-violet-800",
      "bg-teal-500/10 border-teal-500/20 text-teal-800",
  ];


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dépenses"
        actions={canEdit ? <ExpenseForm currency={settings.currency} /> : undefined}
      />

      {sortedGroupKeys.length === 0 ? (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>Aucune dépense enregistrée.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedGroupKeys.map((monthKey, index) => {
                const group = groupedExpenses[monthKey];
                const fromDate = format(subMonths(new Date(monthKey + '-25'), 1), 'd MMM', { locale: fr });
                const toDate = format(new Date(monthKey + '-24'), 'd MMM yyyy', { locale: fr });

                return (
                    <Card key={monthKey} className={cn("flex flex-col", cardColors[index % cardColors.length])}>
                        <CardHeader>
                            <CardTitle className="capitalize text-lg">{group.displayMonth}</CardTitle>
                            <CardDescription className="text-current/70">Période du {fromDate} au {toDate}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <Table>
                                <TableBody>
                                {group.expensesByCategory
                                    .sort((a,b) => b.total - a.total)
                                    .map((expCat) => (
                                    <TableRow key={expCat.category}>
                                        <TableCell className="font-medium p-2 flex items-center gap-2">
                                            {canEdit && (
                                              <ExpenseCategoryDetailsDialog 
                                                expenses={expCat.expenses}
                                                category={expCat.category}
                                                displayMonth={group.displayMonth}
                                                settings={settings}
                                              />
                                            )}
                                            {expCat.category}
                                        </TableCell>
                                        <TableCell className="text-right p-2">{formatCurrency(expCat.total, settings.currency)}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="mt-auto border-t pt-4">
                           <div className="w-full flex justify-between items-center text-lg font-bold">
                                <span>Total du mois</span>
                                <span>{formatCurrency(group.total, settings.currency)}</span>
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
