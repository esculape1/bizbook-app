import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Client, Product, Invoice, Expense, Settings, Quote } from './types';

// Helper to convert Firestore docs to plain objects
function docToObject<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  const data = doc.data();
  // Convert Timestamps to ISO strings
  if (data) {
    for (const key in data) {
      if (data[key] instanceof Timestamp) {
        data[key] = data[key].toDate().toISOString();
      }
    }
  }
  return { id: doc.id, ...data } as T;
}

const DB_UNAVAILABLE_ERROR = "La connexion à la base de données a échoué. Veuillez vérifier la configuration de Firebase.";

// CLIENTS
export async function getClients(): Promise<Client[]> {
  if (!db) return [];
  const clientsCol = db.collection('clients');
  const q = clientsCol.orderBy('registrationDate', 'desc');
  const clientSnapshot = await q.get();
  return clientSnapshot.docs.map(doc => docToObject<Client>(doc));
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!db) return null;
  const clientDocRef = db.collection('clients').doc(id);
  const clientDoc = await clientDocRef.get();
  if (clientDoc.exists) {
    return docToObject<Client>(clientDoc);
  }
  return null;
}

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

// PRODUCTS
export async function getProducts(): Promise<Product[]> {
  if (!db) return [];
  const productsCol = db.collection('products');
  const q = productsCol.orderBy('name');
  const productSnapshot = await q.get();
  return productSnapshot.docs.map(doc => docToObject<Product>(doc));
}

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
export async function getQuotes(): Promise<Quote[]> {
    if (!db) return [];
    const quotesCol = db.collection('quotes');
    const q = quotesCol.orderBy('date', 'desc');
    const quoteSnapshot = await q.get();
    return quoteSnapshot.docs.map(doc => docToObject<Quote>(doc));
}

export async function addQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber'>): Promise<Quote> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const quotesCol = db.collection('quotes');
    const q = quotesCol.orderBy('quoteNumber', 'desc').limit(1);
    const latestQuoteSnap = await q.get();
    
    let latestQuoteNumber = 0;
    if (!latestQuoteSnap.empty) {
        const lastQuote = latestQuoteSnap.docs[0].data() as Quote;
        if (lastQuote.quoteNumber && lastQuote.quoteNumber.includes('-')) {
            latestQuoteNumber = parseInt(lastQuote.quoteNumber.split('-')[1], 10);
        }
    }

    const newQuoteData = {
        ...quoteData,
        quoteNumber: `DEV2024-${(latestQuoteNumber + 1).toString().padStart(3, '0')}`,
    };
    const docRef = await quotesCol.add(newQuoteData);
    return { id: docRef.id, ...newQuoteData };
}

// INVOICES
export async function getInvoices(): Promise<Invoice[]> {
    if (!db) return [];
    const invoicesCol = db.collection('invoices');
    const q = invoicesCol.orderBy('date', 'desc');
    const invoiceSnapshot = await q.get();
    return invoiceSnapshot.docs.map(doc => docToObject<Invoice>(doc));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    if (!db) return null;
    const invoiceDocRef = db.collection('invoices').doc(id);
    const invoiceDoc = await invoiceDocRef.get();
    if (invoiceDoc.exists) {
        return docToObject<Invoice>(invoiceDoc);
    }
    return null;
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const invoicesCol = db.collection('invoices');
    const q = invoicesCol.orderBy('invoiceNumber', 'desc').limit(1);
    const latestInvoiceSnap = await q.get();
    
    let latestInvoiceNumber = 0;
    if (!latestInvoiceSnap.empty) {
        const lastInv = latestInvoiceSnap.docs[0].data() as Invoice;
        if (lastInv.invoiceNumber && lastInv.invoiceNumber.includes('-')) {
            latestInvoiceNumber = parseInt(lastInv.invoiceNumber.split('-')[1], 10);
        }
    }

    const newInvoiceData = {
        ...invoiceData,
        invoiceNumber: `FACT2024-${(latestInvoiceNumber + 1).toString().padStart(3, '0')}`,
    };
    const docRef = await invoicesCol.add(newInvoiceData);
    return { id: docRef.id, ...newInvoiceData };
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


// EXPENSES
export async function getExpenses(): Promise<Expense[]> {
  if (!db) return [];
  const expensesCol = db.collection('expenses');
  const q = expensesCol.orderBy('date', 'desc');
  const expenseSnapshot = await q.get();
  return expenseSnapshot.docs.map(doc => docToObject<Expense>(doc));
}

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const docRef = await db.collection('expenses').add(expenseData);
  return { id: docRef.id, ...expenseData };
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
  logoUrl: 'https://placehold.co/80x80.png',
  invoiceNumberFormat: 'PREFIX-YEAR-NUM',
  invoiceTemplate: 'detailed',
};

export async function getSettings(): Promise<Settings> {
  if (!db) return defaultSettings;
  const settingsDocRef = db.collection('settings').doc('main');
  try {
      const settingsDoc = await settingsDocRef.get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        return { ...defaultSettings, ...data } as Settings;
      }
      await settingsDocRef.set(defaultSettings);
      return defaultSettings;
  } catch (e) {
      console.warn("Impossible de récupérer les paramètres, utilisation des valeurs par défaut.", e);
      return defaultSettings;
  }
}

export async function updateSettings(settingsData: Partial<Settings>): Promise<Settings> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const settingsDocRef = db.collection('settings').doc('main');
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ...settingsData };
  await settingsDocRef.set(newSettings, { merge: true });
  return newSettings;
}
