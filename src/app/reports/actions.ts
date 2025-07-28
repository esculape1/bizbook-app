
'use server';

import { getInvoices, getExpenses, getProducts } from '@/lib/data';
import type { ReportData, Invoice } from '@/lib/types';
import { isWithinInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export async function generateReport(
    dateRange: DateRange | undefined, 
    clientId: string,
    clientName: string,
    invoiceStatus: 'all' | 'paid' | 'unpaid' | 'cancelled'
): Promise<ReportData | { error: string }> {
    if (!dateRange?.from || !dateRange?.to) {
      return { error: "La période est requise." };
    }

    const { from: startDate, to: endDate } = dateRange;

    try {
        const [allInvoices, allExpenses, allProducts] = await Promise.all([
          getInvoices(),
          getExpenses(),
          getProducts(),
        ]);

        const invoicesInPeriod = allInvoices.filter(inv => {
            const inDate = isWithinInterval(new Date(inv.date), { start: startDate, end: endDate });
            const clientMatch = clientId === 'all' || inv.clientId === clientId;
            
            let statusMatch = true;
            if (invoiceStatus !== 'all') {
                if (invoiceStatus === 'unpaid') {
                    statusMatch = inv.status === 'Unpaid' || inv.status === 'Partially Paid';
                } else if (invoiceStatus === 'paid') {
                    statusMatch = inv.status === 'Paid';
                } else if (invoiceStatus === 'cancelled') {
                    statusMatch = inv.status === 'Cancelled';
                }
            }
            
            return inDate && clientMatch && statusMatch;
        });
        
        const expensesInPeriod = allExpenses.filter(exp => 
          isWithinInterval(new Date(exp.date), { start: startDate, end: endDate })
        );

        const activeInvoices = invoicesInPeriod.filter(inv => inv.status !== 'Cancelled');
        
        // Calculate report metrics
        const totalRevenue = activeInvoices
            .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
        
        const grossSales = activeInvoices
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const totalUnpaid = activeInvoices
            .reduce((sum, inv) => sum + inv.totalAmount - (inv.amountPaid || 0), 0);

        const totalExpenses = expensesInPeriod.reduce((sum, exp) => sum + exp.amount, 0);

        const productSales: { [key: string]: { productName: string; quantitySold: number; totalValue: number; } } = {};
        
        // Calculate Cost of Goods Sold (COGS)
        let costOfGoodsSold = 0;

        activeInvoices.forEach(inv => {
            inv.items.forEach(item => {
                // Aggregate product sales for the report
                if (!productSales[item.productId]) {
                    productSales[item.productId] = { productName: item.productName, quantitySold: 0, totalValue: 0 };
                }
                productSales[item.productId].quantitySold += item.quantity;
                productSales[item.productId].totalValue += item.total;
                
                // Find product to calculate COGS
                const product = allProducts.find(p => p.id === item.productId);
                if (product) {
                    costOfGoodsSold += (product.purchasePrice || 0) * item.quantity;
                }
            });
        });
        
        const netProfit = grossSales - costOfGoodsSold - totalExpenses;

        return {
          startDate,
          endDate,
          clientName,
          summary: {
              totalRevenue,
              totalExpenses,
              netProfit: netProfit,
              totalUnpaid,
          },
          productSales: Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold),
          unpaidInvoices: invoicesInPeriod.filter(inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid'),
          allInvoices: invoicesInPeriod,
          expenses: expensesInPeriod,
        };
    } catch(error) {
        console.error("Failed to generate report:", error);
        return { error: "Une erreur est survenue lors de la génération du rapport." }
    }
};
