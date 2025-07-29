
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { Expense, Settings } from '@/lib/types';
import { EditExpenseButton } from './EditExpenseButton';
import { DeleteExpenseButton } from './DeleteExpenseButton';
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ExpenseCategoryDetailsDialogProps = {
  expenses: Expense[];
  category: string;
  displayMonth: string;
  settings: Settings;
};

export function ExpenseCategoryDetailsDialog({ expenses, category, displayMonth, settings }: ExpenseCategoryDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sort expenses by date, most recent first
  const sortedExpenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title={`Détails pour ${category}`}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Voir détails</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails des Dépenses - {category}</DialogTitle>
          <DialogDescription>
            Toutes les dépenses pour la catégorie "{category}" durant la période de {displayMonth}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {sortedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'd MMM yyyy', { locale: fr })}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount, settings.currency)}</TableCell>
                    <TableCell>
                        <div className="flex items-center justify-end">
                            <EditExpenseButton expense={expense} currency={settings.currency} />
                            <DeleteExpenseButton id={expense.id} description={expense.description} />
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
