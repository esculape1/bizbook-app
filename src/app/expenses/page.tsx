
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getExpenses, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { ExpenseForm } from "./ExpenseForm";
import { getSession } from "@/lib/session";
import { EditExpenseButton } from "./EditExpenseButton";
import { DeleteExpenseButton } from "./DeleteExpenseButton";
import type { User, Expense } from "@/lib/types";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type GroupedExpenses = {
  [key: string]: {
    expenses: Expense[];
    total: number;
    date: Date;
  };
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
    const monthKey = format(expenseDate, 'yyyy-MM');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        expenses: [],
        total: 0,
        date: expenseDate,
      };
    }
    
    acc[monthKey].expenses.push(expense);
    acc[monthKey].total += expense.amount;
    
    return acc;
  }, {} as GroupedExpenses);

  // Sort groups by date descending
  const sortedGroupKeys = Object.keys(groupedExpenses).sort().reverse();

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
        <div className="space-y-8">
            {sortedGroupKeys.map(monthKey => {
                const group = groupedExpenses[monthKey];
                const monthName = format(group.date, 'MMMM yyyy', { locale: fr });

                return (
                    <Card key={monthKey}>
                        <CardHeader>
                            <CardTitle className="capitalize">{monthName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/6">Date</TableHead>
                                <TableHead className="w-2/5">Description</TableHead>
                                <TableHead className="w-1/5">Catégorie</TableHead>
                                <TableHead className="text-right w-1/6">Montant</TableHead>
                                {canEdit && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {group.expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                <TableCell>{new Date(expense.date).toLocaleDateString('fr-FR')}</TableCell>
                                <TableCell className="font-medium">{expense.description}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(expense.amount, settings.currency)}</TableCell>
                                {canEdit && (
                                    <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <EditExpenseButton expense={expense} currency={settings.currency} />
                                        <DeleteExpenseButton id={expense.id} description={expense.description} />
                                    </div>
                                    </TableCell>
                                )}
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={canEdit ? 4 : 3} className="text-right font-bold text-lg">Total du mois</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(group.total, settings.currency)}</TableCell>
                                    {canEdit && <TableCell></TableCell>}
                                </TableRow>
                            </TableFooter>
                        </Table>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      )}
    </div>
  );
}
