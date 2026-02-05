
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { Expense, Settings } from '@/lib/types';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { DeleteExpenseButton } from './DeleteExpenseButton';
import { MoreVertical, Pencil, Calendar, Receipt, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type ExpenseCategoryDetailsDialogProps = {
  expenses: Expense[];
  category: string;
  displayMonth: string;
  settings: Settings;
};

export function ExpenseCategoryDetailsDialog({ expenses, category, displayMonth, settings }: ExpenseCategoryDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const sortedExpenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl hover:bg-current/10 transition-colors" title={`Détails pour ${category}`}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Voir détails</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-xl bg-primary text-white">
                        <Receipt className="size-5" />
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">{category}</DialogTitle>
                </div>
                <DialogDescription className="font-bold flex items-center gap-2 text-primary/70">
                    <Calendar className="size-3" />
                    Période de {displayMonth} • {expenses.length} dépense(s)
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-6">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Désignation</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Montant</TableHead>
                        <TableHead className="text-right w-[100px] font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {sortedExpenses.map((expense) => (
                    <TableRow key={expense.id} className="group hover:bg-primary/5 border-l-4 border-l-transparent hover:border-l-primary transition-all">
                    <TableCell className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                        {format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-extrabold text-sm uppercase tracking-tight">
                        {expense.description}
                    </TableCell>
                    <TableCell className="text-right font-black text-primary">
                        {formatCurrency(expense.amount, settings.currency)}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center justify-end gap-1">
                            <ExpenseFormDialog expense={expense} currency={settings.currency}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-amber-100" title="Modifier la dépense">
                                  <Pencil className="h-4 w-4 text-amber-600" />
                                </Button>
                            </ExpenseFormDialog>
                            <DeleteExpenseButton id={expense.id} description={expense.description} />
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
        
        <DialogFooter className="p-6 bg-muted/30 border-t">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="font-bold">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
