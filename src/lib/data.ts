
import { db } from '@/lib/firebase-admin';
import { FieldValue, Timestamp, AggregateField } from 'firebase-admin/firestore';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase, User, UserWithPassword } from './types';
import { unstable_cache as cache } from 'next/cache';

const DB_UNAVAILABLE_ERROR = "La connexion à la base de données a échoué. Veuillez vérifier la configuration de Firebase ou vos quotas d'utilisation.";

// Helper to recursively convert Firestore Timestamps to ISO strings
function convertTimestamps(data: any): any {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }
  if (data !== null && typeof data === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = convertTimestamps(data[key]);
      }
    }
    return newObj;
  }
  return data;
}

function docToObject<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
    if (!doc.exists) {
        // This case should ideally be handled by the caller, but as a safeguard:
        return null as T;
    }
    const data = doc.data();
    const convertedData = convertTimestamps(data);
    return { id: doc.id, ...convertedData } as T;
}

// USERS
// This function should NOT be cached as it retrieves sensitive data for authentication.
export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
    if (!db) {
        console.error(DB_UNAVAILABLE_ERROR);
        return null; // For auth, we don't want to throw, just fail silently.
    }
    try {
        const usersCol = db.collection('users');
        const q = usersCol.where('email', '==', email.toLowerCase()).limit(1);
        const userSnapshot = await q.get();

        if (userSnapshot.empty) {
            return null;
        }
        
        return docToObject<UserWithPassword>(userSnapshot.docs[0]);
    } catch (error) {
        console.error(`Impossible de récupérer l'utilisateur avec l'email ${email}:`, error);
        return null;
    }
}


// CLIENTS
export const getClients = cache(
  async (): Promise<Client[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const clientsCol = db.collection('clients');
    const q = clientsCol.orderBy('registrationDate', 'desc');
    const clientSnapshot = await q.get();
    return clientSnapshot.docs.map(doc => docToObject<Client>(doc));
  },
  ['clients'],
  { revalidate: 10, tags: ['clients'] }
);

export const getClientById = cache(
  async (id: string): Promise<Client | null> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const clientDocRef = db.collection('clients').doc(id);
    const clientDoc = await clientDocRef.get();
    if (clientDoc.exists) {
        return docToObject<Client>(clientDoc);
    }
    return null;
  },
  ['client'],
  { tags: ['clients'] }
);

export async function addClient(clientData: Omit<Client, 'id' | 'registrationDate' | 'status'>): Promise<Client> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const newClientData: Omit<Client, 'id'> = {
    ...clientData,
    registrationDate: new Date().toISOString(),
    status: 'Active',
  };
  const docRef = await db.collection('clients').add(newClientData);
  return { id: docRef.id, ...newClientData };
}

export async function updateClient(id: string, clientData: Partial<Omit<Client, 'id' | 'registrationDate'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const clientDocRef = db.collection('clients').doc(id);
  await clientDocRef.set(clientData, { merge: true });
}

export async function deleteClient(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const clientDocRef = db.collection('clients').doc(id);
  await clientDocRef.delete();
}

// SUPPLIERS
export const getSuppliers = cache(
  async (): Promise<Supplier[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const suppliersCol = db.collection('suppliers');
    const q = suppliersCol.orderBy('registrationDate', 'desc');
    const supplierSnapshot = await q.get();
    return supplierSnapshot.docs.map(doc => docToObject<Supplier>(doc));
  },
  ['suppliers'],
  { revalidate: 10, tags: ['suppliers'] }
);

export async function addSupplier(supplierData: Omit<Supplier, 'id' | 'registrationDate'>): Promise<Supplier> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const newSupplierData: Omit<Supplier, 'id'> = {
    ...supplierData,
    registrationDate: new Date().toISOString(),
  };
  const docRef = await db.collection('suppliers').add(newSupplierData);
  return { id: docRef.id, ...newSupplierData };
}

export async function updateSupplier(id: string, supplierData: Partial<Omit<Supplier, 'id' | 'registrationDate'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const supplierDocRef = db.collection('suppliers').doc(id);
  await supplierDocRef.set(supplierData, { merge: true });
}

export async function deleteSupplier(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const supplierDocRef = db.collection('suppliers').doc(id);
  await supplierDocRef.delete();
}


// PRODUCTS
export const getProducts = cache(
  async (): Promise<Product[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const productsCol = db.collection('products');
    const q = productsCol.orderBy('name');
    const productSnapshot = await q.get();
    return productSnapshot.docs.map(doc => docToObject<Product>(doc));
  },
  ['products'],
  { revalidate: 10, tags: ['products'] }
);

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const docRef = await db.collection('products').add(productData);
  return { id: docRef.id, ...productData };
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const productDocRef = db.collection('products').doc(id);
    await productDocRef.set(productData, { merge: true });
}

export async function deleteProduct(id: string): Promise<void> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const productDocRef = db.collection('products').doc(id);
    await productDocRef.delete();
}

// QUOTES
export const getQuotes = cache(
  async (): Promise<Quote[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const quotesCol = db.collection('quotes');
    const q = quotesCol.orderBy('date', 'desc');
    const quoteSnapshot = await q.get();
    return quoteSnapshot.docs.map(doc => docToObject<Quote>(doc));
  },
  ['quotes'],
  { revalidate: 10, tags: ['quotes'] }
);

export const getQuoteById = cache(
  async (id: string): Promise<Quote | null> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const quoteDocRef = db.collection('quotes').doc(id);
    const quoteDoc = await quoteDocRef.get();
    if (quoteDoc.exists) {
        return docToObject<Quote>(quoteDoc);
    }
    return null;
  },
  ['quote'],
  { tags: ['quotes'] }
);

export async function addQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber'>): Promise<Quote> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const quotesCol = db.collection('quotes');
    
    const currentYear = new Date().getFullYear();
    const prefix = `PRO${currentYear}`;

    const q = quotesCol
        .where('quoteNumber', '>=', prefix)
        .where('quoteNumber', '<', `PRO${currentYear + 1}`)
        .orderBy('quoteNumber', 'desc')
        .limit(1);

    const latestQuoteSnap = await q.get();
    
    let latestNumber = 0;
    if (!latestQuoteSnap.empty) {
        const lastQuote = latestQuoteSnap.docs[0].data() as Quote;
        const numberPart = lastQuote.quoteNumber.split('-')[1];
        if (numberPart) {
            latestNumber = parseInt(numberPart, 10);
        }
    }

    const newQuoteNumber = `${prefix}-${(latestNumber + 1).toString().padStart(3, '0')}`;

    const newQuoteData: Omit<Quote, 'id'> = {
        ...quoteData,
        quoteNumber: newQuoteNumber,
    };

    const docRef = await quotesCol.add(newQuoteData);
    return { id: docRef.id, ...newQuoteData };
}

export async function updateQuote(id: string, quoteData: Partial<Omit<Quote, 'id'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const quoteDocRef = db.collection('quotes').doc(id);
  await quoteDocRef.set(quoteData, { merge: true });
}

export async function deleteQuote(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const quoteDocRef = db.collection('quotes').doc(id);
  await quoteDocRef.delete();
}

// INVOICES
export const getInvoices = cache(
  async (): Promise<Invoice[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const invoicesCol = db.collection('invoices');
    const q = invoicesCol.orderBy('date', 'desc');
    const invoiceSnapshot = await q.get();
    return invoiceSnapshot.docs.map(doc => docToObject<Invoice>(doc));
  },
  ['invoices'],
  { revalidate: 10, tags: ['invoices'] }
);

export const getInvoiceById = cache(
  async (id: string): Promise<Invoice | null> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const invoiceDocRef = db.collection('invoices').doc(id);
    const invoiceDoc = await invoiceDocRef.get();
    if (invoiceDoc.exists) {
        return docToObject<Invoice>(invoiceDoc);
    }
    return null;
  },
  ['invoice'],
  { tags: ['invoices'] }
);

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const invoicesCol = db.collection('invoices');
    const docRef = await invoicesCol.add(invoiceData);
    return { id: docRef.id, ...invoiceData };
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const invoiceDocRef = db.collection('invoices').doc(id);
  await invoiceDocRef.set(invoiceData, { merge: true });
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const invoiceDocRef = db.collection('invoices').doc(id);
  await invoiceDocRef.delete();
}


// PURCHASES
export const getPurchases = cache(
  async (): Promise<Purchase[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const purchasesCol = db.collection('purchases');
    const q = purchasesCol.orderBy('date', 'desc');
    const purchaseSnapshot = await q.get();
    return purchaseSnapshot.docs.map(doc => docToObject<Purchase>(doc));
  },
  ['purchases'],
  { revalidate: 10, tags: ['purchases'] }
);

export const getPurchaseById = cache(
  async (id: string): Promise<Purchase | null> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const purchaseDocRef = db.collection('purchases').doc(id);
    const purchaseDoc = await purchaseDocRef.get();
    if (purchaseDoc.exists) {
        return docToObject<Purchase>(purchaseDoc);
    }
    return null;
  },
  ['purchase'],
  { tags: ['purchases'] }
);

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseNumber'>): Promise<Purchase> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const purchasesCol = db.collection('purchases');
    const q = purchasesCol.orderBy('purchaseNumber', 'desc').limit(1);
    const latestPurchaseSnap = await q.get();
    
    let latestPurchaseNumber = 0;
    if (!latestPurchaseSnap.empty) {
        const lastPurchase = latestPurchaseSnap.docs[0].data() as Purchase;
        if (lastPurchase.purchaseNumber && lastPurchase.purchaseNumber.includes('-')) {
            latestPurchaseNumber = parseInt(lastPurchase.purchaseNumber.split('-')[1], 10);
        }
    }

    const newPurchaseData: Omit<Purchase, 'id'> = {
        ...purchaseData,
        purchaseNumber: `ACH2024-${(latestPurchaseNumber + 1).toString().padStart(3, '0')}`,
    };
    const docRef = await purchasesCol.add(newPurchaseData);
    return { id: docRef.id, ...newPurchaseData };
}

export async function updatePurchase(id: string, purchaseData: Partial<Omit<Purchase, 'id'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const purchaseDocRef = db.collection('purchases').doc(id);
  await purchaseDocRef.set(purchaseData, { merge: true });
}


// EXPENSES
export const getExpenses = cache(
  async (): Promise<Expense[]> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const expensesCol = db.collection('expenses');
    const q = expensesCol.orderBy('date', 'desc');
    const expenseSnapshot = await q.get();
    return expenseSnapshot.docs.map(doc => docToObject<Expense>(doc));
  },
  ['expenses'],
  { revalidate: 10, tags: ['expenses'] }
);

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const docRef = await db.collection('expenses').add(expenseData);
  return { id: docRef.id, ...expenseData };
}

export async function updateExpense(id: string, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const expenseDocRef = db.collection('expenses').doc(id);
  await expenseDocRef.set(expenseData, { merge: true });
}

export async function deleteExpense(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const expenseDocRef = db.collection('expenses').doc(id);
  await expenseDocRef.delete();
}

// SETTINGS
const defaultSettings: Settings = {
  companyName: 'BizBook Inc.',
  legalName: 'BizBook Incorporated',
  managerName: 'Nom du Gérant',
  companyAddress: 'Votre adresse complète',
  companyPhone: 'Votre numéro de téléphone',
  companyIfu: 'Votre numéro IFU',
  companyRccm: 'Votre numéro RCCM',
  currency: 'XOF',
  logoUrl: null,
  invoiceNumberFormat: 'PREFIX-YEAR-NUM',
  invoiceTemplate: 'detailed',
};

export const getSettings = cache(
  async (): Promise<Settings> => {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const settingsDocRef = db.collection('settings').doc('main');
    const settingsDoc = await settingsDocRef.get();
    if (settingsDoc.exists) {
        const data = settingsDoc.data();
        return { ...defaultSettings, ...data } as Settings;
    }
    await settingsDocRef.set(defaultSettings);
    return defaultSettings;
  },
  ['settings'],
  { revalidate: 10, tags: ['settings'] }
);


export async function updateSettings(settingsData: Partial<Settings>): Promise<Settings> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const settingsDocRef = db.collection('settings').doc('main');
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ...settingsData };
  await settingsDocRef.set(newSettings, { merge: true });
  return newSettings;
}

// AGGREGATION / STATS for Dashboard
export const getDashboardStats = cache(async () => {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  
  // Aggregate data using Firestore's aggregation queries for efficiency
  const invoicesCol = db.collection('invoices');
  const expensesCol = db.collection('expenses');
  const clientsCol = db.collection('clients');
  const productsCol = db.collection('products');

  const invoiceAggQuery = invoicesCol.aggregate({
    totalRevenue: AggregateField.sum('amountPaid'),
    totalDue: AggregateField.sum('totalAmount'),
    totalPaid: AggregateField.sum('amountPaid'),
    unpaidInvoicesCount: AggregateField.count()
  });

  const unpaidInvoicesAgg = await invoicesCol
    .where('status', 'in', ['Unpaid', 'Partially Paid'])
    .count()
    .get();

  const expenseAggQuery = expensesCol.aggregate({
    totalExpenses: AggregateField.sum('amount'),
  });

  const clientAggQuery = clientsCol.count();
  const activeClientAggQuery = clientsCol.where('status', '==', 'Active').count();
  const productAggQuery = productsCol.count();
  
  const [
    invoiceAggSnapshot, 
    expenseAggSnapshot,
    clientAggSnapshot,
    activeClientAggSnapshot,
    productAggSnapshot
  ] = await Promise.all([
    invoiceAggQuery.get(),
    expenseAggQuery.get(),
    clientAggQuery.get(),
    activeClientAggQuery.get(),
    productAggSnapshot.get()
  ]);

  const invoiceData = invoiceAggSnapshot.data();
  
  // Calculate total due manually as Firestore aggregation on calculated fields is not direct
  const unpaidInvoices = await invoicesCol.where('status', 'in', ['Unpaid', 'Partially Paid']).get();
  const totalDueManual = unpaidInvoices.docs.reduce((sum, doc) => {
    const inv = doc.data() as Invoice;
    return sum + (inv.totalAmount - (inv.amountPaid || 0));
  }, 0);


  return {
    totalRevenue: invoiceData.totalRevenue || 0,
    totalDue: totalDueManual,
    unpaidInvoicesCount: unpaidInvoicesAgg.data().count,
    totalExpenses: expenseAggSnapshot.data().totalExpenses || 0,
    totalClients: clientAggSnapshot.data().count,
    activeClients: activeClientAggSnapshot.data().count,
    productCount: productAggSnapshot.data().count,
  };
},
['dashboard-stats'],
{ revalidate: 10, tags: ['invoices', 'expenses', 'clients', 'products'] });

    
