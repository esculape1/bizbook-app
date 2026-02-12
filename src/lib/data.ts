import { db } from './firebase-admin';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase, UserWithPassword, ClientOrder } from './types';

/**
 * RÉCUPÉRATION DES DONNÉES DEPUIS FIRESTORE
 */

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  if (!db) return null;
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as UserWithPassword;
}

export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  if (!db) return;
  await db.collection('users').doc(userId).update({ password: hashedPassword });
}

export async function getClients(): Promise<Client[]> {
  if (!db) return [];
  const snap = await db.collection('clients').orderBy('name').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!db) return null;
  const doc = await db.collection('clients').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Client;
}

export async function addClient(clientData: Omit<Client, 'id' | 'registrationDate' | 'status'>) {
  if (!db) return;
  const newClient = {
    ...clientData,
    registrationDate: new Date().toISOString(),
    status: 'Active' as const,
  };
  return await db.collection('clients').add(newClient);
}

export async function updateClient(id: string, data: Partial<Client>) {
  if (!db) return;
  await db.collection('clients').doc(id).update(data);
}

export async function deleteClient(id: string) {
  if (!db) return;
  await db.collection('clients').doc(id).delete();
}

export async function getSuppliers(): Promise<Supplier[]> {
  if (!db) return [];
  const snap = await db.collection('suppliers').orderBy('name').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
}

export async function addSupplier(supplierData: Omit<Supplier, 'id' | 'registrationDate'>) {
  if (!db) return;
  const newSupplier = {
    ...supplierData,
    registrationDate: new Date().toISOString(),
  };
  return await db.collection('suppliers').add(newSupplier);
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
  if (!db) return;
  await db.collection('suppliers').doc(id).update(data);
}

export async function deleteSupplier(id: string) {
  if (!db) return;
  await db.collection('suppliers').doc(id).delete();
}

export async function getProducts(): Promise<Product[]> {
  if (!db) return [];
  const snap = await db.collection('products').orderBy('name').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(productData: Omit<Product, 'id'>) {
  if (!db) return;
  return await db.collection('products').add(productData);
}

export async function updateProduct(id: string, data: Partial<Product>) {
  if (!db) return;
  await db.collection('products').doc(id).update(data);
}

export async function deleteProduct(id: string) {
  if (!db) return;
  await db.collection('products').doc(id).delete();
}

export async function getQuotes(): Promise<Quote[]> {
  if (!db) return [];
  const snap = await db.collection('quotes').orderBy('date', 'desc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  if (!db) return null;
  const doc = await db.collection('quotes').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Quote;
}

export async function addQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber'>) {
  if (!db) return;
  const currentYear = new Date().getFullYear();
  const prefix = `PROF-${currentYear}-`;
  const latestQuoteSnap = await db.collection('quotes')
    .orderBy('quoteNumber', 'desc')
    .limit(1)
    .get();
  
  let latestNumber = 0;
  if (!latestQuoteSnap.empty) {
    const lastQuote = latestQuoteSnap.docs[0].data();
    const numberPart = lastQuote.quoteNumber.split('-')[2];
    if (numberPart) latestNumber = parseInt(numberPart, 10);
  }
  const quoteNumber = `${prefix}${(latestNumber + 1).toString().padStart(4, '0')}`;
  return await db.collection('quotes').add({ ...quoteData, quoteNumber });
}

export async function updateQuote(id: string, data: Partial<Quote>) {
  if (!db) return;
  await db.collection('quotes').doc(id).update(data);
}

export async function deleteQuote(id: string) {
  if (!db) return;
  await db.collection('quotes').doc(id).delete();
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!db) return [];
  const snap = await db.collection('invoices').orderBy('date', 'desc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!db) return null;
  const doc = await db.collection('invoices').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Invoice;
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>) {
  if (!db) return;
  return await db.collection('invoices').add(invoiceData);
}

export async function getNextInvoiceNumber() {
  if (!db) return "FACT-2024-0001";
  const currentYear = new Date().getFullYear();
  const prefix = `FACT-${currentYear}-`;
  const latestInvoiceSnap = await db.collection('invoices')
    .orderBy('invoiceNumber', 'desc')
    .limit(1)
    .get();
  
  let latestNumber = 0;
  if (!latestInvoiceSnap.empty) {
    const lastInvoice = latestInvoiceSnap.docs[0].data();
    const numberPart = lastInvoice.invoiceNumber.split('-')[2];
    if (numberPart) latestNumber = parseInt(numberPart, 10);
  }
  return `${prefix}${(latestNumber + 1).toString().padStart(4, '0')}`;
}

export async function updateInvoice(id: string, data: Partial<Invoice>) {
  if (!db) return;
  await db.collection('invoices').doc(id).update(data);
}

export async function getPurchases(): Promise<Purchase[]> {
  if (!db) return [];
  const snap = await db.collection('purchases').orderBy('date', 'desc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
}

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseNumber'>) {
  if (!db) return;
  const currentYear = new Date().getFullYear();
  const prefix = `ACH-${currentYear}-`;
  const latestSnap = await db.collection('purchases')
    .orderBy('purchaseNumber', 'desc')
    .limit(1)
    .get();
  
  let latestNumber = 0;
  if (!latestSnap.empty) {
    const last = latestSnap.docs[0].data();
    const numberPart = last.purchaseNumber.split('-')[2];
    if (numberPart) latestNumber = parseInt(numberPart, 10);
  }
  const purchaseNumber = `${prefix}${(latestNumber + 1).toString().padStart(4, '0')}`;
  return await db.collection('purchases').add({ ...purchaseData, purchaseNumber });
}

export async function updatePurchase(id: string, data: Partial<Purchase>) {
  if (!db) return;
  await db.collection('purchases').doc(id).update(data);
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  if (!db) return null;
  const doc = await db.collection('purchases').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Purchase;
}

export async function getExpenses(): Promise<Expense[]> {
  if (!db) return [];
  const snap = await db.collection('expenses').orderBy('date', 'desc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(expenseData: Omit<Expense, 'id'>) {
  if (!db) return;
  return await db.collection('expenses').add(expenseData);
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  if (!db) return;
  await db.collection('expenses').doc(id).update(data);
}

export async function deleteExpense(id: string) {
  if (!db) return;
  await db.collection('expenses').doc(id).delete();
}

export async function getClientOrders(): Promise<ClientOrder[]> {
  if (!db) return [];
  const snap = await db.collection('clientOrders').orderBy('date', 'desc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientOrder));
}

export async function getClientOrderById(id: string): Promise<ClientOrder | null> {
  if (!db) return null;
  const doc = await db.collection('clientOrders').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ClientOrder;
}

export async function updateClientOrder(id: string, data: Partial<ClientOrder>) {
  if (!db) return;
  await db.collection('clientOrders').doc(id).update(data);
}

export async function getSettings(): Promise<Settings> {
  const defaultSettings: Settings = {
    companyName: "BizBook",
    legalName: "BizBook Management Suite",
    managerName: "Directeur Général",
    companyAddress: "Ouagadougou, Burkina Faso",
    companyPhone: "+226 25 00 00 00",
    companyIfu: "00000000X",
    companyRccm: "BF OUA 2024 B 0000",
    currency: "XOF",
    invoiceNumberFormat: "PREFIX-YEAR-NUM",
    invoiceTemplate: "detailed",
  };

  if (!db) return defaultSettings;
  try {
    const doc = await db.collection('settings').doc('global').get();
    if (!doc.exists) {
      return defaultSettings;
    }
    return { id: doc.id, ...doc.data() } as Settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return defaultSettings;
  }
}

export async function updateSettings(data: Partial<Settings>) {
  if (!db) return;
  await db.collection('settings').doc('global').set(data, { merge: true });
}

export async function getDashboardStats() {
  if (!db) return { totalRevenue: 0, totalDue: 0, unpaidInvoicesCount: 0, totalExpenses: 0, totalClients: 0, activeClients: 0, productCount: 0 };
  
  try {
    const [invoices, expenses, clients, products] = await Promise.all([
      getInvoices(),
      getExpenses(),
      getClients(),
      getProducts()
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    let fiscalYearStartDate: Date;

    // Logique de l'exercice : commence le 25 décembre de l'année précédente
    if (now.getMonth() < 11 || (now.getMonth() === 11 && now.getDate() < 25)) {
      fiscalYearStartDate = new Date(currentYear - 1, 11, 25, 0, 0, 0, 0);
    } else {
      fiscalYearStartDate = new Date(currentYear, 11, 25, 0, 0, 0, 0);
    }

    const invoicesForFiscalYear = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= fiscalYearStartDate && inv.status !== 'Cancelled';
    });

    const expensesForFiscalYear = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= fiscalYearStartDate;
    });

    // CA Net (après retenue) pour l'exercice en cours
    const totalRevenue = invoicesForFiscalYear.reduce((sum, i) => sum + (i.netAPayer ?? i.totalAmount), 0);
    
    // Dépenses pour l'exercice en cours
    const totalExpenses = expensesForFiscalYear.reduce((sum, e) => sum + e.amount, 0);

    // Dettes globales (indépendamment de l'exercice pour le recouvrement)
    const activeInvoices = invoices.filter(i => i.status !== 'Cancelled');
    const totalDue = activeInvoices.reduce((sum, i) => sum + ((i.netAPayer ?? i.totalAmount) - i.amountPaid), 0);
    const unpaidInvoicesCount = activeInvoices.filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid').length;

    return {
      totalRevenue,
      totalDue,
      unpaidInvoicesCount,
      totalExpenses,
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'Active').length,
      productCount: products.length,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return { totalRevenue: 0, totalDue: 0, unpaidInvoicesCount: 0, totalExpenses: 0, totalClients: 0, activeClients: 0, productCount: 0 };
  }
}
