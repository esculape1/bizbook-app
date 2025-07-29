
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getExpenses, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { ExpenseForm } from "./ExpenseForm";
import { getSession } from "@/lib/session";
import type { Expense } from "@/lib/types";
import { format, subMonths, getDate } from 'date-fns';
import { fr } from 'date-fns/locale';

type CategoryExpense = {
  category: string;
  total: number;
};

type GroupedExpenses = {
  [key: string]: {
    expensesByCategory: CategoryExpense[];
    total: number;
    displayMonth: string;
  };
};

/**
 * Determines the fiscal month key for a given date.
 * A fiscal month runs from the 25th of the previous month to the 24th of the current month.
 * @param date The date of the expense.
 * @returns A string key like "2024-01" for the fiscal month of January.
 */
const getFiscalMonthKey = (date: Date): string => {
  if (getDate(date) >= 25) {
    // If date is on or after the 25th, it belongs to the *next* month's fiscal period.
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return format(nextMonth, 'yyyy-MM');
  }
  // Otherwise, it belongs to the current month's fiscal period.
  return format(date, 'yyyy-MM');
};


export default async function ExpensesPage() {
  const [expenses, settings, user] = await Promise.all([
    getExpenses(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin';

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const expenseDate = new Date(expense.date);
    const monthKey = getFiscalMonthKey(expenseDate);
    
    if (!acc[monthKey]) {
      const displayDate = new Date(monthKey + '-01'); // Use the 1st of the month for display
      acc[monthKey] = {
        expensesByCategory: [],
        total: 0,
        displayMonth: format(displayDate, 'MMMM yyyy', { locale: fr }),
      };
    }
    
    // Find or create category entry
    let categoryEntry = acc[monthKey].expensesByCategory.find(e => e.category === expense.category);
    if (!categoryEntry) {
      categoryEntry = { category: expense.category, total: 0 };
      acc[monthKey].expensesByCategory.push(categoryEntry);
    }
    
    categoryEntry.total += expense.amount;
    acc[monthKey].total += expense.amount;
    
    return acc;
  }, {} as GroupedExpenses);

  // Sort groups by date descending
  const sortedGroupKeys = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

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
            {sortedGroupKeys.map(monthKey => {
                const group = groupedExpenses[monthKey];
                const fromDate = format(subMonths(new Date(monthKey + '-25'), 1), 'd MMM', { locale: fr });
                const toDate = format(new Date(monthKey + '-24'), 'd MMM yyyy', { locale: fr });

                return (
                    <Card key={monthKey} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="capitalize">{group.displayMonth}</CardTitle>
                            <CardDescription>Période du {fromDate} au {toDate}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <Table>
                                <TableBody>
                                {group.expensesByCategory
                                    .sort((a,b) => b.total - a.total)
                                    .map((expCat) => (
                                    <TableRow key={expCat.category}>
                                        <TableCell className="font-medium">{expCat.category}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(expCat.total, settings.currency)}</TableCell>
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
