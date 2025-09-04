
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase, User, UserWithPassword } from './types';

// Helper to convert Firestore docs to plain objects
function docToObject<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  const data = doc.data() as T;
  return { id: doc.id, ...data };
}

const DB_UNAVAILABLE_ERROR = "La connexion à la base de données a échoué. Veuillez vérifier la configuration de Firebase.";
const DB_READ_ERROR = "Erreur de lecture dans la base de données. L'application peut être partiellement fonctionnelle.";

// USERS
export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
    if (!db) {
        console.error("La connexion à la base de données a échoué. DB non disponible.");
        return null;
    }
    try {
        const usersCol = db.collection('users');
        const q = usersCol.where('email', '==', email.toLowerCase()).limit(1);
        const userSnapshot = await q.get();

        if (userSnapshot.empty) {
            console.log(`Aucun utilisateur trouvé pour l'email: ${email}`);
            return null;
        }
        
        console.log(`Utilisateur trouvé pour l'email: ${email}`);
        const userDoc = userSnapshot.docs[0];
        const data = userDoc.data();

        // Manually convert Timestamps to ISO strings
        if (data.registrationDate && data.registrationDate instanceof Timestamp) {
            data.registrationDate = data.registrationDate.toDate().toISOString();
        }

        return { id: userDoc.id, ...data } as UserWithPassword;
    } catch (error) {
        console.error(`Impossible de récupérer l'utilisateur avec l'email ${email}:`, error);
        return null;
    }
}


// CLIENTS
export async function getClients(): Promise<Client[]> {
  if (!db) return [];
  try {
    const clientsCol = db.collection('clients');
    const q = clientsCol.orderBy('registrationDate', 'desc');
    const clientSnapshot = await q.get();
    return clientSnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.registrationDate && data.registrationDate instanceof Timestamp) {
            data.registrationDate = data.registrationDate.toDate().toISOString();
        }
        return { id: doc.id, ...data } as Client;
    });
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
      const data = clientDoc.data();
      if(data) {
        if (data.registrationDate && data.registrationDate instanceof Timestamp) {
            data.registrationDate = data.registrationDate.toDate().toISOString();
        }
        return { id: clientDoc.id, ...data } as Client;
      }
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
    return supplierSnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.registrationDate && data.registrationDate instanceof Timestamp) {
            data.registrationDate = data.registrationDate.toDate().toISOString();
        }
        return { id: doc.id, ...data } as Supplier;
    });
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
      return quoteSnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.date && data.date instanceof Timestamp) data.date = data.date.toDate().toISOString();
        if (data.expiryDate && data.expiryDate instanceof Timestamp) data.expiryDate = data.expiryDate.toDate().toISOString();
        return { id: doc.id, ...data } as Quote;
      });
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
          const data = quoteDoc.data();
          if (data) {
            if (data.date && data.date instanceof Timestamp) data.date = data.date.toDate().toISOString();
            if (data.expiryDate && data.expiryDate instanceof Timestamp) data.expiryDate = data.expiryDate.toDate().toISOString();
            return { id: quoteDoc.id, ...data } as Quote;
          }
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
export async function getInvoices(): Promise<Invoice[]> {
    if (!db) return [];
    try {
      const invoicesCol = db.collection('invoices');
      const q = invoicesCol.orderBy('date', 'desc');
      const invoiceSnapshot = await q.get();
      return invoiceSnapshot.docs.map(doc => {
          const data = doc.data();
          if (data.date && data.date instanceof Timestamp) {
            data.date = data.date.toDate().toISOString();
          }
          if (data.dueDate && data.dueDate instanceof Timestamp) {
            data.dueDate = data.dueDate.toDate().toISOString();
          }
          if (data.payments && Array.isArray(data.payments)) {
            data.payments.forEach((p: any) => {
              if (p.date && p.date instanceof Timestamp) {
                p.date = p.date.toDate().toISOString();
              }
            });
          }
          return { id: doc.id, ...data } as Invoice;
      });
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
          const data = invoiceDoc.data();
          if (data) {
            if (data.date && data.date instanceof Timestamp) {
                data.date = data.date.toDate().toISOString();
            }
            if (data.dueDate && data.dueDate instanceof Timestamp) {
                data.dueDate = data.dueDate.toDate().toISOString();
            }
            if (data.payments && Array.isArray(data.payments)) {
                data.payments.forEach((p: any) => {
                  if (p.date && p.date instanceof Timestamp) {
                    p.date = p.date.toDate().toISOString();
                  }
                });
            }
            return { id: invoiceDoc.id, ...data } as Invoice;
          }
      }
      return null;
    } catch (error) {
      console.error(`Impossible de récupérer la facture ${id}:`, error);
      return null;
    }
}

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
export async function getPurchases(): Promise<Purchase[]> {
    if (!db) return [];
    try {
      const purchasesCol = db.collection('purchases');
      const q = purchasesCol.orderBy('date', 'desc');
      const purchaseSnapshot = await q.get();
      return purchaseSnapshot.docs.map(doc => {
          const data = doc.data();
          if (data.date && data.date instanceof Timestamp) {
              data.date = data.date.toDate().toISOString();
          }
          return { id: doc.id, ...data } as Purchase;
      });
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
          const data = purchaseDoc.data();
          if(data && data.date && data.date instanceof Timestamp) {
            data.date = data.date.toDate().toISOString();
          }
          return {id: purchaseDoc.id, ...data} as Purchase;
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
    return expenseSnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.date && data.date instanceof Timestamp) {
            data.date = data.date.toDate().toISOString();
        }
        return { id: doc.id, ...data } as Expense;
    });
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

export async function getSettings(): Promise<Settings> {
  if (!db) return defaultSettings;
  const settingsDocRef = db.collection('settings').doc('main');
  try {
      const settingsDoc = await settingsDocRef.get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        // Merge with defaults to ensure all keys are present, even if not in DB
        return { ...defaultSettings, ...data } as Settings;
      }
      // If no settings doc exists, create one with defaults
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
