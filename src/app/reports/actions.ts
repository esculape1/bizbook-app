'use server';

import { createClient } from '@/lib/supabase/server';
import { getExpenses, getProducts } from '@/lib/data';
import type { ReportData, Invoice, Expense, Product } from '@/lib/types';
import { isWithinInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// Helper to map snake_case DB rows to camelCase Invoice type
function mapInvoiceRow(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    clientName: row.client_name,
    date: row.date,
    dueDate: row.due_date,
    items: row.items || [],
    subTotal: Number(row.sub_total) || 0,
    vat: Number(row.vat) || 0,
    vatAmount: Number(row.vat_amount) || 0,
    discount: Number(row.discount) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    retenue: Number(row.retenue) || 0,
    retenueAmount: Number(row.retenue_amount) || 0,
    netAPayer: Number(row.net_a_payer) || 0,
    status: row.status,
    amountPaid: Number(row.amount_paid) || 0,
    payments: row.payments || [],
  };
}

function mapExpenseRow(row: any): Expense {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount) || 0,
    category: row.category,
  };
}

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
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    try {
        const supabase = createClient();

        const [invoicesResult, expensesResult, allProducts] = await Promise.all([
          supabase
            .from('invoices')
            .select('*')
            .gte('date', startIso)
            .lte('date', endIso),
          supabase
            .from('expenses')
            .select('*')
            .gte('date', startIso)
            .lte('date', endIso),
          getProducts(),
        ]);

        const allInvoices: Invoice[] = (invoicesResult.data || []).map(mapInvoiceRow);
        const allExpenses: Expense[] = (expensesResult.data || []).map(mapExpenseRow);

        const invoicesInPeriod = allInvoices.filter(inv => {
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
            
            return clientMatch && statusMatch;
        });
        
        const activeInvoices = invoicesInPeriod.filter(inv => inv.status !== 'Cancelled');
        
        const grossSales = activeInvoices
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const totalUnpaid = activeInvoices
            .reduce((sum, inv) => sum + inv.totalAmount - (inv.amountPaid || 0), 0);

        const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const productSales: { [key: string]: { productName: string, productNameForDisplay: string, quantitySold: number, totalValue: number } } = {};
        let costOfGoodsSold = 0;

        activeInvoices.forEach(inv => {
            inv.items.forEach(item => {
                let itemCost = 0;
                if (item.purchasePrice !== undefined && item.purchasePrice !== null) {
                    itemCost = item.purchasePrice;
                } else {
                    const product = allProducts.find(p => p.id === item.productId);
                    if (product && product.unitPrice > 0 && product.purchasePrice >= 0) {
                        const currentCostToPriceRatio = product.purchasePrice / product.unitPrice;
                        const estimatedCost = item.unitPrice * currentCostToPriceRatio;
                        itemCost = isNaN(estimatedCost) ? 0 : estimatedCost;
                    } 
                }
                costOfGoodsSold += itemCost * item.quantity;
                
                const uniqueKey = `${item.productName}::${item.unitPrice}`;
                
                if (!productSales[uniqueKey]) {
                    productSales[uniqueKey] = { 
                        productName: item.productName,
                        productNameForDisplay: `${item.productName} (PU: ${item.unitPrice})`, 
                        quantitySold: 0, 
                        totalValue: 0,
                    };
                }
                productSales[uniqueKey].quantitySold += item.quantity;
                productSales[uniqueKey].totalValue += item.total;
            });
        });
        
        const finalProductSales = Object.values(productSales).map(sale => {
            const currentProduct = allProducts.find(p => p.name === sale.productName);
            return {
                productName: sale.productNameForDisplay,
                quantitySold: sale.quantitySold,
                totalValue: sale.totalValue,
                quantityInStock: currentProduct?.quantityInStock ?? 'N/A'
            };
        });

        const grossProfit = grossSales - costOfGoodsSold;
        const netProfit = grossProfit - totalExpenses;

        return {
          startDate: startIso,
          endDate: endIso,
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
          expenses: allExpenses,
        };
    } catch(error) {
        console.error("Failed to generate report:", error);
        return { error: "Une erreur est survenue lors de la génération du rapport." }
    }
};
