
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExpenses, getSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { ExpenseForm } from "./ExpenseForm";
import { getSession } from "@/lib/session";
import { EditExpenseButton } from "./EditExpenseButton";
import { DeleteExpenseButton } from "./DeleteExpenseButton";
import type { User } from "@/lib/types";

export default async function ExpensesPage() {
  const [expenses, settings, user] = await Promise.all([
    getExpenses(),
    getSettings(),
    getSession()
  ]);

  const canEdit = user?.role === 'Admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dépenses"
        actions={canEdit ? <ExpenseForm currency={settings.currency} /> : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
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
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
