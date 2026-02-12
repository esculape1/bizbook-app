
'use server';

import { db } from '@/lib/firebase-admin';
import { getProducts } from '@/lib/data';
import type { ReportData, Invoice, Expense, Product } from '@/lib/types';
import type { DateRange } from 'react-day-picker';

export async function generateReport(
    dateRange: DateRange | undefined, 
    clientId: string,
    clientName: string,
    invoiceStatus: 'all' | 'paid' | 'unpaid' | 'cancelled'
): Promise<ReportData | { error: string }> {
    if (!dateRange?.from || !dateRange?.to) return { error: "La période est requise." };
    if (!db) return { error: "Connexion DB perdue." };

    const startIso = dateRange.from.toISOString();
    const endIso = dateRange.to.toISOString();

    try {
        const [invSnap, expSnap, allProducts] = await Promise.all([
          db.collection('invoices').where('date', '>=', startIso).where('date', '<=', endIso).get(),
          db.collection('expenses').where('date', '>=', startIso).where('date', '<=', endIso).get(),
          getProducts(),
        ]);

        const allInvoices = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        const allExpenses = expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

        const invoicesInPeriod = allInvoices.filter(inv => {
            const clientMatch = clientId === 'all' || inv.clientId === clientId;
            let statusMatch = true;
            if (invoiceStatus === 'unpaid') statusMatch = inv.status === 'Unpaid' || inv.status === 'Partially Paid';
            else if (invoiceStatus === 'paid') statusMatch = inv.status === 'Paid';
            else if (invoiceStatus === 'cancelled') statusMatch = inv.status === 'Cancelled';
            return clientMatch && statusMatch;
        });
        
        const activeInvoices = invoicesInPeriod.filter(inv => inv.status !== 'Cancelled');
        
        // Utilisation du netAPayer pour le CA réel
        const grossSales = activeInvoices.reduce((sum, inv) => sum + (inv.netAPayer ?? inv.totalAmount), 0);
        const totalUnpaid = activeInvoices.reduce((sum, inv) => sum + (inv.netAPayer ?? inv.totalAmount) - (inv.amountPaid || 0), 0);
        const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const productSales: Record<string, any> = {};
        let costOfGoodsSold = 0;

        activeInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const product = allProducts.find(p => p.id === item.productId);
                const itemCost = item.purchasePrice ?? product?.purchasePrice ?? 0;
                costOfGoodsSold += itemCost * item.quantity;
                
                const key = `${item.productName}::${item.unitPrice}`;
                if (!productSales[key]) {
                    productSales[key] = { productName: item.productName, quantitySold: 0, totalValue: 0 };
                }
                productSales[key].quantitySold += item.quantity;
                productSales[key].totalValue += item.total;
            });
        });
        
        const finalProductSales = Object.values(productSales).map(sale => ({
            ...sale,
            productName: `${sale.productName} (PU: ${sale.totalValue / sale.quantitySold})`,
            quantityInStock: allProducts.find(p => p.name === sale.productName)?.quantityInStock ?? 'N/A'
        }));

        return {
          startDate: startIso, endDate: endIso, clientName,
          summary: { 
              grossSales, 
              totalExpenses, 
              costOfGoodsSold, 
              grossProfit: grossSales - costOfGoodsSold, 
              netProfit: grossSales - costOfGoodsSold - totalExpenses, 
              totalUnpaid 
          },
          productSales: finalProductSales.sort((a, b) => b.quantitySold - a.quantitySold),
          allInvoices: invoicesInPeriod, 
          expenses: allExpenses,
        };
    } catch(error) {
        console.error("Failed to generate report:", error);
        return { error: "Erreur lors de la génération du rapport." }
    }
}
