'use server';

import { getInvoices, getExpenses } from '@/lib/data';
import type { ReportData } from '@/lib/types';
import { isWithinInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export async function generateReport(
    dateRange: DateRange | undefined, 
    clientId: string,
    clientName: string,
): Promise<ReportData | { error: string }> {
    if (!dateRange?.from || !dateRange?.to) {
      return { error: "La période est requise." };
    }

    const { from: startDate, to: endDate } = dateRange;

    try {
        const allInvoices = await getInvoices();
        const allExpenses = await getExpenses();

        const invoicesInPeriod = allInvoices.filter(inv => 
        isWithinInterval(new Date(inv.date), { start: startDate, end: endDate }) &&
        (clientId === 'all' || inv.clientId === clientId)
        );
        
        const expensesInPeriod = allExpenses.filter(exp => 
        isWithinInterval(new Date(exp.date), { start: startDate, end: endDate })
        );

        // Calculate report metrics
        const totalRevenue = invoicesInPeriod
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const totalUnpaid = invoicesInPeriod
            .filter(inv => inv.status !== 'Paid')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const totalExpenses = expensesInPeriod.reduce((sum, exp) => sum + exp.amount, 0);

        const productSales: { [key: string]: { productName: string; quantitySold: number; totalValue: number; } } = {};
        invoicesInPeriod.forEach(inv => {
            inv.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = { productName: item.productName, quantitySold: 0, totalValue: 0 };
                }
                productSales[item.productId].quantitySold += item.quantity;
                productSales[item.productId].totalValue += item.total;
            });
        });

        return {
        startDate,
        endDate,
        clientName,
        summary: {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            totalUnpaid,
        },
        productSales: Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold),
        unpaidInvoices: invoicesInPeriod.filter(inv => inv.status !== 'Paid'),
        allInvoices: invoicesInPeriod,
        expenses: expensesInPeriod,
        };
    } catch(error) {
        console.error("Failed to generate report:", error);
        return { error: "Une erreur est survenue lors de la génération du rapport." }
    }
};
