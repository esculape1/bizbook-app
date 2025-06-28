import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  query,
  orderBy,
  Timestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Client, Product, Invoice, Expense, Settings, User, Quote } from './types';

// Helper to convert Firestore docs to plain objects
function docToObject<T>(doc: any): T {
  const data = doc.data();
  // Convert Timestamps to ISO strings
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return { id: doc.id, ...data } as T;
}

const DB_UNAVAILABLE_ERROR = "La connexion à la base de données a échoué. Veuillez vérifier la configuration de Firebase.";

// CLIENTS
export async function getClients(): Promise<Client[]> {
  if (!db) return [];
  const clientsCol = collection(db, 'clients');
  const q = query(clientsCol, orderBy('registrationDate', 'desc'));
  const clientSnapshot = await getDocs(q);
  return clientSnapshot.docs.map(doc => docToObject<Client>(doc));
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!db) return null;
  const clientDocRef = doc(db, 'clients', id);
  const clientDoc = await getDoc(clientDocRef);
  if (clientDoc.exists()) {
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
  const docRef = await addDoc(collection(db, 'clients'), newClientData);
  return { id: docRef.id, ...newClientData };
}

export async function updateClient(id: string, clientData: Partial<Omit<Client, 'id' | 'registrationDate'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const clientDocRef = doc(db, 'clients', id);
  await setDoc(clientDocRef, clientData, { merge: true });
}

export async function deleteClient(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const clientDocRef = doc(db, 'clients', id);
  await deleteDoc(clientDocRef);
}

// PRODUCTS
export async function getProducts(): Promise<Product[]> {
  if (!db) return [];
  const productsCol = collection(db, 'products');
  const q = query(productsCol, orderBy('name'));
  const productSnapshot = await getDocs(q);
  return productSnapshot.docs.map(doc => docToObject<Product>(doc));
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const docRef = await addDoc(collection(db, 'products'), productData);
  return { id: docRef.id, ...productData };
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const productDocRef = doc(db, 'products', id);
    await setDoc(productDocRef, productData, { merge: true });
}

export async function deleteProduct(id: string): Promise<void> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const productDocRef = doc(db, 'products', id);
    await deleteDoc(productDocRef);
}

// QUOTES
export async function getQuotes(): Promise<Quote[]> {
    if (!db) return [];
    const quotesCol = collection(db, 'quotes');
    const q = query(quotesCol, orderBy('date', 'desc'));
    const quoteSnapshot = await getDocs(q);
    return quoteSnapshot.docs.map(doc => docToObject<Quote>(doc));
}

export async function addQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber'>): Promise<Quote> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const quotesCol = collection(db, 'quotes');
    const q = query(quotesCol, orderBy('quoteNumber', 'desc'), limit(1));
    const latestQuoteSnap = await getDocs(q);
    
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
    const docRef = await addDoc(quotesCol, newQuoteData);
    return { id: docRef.id, ...newQuoteData };
}

// INVOICES
export async function getInvoices(): Promise<Invoice[]> {
    if (!db) return [];
    const invoicesCol = collection(db, 'invoices');
    const q = query(invoicesCol, orderBy('date', 'desc'));
    const invoiceSnapshot = await getDocs(q);
    return invoiceSnapshot.docs.map(doc => docToObject<Invoice>(doc));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    if (!db) return null;
    const invoiceDocRef = doc(db, 'invoices', id);
    const invoiceDoc = await getDoc(invoiceDocRef);
    if (invoiceDoc.exists()) {
        return docToObject<Invoice>(invoiceDoc);
    }
    return null;
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice> {
    if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
    const invoicesCol = collection(db, 'invoices');
    const q = query(invoicesCol, orderBy('invoiceNumber', 'desc'), limit(1));
    const latestInvoiceSnap = await getDocs(q);
    
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
    const docRef = await addDoc(invoicesCol, newInvoiceData);
    return { id: docRef.id, ...newInvoiceData };
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const invoiceDocRef = doc(db, 'invoices', id);
  await setDoc(invoiceDocRef, invoiceData, { merge: true });
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const invoiceDocRef = doc(db, 'invoices', id);
  await deleteDoc(invoiceDocRef);
}


// EXPENSES
export async function getExpenses(): Promise<Expense[]> {
  if (!db) return [];
  const expensesCol = collection(db, 'expenses');
  const q = query(expensesCol, orderBy('date', 'desc'));
  const expenseSnapshot = await getDocs(q);
  return expenseSnapshot.docs.map(doc => docToObject<Expense>(doc));
}

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const docRef = await addDoc(collection(db, 'expenses'), expenseData);
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
  const settingsDocRef = doc(db, 'settings', 'main');
  try {
      const settingsDoc = await getDoc(settingsDocRef);
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return { ...defaultSettings, ...data } as Settings;
      }
      await setDoc(settingsDocRef, defaultSettings);
      return defaultSettings;
  } catch (e) {
      console.warn("Impossible de récupérer les paramètres, utilisation des valeurs par défaut.", e);
      return defaultSettings;
  }
}

export async function updateSettings(settingsData: Partial<Settings>): Promise<Settings> {
  if (!db) throw new Error(DB_UNAVAILABLE_ERROR);
  const settingsDocRef = doc(db, 'settings', 'main');
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ...settingsData };
  await setDoc(settingsDocRef, newSettings, { merge: true });
  return newSettings;
}
