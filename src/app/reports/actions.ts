
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
        
        const grossSales = activeInvoices
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const totalUnpaid = activeInvoices
            .reduce((sum, inv) => sum + inv.totalAmount - (inv.amountPaid || 0), 0);

        const totalExpenses = expensesInPeriod.reduce((sum, exp) => sum + exp.amount, 0);

        const productSales: { [productName: string]: { productName: string; quantitySold: number; totalValue: number; } } = {};
        let costOfGoodsSold = 0;

        activeInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const product = allProducts.find(p => p.id === item.productId);
                
                const itemCost = item.purchasePrice ?? product?.purchasePrice ?? 0;
                costOfGoodsSold += itemCost * item.quantity;
                
                if (!productSales[item.productName]) {
                    productSales[item.productName] = { 
                        productName: item.productName, 
                        quantitySold: 0, 
                        totalValue: 0,
                    };
                }
                productSales[item.productName].quantitySold += item.quantity;
                productSales[item.productName].totalValue += item.total;
            });
        });
        
        const finalProductSales = Object.values(productSales).map(sale => {
            const anItemOfThisSale = activeInvoices.flatMap(inv => inv.items).find(i => i.productName === sale.productName);
            const currentProduct = anItemOfThisSale ? allProducts.find(p => p.id === anItemOfThisSale.productId) : undefined;
            
            return {
                ...sale,
                quantityInStock: currentProduct?.quantityInStock ?? 'N/A'
            };
        });

        const grossProfit = grossSales - costOfGoodsSold;
        const netProfit = grossProfit - totalExpenses;

        return {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          clientName,
          summary: {
              grossSales,
              totalExpenses,
              costOfGoodsSold,
              grossProfit,
              netProfit: netProfit,
              totalUnpaid,
          },
          productSales: finalProductSales.sort((a, b) => b.quantitySold - a.quantitySold),
          allInvoices: invoicesInPeriod,
          expenses: expensesInPeriod,
        };
    } catch(error) {
        console.error("Failed to generate report:", error);
        return { error: "Une erreur est survenue lors de la génération du rapport." }
    }
};
