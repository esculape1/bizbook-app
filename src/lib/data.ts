
import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase } from './types';

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
const DB_READ_ERROR = "Erreur de lecture dans la base de données. L'application peut être partiellement fonctionnelle.";

// CLIENTS
export async function getClients(): Promise<Client[]> {
  if (!db) return [];
  try {
    const clientsCol = db.collection('clients');
    const q = clientsCol.orderBy('registrationDate', 'desc');
    const clientSnapshot = await q.get();
    return clientSnapshot.docs.map(doc => docToObject<Client>(doc));
  } catch (error) {
    console.error("Impossible de récupérer les clients:", error);
    // Return empty array to prevent crashing the app
    return [];
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!db) return null;
  try {
    const clientDocRef = db.collection('clients').doc(id);
    const clientDoc = await clientDocRef.get();
    if (clientDoc.exists) {
      return docToObject<Client>(clientDoc);
    }
    return null;
  } catch (error) {
    console.error(`Impossible de récupérer le client ${id}:`, error);
    return null;
  }
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

// SUPPLIERS
export async function getSuppliers(): Promise<Supplier[]> {
  if (!db) return [];
  try {
    const suppliersCol = db.collection('suppliers');
    const q = suppliersCol.orderBy('registrationDate', 'desc');
    const supplierSnapshot = await q.get();
    return supplierSnapshot.docs.map(doc => docToObject<Supplier>(doc));
  } catch (error) {
    console.error("Impossible de récupérer les fournisseurs:", error);
    return [];
  }
}

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
export async function getProducts(): Promise<Product[]> {
  if (!db) return [];
  try {
    const productsCol = db.collection('products');
    const q = productsCol.orderBy('name');
    const productSnapshot = await q.get();
    return productSnapshot.docs.map(doc => docToObject<Product>(doc));
  } catch (error) {
    console.error("Impossible de récupérer les produits:", error);
    return [];
  }
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
    try {
      const quotesCol = db.collection('quotes');
      const q = quotesCol.orderBy('date', 'desc');
      const quoteSnapshot = await q.get();
      return quoteSnapshot.docs.map(doc => docToObject<Quote>(doc));
    } catch (error) {
      console.error("Impossible de récupérer les proformas:", error);
      return [];
    }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
    if (!db) return null;
    try {
      const quoteDocRef = db.collection('quotes').doc(id);
      const quoteDoc = await quoteDocRef.get();
      if (quoteDoc.exists) {
          return docToObject<Quote>(quoteDoc);
      }
      return null;
    } catch (error) {
      console.error(`Impossible de récupérer la proforma ${id}:`, error);
      return null;
    }
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
            const numberPart = lastQuote.quoteNumber.split('-')[1];
            if (numberPart) {
                latestQuoteNumber = parseInt(numberPart, 10);
            }
        }
    }

    const newQuoteData: Omit<Quote, 'id'> = {
        ...quoteData,
        quoteNumber: `PRO2024-${(latestQuoteNumber + 1).toString().padStart(3, '0')}`,
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
export async function getInvoices(): Promise<Invoice[]> {
    if (!db) return [];
    try {
      const invoicesCol = db.collection('invoices');
      const q = invoicesCol.orderBy('date', 'desc');
      const invoiceSnapshot = await q.get();
      return invoiceSnapshot.docs.map(doc => docToObject<Invoice>(doc));
    } catch (error) {
      console.error("Impossible de récupérer les factures:", error);
      return [];
    }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    if (!db) return null;
    try {
      const invoiceDocRef = db.collection('invoices').doc(id);
      const invoiceDoc = await invoiceDocRef.get();
      if (invoiceDoc.exists) {
          return docToObject<Invoice>(invoiceDoc);
      }
      return null;
    } catch (error) {
      console.error(`Impossible de récupérer la facture ${id}:`, error);
      return null;
    }
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

    const newInvoiceData: Omit<Invoice, 'id'> = {
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


// PURCHASES
export async function getPurchases(): Promise<Purchase[]> {
    if (!db) return [];
    try {
      const purchasesCol = db.collection('purchases');
      const q = purchasesCol.orderBy('date', 'desc');
      const purchaseSnapshot = await q.get();
      return purchaseSnapshot.docs.map(doc => docToObject<Purchase>(doc));
    } catch (error) {
      console.error("Impossible de récupérer les achats:", error);
      return [];
    }
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
    if (!db) return null;
    try {
      const purchaseDocRef = db.collection('purchases').doc(id);
      const purchaseDoc = await purchaseDocRef.get();
      if (purchaseDoc.exists) {
          return docToObject<Purchase>(purchaseDoc);
      }
      return null;
    } catch (error) {
      console.error(`Impossible de récupérer l'achat ${id}:`, error);
      return null;
    }
}

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
export async function getExpenses(): Promise<Expense[]> {
  if (!db) return [];
  try {
    const expensesCol = db.collection('expenses');
    const q = expensesCol.orderBy('date', 'desc');
    const expenseSnapshot = await q.get();
    return expenseSnapshot.docs.map(doc => docToObject<Expense>(doc));
  } catch (error) {
    console.error("Impossible de récupérer les dépenses:", error);
    return [];
  }
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
      console.warn(DB_READ_ERROR, e);
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
