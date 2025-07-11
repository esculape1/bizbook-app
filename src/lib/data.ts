
import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase, User, UserWithPassword } from './types';

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

// Seed products data
const productsToSeed = [
    { name: 'Balance analogique', reference: 'BLCA'},
    { name: 'Balance électronique', reference: 'BLCE'},
    { name: 'Baume de lèvres1', reference: 'BKL'},
    { name: 'Baume de lèvres2', reference: 'BKL'}, // Note: Duplicate reference
    { name: 'Beurre de Karité 120g', reference: 'BK120'},
    { name: 'Beurre de karité 200g', reference: 'BK200'},
    { name: 'Beurre de karité 250g', reference: 'BK250'},
    { name: 'Beurre de Karité 300g', reference: 'BK300'},
    { name: 'Beurre de Karité 400g', reference: 'BK400'},
    { name: 'Beurre de Karité 500g', reference: 'BK500'},
    { name: 'Carnets bleus', reference: 'CB'},
    { name: 'Carnets jaunes', reference: 'CJ'},
    { name: 'Compresse 40x40 bte 10', reference: 'CM10'},
    { name: 'Compresse 40x40 bte 100', reference: 'CM100'},
    { name: 'Consommables informatiques', reference: ''},
    { name: 'ENCRE POUR IMPRIMANTE', reference: 'EPI'},
    { name: 'Encre d\'imprimer', reference: ''},
    { name: 'Fil NR 2/0 AR', reference: 'FNR20AR'},
    { name: 'Fil NR 2/0 AT', reference: 'FNR20AT'},
    { name: 'Fil NR 3/0 AR', reference: 'FNR30AR'},
    { name: 'Fil NR 3/0 AT', reference: 'FNR30AT'},
    { name: 'Fil NR N° 0 AR', reference: 'FNR0AR'},
    { name: 'FIL NR N°1 AT', reference: 'FILNR1AT'},
    { name: 'Fil NR N°2 AR', reference: 'FNR2AR'},
    { name: 'Fil NR N°2 AT', reference: 'FNR2AT'},
    { name: 'Fil R 2/0 AR', reference: 'FR20AR'},
    { name: 'Fil R 2/0 AT', reference: 'FR20AT'},
    { name: 'Fil R 3/0 AR', reference: 'FR30AR'},
    { name: 'Fil R 3/0 AT', reference: 'FR30AT'},
    { name: 'FIL R N°0 AR', reference: 'FR0AR'},
    { name: 'Fil R N°1 AR', reference: 'FR1AR'},
    { name: 'Fil R N°1 AT', reference: 'FR1AT'},
    { name: 'Fil R N°2 AR', reference: 'FR2AR'},
    { name: 'Fil R N°2 AT', reference: 'FR2AT'},
    { name: 'FIL R N°4/0 AT', reference: 'FR40AT'},
    { name: 'FRAIS D\'EXPEDITION', reference: 'FE'},
    { name: 'Gants en Vrac L', reference: 'GV-L'},
    { name: 'Gants en Vrac M', reference: 'GV-M'},
    { name: 'Intranule G18', reference: 'INT18'},
    { name: 'Intranule G20', reference: 'INT20'},
    { name: 'Intranule G22', reference: 'INT22'},
    { name: 'Intranule G24', reference: 'INT24'},
    { name: 'MARQUEUR VERT CITRON', reference: 'MVC'},
    { name: 'masque chrirurgical', reference: 'MC'},
    { name: 'Matelas anti escarre', reference: 'MAE'},
    { name: 'Moustiquaire Imprégnée 2 places', reference: 'M2P'},
    { name: 'Moustiquaire Imprégnée 3 places', reference: 'M3P'},
    { name: 'PAPIER MOUCHOIR', reference: 'PM'},
    { name: 'Papier termique 80x80', reference: 'PR80'},
    { name: 'Papier termique rouleau', reference: 'PAT'},
    { name: 'Perfuseur', reference: 'PERF'},
    { name: 'Pointeurs Pointech', reference: 'PPR'},
    { name: 'Pots de prélèvement', reference: 'PPR'}, // Note: Duplicate reference
    { name: 'Produits d\'entretien divers', reference: ''},
    { name: 'RAME DE PAPIER', reference: 'RP'},
    { name: 'SAVON LIQUIDE', reference: 'SL'},
    { name: 'SERINGUE MOUCHE BEBE', reference: 'SMBB'},
    { name: 'Seringues 05cc Luer lock', reference: 'S05'},
    { name: 'Seringues 10cc Luer lock', reference: 'S10'},
    { name: 'seringues 20 cc', reference: 'SR20'},
    { name: 'Seringues mouche bébé', reference: 'SMB'},
    { name: 'TDR PALU', reference: 'TDRPALU'},
    { name: 'Tensiomètre Contec', reference: 'TM'},
    { name: 'Amikacine 500mg', reference: 'AMI'},
    { name: 'Aiguille a PL G25 avec introducteur', reference: 'APL'},
    { name: 'Transfuseur', reference: 'TR'},
    { name: 'savon liquide', reference: 'sl'},
    { name: 'Moustiquaire Impregnees permanet 3.0 2places', reference: ''},
    { name: 'papier etiquette', reference: 'PERF'}, // Note: Duplicate reference
    { name: 'Gants chirurgicaux', reference: 'GCH'},
    { name: 'Papier etiquettes vert citron', reference: 'PEVC'},
    { name: 'gants chirurgicaux 7,5', reference: ''},
    { name: 'clamp de baar', reference: 'cdb'},
    { name: 'lame de bistouri', reference: 'ldb'},
    { name: 'FIL R 1/0 AR', reference: ''},
    { name: 'FIL NR 1/0 AR', reference: ''},
    { name: 'SONDE URINAIRE Siliconé CH16', reference: 'SUCH16'},
    { name: 'SONDE URINAIRE Siliconé CH18', reference: 'SUCH18'},
    { name: 'lingettes nettoyantes lunettes', reference: 'LNLU'},
    { name: 'Fil NR n1 AR', reference: 'FNR1AR'},
    { name: 'Gant EN Nitrile L', reference: 'GEN'},
    { name: 'poche urinaire', reference: 'PU'},
    { name: 'lame de bistouri N 22', reference: 'LDBN22'},
];

async function seedProducts() {
    if (!db) return;
    try {
        console.log("Vérification et remplissage du catalogue de produits...");
        const productsCol = db.collection('products');
        
        const productsToAdd = [];
        const uniqueProducts = new Map<string, typeof productsToSeed[0]>();

        // Handle duplicates in the source list, keeping the first occurrence
        for (const product of productsToSeed) {
            if (product.reference && !uniqueProducts.has(product.reference)) {
                uniqueProducts.set(product.reference, product);
            } else if (!product.reference) {
                // For products without reference, we can't check for duplicates easily, add them directly.
                // A name-based check could be added if needed.
                productsToAdd.push(product);
            }
        }
        
        // Check existing products in DB
        if (uniqueProducts.size > 0) {
            const existingRefsSnapshot = await productsCol.where('reference', 'in', Array.from(uniqueProducts.keys())).get();
            const existingRefs = new Set(existingRefsSnapshot.docs.map(doc => doc.data().reference));
            
            for (const [ref, product] of uniqueProducts.entries()) {
                if (!existingRefs.has(ref)) {
                    productsToAdd.push(product);
                }
            }
        }

        if (productsToAdd.length > 0) {
            console.log(`Ajout de ${productsToAdd.length} nouveaux produits...`);
            const batch = db.batch();
            productsToAdd.forEach(product => {
                const docRef = productsCol.doc();
                batch.set(docRef, {
                    name: product.name,
                    reference: product.reference || '',
                    category: 'Divers',
                    purchasePrice: 0,
                    unitPrice: 0,
                    quantityInStock: 0,
                    reorderPoint: 10,
                    safetyStock: 5
                });
            });
            await batch.commit();
            console.log(`✅ ${productsToAdd.length} produits ont été ajoutés à la base de données.`);
        } else {
            console.log("Aucun nouveau produit à ajouter. Le catalogue est à jour.");
        }
    } catch (error) {
        console.error("Erreur lors du remplissage de la base de données avec les produits :", error);
    }
}


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
        return docToObject<UserWithPassword>(userSnapshot.docs[0]);
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
    // Run the seeding function before fetching products
    await seedProducts();
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
    
    // Get the current year to filter quotes and generate the new number
    const currentYear = new Date().getFullYear();
    const prefix = `PRO${currentYear}`;

    // Query for the last quote of the current year
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
